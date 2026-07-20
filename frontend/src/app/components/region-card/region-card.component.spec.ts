import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegionCardComponent } from './region-card.component';
import { RegionWeather } from '../../models/region-weather.model';
import { MapFocusService } from '../../services/map-focus.service';

function makeRegion(overrides: Partial<RegionWeather> = {}): RegionWeather {
  return {
    country: 'India',
    capital: 'New Delhi',
    code: 'in',
    flag: '🇮🇳',
    timeZone: 'Asia/Kolkata',
    latitude: 20,
    longitude: 77,
    temperatureC: 31,
    temperatureF: 88,
    weatherCode: 2,
    summary: 'Partly cloudy',
    aqi: 64,
    aqiCategory: 'Moderate',
    currencyCode: 'INR',
    currencySymbol: '₹',
    currencyRate: 96.5,
    establishedYear: 1947,
    officialLanguage: 'Hindi, English',
    ...overrides,
  };
}

describe('RegionCardComponent', () => {
  let fixture: ComponentFixture<RegionCardComponent>;
  let component: RegionCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RegionCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(RegionCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('region', makeRegion());
    fixture.detectChanges();
  });

  it('renders the station tag as the upper-case ISO code', () => {
    expect(component.stationId()).toBe('IN');
  });

  it('formats coordinates with N/S and E/W', () => {
    fixture.componentRef.setInput('region', makeRegion({ latitude: -33.9, longitude: -18.4 }));
    expect(component.coords()).toBe('33.9°S 18.4°W');
  });

  it('shows the founding year, and an em dash when unknown', () => {
    expect(component.established()).toBe('1947');
    fixture.componentRef.setInput('region', makeRegion({ establishedYear: 0 }));
    expect(component.established()).toBe('—');
  });

  it('formats the live currency rate', () => {
    const currency = component.currency();
    expect(currency.available).toBeTrue();
    expect(currency.symbol).toBe('₹');
    expect(currency.rateText).toBe('96.5');
  });

  it('marks currency unavailable when the rate is negative', () => {
    fixture.componentRef.setInput('region', makeRegion({ currencyRate: -1 }));
    expect(component.currency().available).toBeFalse();
  });

  it('derives temperature colour and sky cover', () => {
    expect(component.tempColor()).toBe('#f2a65a'); // 31°C -> warm
    expect(component.cover()).toBe(0.55); // code 2 -> partly cloudy
    expect(component.hasReading()).toBeTrue();
  });

  it('treats a negative weather code as "no reading"', () => {
    fixture.componentRef.setInput('region', makeRegion({ weatherCode: -1 }));
    expect(component.hasReading()).toBeFalse();
  });

  it('displays both the country and capital names', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.stn__country')?.textContent).toContain('India');
    expect(host.querySelector('.stn__capital')?.textContent).toContain('New Delhi');
  });

  it('shows the official language, and hides the line when unknown', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.stn__lang')?.textContent).toContain('Hindi, English');

    fixture.componentRef.setInput('region', makeRegion({ officialLanguage: '' }));
    fixture.detectChanges();
    expect(host.querySelector('.stn__lang')).toBeNull();
  });

  it('shows the time-zone label', () => {
    expect(component.zone()).toContain('IST');
  });

  it('focuses the background map on hover', () => {
    const mapFocus = TestBed.inject(MapFocusService);
    const spy = spyOn(mapFocus, 'focusOn');
    component.onHover();
    expect(spy).toHaveBeenCalledWith(20, 77, 'New Delhi');
  });
});
