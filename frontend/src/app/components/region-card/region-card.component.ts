import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RegionWeather } from '../../models/region-weather.model';
import { MapFocusService } from '../../services/map-focus.service';
import { I18nService } from '../../services/i18n.service';
import {
  aqiColor,
  iconForWeatherCode,
  skyCover,
  temperatureColor,
  timeZoneLabel,
} from '../../shared/weather-visuals';

/**
 * One country plotted as a synoptic station model: a station tag and
 * coordinates, a sky-cover disc, and monospace TEMP / AIR / FX readouts.
 * Lazily loaded via @defer.
 */
@Component({
  selector: 'app-region-card',
  standalone: true,
  templateUrl: './region-card.component.html',
  styleUrl: './region-card.component.scss',
})
export class RegionCardComponent {
  readonly region = input.required<RegionWeather>();
  readonly favorite = input<boolean>(false);
  readonly pinned = input<boolean>(false);
  /** Shared wall-clock timestamp (ms) that drives the local-time display. */
  readonly now = input<number>(Date.now());

  readonly favoriteToggle = output<string>();

  private readonly mapFocus = inject(MapFocusService);
  protected readonly i18n = inject(I18nService);

  /** Set to true when the flag image fails to load, so the emoji is shown instead. */
  protected readonly flagFailed = signal<boolean>(false);

  /** Pan the background map to this location when the card is hovered/focused. */
  onHover(): void {
    const region = this.region();
    this.mapFocus.focusOn(region.latitude, region.longitude, region.capital);
  }

  readonly icon = computed(() => iconForWeatherCode(this.region().weatherCode));
  readonly aqiDot = computed(() => aqiColor(this.region().aqi));
  readonly tempColor = computed(() => temperatureColor(this.region().temperatureC));
  readonly cover = computed(() => skyCover(this.region().weatherCode));
  readonly hasReading = computed(() => this.region().weatherCode >= 0);
  readonly flagUrl = computed(() => `https://flagcdn.com/w160/${this.region().code}.png`);
  readonly localTime = computed(() => this.formatLocalTime(this.region().timeZone, this.now()));

  /** Time-zone label, e.g. "IST · UTC+5:30". */
  readonly zone = computed(() => timeZoneLabel(this.region().timeZone, new Date(this.now())));

  /** Station tag: upper-case ISO code, the way a chart labels a station. */
  readonly stationId = computed(() => this.region().code.toUpperCase());

  /** Human-readable coordinates, e.g. "20.0°N 77.0°E". */
  readonly coords = computed(() => {
    const region = this.region();
    return `${this.formatCoord(region.latitude, 'N', 'S')} ${this.formatCoord(region.longitude, 'E', 'W')}`;
  });

  /** Year the country was founded, or an em dash when unknown. */
  readonly established = computed(() => {
    const year = this.region().establishedYear;
    return year > 0 ? String(year) : '—';
  });

  /** Currency symbol, code and the live "1 USD = …" rate, formatted for display. */
  readonly currency = computed(() => {
    const region = this.region();
    const available = region.currencyRate >= 0;
    return {
      code: region.currencyCode,
      symbol: region.currencySymbol,
      available,
      rateText: available ? this.formatRate(region.currencyRate) : '',
    };
  });

  onToggle(): void {
    this.favoriteToggle.emit(this.region().country);
  }

  onFlagError(): void {
    this.flagFailed.set(true);
  }

  private formatCoord(value: number, positive: string, negative: string): string {
    return `${Math.abs(value).toFixed(1)}°${value >= 0 ? positive : negative}`;
  }

  /** Formats an exchange rate with thousands separators and adaptive precision. */
  private formatRate(rate: number): string {
    const maximumFractionDigits = rate >= 100 ? 0 : rate >= 1 ? 2 : 4;
    return new Intl.NumberFormat(this.i18n.lang(), { maximumFractionDigits }).format(rate);
  }

  private formatLocalTime(timeZone: string, timestamp: number): string {
    try {
      return new Intl.DateTimeFormat(this.i18n.lang(), {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone,
      }).format(new Date(timestamp));
    } catch {
      return '--:--';
    }
  }
}
