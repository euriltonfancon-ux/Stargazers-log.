# Skydash weather dashboard

A responsive, browser-based weather dashboard powered by the free [Open-Meteo](https://open-meteo.com/) forecast and geocoding APIs. No API key or build step is required.

## Run locally

Serve the project directory with any static HTTP server, then open the URL it prints:

```bash
python -m http.server 8000
```

For example, visit http://localhost:8000. You can also use another static file server. Opening `index.html` directly may work in some browsers, but serving it over HTTP is recommended.

## Features

- Current conditions, apparent temperature, humidity, wind, and today's rain chance
- Search by city name
- Six-hour and seven-day forecasts
- Celsius / Fahrenheit temperature toggle (with matching wind units)
- Responsive layout for desktop and mobile

Forecasts are fetched from Open-Meteo's public endpoints; no secrets or environment variables are needed. Google Fonts are used for typography, with system sans-serif fallbacks.
