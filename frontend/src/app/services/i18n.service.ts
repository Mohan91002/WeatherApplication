import { Injectable, computed, effect, signal } from '@angular/core';

/** Languages the UI can auto-localize into. English is the fallback. */
export const SUPPORTED_LANGS = ['en', 'hi', 'es', 'fr', 'ar', 'zh', 'ja'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

/** Endonyms for the language switcher. */
export const LANG_NAMES: Readonly<Record<Lang, string>> = {
  en: 'English',
  hi: 'हिन्दी',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
};

type Dict = Readonly<Record<string, string>>;

const EN: Dict = {
  live: 'LIVE',
  stationsReporting: '{n} stations reporting',
  boardTitle: 'World Weather Board',
  warmest: 'WARMEST',
  coldest: 'COLDEST',
  worstAir: 'WORST AIR',
  sort: 'SORT',
  country: 'Country',
  capital: 'Capital',
  aqi: 'AQI',
  year: 'Year',
  find: 'FIND',
  searchPlaceholder: 'country or capital…',
  loading: 'acquiring live weather & air quality…',
  loadError: 'Unable to load live weather. Is the API running on port 5135?',
  allPlotted: 'all {n} stations plotted',
  showing: 'showing {v} / {t}',
  temp: 'TEMP',
  air: 'AIR',
  fx: 'FX',
  est: 'EST.',
  noReport: 'no report',
  rateUnavailable: 'rate unavailable',
  outlookEyebrow: 'FORECAST · NEXT 5 DAYS',
  outlookTitle: '5-Day Outlook',
  refresh: 'refresh',
  refreshing: 'refreshing…',
  forecastError: 'Unable to reach the weather service. Is the API running on port 5135?',
  fetchingForecast: 'fetching forecast…',
  language: 'Language',
  'wx.Freezing': 'Freezing',
  'wx.Bracing': 'Bracing',
  'wx.Chilly': 'Chilly',
  'wx.Cool': 'Cool',
  'wx.Mild': 'Mild',
  'wx.Warm': 'Warm',
  'wx.Balmy': 'Balmy',
  'wx.Hot': 'Hot',
  'wx.Sweltering': 'Sweltering',
  'wx.Scorching': 'Scorching',
};

const HI: Dict = {
  live: 'लाइव',
  stationsReporting: '{n} स्टेशन रिपोर्ट कर रहे हैं',
  boardTitle: 'विश्व मौसम बोर्ड',
  warmest: 'सबसे गर्म',
  coldest: 'सबसे ठंडा',
  worstAir: 'सबसे खराब वायु',
  sort: 'क्रमबद्ध करें',
  country: 'देश',
  capital: 'राजधानी',
  aqi: 'AQI',
  year: 'वर्ष',
  find: 'खोजें',
  searchPlaceholder: 'देश या राजधानी…',
  loading: 'लाइव मौसम और वायु गुणवत्ता प्राप्त की जा रही है…',
  loadError: 'लाइव मौसम लोड नहीं हो सका। क्या API पोर्ट 5135 पर चल रहा है?',
  allPlotted: 'सभी {n} स्टेशन दिखाए गए',
  showing: '{v} / {t} दिखाया जा रहा है',
  temp: 'तापमान',
  air: 'वायु',
  fx: 'विनिमय',
  est: 'स्थापना',
  noReport: 'कोई रिपोर्ट नहीं',
  rateUnavailable: 'दर उपलब्ध नहीं',
  outlookEyebrow: 'पूर्वानुमान · अगले 5 दिन',
  outlookTitle: '5-दिन का पूर्वानुमान',
  refresh: 'ताज़ा करें',
  refreshing: 'ताज़ा हो रहा है…',
  forecastError: 'मौसम सेवा तक नहीं पहुँच सका। क्या API पोर्ट 5135 पर चल रहा है?',
  fetchingForecast: 'पूर्वानुमान प्राप्त किया जा रहा है…',
  language: 'भाषा',
  'wx.Freezing': 'हिमांक',
  'wx.Bracing': 'कड़ाके की ठंड',
  'wx.Chilly': 'ठंडा',
  'wx.Cool': 'शीतल',
  'wx.Mild': 'सुहावना',
  'wx.Warm': 'गर्म',
  'wx.Balmy': 'सुखद',
  'wx.Hot': 'गरम',
  'wx.Sweltering': 'तपिश भरा',
  'wx.Scorching': 'झुलसाने वाला',
};

const ES: Dict = {
  live: 'EN VIVO',
  stationsReporting: '{n} estaciones informando',
  boardTitle: 'Panel Meteorológico Mundial',
  warmest: 'MÁS CÁLIDO',
  coldest: 'MÁS FRÍO',
  worstAir: 'PEOR AIRE',
  sort: 'ORDENAR',
  country: 'País',
  capital: 'Capital',
  aqi: 'AQI',
  year: 'Año',
  find: 'BUSCAR',
  searchPlaceholder: 'país o capital…',
  loading: 'obteniendo clima y calidad del aire en vivo…',
  loadError: 'No se pudo cargar el clima en vivo. ¿La API está en el puerto 5135?',
  allPlotted: 'las {n} estaciones mostradas',
  showing: 'mostrando {v} / {t}',
  temp: 'TEMP',
  air: 'AIRE',
  fx: 'DIVISA',
  est: 'FUND.',
  noReport: 'sin datos',
  rateUnavailable: 'tasa no disponible',
  outlookEyebrow: 'PRONÓSTICO · PRÓXIMOS 5 DÍAS',
  outlookTitle: 'Pronóstico de 5 Días',
  refresh: 'actualizar',
  refreshing: 'actualizando…',
  forecastError: 'No se pudo conectar con el servicio meteorológico. ¿La API está en el puerto 5135?',
  fetchingForecast: 'obteniendo pronóstico…',
  language: 'Idioma',
  'wx.Freezing': 'Helado',
  'wx.Bracing': 'Fresco intenso',
  'wx.Chilly': 'Frío',
  'wx.Cool': 'Fresco',
  'wx.Mild': 'Templado',
  'wx.Warm': 'Cálido',
  'wx.Balmy': 'Agradable',
  'wx.Hot': 'Caluroso',
  'wx.Sweltering': 'Sofocante',
  'wx.Scorching': 'Abrasador',
};

const FR: Dict = {
  live: 'EN DIRECT',
  stationsReporting: '{n} stations signalées',
  boardTitle: 'Tableau Météo Mondial',
  warmest: 'LE PLUS CHAUD',
  coldest: 'LE PLUS FROID',
  worstAir: 'PIRE AIR',
  sort: 'TRIER',
  country: 'Pays',
  capital: 'Capitale',
  aqi: 'AQI',
  year: 'Année',
  find: 'CHERCHER',
  searchPlaceholder: 'pays ou capitale…',
  loading: 'récupération de la météo et qualité de l’air en direct…',
  loadError: 'Impossible de charger la météo en direct. L’API tourne-t-elle sur le port 5135 ?',
  allPlotted: 'les {n} stations affichées',
  showing: 'affichage {v} / {t}',
  temp: 'TEMP',
  air: 'AIR',
  fx: 'DEVISE',
  est: 'FOND.',
  noReport: 'aucune donnée',
  rateUnavailable: 'taux indisponible',
  outlookEyebrow: 'PRÉVISIONS · 5 PROCHAINS JOURS',
  outlookTitle: 'Prévisions sur 5 Jours',
  refresh: 'actualiser',
  refreshing: 'actualisation…',
  forecastError: 'Impossible d’atteindre le service météo. L’API tourne-t-elle sur le port 5135 ?',
  fetchingForecast: 'récupération des prévisions…',
  language: 'Langue',
  'wx.Freezing': 'Glacial',
  'wx.Bracing': 'Vivifiant',
  'wx.Chilly': 'Frisquet',
  'wx.Cool': 'Frais',
  'wx.Mild': 'Doux',
  'wx.Warm': 'Chaud',
  'wx.Balmy': 'Clément',
  'wx.Hot': 'Très chaud',
  'wx.Sweltering': 'Étouffant',
  'wx.Scorching': 'Torride',
};

const AR: Dict = {
  live: 'مباشر',
  stationsReporting: '{n} محطة ترسل تقارير',
  boardTitle: 'لوحة الطقس العالمية',
  warmest: 'الأدفأ',
  coldest: 'الأبرد',
  worstAir: 'أسوأ هواء',
  sort: 'ترتيب',
  country: 'الدولة',
  capital: 'العاصمة',
  aqi: 'AQI',
  year: 'السنة',
  find: 'بحث',
  searchPlaceholder: 'دولة أو عاصمة…',
  loading: 'جارٍ جلب الطقس وجودة الهواء المباشرة…',
  loadError: 'تعذّر تحميل الطقس المباشر. هل واجهة API تعمل على المنفذ 5135؟',
  allPlotted: 'تم عرض كل المحطات {n}',
  showing: 'عرض {v} / {t}',
  temp: 'الحرارة',
  air: 'الهواء',
  fx: 'العملة',
  est: 'التأسيس',
  noReport: 'لا توجد بيانات',
  rateUnavailable: 'السعر غير متاح',
  outlookEyebrow: 'التوقعات · الأيام الـ5 القادمة',
  outlookTitle: 'توقعات 5 أيام',
  refresh: 'تحديث',
  refreshing: 'جارٍ التحديث…',
  forecastError: 'تعذّر الوصول إلى خدمة الطقس. هل واجهة API تعمل على المنفذ 5135؟',
  fetchingForecast: 'جارٍ جلب التوقعات…',
  language: 'اللغة',
  'wx.Freezing': 'متجمّد',
  'wx.Bracing': 'منعش',
  'wx.Chilly': 'بارد',
  'wx.Cool': 'معتدل البرودة',
  'wx.Mild': 'معتدل',
  'wx.Warm': 'دافئ',
  'wx.Balmy': 'لطيف',
  'wx.Hot': 'حار',
  'wx.Sweltering': 'شديد الحرارة',
  'wx.Scorching': 'حارق',
};

const ZH: Dict = {
  live: '实时',
  stationsReporting: '{n} 个站点报告中',
  boardTitle: '世界天气面板',
  warmest: '最热',
  coldest: '最冷',
  worstAir: '空气最差',
  sort: '排序',
  country: '国家',
  capital: '首都',
  aqi: 'AQI',
  year: '年份',
  find: '查找',
  searchPlaceholder: '国家或首都…',
  loading: '正在获取实时天气和空气质量…',
  loadError: '无法加载实时天气。API 是否在端口 5135 上运行？',
  allPlotted: '已显示全部 {n} 个站点',
  showing: '显示 {v} / {t}',
  temp: '温度',
  air: '空气',
  fx: '汇率',
  est: '成立',
  noReport: '无数据',
  rateUnavailable: '汇率不可用',
  outlookEyebrow: '预报 · 未来 5 天',
  outlookTitle: '5 天预报',
  refresh: '刷新',
  refreshing: '刷新中…',
  forecastError: '无法连接天气服务。API 是否在端口 5135 上运行？',
  fetchingForecast: '正在获取预报…',
  language: '语言',
  'wx.Freezing': '严寒',
  'wx.Bracing': '清冽',
  'wx.Chilly': '寒冷',
  'wx.Cool': '凉爽',
  'wx.Mild': '温和',
  'wx.Warm': '温暖',
  'wx.Balmy': '宜人',
  'wx.Hot': '炎热',
  'wx.Sweltering': '闷热',
  'wx.Scorching': '酷热',
};

const JA: Dict = {
  live: 'ライブ',
  stationsReporting: '{n} 地点が観測中',
  boardTitle: '世界気象ボード',
  warmest: '最も暑い',
  coldest: '最も寒い',
  worstAir: '最悪の大気',
  sort: '並べ替え',
  country: '国',
  capital: '首都',
  aqi: 'AQI',
  year: '設立年',
  find: '検索',
  searchPlaceholder: '国または首都…',
  loading: 'ライブの天気と大気質を取得中…',
  loadError: 'ライブ天気を読み込めません。API はポート 5135 で動作していますか？',
  allPlotted: '全 {n} 地点を表示しました',
  showing: '{v} / {t} を表示中',
  temp: '気温',
  air: '大気',
  fx: '為替',
  est: '設立',
  noReport: 'データなし',
  rateUnavailable: 'レート利用不可',
  outlookEyebrow: '予報 · 今後 5 日間',
  outlookTitle: '5 日間予報',
  refresh: '更新',
  refreshing: '更新中…',
  forecastError: '気象サービスに接続できません。API はポート 5135 で動作していますか？',
  fetchingForecast: '予報を取得中…',
  language: '言語',
  'wx.Freezing': '極寒',
  'wx.Bracing': '厳しい寒さ',
  'wx.Chilly': '肌寒い',
  'wx.Cool': '涼しい',
  'wx.Mild': '穏やか',
  'wx.Warm': '暖かい',
  'wx.Balmy': '心地よい',
  'wx.Hot': '暑い',
  'wx.Sweltering': '蒸し暑い',
  'wx.Scorching': '灼熱',
};

const TRANSLATIONS: Readonly<Record<Lang, Dict>> = {
  en: EN,
  hi: HI,
  es: ES,
  fr: FR,
  ar: AR,
  zh: ZH,
  ja: JA,
};

/**
 * Runtime UI localization. Detects the language from the browser locale, lets
 * the user override it (persisted), and exposes a reactive {@link t} so the UI
 * re-renders when the language changes. Also drives `<html lang>`/`dir` (RTL for
 * Arabic).
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private static readonly STORAGE_KEY = 'lang';

  readonly languages = SUPPORTED_LANGS;
  readonly names = LANG_NAMES;
  readonly lang = signal<Lang>(this.detect());
  readonly dir = computed<'rtl' | 'ltr'>(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    effect(() => {
      const lang = this.lang();
      try {
        localStorage.setItem(I18nService.STORAGE_KEY, lang);
      } catch {
        // ignore storage failures
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = this.dir();
      }
    });
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
  }

  /** Translate a key for the current language, with optional {param} substitution. */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.lang();
    let value = TRANSLATIONS[lang][key] ?? EN[key] ?? key;
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replace(`{${name}}`, String(replacement));
      }
    }
    return value;
  }

  /** Localized label for a 5-day-forecast summary word (e.g. "Mild"). */
  wx(summary: string): string {
    return this.t(`wx.${summary}`);
  }

  private detect(): Lang {
    try {
      const saved = localStorage.getItem(I18nService.STORAGE_KEY);
      if (saved && (SUPPORTED_LANGS as readonly string[]).includes(saved)) {
        return saved as Lang;
      }
    } catch {
      // ignore storage failures
    }
    const locale = (typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en').toLowerCase();
    const prefix = locale.split('-')[0];
    return (SUPPORTED_LANGS as readonly string[]).includes(prefix) ? (prefix as Lang) : 'en';
  }
}
