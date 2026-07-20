namespace WeatherApi.Services;

/// <summary>
/// Translates the domain strings the backend owns — WMO weather descriptions and
/// US AQI categories — into the supported UI languages. Canonical values are
/// English (produced by <see cref="WeatherClassifier"/>); this maps them to the
/// requested language, falling back to English for unknown languages or terms.
/// </summary>
public static class Localizer
{
    public static readonly IReadOnlyList<string> SupportedLanguages =
        ["en", "hi", "es", "fr", "ar", "zh", "ja"];

    // Keyed by language → (canonical English term → localized term).
    private static readonly IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> Tables =
        new Dictionary<string, IReadOnlyDictionary<string, string>>
        {
            ["hi"] = new Dictionary<string, string>
            {
                ["Clear sky"] = "साफ आसमान",
                ["Mainly clear"] = "मुख्यतः साफ",
                ["Partly cloudy"] = "आंशिक बादल",
                ["Overcast"] = "घने बादल",
                ["Fog"] = "कोहरा",
                ["Drizzle"] = "बूंदाबांदी",
                ["Freezing drizzle"] = "हिमीकृत बूंदाबांदी",
                ["Rain"] = "बारिश",
                ["Freezing rain"] = "हिमीकृत वर्षा",
                ["Snow"] = "बर्फबारी",
                ["Snow grains"] = "हिमकण",
                ["Rain showers"] = "वर्षा की बौछारें",
                ["Snow showers"] = "हिम बौछारें",
                ["Thunderstorm"] = "आंधी-तूफान",
                ["Thunderstorm with hail"] = "ओलों के साथ तूफान",
                ["Unavailable"] = "उपलब्ध नहीं",
                ["N/A"] = "लागू नहीं",
                ["Good"] = "अच्छा",
                ["Moderate"] = "मध्यम",
                ["Unhealthy (sensitive)"] = "अस्वस्थ (संवेदनशील)",
                ["Unhealthy"] = "अस्वस्थ",
                ["Very unhealthy"] = "बहुत अस्वस्थ",
                ["Hazardous"] = "खतरनाक",
            },
            ["es"] = new Dictionary<string, string>
            {
                ["Clear sky"] = "Cielo despejado",
                ["Mainly clear"] = "Mayormente despejado",
                ["Partly cloudy"] = "Parcialmente nublado",
                ["Overcast"] = "Nublado",
                ["Fog"] = "Niebla",
                ["Drizzle"] = "Llovizna",
                ["Freezing drizzle"] = "Llovizna helada",
                ["Rain"] = "Lluvia",
                ["Freezing rain"] = "Lluvia helada",
                ["Snow"] = "Nieve",
                ["Snow grains"] = "Granos de nieve",
                ["Rain showers"] = "Chubascos",
                ["Snow showers"] = "Chubascos de nieve",
                ["Thunderstorm"] = "Tormenta",
                ["Thunderstorm with hail"] = "Tormenta con granizo",
                ["Unavailable"] = "No disponible",
                ["N/A"] = "N/D",
                ["Good"] = "Bueno",
                ["Moderate"] = "Moderado",
                ["Unhealthy (sensitive)"] = "Insalubre (sensibles)",
                ["Unhealthy"] = "Insalubre",
                ["Very unhealthy"] = "Muy insalubre",
                ["Hazardous"] = "Peligroso",
            },
            ["fr"] = new Dictionary<string, string>
            {
                ["Clear sky"] = "Ciel dégagé",
                ["Mainly clear"] = "Plutôt dégagé",
                ["Partly cloudy"] = "Partiellement nuageux",
                ["Overcast"] = "Couvert",
                ["Fog"] = "Brouillard",
                ["Drizzle"] = "Bruine",
                ["Freezing drizzle"] = "Bruine verglaçante",
                ["Rain"] = "Pluie",
                ["Freezing rain"] = "Pluie verglaçante",
                ["Snow"] = "Neige",
                ["Snow grains"] = "Neige en grains",
                ["Rain showers"] = "Averses de pluie",
                ["Snow showers"] = "Averses de neige",
                ["Thunderstorm"] = "Orage",
                ["Thunderstorm with hail"] = "Orage avec grêle",
                ["Unavailable"] = "Indisponible",
                ["N/A"] = "N/D",
                ["Good"] = "Bon",
                ["Moderate"] = "Modéré",
                ["Unhealthy (sensitive)"] = "Malsain (sensibles)",
                ["Unhealthy"] = "Malsain",
                ["Very unhealthy"] = "Très malsain",
                ["Hazardous"] = "Dangereux",
            },
            ["ar"] = new Dictionary<string, string>
            {
                ["Clear sky"] = "سماء صافية",
                ["Mainly clear"] = "صافٍ غالبًا",
                ["Partly cloudy"] = "غائم جزئيًا",
                ["Overcast"] = "غائم",
                ["Fog"] = "ضباب",
                ["Drizzle"] = "رذاذ",
                ["Freezing drizzle"] = "رذاذ متجمد",
                ["Rain"] = "مطر",
                ["Freezing rain"] = "مطر متجمد",
                ["Snow"] = "ثلج",
                ["Snow grains"] = "حبيبات ثلجية",
                ["Rain showers"] = "زخات مطر",
                ["Snow showers"] = "زخات ثلج",
                ["Thunderstorm"] = "عاصفة رعدية",
                ["Thunderstorm with hail"] = "عاصفة رعدية مع بَرَد",
                ["Unavailable"] = "غير متاح",
                ["N/A"] = "غير متاح",
                ["Good"] = "جيد",
                ["Moderate"] = "متوسط",
                ["Unhealthy (sensitive)"] = "غير صحي (للحساسين)",
                ["Unhealthy"] = "غير صحي",
                ["Very unhealthy"] = "غير صحي جدًا",
                ["Hazardous"] = "خطير",
            },
            ["zh"] = new Dictionary<string, string>
            {
                ["Clear sky"] = "晴",
                ["Mainly clear"] = "大致晴朗",
                ["Partly cloudy"] = "多云",
                ["Overcast"] = "阴",
                ["Fog"] = "雾",
                ["Drizzle"] = "毛毛雨",
                ["Freezing drizzle"] = "冻毛毛雨",
                ["Rain"] = "雨",
                ["Freezing rain"] = "冻雨",
                ["Snow"] = "雪",
                ["Snow grains"] = "米雪",
                ["Rain showers"] = "阵雨",
                ["Snow showers"] = "阵雪",
                ["Thunderstorm"] = "雷暴",
                ["Thunderstorm with hail"] = "雷暴伴冰雹",
                ["Unavailable"] = "不可用",
                ["N/A"] = "无数据",
                ["Good"] = "优",
                ["Moderate"] = "中等",
                ["Unhealthy (sensitive)"] = "对敏感人群不健康",
                ["Unhealthy"] = "不健康",
                ["Very unhealthy"] = "非常不健康",
                ["Hazardous"] = "危险",
            },
            ["ja"] = new Dictionary<string, string>
            {
                ["Clear sky"] = "快晴",
                ["Mainly clear"] = "概ね晴れ",
                ["Partly cloudy"] = "部分的に曇り",
                ["Overcast"] = "曇り",
                ["Fog"] = "霧",
                ["Drizzle"] = "霧雨",
                ["Freezing drizzle"] = "着氷性の霧雨",
                ["Rain"] = "雨",
                ["Freezing rain"] = "着氷性の雨",
                ["Snow"] = "雪",
                ["Snow grains"] = "霧雪",
                ["Rain showers"] = "にわか雨",
                ["Snow showers"] = "にわか雪",
                ["Thunderstorm"] = "雷雨",
                ["Thunderstorm with hail"] = "雹を伴う雷雨",
                ["Unavailable"] = "利用不可",
                ["N/A"] = "データなし",
                ["Good"] = "良い",
                ["Moderate"] = "普通",
                ["Unhealthy (sensitive)"] = "敏感な人に不健康",
                ["Unhealthy"] = "不健康",
                ["Very unhealthy"] = "非常に不健康",
                ["Hazardous"] = "危険",
            },
        };

    /// <summary>Normalises a requested language to a supported code (default "en").</summary>
    public static string Normalize(string? lang)
    {
        if (string.IsNullOrWhiteSpace(lang))
        {
            return "en";
        }
        var code = lang.Trim().ToLowerInvariant().Split('-')[0];
        return SupportedLanguages.Contains(code) ? code : "en";
    }

    /// <summary>
    /// Translates a canonical English term into the requested language, falling
    /// back to the English term when there is no translation.
    /// </summary>
    public static string Translate(string englishTerm, string lang)
    {
        var code = Normalize(lang);
        if (code == "en")
        {
            return englishTerm;
        }
        return Tables.TryGetValue(code, out var table) && table.TryGetValue(englishTerm, out var translated)
            ? translated
            : englishTerm;
    }
}
