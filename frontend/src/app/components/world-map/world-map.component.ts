import {
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MapFocusService } from '../../services/map-focus.service';
import { WORLD_LAND_PATH } from './world-map.data';

/**
 * Interactive world-map background. The map is an equirectangular land outline
 * (viewBox 0..360 x 0..180). It pans and zooms to whichever country a card is
 * hovered over (via {@link MapFocusService}) and parallax-follows the cursor
 * over the background. A pulsing marker pins the focused location.
 *
 * Two nested transforms keep it smooth: focus pan/zoom eases slowly, while the
 * cursor parallax responds quickly.
 */
@Component({
  selector: 'app-world-map',
  standalone: true,
  templateUrl: './world-map.component.html',
  styleUrl: './world-map.component.scss',
})
export class WorldMapComponent {
  protected readonly landPath = WORLD_LAND_PATH;

  /** SVG pixel size of the map (2:1 equirectangular). */
  protected readonly mapWidth = 1600;
  protected readonly mapHeight = 800;

  private readonly focusService = inject(MapFocusService);
  protected readonly focus = this.focusService.focus;

  private readonly viewport = signal({ w: 1440, h: 900 });
  private readonly cursor = signal({ nx: 0, ny: 0 });
  private lastMove = 0;

  /** Default world-view centre (lon 10, lat 20) when nothing is hovered. */
  private static readonly DEFAULT = { lon: 10, lat: 20 };

  constructor() {
    if (typeof window !== 'undefined') {
      this.viewport.set({ w: window.innerWidth, h: window.innerHeight });
    }
  }

  /** Marker position, in map (viewBox) units, for the focused location. */
  protected readonly marker = computed(() => {
    const focus = this.focus();
    if (!focus) {
      return null;
    }
    return { x: focus.lon + 180, y: 90 - focus.lat, label: focus.label };
  });

  /** Focus pan/zoom transform (transform-origin: 0 0), eased slowly. */
  protected readonly focusTransform = computed(() => {
    const { w, h } = this.viewport();
    const focus = this.focus();
    const point = focus ?? WorldMapComponent.DEFAULT;

    const pointX = ((point.lon + 180) / 360) * this.mapWidth;
    const pointY = ((90 - point.lat) / 180) * this.mapHeight;

    const cover = Math.max(w / this.mapWidth, h / this.mapHeight);
    // Zoom out a little when focused so neighbouring countries give context.
    const scale = cover * (focus ? 1.5 : 1.15);

    // Anchor the focused location in the open band near the top of the screen —
    // the card grid fills the centre, so a centred marker would sit behind it.
    // The default (un-hovered) world view stays centred.
    const anchorX = w * 0.5;
    const anchorY = focus ? h * 0.2 : h * 0.5;

    const tx = anchorX - scale * pointX;
    const ty = anchorY - scale * pointY;
    return `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`;
  });

  /** Small cursor parallax translate, responds quickly. */
  protected readonly parallaxTransform = computed(() => {
    const { nx, ny } = this.cursor();
    return `translate(${(-nx * 38).toFixed(1)}px, ${(-ny * 26).toFixed(1)}px)`;
  });

  @HostListener('window:resize')
  onResize(): void {
    this.viewport.set({ w: window.innerWidth, h: window.innerHeight });
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    // Throttle to ~30fps so parallax doesn't over-trigger change detection.
    const now = event.timeStamp;
    if (now - this.lastMove < 33) {
      return;
    }
    this.lastMove = now;
    const { w, h } = this.viewport();
    this.cursor.set({ nx: event.clientX / w - 0.5, ny: event.clientY / h - 0.5 });
  }
}
