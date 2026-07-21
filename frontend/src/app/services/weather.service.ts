import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, retry, switchMap, tap } from 'rxjs';
import { RegionWeather } from '../models/region-weather.model';
import { environment } from '../../environments/environment';

/** Country coordinates served by the .NET API (GET /api/countries). */
interface CountryInfo {
  readonly country: string;
  readonly capital: string;
  readonly code: string;
  readonly flag: string;
  readonly latitude: number;
  readonly longitude: number;
}

/** One raw Open-Meteo forecast location result (relayed to the backend as-is). */
interface ForecastResult {
  readonly timezone?: string;
  readonly current?: {
    readonly temperature_2m: number;
    readonly weather_code: number;
  };
}

/** One raw Open-Meteo air-quality location result (relayed to the backend as-is). */
interface AirQualityResult {
  readonly current?: {
    readonly us_aqi: number;
  };
}

/** Raw open.er-api.com response (USD base). */
interface ExchangeRatesResponse {
  readonly result?: string;
  readonly rates?: Record<string, number>;
}

/** Raw upstream results, sent to /api/regions/merge for the backend to merge. */
interface RegionMergeRequest {
  readonly forecast: ForecastResult[];
  readonly air: AirQualityResult[];
  readonly rates: Record<string, number>;
}

/** Cached weather payload with a timestamp. */
interface WeatherCache {
  readonly ts: number;
  readonly data: RegionWeather[];
}

/**
 * Talks to the .NET API for the live weather + air quality for every country.
 *
 * All business logic — the country dataset, the Open-Meteo integration, the
 * merge and the weather/AQI classification — lives in the backend. The primary
 * path is a single call to GET /api/regions.
 *
 * If the backend host cannot reach Open-Meteo (as in this sandbox, where
 * outbound HTTPS is blocked), the client falls back to relaying: it fetches the
 * coordinates from the backend, calls Open-Meteo from the browser, and POSTs
 * the raw results back to /api/regions/merge so the backend still performs all
 * merging and classification. The browser is only a network relay — it holds no
 * business logic. Results are cached in localStorage for an hour.
 */
@Injectable({ providedIn: 'root' })
export class WeatherService {
  private static readonly BASE_URL = environment.apiBaseUrl;
  private static readonly REGIONS_URL = `${WeatherService.BASE_URL}/api/regions`;
  private static readonly COUNTRIES_URL = `${WeatherService.BASE_URL}/api/countries`;
  private static readonly MERGE_URL = `${WeatherService.BASE_URL}/api/regions/merge`;
  private static readonly OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
  private static readonly OPEN_METEO_AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality';
  private static readonly EXCHANGE_RATES_URL = 'https://open.er-api.com/v6/latest/USD';
  private static readonly CHUNK_SIZE = 200;
  private static readonly CACHE_KEY = 'weatherCacheV2';
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000;

  constructor(private readonly http: HttpClient) {}

  /**
   * Returns cached live weather + air quality if still fresh; otherwise asks the
   * backend (GET /api/regions) and, only if the backend could not reach
   * Open-Meteo, falls back to the browser relay.
   */
  getLiveRegions(): Observable<RegionWeather[]> {
    const cached = this.readCache();
    if (cached) {
      return of(cached);
    }
    return this.http.get<RegionWeather[]>(WeatherService.REGIONS_URL).pipe(
      catchError(() => of<RegionWeather[]>([])),
      switchMap((regions) =>
        this.hasLiveData(regions) ? of(regions) : this.fetchViaBrowserRelay(),
      ),
      tap((data) => this.writeCache(data)),
    );
  }

