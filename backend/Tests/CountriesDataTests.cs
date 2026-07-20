using System.Text.RegularExpressions;
using WeatherApi.Data;
using Xunit;

namespace WeatherApplication.Tests;

public class CountriesDataTests
{
    [Fact]
    public void Contains_the_full_country_set()
    {
        // 245 countries/territories + India's 8 union territories.
        Assert.Equal(253, Countries.All.Count);
    }

    [Fact]
    public void Every_code_is_a_lowercase_alpha2_or_subdivision()
    {
        // ISO 3166-1 alpha-2 (e.g. "in") or ISO 3166-2 subdivision (e.g. "in-dl").
        Assert.All(Countries.All, c => Assert.Matches(new Regex("^[a-z]{2}(-[a-z]{2})?$"), c.Code));
    }

    [Fact]
    public void Codes_are_unique()
    {
        Assert.Equal(Countries.All.Count, Countries.All.Select(c => c.Code).Distinct().Count());
    }

    [Fact]
    public void Every_country_has_a_currency_code()
    {
        Assert.All(Countries.All, c => Assert.False(string.IsNullOrWhiteSpace(c.CurrencyCode)));
    }

    [Fact]
    public void Every_country_has_an_official_language()
    {
        Assert.All(Countries.All, c => Assert.False(string.IsNullOrWhiteSpace(c.OfficialLanguage)));
    }

    [Fact]
    public void Coordinates_are_within_valid_ranges()
    {
        Assert.All(Countries.All, c =>
        {
            Assert.InRange(c.Latitude, -90, 90);
            Assert.InRange(c.Longitude, -180, 180);
        });
    }

    [Fact]
    public void Established_year_is_zero_or_a_plausible_year()
    {
        Assert.All(Countries.All, c =>
            Assert.True(c.EstablishedYear == 0 || (c.EstablishedYear is > 0 and <= 2100)));
    }

    [Fact]
    public void India_has_expected_details()
    {
        var india = Countries.All.Single(c => c.Country == "India");
        Assert.Equal("New Delhi", india.Capital);
        Assert.Equal("in", india.Code);
        Assert.Equal("INR", india.CurrencyCode);
        Assert.Equal("₹", india.CurrencySymbol);
        Assert.Equal(1947, india.EstablishedYear);
        Assert.Equal("Hindi, English", india.OfficialLanguage);
    }
}
