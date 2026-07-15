"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Cloud, CloudRain, Wind, Droplets, Thermometer } from "lucide-react";
import { Reveal } from "./Motifs";

/**
 * Vrindavan weather widget — shows current weather conditions.
 *
 * Uses the Open-Meteo API (free, no API key required) for Vrindavan
 * coordinates (27.5756°N, 77.7100°E).
 *
 * Falls back to a seasonal estimate if the API is unreachable.
 */
type Weather = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  isDay: boolean;
};

const WEATHER_CODES: Record<number, { desc: string; icon: "sun" | "cloud" | "rain" }> = {
  0: { desc: "Clear sky", icon: "sun" },
  1: { desc: "Mainly clear", icon: "sun" },
  2: { desc: "Partly cloudy", icon: "cloud" },
  3: { desc: "Overcast", icon: "cloud" },
  45: { desc: "Foggy", icon: "cloud" },
  48: { desc: "Rime fog", icon: "cloud" },
  51: { desc: "Light drizzle", icon: "rain" },
  53: { desc: "Drizzle", icon: "rain" },
  55: { desc: "Heavy drizzle", icon: "rain" },
  61: { desc: "Light rain", icon: "rain" },
  63: { desc: "Rain", icon: "rain" },
  65: { desc: "Heavy rain", icon: "rain" },
  71: { desc: "Light snow", icon: "cloud" },
  73: { desc: "Snow", icon: "cloud" },
  75: { desc: "Heavy snow", icon: "cloud" },
  80: { desc: "Rain showers", icon: "rain" },
  81: { desc: "Rain showers", icon: "rain" },
  82: { desc: "Violent showers", icon: "rain" },
  95: { desc: "Thunderstorm", icon: "rain" },
  96: { desc: "Thunderstorm", icon: "rain" },
  99: { desc: "Severe storm", icon: "rain" },
};

function getSeasonalEstimate(): Weather {
  const month = new Date().getMonth();
  // Vrindavan seasonal averages
  const tempByMonth = [12, 15, 22, 30, 36, 38, 33, 31, 30, 26, 19, 13];
  const humidityByMonth = [70, 65, 55, 40, 35, 50, 75, 80, 75, 55, 60, 70];
  return {
    temperature: tempByMonth[month],
    feelsLike: tempByMonth[month] + 2,
    humidity: humidityByMonth[month],
    windSpeed: 8,
    weatherCode: month >= 6 && month <= 8 ? 63 : 1,
    description: month >= 6 && month <= 8 ? "Monsoon rain" : "Mainly clear",
    isDay: true,
  };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=27.5756&longitude=77.7100&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=Asia%2FKolkata"
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const c = data.current;
        const meta = WEATHER_CODES[c.weather_code] || { desc: "Clear", icon: "sun" };
        setWeather({
          temperature: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          weatherCode: c.weather_code,
          description: meta.desc,
          isDay: c.is_day === 1,
        });
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setWeather(getSeasonalEstimate());
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading || !weather) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-ivory/20 bg-ivory/5 px-4 py-2 backdrop-blur-sm">
        <div className="h-4 w-4 animate-pulse rounded-full bg-ivory/30" />
        <span className="font-display text-xs text-ivory/60">Loading weather…</span>
      </div>
    );
  }

  const meta = WEATHER_CODES[weather.weatherCode] || { desc: "Clear", icon: "sun" };
  const Icon = meta.icon === "sun" ? Sun : meta.icon === "cloud" ? Cloud : CloudRain;

  return (
    <Reveal>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="inline-flex items-center gap-3 rounded-2xl border border-ivory/20 bg-ivory/10 px-4 py-2.5 backdrop-blur-md"
      >
        <Icon className={`h-5 w-5 ${meta.icon === "sun" ? "text-gold" : meta.icon === "rain" ? "text-blue-300" : "text-ivory/80"}`} />
        <div className="flex items-center gap-3">
          <div>
            <div className="font-serif text-base font-bold text-ivory">
              {weather.temperature}°C
            </div>
            <div className="font-display text-[10px] text-ivory/60">
              {weather.description}
            </div>
          </div>
          <div className="h-8 w-px bg-ivory/20" />
          <div className="flex items-center gap-3 font-display text-[10px] text-ivory/70">
            <span className="inline-flex items-center gap-1">
              <Thermometer className="h-3 w-3" />
              {weather.feelsLike}°
            </span>
            <span className="inline-flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              {weather.humidity}%
            </span>
            <span className="hidden items-center gap-1 sm:inline-flex">
              <Wind className="h-3 w-3" />
              {weather.windSpeed}
            </span>
          </div>
        </div>
        <div className="hidden border-l border-ivory/20 pl-3 sm:block">
          <div className="font-display text-[10px] uppercase tracking-wider text-gold-soft">
            Vrindavan
          </div>
          <div className="font-display text-[10px] text-ivory/50">
            Now
          </div>
        </div>
      </motion.div>
    </Reveal>
  );
}
