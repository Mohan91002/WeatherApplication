import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('translates keys for the active language', () => {
    service.setLang('es');
    expect(service.t('country')).toBe('País');
    service.setLang('hi');
    expect(service.t('country')).toBe('देश');
    service.setLang('ja');
    expect(service.t('boardTitle')).toBe('世界気象ボード');
  });

  it('interpolates parameters', () => {
    service.setLang('en');
    expect(service.t('stationsReporting', { n: 253 })).toBe('253 stations reporting');
  });

  it('falls back to English text for a missing key', () => {
    service.setLang('ar');
    expect(service.t('this-key-does-not-exist')).toBe('this-key-does-not-exist');
  });

  it('reports RTL only for Arabic', () => {
    service.setLang('ar');
    expect(service.dir()).toBe('rtl');
    service.setLang('fr');
    expect(service.dir()).toBe('ltr');
  });

  it('localizes 5-day-forecast summary words', () => {
    service.setLang('fr');
    expect(service.wx('Mild')).toBe('Doux');
    service.setLang('es');
    expect(service.wx('Scorching')).toBe('Abrasador');
  });

  it('keeps the AQI acronym across languages', () => {
    service.setLang('zh');
    expect(service.t('aqi')).toBe('AQI');
  });
});
