import { useState } from "react";
import { useEffect } from "react";

import "./App.css";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}
console.log(getWeatherIcon);

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}
console.log(convertToFlag);

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

console.log(formatDay);

function App() {
  const [location, setLocation] = useState("Pretoria");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});

  useEffect(() => {
    const savedLocation = localStorage.getItem("location") || "";
    setLocation(savedLocation);
  }, []);

  useEffect(() => {
    if (location.length >= 2) {
      fetchWeather();
    }
  }, [location]);

  useEffect(() => {
    localStorage.setItem("location", location);
  }, [location]);

  const fetchWeather = async () => {
    if (location.length < 2) setWeather({});
    setIsLoading(true);
    try {
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results[0];

      // const { geometry, properties } = geoData.features[0];
      // const { latitude, longitude, timezone } = geometry;
      // const { name, country_code } = properties;
      setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData.daily);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocation = (e) => {
    setLocation(e.target.value);
  };

  return (
    <div className="app">
      <h1>Classy Weather</h1>
      <Input location={location} onChangeLocation={handleLocation}></Input>
      {/* <button onClick={fetchWeather}>Get weather</button> */}
      {isLoading && <p className="loader">Loading ...</p>}
      {weather.weathercode && (
        <Weather weather={weather} location={displayLocation}></Weather>
      )}
    </div>
  );
}

const Input = ({ location, onChangeLocation }) => {
  return (
    <div>
      <input
        type="text"
        placeholder="Search for location..."
        value={location}
        onChange={onChangeLocation}
      ></input>
    </div>
  );
};

const Weather = ({
  weather: {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: code,
  },
  location,
}) => {
  // This Kept breaking the code, and not have the Weather or Day component render, above is fix
  // const {
  //   temperature_2m_max: max,
  //   temperature_2m_min: min,
  //   time: dates,
  //   weathercode: code,
  // } = weather;

  return (
    <div>
      <h2>Weather for {location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max[i]}
            min={min[i]}
            code={code[i]}
            key={date}
            isToday={i === 0}
          ></Day>
        ))}
      </ul>
    </div>
  );
};

const Day = ({ date, max, min, code, isToday }) => {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
};

export default App;