  /**
   * Fallback for when the backend host cannot reach the upstream APIs: fetch the
   * coordinates from the backend, query Open-Meteo and the FX API from the
   * browser, then POST the raw results back so the backend does all
   * merging/classification.
   */
  private fetchViaBrowserRelay(): Observable<RegionWeather[]> {
    const mergeUrl = WeatherService.MERGE_URL;
    return this.http.get<CountryInfo[]>(WeatherService.COUNTRIES_URL).pipe(
      switchMap((countries) => {
        const chunks = this.chunk(countries, WeatherService.CHUNK_SIZE);
        const weather$ = forkJoin(chunks.map((chunk) => this.fetchChunk(chunk))).pipe(
          map((parts) =>
            parts.reduce(
              (acc, part) => ({
                forecast: [...acc.forecast, ...part.forecast],
                air: [...acc.air, ...part.air],
              }),
              { forecast: [] as ForecastResult[], air: [] as AirQualityResult[] },
            ),
          ),
        );
        return forkJoin([weather$, this.fetchRates()]).pipe(
          map(([weather, rates]): RegionMergeRequest => ({ ...weather, rates })),
          switchMap((payload) =>
            this.http
              .post<RegionWeather[]>(mergeUrl, payload)
              .pipe(catchError(() => of<RegionWeather[]>([]))),
          ),
        );
      }),
      catchError(() => of<RegionWeather[]>([])),
    );
  }

  /** Fetches live USD-based exchange rates from the browser (relay fallback). */
  private fetchRates(): Observable<Record<string, number>> {
    return this.http.get<ExchangeRatesResponse>(WeatherService.EXCHANGE_RATES_URL).pipe(
      retry({ count: 1, delay: 2000 }),
      map((response) => response.rates ?? {}),
      catchError(() => of<Record<string, number>>({})),
    );
  }

  /**
   * Queries Open-Meteo for one chunk of countries and returns the raw forecast
   * and air-quality arrays, padded to the chunk size so they stay index-aligned
   * with the country list even when a request fails.
   */
  private fetchChunk(
    countries: CountryInfo[],
  ): Observable<{ forecast: ForecastResult[]; air: AirQualityResult[] }> {
    const latitude = countries.map((c) => c.latitude).join(',');
    const longitude = countries.map((c) => c.longitude).join(',');

    const forecast$ = this.http
      .get<ForecastResult[] | ForecastResult>(WeatherService.OPEN_METEO_FORECAST, {
        params: { latitude, longitude, current: 'temperature_2m,weather_code', timezone: 'auto' },
      })
      .pipe(
        retry({ count: 1, delay: 2000 }),
        map((response) => this.toArray(response)),
        catchError(() => of<ForecastResult[]>([])),
      );

    const air$ = this.http
      .get<AirQualityResult[] | AirQualityResult>(WeatherService.OPEN_METEO_AIR, {
        params: { latitude, longitude, current: 'us_aqi' },
      })
      .pipe(
        retry({ count: 1, delay: 2000 }),
        map((response) => this.toArray(response)),
        catchError(() => of<AirQualityResult[]>([])),
      );

    return forkJoin([forecast$, air$]).pipe(
      map(([forecast, air]) => ({
        forecast: this.padTo(countries.length, forecast),
        air: this.padTo(countries.length, air),
      })),
    );
  }

  private hasLiveData(regions: RegionWeather[]): boolean {
    return regions.length > 0 && regions.some((r) => r.weatherCode >= 0 || r.aqi >= 0);
  }

  private readCache(): RegionWeather[] | null {
    try {
      const raw = localStorage.getItem(WeatherService.CACHE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as WeatherCache;
      const fresh = Date.now() - parsed.ts < WeatherService.CACHE_TTL_MS;
      return fresh && Array.isArray(parsed.data) && parsed.data.length > 0 ? parsed.data : null;
    } catch {
      return null;
    }
  }

  private writeCache(data: RegionWeather[]): void {
    // Only cache a result that actually contains live data, so a rate-limited
    // (blank) response is not persisted for an hour.
    if (!this.hasLiveData(data)) {
      return;
    }
    try {
      localStorage.setItem(
        WeatherService.CACHE_KEY,
        JSON.stringify({ ts: Date.now(), data }),
      );
    } catch {
      // Ignore storage failures (e.g. private mode / quota).
    }
  }

  private toArray<T>(value: T[] | T): T[] {
    return Array.isArray(value) ? value : [value];
  }

  /** Pads (or trims) an array to exactly `size` entries, using {} for gaps. */
  private padTo<T extends object>(size: number, items: T[]): T[] {
    if (items.length >= size) {
      return items.slice(0, size);
    }
    const gaps = Array.from({ length: size - items.length }, () => ({}) as T);
    return [...items, ...gaps];
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }
}
