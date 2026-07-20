import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RegionWeather } from '../../models/region-weather.model';
import { WeatherService } from '../../services/weather.service';
import { I18nService, Lang } from '../../services/i18n.service';
import { RegionCardComponent } from '../region-card/region-card.component';

/** Field the country list can be sorted by. */
type SortField = 'country' | 'capital' | 'aqi' | 'year';

/**
 * Shows every country as a card. India is pinned first, then favourites, then
 * the rest sorted by the chosen field. Cards load 5 at a time (one row) as the
 * user scrolls (infinite scroll). Live weather + air quality refresh hourly.
 */
@Component({
  selector: 'app-regions-panel',
  standalone: true,
  imports: [RegionCardComponent],
  templateUrl: './regions-panel.component.html',
  styleUrl: './regions-panel.component.scss',
})
export class RegionsPanelComponent implements OnInit, OnDestroy {
  /** Country always shown first, regardless of sort field or favourites. */
  static readonly PINNED_COUNTRY = 'India';
  static readonly FAVORITES_KEY = 'favoriteCountries';
  static readonly REFRESH_MS = 60 * 60 * 1000;
  static readonly CLOCK_MS = 30 * 1000;
  /** How many cards are revealed initially and per scroll step (one full row). */
  static readonly PAGE_SIZE = 5;
  /** Minimum gap between scroll-triggered loads, so one gesture reveals one batch. */
  static readonly SCROLL_COOLDOWN_MS = 500;

  protected readonly regions = signal<RegionWeather[]>([]);
  protected readonly favorites = signal<Set<string>>(new Set());
  protected readonly errorMessage = signal<string>('');
  protected readonly loading = signal<boolean>(false);
  protected readonly now = signal<number>(Date.now());
  protected readonly sortField = signal<SortField>('country');
  protected readonly searchQuery = signal<string>('');
  protected readonly visibleCount = signal<number>(RegionsPanelComponent.PAGE_SIZE);

  /** All regions ordered: India, then favourites, then the rest — by the chosen field. */
  protected readonly sortedRegions = computed<RegionWeather[]>(() => {
    const favs = this.favorites();
    const field = this.sortField();
    return [...this.regions()].sort((a, b) => {
      const rankDiff = this.rank(a, favs) - this.rank(b, favs);
      return rankDiff !== 0 ? rankDiff : this.compare(a, b, field);
    });
  });

