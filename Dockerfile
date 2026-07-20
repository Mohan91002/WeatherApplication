# syntax=docker/dockerfile:1
# Multi-stage build for the WeatherApplication .NET 10 API.
# The Angular SPA is built + deployed separately (S3/CloudFront), not in this image.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first (better layer caching).
COPY WeatherApplication.csproj ./
RUN dotnet restore WeatherApplication.csproj

# Copy the rest and publish (Tests/ and frontend/ are excluded via .dockerignore).
COPY . .
RUN dotnet publish WeatherApplication.csproj -c Release -o /app /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

# Listen on 8080 (the non-root default in .NET 8+ images).
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
# Honour X-Forwarded-Proto/For from the TLS-terminating edge (App Runner / ALB /
# CloudFront) so HttpsRedirection doesn't loop and client IPs are correct.
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED=true

EXPOSE 8080
# Run as the image's built-in non-root user.
USER $APP_UID

ENTRYPOINT ["dotnet", "WeatherApplication.dll"]
