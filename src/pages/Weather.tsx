import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import {
  Sun,
  SunDim,
  Cloud,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudLightning,
  MapPin,
  Search,
  Wind,
  Droplets,
  Gauge,
  Thermometer,
  Loader2,
  Languages,
  ChevronDown,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type WeatherBundle,
  type GeocodeResult,
  fetchWeather,
  geocode,
  reverseGeocode,
  describeWeather,
  contextualMessage,
} from "@/services/weatherService";

// Lazy-load the heavy map (Leaflet)
const WeatherMap = lazy(() => import("@/components/weather/WeatherMap"));

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun,
  SunDim,
  Cloud,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudLightning,
};

type Lang = "fr" | "en";

const T = {
  fr: {
    title: "Météo",
    subtitle: "Prévisions claires, en un coup d'œil",
    locating: "Localisation…",
    loading: "Chargement…",
    feelsLike: "Ressenti",
    searchPlaceholder: "Rechercher une ville…",
    customize: "Changer de lieu",
    allData: "Toutes les données pour ce lieu",
    next24h: "Prochaines 24 heures",
    daily: "Prévisions sur 7 jours",
    metrics: "Indicateurs",
    humidity: "Humidité",
    wind: "Vent",
    pressure: "Pression",
    precipitation: "Précipitations",
    map: "Carte",
    mapHint: "Cliquez sur la carte pour mettre à jour les données.",
    hour: "h",
    today: "Aujourd'hui",
    error: "Impossible de charger les données météo.",
    retry: "Réessayer",
    geoDenied: "Géolocalisation refusée — Paris affiché par défaut.",
    selectedLocation: "Lieu sélectionné",
  },
  en: {
    title: "Weather",
    subtitle: "Clear forecasts at a glance",
    locating: "Locating…",
    loading: "Loading…",
    feelsLike: "Feels like",
    searchPlaceholder: "Search a city…",
    customize: "Change location",
    allData: "All data for this location",
    next24h: "Next 24 hours",
    daily: "7-day forecast",
    metrics: "Metrics",
    humidity: "Humidity",
    wind: "Wind",
    pressure: "Pressure",
    precipitation: "Precipitation",
    map: "Map",
    mapHint: "Click the map to update data.",
    hour: ":00",
    today: "Today",
    error: "Could not load weather data.",
    retry: "Retry",
    geoDenied: "Geolocation denied — showing Paris.",
    selectedLocation: "Selected location",
  },
} as const;

const PARIS: GeocodeResult = {
  name: "Paris",
  country: "France",
  admin1: "Île-de-France",
  latitude: 48.8566,
  longitude: 2.3522,
};

