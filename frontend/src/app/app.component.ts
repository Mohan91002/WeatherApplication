import { Component } from '@angular/core';
import { RegionsPanelComponent } from './components/regions-panel/regions-panel.component';
import { WorldMapComponent } from './components/world-map/world-map.component';

/**
 * Root component: an interactive world-map backdrop behind the weather board.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WorldMapComponent, RegionsPanelComponent],
  template: `
    <app-world-map></app-world-map>
    <app-regions-panel></app-regions-panel>
  `,
})
export class AppComponent {}
