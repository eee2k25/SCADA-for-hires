// User & Auth
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  username: string;
  role: UserRole;
  lastLogin: string;
}

// Hardware Telemetry Interfaces
export interface DCSolar {
  voltage: number;
  current: number;
  power: number;
  energy_today: number;
}

export interface DCWind {
  voltage: number;
  current: number;
  power: number;
  energy_today: number;
}

export interface DCBattery {
  voltage: number;
  current: number;
  soc: number;
  temperature: number;
  health: number;
  status: 'CHARGING' | 'DISCHARGING' | 'IDLE';
}

export interface GridInfo {
  status: 'CONNECTED' | 'ISLANDED' | 'FAULT';
  voltage: number;
  current: number;
  power: number; // Positive = Import, Negative = Export
  energy_import_today: number;
  energy_export_today: number;
  frequency: number;
}

export interface LoadInfo {
  total_power: number;
  breakdown: {
    critical: number; // Servers, PLC
    hvac: number;     // Cooling
    lighting: number;
    aux: number;
  };
}

export interface ACOutput {
  voltage: number;
  current: number;
  power: number;
  frequency: number;
  power_factor: number;
}

export interface SystemFlags {
  active_source: 'SOLAR' | 'WIND' | 'HYBRID' | 'GRID' | 'BATTERY';
  inverter_status: boolean;
  load_status: boolean;
  fault_detected: boolean;
}

export interface TelemetryData {
  dc_solar: DCSolar;
  dc_wind: DCWind;
  dc_battery: DCBattery;
  grid: GridInfo;
  loads: LoadInfo;
  ac_output: ACOutput;
  system_flags: SystemFlags;
  ts: number; // Timestamp
}

// Control Interfaces
export interface ControlState {
  loadState: boolean;
  inverterState: boolean;
  sourcePriority: 'SOLAR' | 'WIND' | 'AUTO';
  batteryProtection: boolean;
  solarPan: number;
  solarTilt: number;
  windBrake: boolean;
  emergencyShutdown: boolean;
  gridTieEnabled: boolean; // New for Manager/Admin
}

// Weather & Intelligent Logic
export interface ForecastDay {
  day: string;
  condition: 'SUNNY' | 'CLOUDY' | 'WINDY' | 'RAINY';
  tempHigh: number;
  tempLow: number;
  windSpeed: number;
  irradiance: number;
}

export interface WeatherData {
  temp: number;
  cloudCover: number; // Percentage
  windSpeed: number; // m/s
  irradiance: number; // W/m2
  rainProb: number; // Percentage
  forecast: 'SUNNY' | 'CLOUDY' | 'WINDY' | 'RAINY';
  weeklyForecast: ForecastDay[];
}

export interface EnergyStrategy {
  mode: 'SOLAR' | 'WIND' | 'AUTO';
  reason: string;
}
