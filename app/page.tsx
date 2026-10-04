"use client";

import { useEffect, useState } from "react";

type City = {
  name: string;
  country: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type SearchResult = City & {
  id: number;
  admin1?: string;
};

const defaultCity: City = {
  name: "東京",
  country: "日本",
  country_code: "JP",
  latitude: 35.68,
  longitude: 139.77,
  timezone: "Asia/Tokyo",
};

function getWeatherInfo(code: number) {
  if (code === 0) {
    return {
      label: "晴れ",
      icon: "☀️",
      image: "/icons/sunny.jpg",
    };
  }

  if (code === 1 || code === 2) {
    return {
      label: "晴れ時々くもり",
      icon: "🌤️",
      image: "/icons/partly-cloudy.jpg",
    };
  }

  if (code === 3) {
    return {
      label: "くもり",
      icon: "☁️",
      image: "/icons/cloudy.jpg",
    };
  }

  if (code === 45 || code === 48) {
    return {
      label: "霧",
      icon: "🌫️",
      image: "/icons/fog.jpg",
    };
  }

  if (code >= 51 && code <= 67) {
    return {
      label: "雨",
      icon: "🌧️",
      image: "/icons/rainy.jpg",
    };
  }

  if (code >= 71 && code <= 77) {
    return {
      label: "雪",
      icon: "❄️",
      image: "/icons/snowy.jpg",
    };
  }

  if (code >= 80 && code <= 82) {
    return {
      label: "にわか雨",
      icon: "🌦️",
      image: "/icons/rainy.jpg",
    };
  }

  if (code === 85 || code === 86) {
    return {
      label: "にわか雪",
      icon: "🌨️",
      image: "/icons/snowy.jpg",
    };
  }

  if (code >= 95 && code <= 99) {
    return {
      label: "雷雨",
      icon: "⛈️",
      image: "/icons/thunder.jpg",
    };
  }

  return {
    label: "不明",
    icon: "❓",
    image: "/icons/cloudy.jpg",
  };
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);

  const weekdays = [
    "日",
    "月",
    "火",
    "水",
    "木",
    "金",
    "土",
  ];

  return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
}

function formatHour(timeString: string) {
  return timeString.slice(11, 16);
}

