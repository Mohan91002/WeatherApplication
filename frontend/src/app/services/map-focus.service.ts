import { Injectable, signal } from '@angular/core';

/** A place the background map should pan/zoom to. */
export interface MapFocus {
  readonly lat: number;
  readonly lon: number;
  readonly label: string;
}

/**
 * Shares the currently focused location between the region cards (which set it
 * on hover) and the background world map (which pans/zooms to it). Keeping this
 * in a tiny service avoids threading hover events through the component tree.
 */
@Injectable({ providedIn: 'root' })
export class MapFocusService {
  /** The location the map is focused on, or null for the default world view. */
  readonly focus = signal<MapFocus | null>(null);

  focusOn(lat: number, lon: number, label: string): void {
    this.focus.set({ lat, lon, label });
  }
}
