import { Component } from '@angular/core';
import { WeatherDashboardComponent } from './components/weather-dashboard/weather-dashboard.component';
import { RegionsPanelComponent } from './components/regions-panel/regions-panel.component';
import { WorldMapComponent } from './components/world-map/world-map.component';

/**
 * Root component: an interactive world-map backdrop behind the weather board,
 * with the 5-day outlook lazily loaded when scrolled into view.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WorldMapComponent, RegionsPanelComponent, WeatherDashboardComponent],
  template: `
    <app-world-map></app-world-map>
    <app-regions-panel></app-regions-panel>

    @defer (on idle) {
      <app-weather-dashboard></app-weather-dashboard>
    } @placeholder {
      <p class="lazy-placeholder">▾ loading 5-day outlook…</p>
    } @loading {
      <p class="lazy-placeholder">loading outlook…</p>
    }
  `,
  styles: [
    `
      .lazy-placeholder {
        text-align: center;
        padding: 3rem 1.5rem;
        color: var(--paper-dim);
        font-family: var(--font-mono);
        font-size: 0.85rem;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
    `,
  ],
})
export class AppComponent {}
