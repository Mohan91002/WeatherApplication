import { Injectable } from '@angular/core';

type Dict = Readonly<Record<string, string>>;

/** English UI strings. The app is English-only (multi-language support removed). */
const EN: Dict = {
  live: 'LIVE',
  stationsReporting: '{n} stations reporting',
  boardTitle: 'World Weather',
  warmest: 'WARMEST',
  coldest: 'COLDEST',
  worstAir: 'WORST AIR',
  sort: 'SORT',
  country: 'Country',
  capital: 'Capital',
  aqi: 'AQI',
  year: 'Year',
  find: 'FIND',
  searchPlaceholder: 'Country',
  loading: 'acquiring live weather & air quality…',
  loadError: 'Unable to load live weather. Is the API running on port 5135?',
  allPlotted: 'all {n} stations plotted',
  showing: 'showing {v} / {t}',
  lang: 'LANG',
  temp: 'TEMP',
  air: 'AIR',
  fx: 'FX',
  est: 'EST.',
  noReport: 'no report',
  rateUnavailable: 'rate unavailable',
  outlookEyebrow: 'FORECAST · NEXT 7 DAYS',
  outlookTitle: '7-Day Outlook',
  refresh: 'refresh',
  refreshing: 'refreshing…',
  forecastError: 'Unable to reach the weather service. Is the API running on port 5135?',
  fetchingForecast: 'fetching forecast…',
  'wx.Freezing': 'Freezing',
  'wx.Bracing': 'Bracing',
  'wx.Chilly': 'Chilly',
  'wx.Cool': 'Cool',
  'wx.Mild': 'Mild',
  'wx.Warm': 'Warm',
  'wx.Balmy': 'Balmy',
  'wx.Hot': 'Hot',
  'wx.Sweltering': 'Sweltering',
  'wx.Scorching': 'Scorching',
};

/**
 * Central lookup for the app's English UI strings, with {param} interpolation.
 * (Multi-language translation was removed; the app is English-only.)
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  /** Look up a UI string by key, with optional {param} substitution. */
  t(key: string, params?: Record<string, string | number>): string {
    let value = EN[key] ?? key;
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replace(`{${name}}`, String(replacement));
      }
    }
    return value;
  }

  /** Label for a forecast summary word (e.g. "Mild"). */
  wx(summary: string): string {
    return this.t(`wx.${summary}`);
  }
}