  /** Total number of countries (ignores the search filter). */
  protected readonly totalCountries = computed<number>(() => this.regions().length);
  /** Regions after the search filter; India is always kept regardless of the query. */
  protected readonly filteredRegions = computed<RegionWeather[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const sorted = this.sortedRegions();
    if (!query) {
      return sorted;
    }
    return sorted.filter(
      (region) => this.isPinned(region.country) || this.matchesQuery(region, query),
    );
  });
  protected readonly total = computed<number>(() => this.filteredRegions().length);
  /** The slice currently rendered (grows as the user scrolls). */
  protected readonly visibleRegions = computed<RegionWeather[]>(() =>
    this.filteredRegions().slice(0, this.visibleCount()),
  );
  protected readonly allLoaded = computed<boolean>(() => this.visibleCount() >= this.total());

  /** Live world extremes derived from the current readings, shown in the header. */
  protected readonly extremes = computed(() => {
    const withWeather = this.regions().filter((r) => r.weatherCode >= 0);
    const withAir = this.regions().filter((r) => r.aqi >= 0);
    const pick = <T>(items: T[], better: (a: T, b: T) => boolean): T | null =>
      items.length ? items.reduce((best, item) => (better(item, best) ? item : best)) : null;
    return {
      hottest: pick(withWeather, (a, b) => a.temperatureC > b.temperatureC),
      coldest: pick(withWeather, (a, b) => a.temperatureC < b.temperatureC),
      worstAir: pick(withAir, (a, b) => a.aqi > b.aqi),
    };
  });

  private refreshTimer?: ReturnType<typeof setInterval>;
  private clockTimer?: ReturnType<typeof setInterval>;
  private scrollCooldown = false;
  private lastScrollY = 0;
  private readonly scrollHandler = (): void => this.onScroll();

  protected readonly i18n = inject(I18nService);

  constructor(private readonly weatherService: WeatherService) {
    // Re-fetch region data whenever the language changes (the initial run also
    // performs the first load), so backend-localized summaries/AQI update too.
    effect(
      () => {
        this.i18n.lang();
        this.refreshRegions();
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    this.favorites.set(this.loadFavorites());
    this.refreshTimer = setInterval(() => this.refreshRegions(), RegionsPanelComponent.REFRESH_MS);
    this.clockTimer = setInterval(() => this.now.set(Date.now()), RegionsPanelComponent.CLOCK_MS);
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
    window.removeEventListener('scroll', this.scrollHandler);
  }

  setSort(field: SortField): void {
    this.sortField.set(field);
    this.visibleCount.set(RegionsPanelComponent.PAGE_SIZE);
  }

  onLanguageChange(lang: string): void {
    this.i18n.setLang(lang as Lang);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.visibleCount.set(RegionsPanelComponent.PAGE_SIZE);
  }

  /** Reveals exactly one more batch (PAGE_SIZE) of cards. */
  loadMore(): void {
    if (this.visibleCount() < this.total()) {
      this.visibleCount.update((count) =>
        Math.min(count + RegionsPanelComponent.PAGE_SIZE, this.total()),
      );
    }
  }

  /** Hides the most recently revealed batch — used when scrolling back up. */
  unloadLess(): void {
    if (this.visibleCount() > RegionsPanelComponent.PAGE_SIZE) {
      this.visibleCount.update((count) =>
        Math.max(count - RegionsPanelComponent.PAGE_SIZE, RegionsPanelComponent.PAGE_SIZE),
      );
    }
  }

  isPinned(country: string): boolean {
    return country === RegionsPanelComponent.PINNED_COUNTRY;
  }

  isFavorite(country: string): boolean {
    return this.favorites().has(country);
  }

  toggleFavorite(country: string): void {
    if (this.isPinned(country)) {
      return;
    }
    const next = new Set(this.favorites());
    if (next.has(country)) {
      next.delete(country);
    } else {
      next.add(country);
    }
    this.favorites.set(next);
    this.saveFavorites(next);
  }

  private onScroll(): void {
    if (this.scrollCooldown) {
      return;
    }
    const doc = document.documentElement;
    const scrollY = window.scrollY;
    const goingDown = scrollY > this.lastScrollY;
    this.lastScrollY = scrollY;

    const distanceFromBottom = doc.scrollHeight - (window.innerHeight + scrollY);

    if (goingDown && !this.allLoaded() && distanceFromBottom <= 300) {
      // Scrolling down near the end: reveal one more batch.
      this.loadMore();
      this.startScrollCooldown();
    } else if (
      !goingDown &&
      this.visibleCount() > RegionsPanelComponent.PAGE_SIZE &&
      distanceFromBottom > 700
    ) {
      // Scrolling back up with the last batch well off-screen: unload it.
      this.unloadLess();
      this.startScrollCooldown();
    }
  }

  /** One batch per scroll gesture: ignore further scroll events briefly. */
  private startScrollCooldown(): void {
    this.scrollCooldown = true;
    setTimeout(() => {
      this.scrollCooldown = false;
    }, RegionsPanelComponent.SCROLL_COOLDOWN_MS);
  }

  private rank(region: RegionWeather, favorites: Set<string>): number {
    if (this.isPinned(region.country)) {
      return 0;
    }
    return favorites.has(region.country) ? 1 : 2;
  }

  private matchesQuery(region: RegionWeather, query: string): boolean {
    return (
      region.country.toLowerCase().includes(query) ||
      region.capital.toLowerCase().includes(query)
    );
  }

  private compare(a: RegionWeather, b: RegionWeather, field: SortField): number {
    if (field === 'aqi') {
      // Highest AQI (most polluted) first; unavailable readings (-1) sink to the bottom.
      const aqiA = a.aqi < 0 ? Number.NEGATIVE_INFINITY : a.aqi;
      const aqiB = b.aqi < 0 ? Number.NEGATIVE_INFINITY : b.aqi;
      return aqiB - aqiA;
    }
    if (field === 'year') {
      // Oldest founded first; unknown years (0) sink to the bottom.
      const yearA = a.establishedYear > 0 ? a.establishedYear : Number.POSITIVE_INFINITY;
      const yearB = b.establishedYear > 0 ? b.establishedYear : Number.POSITIVE_INFINITY;
      return yearA - yearB;
    }
    const valueA = field === 'capital' ? a.capital : a.country;
    const valueB = field === 'capital' ? b.capital : b.country;
    return valueA.localeCompare(valueB);
  }

  private refreshRegions(): void {
    this.loading.set(true);
    this.weatherService.getLiveRegions().subscribe({
      next: (data) => {
        this.regions.set(data);
        this.errorMessage.set('');
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'Unable to load live weather. Is the .NET API running on port 5135?',
        );
        this.loading.set(false);
      },
    });
  }

  private loadFavorites(): Set<string> {
    try {
      const raw = localStorage.getItem(RegionsPanelComponent.FAVORITES_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveFavorites(favorites: Set<string>): void {
    try {
      localStorage.setItem(
        RegionsPanelComponent.FAVORITES_KEY,
        JSON.stringify([...favorites]),
      );
    } catch {
      // Ignore storage failures (e.g. private mode); favourites simply won't persist.
    }
  }
}
