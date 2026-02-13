import { TelemetryData, WeatherData, ForecastDay } from '../types';

// Helper for realistic data drift (Brownian motion)
const drift = (current: number, min: number, max: number, volatility: number) => {
  const change = (Math.random() - 0.5) * volatility;
  let newValue = current + change;
  if (newValue < min) newValue = min;
  if (newValue > max) newValue = max;
  return Number(newValue.toFixed(2));
};

let lastTelemetry: TelemetryData = {
  dc_solar: { voltage: 18.5, current: 4.2, power: 77.7, energy_today: 450.2 },
  dc_wind: { voltage: 12.1, current: 2.5, power: 30.2, energy_today: 210.5 },
  dc_battery: { voltage: 12.8, current: -3.2, soc: 85, temperature: 29, health: 97, status: 'CHARGING' },
  grid: { 
    status: 'CONNECTED', 
    voltage: 230, 
    current: 2, 
    power: 460, 
    energy_import_today: 12.5, 
    energy_export_today: 8.2, 
    frequency: 50 
  },
  loads: {
    total_power: 800,
    breakdown: { critical: 300, hvac: 300, lighting: 100, aux: 100 }
  },
  ac_output: { voltage: 230.5, current: 1.5, power: 345, frequency: 50, power_factor: 0.96 },
  system_flags: { active_source: 'HYBRID', inverter_status: true, load_status: true, fault_detected: false },
  ts: Date.now()
};

export const generateTelemetry = (override: Partial<TelemetryData> = {}): TelemetryData => {
  const t = lastTelemetry;
  
  // Simulate Sources
  const newSolarV = drift(t.dc_solar.voltage, 0, 24, 0.5);
  const newSolarC = newSolarV > 5 ? drift(t.dc_solar.current, 0, 15, 0.2) : 0;
  const solarP = newSolarV * newSolarC;

  const newWindV = drift(t.dc_wind.voltage, 0, 24, 1.5);
  const newWindC = newWindV > 5 ? drift(t.dc_wind.current, 0, 20, 0.5) : 0;
  const windP = newWindV * newWindC;

  // Simulate Load Breakdown
  const critical = drift(t.loads.breakdown.critical, 280, 320, 2);
  const hvac = drift(t.loads.breakdown.hvac, 0, 1500, 10); // HVAC cycles
  const lighting = drift(t.loads.breakdown.lighting, 50, 150, 1);
  const aux = drift(t.loads.breakdown.aux, 20, 200, 5);
  const totalLoad = critical + hvac + lighting + aux;

  // Energy Balance Calculation
  // Total Generation = Solar + Wind
  // Net = Generation - Load
  // If Net > 0: Charge Battery -> Then Export to Grid
  // If Net < 0: Discharge Battery -> Then Import from Grid
  
  const generation = solarP + windP;
  let netPower = generation - totalLoad;
  
  // Battery handling
  let batPower = 0; // Positive = Charging
  const currentSoc = t.dc_battery.soc;
  
  if (netPower > 0) {
    if (currentSoc < 98) {
        batPower = Math.min(netPower, 500); // Max charge rate 500W
        netPower -= batPower;
    }
  } else {
    if (currentSoc > 10) {
        batPower = Math.max(netPower, -500); // Max discharge 500W
        netPower -= batPower;
    }
  }
  
  // Remaining netPower goes to/from Grid
  const gridPower = -netPower; // If net is surplus (positive), grid is negative (export)
  
  // Calculate new SOC
  let newSoc = currentSoc + (batPower * 0.0005); // Simulated integration
  newSoc = Math.min(Math.max(newSoc, 0), 100);

  const newTelem: TelemetryData = {
    dc_solar: {
      voltage: newSolarV,
      current: newSolarC,
      power: Number(solarP.toFixed(1)),
      energy_today: t.dc_solar.energy_today + (solarP * 0.0001)
    },
    dc_wind: {
      voltage: newWindV,
      current: newWindC,
      power: Number(windP.toFixed(1)),
      energy_today: t.dc_wind.energy_today + (windP * 0.0001)
    },
    dc_battery: {
      voltage: drift(t.dc_battery.voltage, 11.5, 14.4, 0.05),
      current: Number((batPower / 12).toFixed(1)), // Approx DC Amps
      soc: Number(newSoc.toFixed(1)),
      temperature: drift(t.dc_battery.temperature, 20, 45, 0.1),
      health: 97,
      status: batPower > 5 ? 'CHARGING' : batPower < -5 ? 'DISCHARGING' : 'IDLE'
    },
    grid: {
        status: 'CONNECTED',
        voltage: drift(230, 228, 232, 0.2),
        current: Number((Math.abs(gridPower) / 230).toFixed(2)),
        power: Number(gridPower.toFixed(1)),
        energy_import_today: t.grid.energy_import_today + (gridPower > 0 ? gridPower * 0.0001 : 0),
        energy_export_today: t.grid.energy_export_today + (gridPower < 0 ? Math.abs(gridPower) * 0.0001 : 0),
        frequency: drift(50, 49.9, 50.1, 0.02)
    },
    loads: {
        total_power: Number(totalLoad.toFixed(0)),
        breakdown: {
            critical: Number(critical.toFixed(0)),
            hvac: Number(hvac.toFixed(0)),
            lighting: Number(lighting.toFixed(0)),
            aux: Number(aux.toFixed(0))
        }
    },
    ac_output: {
      voltage: t.system_flags.inverter_status ? drift(t.ac_output.voltage, 225, 235, 0.5) : 0,
      current: t.system_flags.load_status ? Number((totalLoad / 230).toFixed(1)) : 0,
      power: t.system_flags.load_status ? Number(totalLoad.toFixed(0)) : 0,
      frequency: drift(t.ac_output.frequency, 49.8, 50.2, 0.05),
      power_factor: 0.96
    },
    system_flags: {
      ...t.system_flags,
      ...override.system_flags
    },
    ts: Date.now()
  };

  lastTelemetry = newTelem;
  return newTelem;
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const generateWeather = (): WeatherData => {
  const weeklyForecast: ForecastDay[] = Array.from({ length: 7 }).map((_, i) => ({
      day: DAYS[(new Date().getDay() + i) % 7],
      condition: Math.random() > 0.7 ? 'CLOUDY' : Math.random() > 0.8 ? 'RAINY' : Math.random() > 0.85 ? 'WINDY' : 'SUNNY',
      tempHigh: Math.floor(22 + Math.random() * 8),
      tempLow: Math.floor(15 + Math.random() * 5),
      windSpeed: Math.floor(3 + Math.random() * 8),
      irradiance: Math.floor(400 + Math.random() * 400)
  }));

  return {
    temp: 24,
    cloudCover: 45,
    windSpeed: 5.5,
    irradiance: 600,
    rainProb: 10,
    forecast: 'CLOUDY',
    weeklyForecast
  };
};
