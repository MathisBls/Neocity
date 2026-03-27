import React, { useState, useEffect, useRef } from 'react';
import eventBus from 'shared/eventBus';
import './WeatherTower.css';

const WEATHER_STATES = {
  normal: {
    condition: 'clear',
    temperature: 18,
    toxicity: 0,
    intensity: 0,
    label: 'NORMAL',
    icon: '🌙',
  },
  crisis: {
    condition: 'storm',
    temperature: -3,
    toxicity: 42,
    intensity: 72,
    label: 'CRISE',
    icon: '⚡',
  },
  danger: {
    condition: 'acid',
    temperature: -8,
    toxicity: 87,
    intensity: 95,
    label: 'DANGER',
    icon: '☢️',
  },
  love: {
    condition: 'rainbow',
    temperature: 22,
    toxicity: 0,
    intensity: 10,
    label: 'LOVE',
    icon: '🌈',
  },
  smog: {
    condition: 'smog',
    temperature: 34,
    toxicity: 65,
    intensity: 50,
    label: 'SMOG',
    icon: '🌫️',
  },
  electromagnetic: {
    condition: 'electromagnetic',
    temperature: 12,
    toxicity: 15,
    intensity: 80,
    label: 'EM STORM',
    icon: '🔌',
  },
};

export default function WeatherTower() {
  const [weather, setWeather] = useState(WEATHER_STATES.normal);
  const [sensorDegraded, setSensorDegraded] = useState(false);
  const [logs, setLogs] = useState([]);
  const weatherRef = useRef(weather);

  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [{ time, message }, ...prev].slice(0, 5));
  };

  useEffect(() => {
    const handleCommand = (payload) => {
      console.log('[WeatherTower] hacker:command reçu :', payload);

      let command = typeof payload === 'string' ? payload : payload?.command;
      let newWeather = WEATHER_STATES.normal;

      switch (command) {
        case 'storm':
          newWeather = WEATHER_STATES.crisis;
          break;
        case 'storm max':
          newWeather = WEATHER_STATES.danger;
          break;
        case 'love':
          newWeather = WEATHER_STATES.love;
          break;
        case 'riot':
          newWeather = WEATHER_STATES.smog;
          break;
        case 'drones':
          newWeather = WEATHER_STATES.electromagnetic;
          break;
        case 'blackout':
          addLog('BLACKOUT detected — maintaining current weather');
          console.log('[WeatherTower] Blackout activé - état maintenu');
          return;
        case 'reset':
          newWeather = WEATHER_STATES.normal;
          setSensorDegraded(false);
          break;
        default:
          return;
      }

      setWeather(newWeather);
      addLog(`Command "${command}" → ${newWeather.label}`);

      const eventData = {
        condition: newWeather.condition,
        intensity: newWeather.intensity,
        temperature: newWeather.temperature,
        toxicity: newWeather.toxicity,
      };

      console.log('[WeatherTower] weather:change émis :', eventData);
      eventBus.emit('weather:change', eventData);
    };

    const handlePowerOutage = (payload) => {
      console.log('[WeatherTower] power:outage reçu :', payload);
      if (payload?.severity === 'total' || payload?.cityPower < 20) {
        setSensorDegraded(true);
        addLog(`POWER OUTAGE — sensors degraded (city power: ${payload?.cityPower ?? 0}%)`);
      } else if (payload?.cityPower >= 80) {
        setSensorDegraded(false);
        addLog('Power restored — sensors online');
      }
    };

    const handleCrowdPanic = (payload) => {
      console.log('[WeatherTower] crowd:panic reçu :', payload);
      if (payload?.level > 60) {
        const current = weatherRef.current;
        const boostedToxicity = Math.min(100, current.toxicity + Math.round(payload.level * 0.2));
        const newWeather = {
          ...current,
          toxicity: boostedToxicity,
        };
        setWeather(newWeather);
        addLog(`Crowd panic ${payload.level}% → toxicity +${boostedToxicity - current.toxicity}%`);

        eventBus.emit('weather:change', {
          condition: newWeather.condition,
          intensity: newWeather.intensity,
          temperature: newWeather.temperature,
          toxicity: newWeather.toxicity,
        });
      }
    };

    const unsubCommand = eventBus.on('hacker:command', handleCommand);
    const unsubPower = eventBus.on('power:outage', handlePowerOutage);
    const unsubPanic = eventBus.on('crowd:panic', handleCrowdPanic);

    return () => {
      unsubCommand();
      unsubPower();
      unsubPanic();
    };
  }, []);

  const handleSimulate = () => {
    eventBus.emit('hacker:command', { command: 'storm' });
  };

  const handleReset = () => {
    eventBus.emit('hacker:command', { command: 'reset' });
  };

  const handleNextWeather = () => {
    const states = Object.keys(WEATHER_STATES);
    const currentIndex = states.findIndex(key => WEATHER_STATES[key].condition === weather.condition);
    const nextIndex = (currentIndex + 1) % states.length;
    const nextState = WEATHER_STATES[states[nextIndex]];
    setWeather(nextState);
    addLog(`Weather cycled → ${nextState.label}`);
    eventBus.emit('weather:change', {
      condition: nextState.condition,
      intensity: nextState.intensity,
      temperature: nextState.temperature,
      toxicity: nextState.toxicity,
    });
  };

  return (
    <div className={`weather-tower weather-${weather.condition} ${sensorDegraded ? 'sensor-glitch' : ''}`}>
      <div className="weather-header">
        <span className="weather-label">WEATHER TOWER</span>
        <span className={`weather-status ${weather.condition}`}>
          {sensorDegraded ? 'DEGRADED' : weather.label}
        </span>
      </div>

      <div className="weather-content">
        <div className="weather-icon-large">{weather.icon}</div>

        <div className="weather-metrics">
          <div className="metric">
            <span className="metric-label">TEMP</span>
            <span className={`metric-value ${sensorDegraded ? 'glitch-text' : ''}`}>
              {weather.temperature}°C
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">TOXICITY</span>
            <span className={`metric-value ${weather.toxicity > 50 ? 'metric-danger' : ''} ${sensorDegraded ? 'glitch-text' : ''}`}>
              {weather.toxicity}%
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">INTENSITY</span>
            <span className={`metric-value ${weather.intensity > 70 ? 'metric-danger' : ''} ${sensorDegraded ? 'glitch-text' : ''}`}>
              {weather.intensity}%
            </span>
          </div>
        </div>
      </div>

      <div className="weather-controls">
        <button className="ctrl-btn simulate-btn" onClick={handleSimulate}>
          SIMULATE STORM
        </button>

        <button className="ctrl-btn cycle-btn" onClick={handleNextWeather}>
          NEXT WEATHER
        </button>

        {weather.condition !== 'clear' && (
          <button className="ctrl-btn reset-btn" onClick={handleReset}>
            RESET
          </button>
        )}
      </div>

      {logs.length > 0 && (
        <div className="weather-log">
          {logs.map((log, i) => (
            <div key={i} className="log-entry">
              <span className="log-time">[{log.time}]</span> {log.message}
            </div>
          ))}
        </div>
      )}

      {weather.condition === 'storm' && <div className="rain-effect" />}
      {weather.condition === 'acid' && <div className="acid-rain-effect" />}
      {weather.condition === 'smog' && <div className="smog-effect" />}
      {weather.condition === 'electromagnetic' && <div className="em-effect" />}
    </div>
  );
}
