import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { WeatherForecast } from '../../models/weather-forecast.model';
import { WeatherService } from '../../services/weather.service';
import { I18nService } from '../../services/i18n.service';
import { gradientForTemperature, iconForSummary } from '../../shared/weather-visuals';

/**
 * Displays the weather forecast as a grid of vibrant, colourful cards.
 */
@Component({
  selector: 'app-weather-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-dashboard.component.html',
  styleUrl: './weather-dashboard.component.scss',
})
export class WeatherDashboardComponent implements OnInit {
  protected readonly forecasts = signal<WeatherForecast[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly i18n = inject(I18nService);

  constructor(private readonly weatherService: WeatherService) {}

  ngOnInit(): void {
    this.loadForecast();
  }

  /**
   * Requests a fresh forecast from the backend.
   */
  loadForecast(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.weatherService.getForecast().subscribe({
      next: (data) => {
        this.forecasts.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'Unable to reach the weather service. Is the .NET API running on port 5135?',
        );
        this.loading.set(false);
      },
    });
  }

  /**
   * Vibrant gradient for a temperature (delegates to the shared helper).
   *
   * @param temperatureC the temperature in Celsius
   * @returns a CSS linear-gradient value
   */
  gradientFor(temperatureC: number): string {
    return gradientForTemperature(temperatureC);
  }

  /**
   * Weather emoji for a summary (delegates to the shared helper).
   *
   * @param summary the textual weather summary
   * @returns an emoji describing the weather
   */
  iconFor(summary: string): string {
    return iconForSummary(summary);
  }
}
