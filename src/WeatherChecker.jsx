import { useState, useEffect } from 'react';
import './WeatherChecker.css';

// Constants
const MAX_RECENT = 5;
const STORAGE_KEY = 'weather_recent_searches';

// Component
export default function WeatherChecker() {
    // State
    const [city, setCity] = useState('');                 
    const [weather, setWeather] = useState(null);         
    const [temperature, setTemperature] = useState(null); 
    const [condition, setCondition] = useState('');       
    const [loading, setLoading] = useState(false);        
    const [error, setError] = useState('');               
    const [unit, setUnit] = useState('Celsius');          
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    });

    // storing recent searches to localStorage whenever it changes 
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches));
    }, [recentSearches]);

    // main fetching function 
    const fetchWeather = async (searchCity) => {
        const trimmed = searchCity.trim();
        if (!trimmed) return;

        setLoading(true);
        setError('');
        setWeather(null);

        try {
            const url = `https://api.weatherapi.com/v1/current.json?key=f2f205d6a01f4b4ba3961210261901&q=${encodeURIComponent(trimmed)}&aqi=no`;
            const response = await fetch(url);
            const data = await response.json();

            // WeatherAPI returns error details inside the JSON body
            if (!response.ok || data.error) {
                const msg = data.error?.message || `Error ${response.status}: ${response.statusText}`;
                throw new Error(msg);
            }

            
            setWeather(data);
            setTemperature({ c: data.current.temp_c, f: data.current.temp_f }); // Already °C / °F
            setCondition(data.current.condition.text);

            // Update recent searches 
            setRecentSearches((prev) => {
                const normalised = trimmed.trim().toLowerCase();
                const filtered = prev.filter((c) => c.toLowerCase() !== normalised);
                return [trimmed, ...filtered].slice(0, MAX_RECENT);
            });

        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    //  Form submit handler
    const handleSubmit = (e) => {
        e.preventDefault();
        fetchWeather(city);
    };

    // display temperature based on selected unit
    const displayTemp =
        temperature !== null
            ? unit === 'Celsius'
                ? `${temperature.c.toFixed(1)} °C`
                : `${temperature.f.toFixed(1)} °F`
            : null;

    //  Toggle unit
    const toggleUnit = () =>
        setUnit((prev) => (prev === 'Celsius' ? 'Fahrenheit' : 'Celsius'));

    return (
        <div className="wc-wrapper">
            <div className="wc-card">

                {/* App Header */}
                <header className="wc-header">
                    <span className="wc-header-icon">🌤️</span>
                    <h1>Weather Checker</h1>
                </header>

                {/* Search Form */}
                <form className="wc-form" onSubmit={handleSubmit}>
                    <input
                        className="wc-input"
                        type="text"
                        placeholder="Enter city name…"
                        value={city}                              // Controlled component
                        onChange={(e) => setCity(e.target.value)}
                        aria-label="City name"
                        disabled={loading}
                    />
                    <button
                        className="wc-btn wc-btn-search"
                        type="submit"
                        disabled={loading || !city.trim()}
                        aria-label="Search weather"
                    >
                        {loading ? '…' : '🔍 Search'}
                    </button>
                </form>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                    <div className="wc-recent">
                        <p className="wc-recent-label">Recent:</p>
                        <div className="wc-recent-chips">
                            {recentSearches.map((name) => (
                                <button
                                    key={name}
                                    className="wc-chip"
                                    onClick={() => {
                                        setCity(name);
                                        fetchWeather(name);
                                    }}
                                >
                                    {name}
                                </button>
                            ))}
                            {/* Clear all recent searches */}
                            <button
                                className="wc-chip wc-chip-clear"
                                onClick={() => setRecentSearches([])}
                                title="Clear history"
                            >
                                ✕ Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="wc-loading" role="status" aria-live="polite">
                        <div className="wc-spinner" />
                        <p>Fetching weather data…</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="wc-error" role="alert">
                        <span className="wc-error-icon">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                {/* Weather Result Card */}
                {weather && !loading && !error && (
                    <div className="wc-result">

                        {/* City & country */}
                        <h2 className="wc-city">
                            {weather.location.name}
                            {weather.location.country && (
                                <span className="wc-country"> , {weather.location.country}</span>
                            )}
                        </h2>

                        {/* Weather icon */}
                        <div className="wc-icon-wrap">
                            <img
                                className="wc-icon"
                                src={`https:${weather.current.condition.icon}`}
                                alt={condition}
                            />
                        </div>

                        {/* Temperature display + unit toggle */}
                        <div className="wc-temp-row">
                            <span className="wc-temp">{displayTemp}</span>
                            <button
                                className="wc-btn wc-btn-toggle"
                                onClick={toggleUnit}
                                aria-label={`Switch to ${unit === 'Celsius' ? 'Fahrenheit' : 'Celsius'}`}
                            >
                                Switch to °{unit === 'Celsius' ? 'F' : 'C'}
                            </button>
                        </div>

                        {/* Condition description */}
                        <p className="wc-condition">
                            {condition.charAt(0).toUpperCase() + condition.slice(1)}
                        </p>

                        {/* Extra details grid */}
                        <div className="wc-details">
                            <div className="wc-detail-item">
                                <span className="wc-detail-label">Feels like</span>
                                <span className="wc-detail-value">
                                    {unit === 'Celsius'
                                        ? `${weather.current.feelslike_c.toFixed(1)} °C`
                                        : `${weather.current.feelslike_f.toFixed(1)} °F`}
                                </span>
                            </div>
                            <div className="wc-detail-item">
                                <span className="wc-detail-label">Humidity</span>
                                <span className="wc-detail-value">{weather.current.humidity}%</span>
                            </div>
                            <div className="wc-detail-item">
                                <span className="wc-detail-label">Wind</span>
                                <span className="wc-detail-value">{weather.current.wind_kph} km/h</span>
                            </div>
                            <div className="wc-detail-item">
                                <span className="wc-detail-label">Visibility</span>
                                <span className="wc-detail-value">{weather.current.vis_km} km</span>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}
