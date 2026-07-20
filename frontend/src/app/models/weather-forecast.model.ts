/**
 * A single day's weather forecast as returned by the .NET API.
 * Matches the JSON shape of GET /weatherforecast.
 */
export interface WeatherForecast {
  readonly date: string;
  readonly temperatureC: number;
  readonly temperatureF: number;
  readonly summary: string;
}
