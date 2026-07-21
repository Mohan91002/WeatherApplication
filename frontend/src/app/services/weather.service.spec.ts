import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { WeatherService } from './weather.service';
import { RegionWeather } from '../models/region-weather.model';

const BASE = 'http://localhost:5135';
const REGIONS = `${BASE}/api/regions`;
const COUNTRIES = `${BASE}/api/countries`;
const MERGE = `${BASE}/api/regions/merge`;
const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const FX = 'https://open.er-api.com/v6/latest/USD';

function liveRegion(overrides: Partial<RegionWeather> = {}): RegionWeather {
  return {
    country: 'India',
    capital: 'New Delhi',
    code: 'in',
    flag: '🇮🇳',
    timeZone: 'Asia/Kolkata',
    latitude: 20,
    longitude: 77,
    temperatureC: 31,
    temperatureF: 88,
    weatherCode: 2,
    summary: 'Partly cloudy',
    aqi: 64,
    aqiCategory: 'Moderate',
    currencyCode: 'INR',
    currencySymbol: '₹',
    currencyRate: 96.5,
    establishedYear: 1947,
    officialLanguage: 'Hindi, English',
    ...overrides,
  };
}

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear(); // avoid the 1-hour localStorage cache short-circuit
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('uses /api/regions directly when the backend returns live data', () => {
    const live = [liveRegion()];
    let result: RegionWeather[] | undefined;
    service.getLiveRegions().subscribe((data) => (result = data));

    httpMock.expectOne((r) => r.url.split('?')[0] === REGIONS).flush(live);
    // No fallback requests should be made.
    httpMock.expectNone(COUNTRIES);
    expect(result).toEqual(live);
  });

  it('falls back to the browser relay when the backend has no live data', () => {
    const merged = [liveRegion()];
    let result: RegionWeather[] | undefined;
    service.getLiveRegions().subscribe((data) => (result = data));

    // Backend reachable but with placeholder-only data → triggers the relay.
    httpMock.expectOne((r) => r.url.split('?')[0] === REGIONS).flush([]);

    // 1) coordinates from the backend
    httpMock.expectOne(COUNTRIES).flush([
      { country: 'India', capital: 'New Delhi', code: 'in', flag: '🇮🇳', latitude: 20, longitude: 77 },
    ]);

    // 2) Open-Meteo + FX fetched from the browser (in parallel)
    httpMock.expectOne((r) => r.url === OPEN_METEO_FORECAST).flush([
      { timezone: 'Asia/Kolkata', current: { temperature_2m: 31, weather_code: 2 } },
    ]);
    httpMock.expectOne((r) => r.url === OPEN_METEO_AIR).flush([{ current: { us_aqi: 64 } }]);
    httpMock.expectOne((r) => r.url === FX).flush({ result: 'success', rates: { INR: 96.5 } });

    // 3) raw results relayed back to the backend for merging
    const mergeReq = httpMock.expectOne((r) => r.url.split('?')[0] === MERGE);
    expect(mergeReq.request.method).toBe('POST');
    expect(mergeReq.request.body.forecast.length).toBe(1);
    expect(mergeReq.request.body.air.length).toBe(1);
    expect(mergeReq.request.body.rates).toEqual({ INR: 96.5 });
    mergeReq.flush(merged);

    expect(result).toEqual(merged);
  });

  it('returns an empty list when both the backend and the relay fail', () => {
    let result: RegionWeather[] | undefined;
    service.getLiveRegions().subscribe((data) => (result = data));

    httpMock.expectOne((r) => r.url.split('?')[0] === REGIONS).error(new ProgressEvent('error'));
    httpMock.expectOne(COUNTRIES).error(new ProgressEvent('error'));

    expect(result).toEqual([]);
  });
});
