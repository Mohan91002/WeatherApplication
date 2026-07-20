import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorldMapComponent } from './world-map.component';
import { MapFocusService } from '../../services/map-focus.service';

// Reach the protected computed signals used by the template.
type Internals = {
  marker: () => { x: number; y: number; label: string } | null;
  focusTransform: () => string;
};

describe('WorldMapComponent', () => {
  let fixture: ComponentFixture<WorldMapComponent>;
  let component: WorldMapComponent;
  let focusService: MapFocusService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [WorldMapComponent] });
    fixture = TestBed.createComponent(WorldMapComponent);
    component = fixture.componentInstance;
    focusService = TestBed.inject(MapFocusService);
    focusService.focus.set(null);
  });

  it('has no marker in the default world view', () => {
    expect((component as unknown as Internals).marker()).toBeNull();
  });

  it('places a marker at the focused location (lon+180, 90-lat)', () => {
    focusService.focusOn(20, 77, 'New Delhi');
    const marker = (component as unknown as Internals).marker();
    expect(marker).not.toBeNull();
    expect(marker!.x).toBe(257); // 77 + 180
    expect(marker!.y).toBe(70); // 90 - 20
    expect(marker!.label).toBe('New Delhi');
  });

  it('zooms in further when a location is focused', () => {
    const internals = component as unknown as Internals;
    const defaultTransform = internals.focusTransform();
    focusService.focusOn(-33.9, 18.4, 'Cape Town');
    const focusedTransform = internals.focusTransform();
    expect(defaultTransform).toContain('scale(');
    expect(focusedTransform).toContain('scale(');
    expect(focusedTransform).not.toBe(defaultTransform); // panned/zoomed
  });
});
