// Open-Meteo weather service (no API key required)
// Docs: https://open-meteo.com/en/docs

export interface GeocodeResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  pressure: number;
  precipitation: number;
  isDay: boolean;
  time: string;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
}

export interface DailyPoint {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitationSum: number;
}

export interface WeatherBundle {
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  timezone: string;
}

const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";

export async function geocode(query: string, lang: "fr" | "en" = "fr"): Promise<GeocodeResult[]> {
  const url = `${GEO}?name=${encodeURIComponent(query)}&count=8&language=${lang}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export async function reverseGeocode(lat: number, lon: number, lang: "fr" | "en" = "fr"): Promise<GeocodeResult | null> {
  // Open-Meteo doesn't have proper reverse, so use BigDataCloud free endpoint (no key)
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.city || data.locality || data.principalSubdivision || "Unknown",
      country: data.countryName || "",
      admin1: data.principalSubdivision,
      latitude: lat,
      longitude: lon,
    };
  } catch {
    return null;
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherBundle> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "auto",
    forecast_days: "7",
  });
  const res = await fetch(`${FORECAST}?${params.toString()}`);
  if (!res.ok) throw new Error("Forecast fetch failed");
  const data = await res.json();

  const c = data.current;
  const current: CurrentWeather = {
    temperature: c.temperature_2m,
    apparentTemperature: c.apparent_temperature,
    weatherCode: c.weather_code,
    windSpeed: c.wind_speed_10m,
    windDirection: c.wind_direction_10m,
    humidity: c.relative_humidity_2m,
    pressure: c.surface_pressure,
    precipitation: c.precipitation,
    isDay: c.is_day === 1,
    time: c.time,
  };

  const h = data.hourly;
  const nowIdx = h.time.findIndex((t: string) => new Date(t).getTime() >= Date.now()) || 0;
  const hourly: HourlyPoint[] = h.time.slice(nowIdx, nowIdx + 24).map((t: string, i: number) => ({
    time: t,
    temperature: h.temperature_2m[nowIdx + i],
    precipitationProbability: h.precipitation_probability?.[nowIdx + i] ?? 0,
    weatherCode: h.weather_code[nowIdx + i],
  }));

  const d = data.daily;
  const daily: DailyPoint[] = d.time.map((t: string, i: number) => ({
    date: t,
    tempMax: d.temperature_2m_max[i],
    tempMin: d.temperature_2m_min[i],
    weatherCode: d.weather_code[i],
    precipitationSum: d.precipitation_sum[i],
  }));

  return { current, hourly, daily, timezone: data.timezone };
}

// WMO weather code → label + icon name (lucide)
export function describeWeather(code: number, lang: "fr" | "en" = "fr"): { label: string; icon: string } {
  const fr: Record<number, [string, string]> = {
    0: ["Ciel clair", "Sun"],
    1: ["Plutôt clair", "SunDim"],
    2: ["Partiellement nuageux", "CloudSun"],
    3: ["Couvert", "Cloud"],
    45: ["Brouillard", "CloudFog"],
    48: ["Brouillard givrant", "CloudFog"],
    51: ["Bruine légère", "CloudDrizzle"],
    53: ["Bruine modérée", "CloudDrizzle"],
    55: ["Bruine dense", "CloudDrizzle"],
    61: ["Pluie faible", "CloudRain"],
    63: ["Pluie modérée", "CloudRain"],
    65: ["Pluie forte", "CloudRainWind"],
    71: ["Neige faible", "CloudSnow"],
    73: ["Neige modérée", "CloudSnow"],
    75: ["Neige forte", "CloudSnow"],
    77: ["Grains de neige", "Snowflake"],
    80: ["Averses légères", "CloudRain"],
    81: ["Averses modérées", "CloudRain"],
    82: ["Averses violentes", "CloudRainWind"],
    85: ["Averses de neige", "CloudSnow"],
    86: ["Averses de neige fortes", "CloudSnow"],
    95: ["Orage", "CloudLightning"],
    96: ["Orage avec grêle", "CloudLightning"],
    99: ["Orage violent avec grêle", "CloudLightning"],
  };
  const en: Record<number, [string, string]> = {
    0: ["Clear sky", "Sun"],
    1: ["Mainly clear", "SunDim"],
    2: ["Partly cloudy", "CloudSun"],
    3: ["Overcast", "Cloud"],
    45: ["Fog", "CloudFog"],
    48: ["Rime fog", "CloudFog"],
    51: ["Light drizzle", "CloudDrizzle"],
    53: ["Moderate drizzle", "CloudDrizzle"],
    55: ["Dense drizzle", "CloudDrizzle"],
    61: ["Light rain", "CloudRain"],
    63: ["Moderate rain", "CloudRain"],
    65: ["Heavy rain", "CloudRainWind"],
    71: ["Light snow", "CloudSnow"],
    73: ["Moderate snow", "CloudSnow"],
    75: ["Heavy snow", "CloudSnow"],
    77: ["Snow grains", "Snowflake"],
    80: ["Light showers", "CloudRain"],
    81: ["Moderate showers", "CloudRain"],
    82: ["Violent showers", "CloudRainWind"],
    85: ["Snow showers", "CloudSnow"],
    86: ["Heavy snow showers", "CloudSnow"],
    95: ["Thunderstorm", "CloudLightning"],
    96: ["Thunderstorm w/ hail", "CloudLightning"],
    99: ["Severe thunderstorm", "CloudLightning"],
  };
  const dict = lang === "fr" ? fr : en;
  const [label, icon] = dict[code] ?? (lang === "fr" ? ["Inconnu", "Cloud"] : ["Unknown", "Cloud"]);
  return { label, icon };
}

export function contextualMessage(bundle: WeatherBundle, lang: "fr" | "en" = "fr"): string {
  // Look at the next ~2 hours of precipitation probability
  const next = bundle.hourly.slice(0, 4);
  const rainSoon = next.find((h) => h.precipitationProbability >= 60);
  if (rainSoon) {
    const minutes = Math.max(0, Math.round((new Date(rainSoon.time).getTime() - Date.now()) / 60000));
    if (lang === "fr") return minutes <= 5 ? "Pluie en cours" : `Pluie dans ~${minutes} min`;
    return minutes <= 5 ? "Rain right now" : `Rain in ~${minutes} min`;
  }
  const maxToday = bundle.daily[0]?.tempMax;
  if (typeof maxToday === "number") {
    if (lang === "fr") return `Maximum aujourd'hui ~${Math.round(maxToday)}°`;
    return `High today ~${Math.round(maxToday)}°`;
  }
  return lang === "fr" ? "Conditions stables" : "Stable conditions";
}