// Soft, weather-driven palette
function paletteFor(code: number, isDay: boolean): { from: string; to: string; accent: string } {
  if (!isDay) return { from: "#0f172a", to: "#1e293b", accent: "#94a3b8" };
  if ([0, 1].includes(code)) return { from: "#fde68a", to: "#fb923c", accent: "#f59e0b" };
  if ([2].includes(code)) return { from: "#bae6fd", to: "#fcd34d", accent: "#0ea5e9" };
  if ([3, 45, 48].includes(code)) return { from: "#cbd5e1", to: "#94a3b8", accent: "#64748b" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return { from: "#93c5fd", to: "#1d4ed8", accent: "#3b82f6" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { from: "#e0f2fe", to: "#bae6fd", accent: "#0284c7" };
  if ([95, 96, 99].includes(code)) return { from: "#1e1b4b", to: "#4c1d95", accent: "#a78bfa" };
  return { from: "#bae6fd", to: "#60a5fa", accent: "#0ea5e9" };
}

function WeatherIcon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Cloud;
  return <C className={className} />;
}

const Weather = () => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = (localStorage.getItem("ticdia-language") || "fr") as Lang;
    return saved === "en" ? "en" : "fr";
  });
  const t = T[lang];

  const [location, setLocation] = useState<GeocodeResult | null>(null);
  const [bundle, setBundle] = useState<WeatherBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoNote, setGeoNote] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimer = useRef<number | null>(null);

  // Initial geolocation
  useEffect(() => {
    let cancelled = false;
    const fallback = async () => {
      if (cancelled) return;
      setLocation(PARIS);
    };
    if (!("geolocation" in navigator)) {
      fallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        const rev = await reverseGeocode(pos.coords.latitude, pos.coords.longitude, lang);
        setLocation(
          rev ?? {
            name: lang === "fr" ? "Ma position" : "My location",
            country: "",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }
        );
      },
      () => {
        setGeoNote(t.geoDenied);
        fallback();
      },
      { timeout: 6000, maximumAge: 5 * 60 * 1000 }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch weather when location changes
  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWeather(location.latitude, location.longitude)
      .then((b) => {
        if (!cancelled) setBundle(b);
      })
      .catch(() => {
        if (!cancelled) setError(t.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location, t.error]);

  // Debounced geocode search
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = window.setTimeout(async () => {
      try {
        const results = await geocode(search.trim(), lang);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [search, lang]);

  const palette = useMemo(() => {
    if (!bundle) return paletteFor(2, true);
    return paletteFor(bundle.current.weatherCode, bundle.current.isDay);
  }, [bundle]);

  const desc = bundle ? describeWeather(bundle.current.weatherCode, lang) : null;
  const message = bundle ? contextualMessage(bundle, lang) : "";

  const hourlyMax = bundle ? Math.max(...bundle.hourly.map((h) => h.temperature)) : 0;
  const hourlyMin = bundle ? Math.min(...bundle.hourly.map((h) => h.temperature)) : 0;
  const range = Math.max(1, hourlyMax - hourlyMin);

  const handlePickLocation = (loc: GeocodeResult) => {
    setLocation(loc);
    setSearch("");
    setSearchResults([]);
    setSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* SCREEN 1 — HERO */}
      <section
        className="relative min-h-[100svh] flex flex-col items-center justify-center px-4 pt-20 pb-16 overflow-hidden transition-colors duration-700"
        style={{
          background: `linear-gradient(160deg, ${palette.from}, ${palette.to})`,
        }}
      >
        {/* Soft floating blobs */}
        <div
          aria-hidden
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: palette.accent }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-25"
          style={{ background: palette.accent }}
        />

        {/* Lang toggle */}
        <div className="absolute top-20 right-4 sm:right-6 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLang((l) => (l === "fr" ? "en" : "fr"))}
            className="rounded-full bg-white/20 backdrop-blur-md text-white border-white/20 hover:bg-white/30"
          >
            <Languages className="w-4 h-4 mr-1.5" />
            {lang === "fr" ? "EN" : "FR"}
          </Button>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6 text-white drop-shadow-sm">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{t.title}</h1>
            <p className="text-white/80 text-sm mt-1">{t.subtitle}</p>
          </div>

          {/* Main card */}
          <Card className="bg-white/15 backdrop-blur-xl border-white/25 text-white shadow-2xl rounded-3xl p-6 sm:p-8">
            {/* Location + search */}
            <div className="flex items-center justify-between mb-6 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 shrink-0 text-white/80" />
                <span className="truncate text-sm sm:text-base font-medium">
                  {location ? `${location.name}${location.admin1 ? `, ${location.admin1}` : ""}` : t.locating}
                </span>
              </div>

              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-white hover:bg-white/15 h-8 px-3 text-xs"
                  >
                    <Search className="w-3.5 h-3.5 mr-1" />
                    {t.customize}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-2">
                  <Input
                    autoFocus
                    placeholder={t.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="mt-2 max-h-64 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button
                        key={`${r.latitude}-${r.longitude}`}
                        onClick={() => handlePickLocation(r)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm flex items-center gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate">
                          <span className="font-medium">{r.name}</span>
                          <span className="text-muted-foreground">
                            {r.admin1 ? `, ${r.admin1}` : ""}{r.country ? ` · ${r.country}` : ""}
                          </span>
                        </span>
                      </button>
                    ))}
                    {search && searchResults.length === 0 && (
                      <div className="text-xs text-muted-foreground px-3 py-2">—</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Body */}
            {loading || !bundle ? (
              <div className="flex flex-col items-center py-10 text-white/80">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <span className="text-sm">{t.loading}</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-white/90 mb-3 text-sm">{error}</p>
                <Button
                  variant="secondary"
                  onClick={() => location && setLocation({ ...location })}
                  className="bg-white/25 hover:bg-white/35 text-white border-0"
                >
                  {t.retry}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="animate-fade-up">
                  <WeatherIcon
                    name={desc!.icon}
                    className="w-24 h-24 sm:w-28 sm:h-28 text-white drop-shadow-lg mb-2"
                  />
                </div>
                <div className="text-7xl sm:text-8xl font-extralight tracking-tighter leading-none">
                  {Math.round(bundle.current.temperature)}°
                </div>
                <div className="text-base sm:text-lg mt-2 text-white/95">{desc!.label}</div>
                <div className="text-xs sm:text-sm text-white/70 mt-1">
                  {t.feelsLike} {Math.round(bundle.current.apparentTemperature)}°
                </div>

                <div className="mt-5 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-sm">
                  {message}
                </div>
              </div>
            )}
          </Card>

          {geoNote && (
            <p className="mt-4 text-center text-xs text-white/70">{geoNote}</p>
          )}

          {/* Scroll hint */}
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => {
                document.getElementById("data-overview")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-white/80 hover:text-white transition-colors flex flex-col items-center gap-1"
              aria-label="Scroll"
            >
              <span className="text-xs uppercase tracking-widest">{t.allData}</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      {/* SCREEN 2 — DATA OVERVIEW */}
      <section
        id="data-overview"
        className="px-4 sm:px-6 py-16 sm:py-24 max-w-5xl mx-auto"
      >
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
          {t.allData}
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          {location ? `${location.name}${location.admin1 ? `, ${location.admin1}` : ""}` : ""}
        </p>

        {/* Metrics */}
        {bundle && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
            <MetricCard
              icon={<Droplets className="w-4 h-4" />}
              label={t.humidity}
              value={`${Math.round(bundle.current.humidity)}%`}
              accent={palette.accent}
            />
            <MetricCard
              icon={<Wind className="w-4 h-4" />}
              label={t.wind}
              value={`${Math.round(bundle.current.windSpeed)} km/h`}
              accent={palette.accent}
            />
            <MetricCard
              icon={<Gauge className="w-4 h-4" />}
              label={t.pressure}
              value={`${Math.round(bundle.current.pressure)} hPa`}
              accent={palette.accent}
            />
            <MetricCard
              icon={<Thermometer className="w-4 h-4" />}
              label={t.precipitation}
              value={`${bundle.current.precipitation.toFixed(1)} mm`}
              accent={palette.accent}
            />
          </div>
        )}

        {/* Hourly graph + chips */}
        {bundle && (
          <Card className="p-4 sm:p-6 rounded-2xl mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-medium">{t.next24h}</h3>
              <span className="text-xs text-muted-foreground">{bundle.timezone}</span>
            </div>

            {/* SVG line graph */}
            <HourlyGraph
              points={bundle.hourly}
              min={hourlyMin}
              max={hourlyMax}
              range={range}
              accent={palette.accent}
            />

            {/* Hour chips */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6 scrollbar-thin">
              {bundle.hourly.map((h, i) => {
                const d = new Date(h.time);
                const hr = d.getHours();
                const di = describeWeather(h.weatherCode, lang);
                return (
                  <div
                    key={h.time}
                    className="shrink-0 w-16 rounded-xl bg-muted/50 border border-border flex flex-col items-center py-2 text-xs"
                  >
                    <span className="text-muted-foreground">
                      {i === 0 ? (lang === "fr" ? "Maint." : "Now") : `${hr}${t.hour}`}
                    </span>
                    <WeatherIcon name={di.icon} className="w-5 h-5 my-1" />
                    <span className="font-medium">{Math.round(h.temperature)}°</span>
                    {h.precipitationProbability > 20 && (
                      <span className="text-[10px] text-blue-500 mt-0.5">
                        {h.precipitationProbability}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 7-day forecast */}
        {bundle && (
          <Card className="p-4 sm:p-6 rounded-2xl">
            <h3 className="text-base sm:text-lg font-medium mb-4">{t.daily}</h3>
            <div className="divide-y divide-border">
              {bundle.daily.map((d, i) => {
                const di = describeWeather(d.weatherCode, lang);
                const date = new Date(d.date);
                const label = i === 0
                  ? t.today
                  : date.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "short" });
                return (
                  <div key={d.date} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <WeatherIcon name={di.icon} className="w-5 h-5 text-muted-foreground shrink-0" />
                      <span className="text-sm capitalize truncate">{label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {d.precipitationSum > 0.1 && (
                        <span className="text-blue-500 text-xs">
                          {d.precipitationSum.toFixed(1)} mm
                        </span>
                      )}
                      <span className="text-muted-foreground">{Math.round(d.tempMin)}°</span>
                      <span className="font-medium w-10 text-right">{Math.round(d.tempMax)}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </section>

      {/* SCREEN 3 — MAP */}
      <section className="px-4 sm:px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">{t.map}</h2>
        <p className="text-muted-foreground text-sm mb-6">{t.mapHint}</p>

        <Card className="overflow-hidden rounded-2xl">
          <div className="grid md:grid-cols-[1fr_280px]">
            <div className="h-[360px] sm:h-[460px] bg-muted">
              {location && (
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>}>
                  <WeatherMap
                    lat={location.latitude}
                    lon={location.longitude}
                    accent={palette.accent}
                    onPick={async (lat, lon) => {
                      const rev = await reverseGeocode(lat, lon, lang);
                      setLocation(
                        rev ?? {
                          name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
                          country: "",
                          latitude: lat,
                          longitude: lon,
                        }
                      );
                    }}
                  />
                </Suspense>
              )}
            </div>
            <div className="p-5 border-t md:border-t-0 md:border-l border-border">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {t.selectedLocation}
              </p>
              <p className="text-base font-medium mb-4 truncate">
                {location?.name}
                {location?.admin1 ? `, ${location.admin1}` : ""}
              </p>
              {bundle && desc && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{ color: palette.accent }}>
                      <WeatherIcon name={desc.icon} className="w-10 h-10" />
                    </div>
                    <div>
                      <div className="text-3xl font-light leading-none">
                        {Math.round(bundle.current.temperature)}°
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{desc.label}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <Row label={t.humidity} value={`${Math.round(bundle.current.humidity)}%`} />
                    <Row label={t.wind} value={`${Math.round(bundle.current.windSpeed)} km/h`} />
                    <Row label={t.pressure} value={`${Math.round(bundle.current.pressure)} hPa`} />
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const MetricCard = ({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) => (
  <Card className="p-4 rounded-2xl">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
      style={{ background: `${accent}22`, color: accent }}
    >
      {icon}
    </div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold mt-0.5">{value}</div>
  </Card>
);

// Lightweight inline SVG line graph for hourly temperatures
const HourlyGraph = ({
  points,
  min,
  max,
  range,
  accent,
}: {
  points: { time: string; temperature: number }[];
  min: number;
  max: number;
  range: number;
  accent: string;
}) => {
  const W = 600;
  const H = 120;
  const PAD_X = 8;
  const PAD_Y = 16;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;

  const coords = points.map((p, i) => {
    const x = PAD_X + (i / Math.max(1, points.length - 1)) * innerW;
    const y = PAD_Y + (1 - (p.temperature - min) / range) * innerH;
    return [x, y] as const;
  });

  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${PAD_X + innerW} ${PAD_Y + innerH} L ${PAD_X} ${PAD_Y + innerH} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wf-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#wf-grad)" />
        <path d={path} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground px-1 -mt-1">
        <span>{Math.round(min)}°</span>
        <span>{Math.round(max)}°</span>
      </div>
    </div>
  );
};

export default Weather;
