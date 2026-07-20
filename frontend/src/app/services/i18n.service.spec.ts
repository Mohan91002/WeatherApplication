import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('returns the English string for a key', () => {
    expect(service.t('boardTitle')).toBe('World Weather');
    expect(service.t('aqi')).toBe('AQI');
  });

  it('interpolates parameters', () => {
    expect(service.t('stationsReporting', { n: 253 })).toBe('253 stations reporting');
  });

  it('falls back to the key for a missing string', () => {
    expect(service.t('this-key-does-not-exist')).toBe('this-key-does-not-exist');
  });

  it('looks up forecast summary words', () => {
    expect(service.wx('Mild')).toBe('Mild');
  });
});
