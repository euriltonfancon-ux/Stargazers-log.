const API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_API = 'https://geocoding-api.open-meteo.com/v1/search';
const state = { unit: 'celsius', location: { name: 'London', latitude: 51.5072, longitude: -0.1276, country: 'United Kingdom' } };
const $ = (id) => document.getElementById(id);

const weather = (code, isDay = true) => {
  if (code === 0) return { text: 'Clear sky', icon: isDay ? '☀' : '☾' };
  if (code === 1) return { text: 'Mainly clear', icon: isDay ? '🌤' : '☾' };
  if (code === 2) return { text: 'Partly cloudy', icon: '⛅' };
  if (code === 3) return { text: 'Overcast', icon: '☁' };
  if ([45, 48].includes(code)) return { text: 'Foggy', icon: '〰' };
  if ([51, 53, 55, 56, 57].includes(code)) return { text: 'Drizzle', icon: '🌦' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { text: 'Rainy', icon: '🌧' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: 'Snowy', icon: '❄' };
  if ([95, 96, 99].includes(code)) return { text: 'Thunderstorms', icon: '⛈' };
  return { text: 'Variable conditions', icon: '☁' };
};

function setStatus(message = '') { $('status').textContent = message; }
function setText(id, value) { $(id).textContent = value; }
function displayTemp(value) { return `${Math.round(value)}°`; }

async function getForecast() {
  setStatus('');
  try {
    const params = new URLSearchParams({
      latitude: state.location.latitude,
      longitude: state.location.longitude,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
      hourly: 'temperature_2m,precipitation_probability,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max',
      temperature_unit: state.unit,
      wind_speed_unit: state.unit === 'celsius' ? 'kmh' : 'mph',
      timezone: 'auto',
      forecast_days: '7'
    });
    const response = await fetch(`${API}?${params}`);
    if (!response.ok) throw new Error('Weather service is unavailable. Please try again shortly.');
    const data = await response.json();
    renderForecast(data);
  } catch (error) {
    setStatus(error.message || 'Could not load weather. Check your connection and try again.');
  }
}

function renderForecast(data) {
  const current = data.current;
  const today = data.daily;
  const currentWeather = weather(current.weather_code, current.is_day === 1);
  const now = new Date();
  setText('location', state.location.name);
  setText('country-label', state.location.country || '');
  setText('current-date', new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now));
  setText('temperature', displayTemp(current.temperature_2m));
  setText('condition', currentWeather.text);
  setText('feels-like', `Feels like ${displayTemp(current.apparent_temperature)}`);
  setText('high-temp', displayTemp(today.temperature_2m_max[0]));
  setText('low-temp', displayTemp(today.temperature_2m_min[0]));
  setText('metric-feels', displayTemp(current.apparent_temperature));
  setText('feels-note', current.apparent_temperature <= current.temperature_2m ? 'Feels cooler than the air' : 'Feels warmer than the air');
  setText('humidity', current.relative_humidity_2m);
  $('humidity-bar').style.width = `${current.relative_humidity_2m}%`;
  setText('wind-speed', Math.round(current.wind_speed_10m));
  setText('wind-unit', state.unit === 'celsius' ? 'km/h' : 'mph');
  setText('rain-chance', today.precipitation_probability_max?.[0] ?? 0);
  $('hero-art').querySelector('span').textContent = currentWeather.icon;
  $('hero-art').classList.toggle('night', current.is_day !== 1);
  renderHourly(data.hourly, current.time);
  renderDaily(today);
}

function renderHourly(hourly, currentTime) {
  const list = $('hourly-list');
  list.replaceChildren();
  const start = Math.max(0, hourly.time.findIndex((time) => time >= currentTime));
  for (let i = start; i < Math.min(start + 6, hourly.time.length); i++) {
    const item = document.createElement('div');
    item.className = 'hourly-item';
    const time = document.createElement('span');
    const hour = Number(hourly.time[i].slice(11, 13));
    time.textContent = i === start ? 'Now' : `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`;
    const icon = document.createElement('span');
    icon.className = 'hourly-icon';
    icon.textContent = weather(hourly.weather_code[i], hour >= 6 && hour < 18).icon;
    const temp = document.createElement('span');
    temp.className = 'hourly-temp';
    temp.textContent = displayTemp(hourly.temperature_2m[i]);
    const rain = document.createElement('span');
    rain.className = 'hourly-rain';
    rain.textContent = `${hourly.precipitation_probability[i] ?? 0}% rain`;
    item.append(time, icon, temp, rain);
    list.append(item);
  }
}

function renderDaily(daily) {
  const list = $('daily-list');
  list.replaceChildren();
  daily.time.forEach((date, index) => {
    const item = document.createElement('div');
    item.className = 'daily-item';
    const day = document.createElement('span');
    day.className = 'daily-day';
    day.textContent = index === 0 ? 'Today' : new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${date}T12:00:00`));
    const icon = document.createElement('span');
    icon.className = 'daily-icon';
    icon.textContent = weather(daily.weather_code[index]).icon;
    const temps = document.createElement('span');
    temps.className = 'daily-temps';
    const high = document.createElement('span');
    high.textContent = displayTemp(daily.temperature_2m_max[index]);
    const low = document.createElement('span');
    low.textContent = displayTemp(daily.temperature_2m_min[index]);
    temps.append(high, low);
    const rain = document.createElement('span');
    rain.className = 'daily-rain';
    rain.textContent = `☂ ${daily.precipitation_probability_max?.[index] ?? 0}%`;
    item.append(day, icon, temps, rain);
    list.append(item);
  });
}

$('search-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = $('city-search').value.trim();
  if (!query) return;
  setStatus('');
  try {
    const response = await fetch(`${GEOCODE_API}?${new URLSearchParams({ name: query, count: '1', language: 'en', format: 'json' })}`);
    if (!response.ok) throw new Error('Could not search for that city. Try again.');
    const result = await response.json();
    if (!result.results?.length) throw new Error(`No location found for “${query}”. Try another city.`);
    const place = result.results[0];
    state.location = { name: place.name, latitude: place.latitude, longitude: place.longitude, country: place.country };
    await getForecast();
  } catch (error) {
    setStatus(error.message || 'Location search failed. Check your connection and try again.');
  }
});

document.querySelectorAll('.unit-button').forEach((button) => {
  button.addEventListener('click', () => {
    if (state.unit === button.dataset.unit) return;
    state.unit = button.dataset.unit;
    document.querySelectorAll('.unit-button').forEach((option) => {
      const active = option === button;
      option.classList.toggle('active', active);
      option.setAttribute('aria-pressed', String(active));
    });
    getForecast();
  });
});

getForecast();
