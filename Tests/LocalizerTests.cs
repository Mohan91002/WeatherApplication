using WeatherApi.Services;
using Xunit;

namespace WeatherApplication.Tests;

public class LocalizerTests
{
    [Theory]
    [InlineData("Rain", "hi", "बारिश")]
    [InlineData("Rain", "es", "Lluvia")]
    [InlineData("Thunderstorm", "fr", "Orage")]
    [InlineData("Clear sky", "zh", "晴")]
    [InlineData("Good", "ja", "良い")]
    [InlineData("Hazardous", "ar", "خطير")]
    public void Translate_maps_terms_to_the_requested_language(string term, string lang, string expected)
    {
        Assert.Equal(expected, Localizer.Translate(term, lang));
    }

    [Fact]
    public void Translate_returns_english_unchanged()
    {
        Assert.Equal("Rain", Localizer.Translate("Rain", "en"));
    }

    [Fact]
    public void Translate_falls_back_to_english_for_an_unsupported_language()
    {
        Assert.Equal("Rain", Localizer.Translate("Rain", "xx"));
    }

    [Fact]
    public void Translate_returns_the_input_for_an_unknown_term()
    {
        Assert.Equal("Blizzard", Localizer.Translate("Blizzard", "hi"));
    }

    [Theory]
    [InlineData("hi", "hi")]
    [InlineData("HI", "hi")]
    [InlineData("es-419", "es")]
    [InlineData("pt", "en")]
    [InlineData("xx", "en")]
    [InlineData(null, "en")]
    [InlineData("", "en")]
    public void Normalize_maps_input_to_a_supported_code(string? input, string expected)
    {
        Assert.Equal(expected, Localizer.Normalize(input));
    }
}