export default function Home() {
  const [city, setCity] = useState<City>(defaultCity);

  const [weather, setWeather] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  /*
   * 世界の都市を検索する
   */
  const searchCities = async () => {
    const keyword = searchQuery.trim();

    if (!keyword) {
      setSearchResults([]);
      setSearchError("都市名を入力してください。");
      return;
    }

    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const url =
        `https://geocoding-api.open-meteo.com/v1/search?` +
        `name=${encodeURIComponent(keyword)}` +
        `&count=10` +
        `&language=ja` +
        `&format=json`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("City search failed");
      }

      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        setSearchError("都市が見つかりませんでした。");
        return;
      }

      setSearchResults(data.results);
    } catch (err) {
      setSearchError("都市の検索に失敗しました。");
    } finally {
      setSearchLoading(false);
    }
  };

  /*
   * 選択した都市の天気を取得する
   */
  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
      setError("");
      setWeather(null);

      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${city.latitude}` +
          `&longitude=${city.longitude}` +
          `&current=temperature_2m,weather_code,wind_speed_10m` +
          `&hourly=temperature_2m,weather_code,precipitation_probability` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
          `&timezone=auto`;

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("API request failed");
        }

        const data = await res.json();

        setWeather(data);
      } catch (err) {
        setError("天気情報を取得できませんでした。");
      } finally {
        setLoading(false);
      }
    };

    loadWeather();
  }, [city]);

  /*
   * 検索結果から都市を選択する
   */
  const selectCity = (selectedCity: SearchResult) => {
    setCity({
      name: selectedCity.name,
      country: selectedCity.country,
      country_code: selectedCity.country_code,
      latitude: selectedCity.latitude,
      longitude: selectedCity.longitude,
      timezone: selectedCity.timezone,
    });

    setSearchResults([]);
    setSearchQuery("");
    setSearchError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * 今日の時間別予報を作る
   */
  const getHourlyForecast = () => {
    if (!weather?.hourly?.time) {
      return [];
    }

    const currentTime = weather.current?.time;

    const currentIndex = weather.hourly.time.findIndex(
      (time: string) => time === currentTime
    );

    const startIndex = currentIndex >= 0 ? currentIndex : 0;

    return weather.hourly.time
      .slice(startIndex, startIndex + 24)
      .map((time: string, index: number) => {
        const actualIndex = startIndex + index;

        return {
          time,
          temperature: weather.hourly.temperature_2m[actualIndex],
          weatherCode: weather.hourly.weather_code[actualIndex],
          precipitationProbability:
            weather.hourly.precipitation_probability[actualIndex],
        };
      });
  };

  const hourlyForecast = getHourlyForecast();

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-indigo-100 px-4 py-8 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* タイトル */}
        <header className="mb-8 text-center">
          <div className="mb-3 text-5xl">🌍</div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            世界の天気予報
          </h1>

          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            世界中の都市を検索して天気を確認できます
          </p>
        </header>

        {/* 都市検索 */}
        <section className="mb-6 rounded-3xl bg-white/90 p-5 shadow-xl backdrop-blur sm:p-6">
          <h2 className="mb-4 text-lg font-bold">
            🔍 都市を検索
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchCities();
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="例：Tokyo、New York、London"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200"
            />

            <button
              type="submit"
              disabled={searchLoading}
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searchLoading ? "検索中..." : "検索"}
            </button>
          </form>

          {searchError && (
            <p className="mt-3 text-sm font-medium text-red-500">
              {searchError}
            </p>
          )}

          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => selectCity(result)}
                  className="flex w-full items-center justify-between border-b border-slate-100 bg-white px-4 py-4 text-left transition last:border-b-0 hover:bg-sky-50"
                >
                  <div>
                    <div className="font-bold text-slate-800">
                      {result.name}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {result.country}

                      {result.admin1
                        ? ` ・ ${result.admin1}`
                        : ""}
                    </div>
                  </div>

                  <div className="text-xl">→</div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 現在選択されている都市 */}
        <div className="mb-5 text-center">
          <span className="inline-flex items-center rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 shadow">
            📍 {city.name} ・ {city.country}
          </span>
        </div>

        {/* 読み込み中 */}
        {loading && (
          <div className="rounded-3xl bg-white/90 p-12 text-center shadow-xl">
            <div className="mb-4 text-5xl">🌤️</div>

            <p className="font-bold text-slate-700">
              天気情報を読み込んでいます...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {city.name} の天気を取得中です
            </p>
          </div>
        )}

        {/* エラー */}
        {error && !loading && (
          <div className="rounded-3xl bg-white/90 p-10 text-center shadow-xl">
            <div className="mb-4 text-5xl">😢</div>

            <p className="font-bold text-red-500">
              {error}
            </p>
          </div>
        )}

        {/* 天気 */}
        {weather && !loading && !error && (
          <>
            {/* 現在の天気 */}
            <section className="mb-6 overflow-hidden rounded-3xl bg-white/90 shadow-xl backdrop-blur">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5 text-center text-white">
                <h2 className="text-xl font-bold">
                  現在の天気
                </h2>

                {weather.timezone && (
                  <p className="mt-1 text-sm text-blue-100">
                    🕐 {weather.timezone}
                  </p>
                )}
              </div>

              <div className="p-8 text-center">
                <img
                  src={
                    getWeatherInfo(
                      weather.current.weather_code
                    ).image
                  }
                  alt={
                    getWeatherInfo(
                      weather.current.weather_code
                    ).label
                  }
                  className="mx-auto mb-4 h-36 w-36 object-contain"
                />

                <div className="mb-2 text-2xl font-bold">
                  {
                    getWeatherInfo(
                      weather.current.weather_code
                    ).icon
                  }{" "}
                  {
                    getWeatherInfo(
                      weather.current.weather_code
                    ).label
                  }
                </div>

                <div className="text-6xl font-extrabold tracking-tight text-slate-800">
                  {Math.round(
                    weather.current.temperature_2m
                  )}
                  ℃
                </div>

                <div className="mt-5 flex flex-col justify-center gap-3 text-sm text-slate-500 sm:flex-row">
                  <div className="rounded-full bg-slate-100 px-5 py-2">
                    💨 風速{" "}
                    {weather.current.wind_speed_10m} km/h
                  </div>

                  <div className="rounded-full bg-slate-100 px-5 py-2">
                    🌍 {city.country}
                  </div>
                </div>
              </div>
            </section>

            {/* 24時間予報 */}
            <section className="mb-6 rounded-3xl bg-white/90 p-5 shadow-xl backdrop-blur sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    🕐 24時間予報
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    これから24時間の天気
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-3">
                  {hourlyForecast.map((item: any) => {
                    const info = getWeatherInfo(
                      item.weatherCode
                    );

                    return (
                      <div
                        key={item.time}
                        className="w-28 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:-translate-y-1 hover:bg-sky-50 hover:shadow-md"
                      >
                        <div className="font-bold text-slate-700">
                          {formatHour(item.time)}
                        </div>

                        <img
                          src={info.image}
                          alt={info.label}
                          className="mx-auto my-3 h-12 w-12 object-contain"
                        />

                        <div className="text-lg font-extrabold">
                          {Math.round(item.temperature)}
                          ℃
                        </div>

                        <div className="mt-2 text-xs text-blue-500">
                          ☔{" "}
                          {item.precipitationProbability}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 7日間予報 */}
            <section className="rounded-3xl bg-white/90 shadow-xl backdrop-blur">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h2 className="text-xl font-bold">
                  📅 7日間の予報
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  今後7日間の天気予報
                </p>
              </div>

              <div>
                {weather.daily.time.map(
                  (date: string, i: number) => {
                    const info = getWeatherInfo(
                      weather.daily.weather_code[i]
                    );

                    return (
                      <div
                        key={date}
                        className="flex flex-col gap-4 border-b border-slate-100 p-5 transition last:border-b-0 hover:bg-sky-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* 日付 */}
                        <div className="w-24 font-bold text-slate-700">
                          {formatDate(date)}
                        </div>

                        {/* 天気 */}
                        <div className="flex flex-1 items-center gap-3">
                          <img
                            src={info.image}
                            alt={info.label}
                            className="h-14 w-14 object-contain"
                          />

                          <div>
                            <div className="font-bold">
                              {info.icon} {info.label}
                            </div>

                            <div className="mt-1 text-sm text-slate-500">
                              降水確率{" "}
                              {
                                weather.daily
                                  .precipitation_probability_max[
                                  i
                                ]
                              }
                              %
                            </div>
                          </div>
                        </div>

                        {/* 気温 */}
                        <div className="w-full text-left sm:w-32 sm:text-right">
                          <div className="text-lg font-extrabold">
                            {Math.round(
                              weather.daily
                                .temperature_2m_max[i]
                            )}
                            ℃{" "}
                            <span className="font-normal text-slate-400">
                              /
                            </span>{" "}
                            {Math.round(
                              weather.daily
                                .temperature_2m_min[i]
                            )}
                            ℃
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            最高 / 最低
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* フッター */}
            <footer className="py-8 text-center text-xs text-slate-500">
              Weather data provided by Open-Meteo
            </footer>
          </>
        )}
      </div>
    </main>
  );
}