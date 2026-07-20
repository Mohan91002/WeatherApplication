import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RegionsPanelComponent } from './regions-panel.component';
import { WeatherService } from '../../services/weather.service';
import { RegionWeather } from '../../models/region-weather.model';

function region(country: string, temperatureC: number, aqi: number): RegionWeather {
  return {
    country,
    capital: `${country} City`,
    code: 'xx',
    flag: '🏳️',
    timeZone: 'UTC',
    latitude: 0,
    longitude: 0,
    temperatureC,
    temperatureF: 0,
    weatherCode: 1,
    summary: 'Mainly clear',
    aqi,
    aqiCategory: 'Moderate',
    currencyCode: 'USD',
    currencySymbol: '$',
    currencyRate: 1,
    establishedYear: 1900,
  };
}

describe('RegionsPanelComponent', () => {
  let fixture: ComponentFixture<RegionsPanelComponent>;
  let component: RegionsPanelComponent;

  // Fake service so ngOnInit (if triggered) never hits the network.
  const weatherServiceStub: Partial<WeatherService> = {
    getLiveRegions: () => of<RegionWeather[]>([]),
  };

  // Seeds the protected regions signal for computed-signal tests.
  const seed = (regions: RegionWeather[]) => (component as unknown as { regions: { set: (r: RegionWeather[]) => void } }).regions.set(regions);
  const read = <T>(name: string): T => (component as unknown as Record<string, () => T>)[name]();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RegionsPanelComponent],
      providers: [{ provide: WeatherService, useValue: weatherServiceStub }],
    });
    fixture = TestBed.createComponent(RegionsPanelComponent);
    component = fixture.componentInstance;
    // Note: no detectChanges() — we test signals/methods without starting ngOnInit timers.
  });

  afterEach(() => fixture.destroy());

  it('computes live world extremes (hottest, coldest, worst air)', () => {
    seed([region('Alpha', 40, 10), region('Bravo', -5, 300), region('Charlie', 22, 150)]);
    const extremes = read<{ hottest: RegionWeather; coldest: RegionWeather; worstAir: RegionWeather }>('extremes');
    expect(extremes.hottest.country).toBe('Alpha');
    expect(extremes.coldest.country).toBe('Bravo');
    expect(extremes.worstAir.country).toBe('Bravo');
  });

  it('pins India first regardless of sort order', () => {
    seed([region('Zambia', 1, 1), region('India', 1, 1), region('Albania', 1, 1)]);
    const sorted = read<RegionWeather[]>('sortedRegions');
    expect(sorted[0].country).toBe('India');
  });

  it('reveals and hides one batch (PAGE_SIZE) at a time', () => {
    seed(Array.from({ length: 20 }, (_, i) => region(`C${i}`, 20, 10)));
    expect(read<number>('visibleCount')).toBe(5);

    component.loadMore();
    expect(read<number>('visibleCount')).toBe(10);

    component.unloadLess();
    expect(read<number>('visibleCount')).toBe(5);

    // Never drops below one batch.
    component.unloadLess();
    expect(read<number>('visibleCount')).toBe(5);
  });

  it('sorts by founding year, oldest first, unknown last', () => {
    const withYear = (country: string, year: number): RegionWeather => ({
      ...region(country, 20, 10),
      establishedYear: year,
    });
    seed([withYear('Young', 2011), withYear('Ancient', 301), withYear('Unknown', 0), withYear('Mid', 1947)]);
    component.setSort('year');
    const order = read<RegionWeather[]>('sortedRegions').map((r) => r.country);
    expect(order).toEqual(['Ancient', 'Mid', 'Young', 'Unknown']);
  });

  it('filters by the search query but always keeps India', () => {
    seed([region('India', 1, 1), region('Brazil', 1, 1)]);
    component.onSearch('braz');
    const filtered = read<RegionWeather[]>('filteredRegions');
    const names = filtered.map((r) => r.country);
    expect(names).toContain('India'); // pinned, kept despite the query
    expect(names).toContain('Brazil'); // matches the query
  });
});
