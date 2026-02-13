import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Zap, 
  Wind, 
  Sun, 
  Battery, 
  Settings, 
  AlertTriangle, 
  BarChart3, 
  LayoutDashboard, 
  CloudRain, 
  Fan, 
  Power,
  Cpu,
  ShieldCheck,
  Thermometer,
  LogOut,
  Server,
  Database,
  RefreshCw,
  Users,
  HardDrive
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

import { TelemetryData, ControlState, WeatherData, EnergyStrategy, User, UserRole } from './types';
import { generateTelemetry, generateWeather } from './services/mockDataService';
import { Gauge } from './components/Gauge';
import { InfoCard } from './components/InfoCard';
import { ToggleSwitch } from './components/ToggleSwitch';
import { LoginForm } from './components/LoginForm';

// Tabs
type Tab = 'DASHBOARD' | 'CONTROLS' | 'ANALYTICS' | 'ADMIN';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // App State
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [telemetry, setTelemetry] = useState<TelemetryData>(generateTelemetry());
  const [weather, setWeather] = useState<WeatherData>(generateWeather());
  const [history, setHistory] = useState<any[]>([]);
  const [weatherHistory, setWeatherHistory] = useState<any[]>([]); // For Analytics
  const [notifications, setNotifications] = useState<string[]>([]);

  // Control State (Simulating Device Shadow)
  const [controls, setControls] = useState<ControlState>({
    loadState: true,
    inverterState: true,
    sourcePriority: 'AUTO',
    batteryProtection: true,
    solarPan: 45,
    solarTilt: 30,
    windBrake: false,
    emergencyShutdown: false,
    gridTieEnabled: true,
  });

  const [strategy, setStrategy] = useState<EnergyStrategy>({ mode: 'AUTO', reason: 'Initializing...' });

  // Mock History Generator for Weather
  useEffect(() => {
    // Generate 30 days of wind/solar history
    const hist = Array.from({ length: 30 }).map((_, i) => ({
      day: i + 1,
      avgWind: Math.floor(Math.random() * 10) + 2,
      peakWind: Math.floor(Math.random() * 15) + 5,
      solarIrradiance: Math.floor(Math.random() * 800) + 200
    }));
    setWeatherHistory(hist);
  }, []);

  // Main Loop
  useEffect(() => {
    if (!user) return; // Don't run loop if not logged in

    const interval = setInterval(() => {
      // 1. Generate Telemetry
      const newTelem = generateTelemetry({
        system_flags: {
          active_source: controls.sourcePriority === 'AUTO' ? 'HYBRID' : controls.sourcePriority,
          inverter_status: controls.inverterState,
          load_status: controls.loadState,
          fault_detected: controls.emergencyShutdown,
        }
      });
      setTelemetry(newTelem);

      // 2. Update History for Charts
      setHistory(prev => {
        const newData = {
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          solar: newTelem.dc_solar.power,
          wind: newTelem.dc_wind.power,
          load: newTelem.loads.total_power,
          soc: newTelem.dc_battery.soc,
          grid: newTelem.grid.power // Positive import, negative export
        };
        const newHist = [...prev, newData];
        if (newHist.length > 30) newHist.shift(); // Keep last 30 points
        return newHist;
      });

      // 3. Check Alerts
      if (newTelem.dc_battery.soc < 20) addNotification("CRITICAL: Battery Low (<20%)");
      if (newTelem.ac_output.voltage > 250) addNotification("WARNING: AC Voltage High");
      if (controls.emergencyShutdown) addNotification("CRITICAL: EMERGENCY SHUTDOWN ACTIVE");
      if (newTelem.grid.status !== 'CONNECTED') addNotification("WARNING: Grid Island Mode");
      
    }, 1000);

    return () => clearInterval(interval);
  }, [controls, user]);

  // Weather Logic Loop
  useEffect(() => {
    if (!user) return;

    const runStrategy = () => {
      const w = weather;
      let newMode: 'SOLAR' | 'WIND' | 'AUTO' = 'AUTO';
      let reason = "Balanced Conditions";

      if (w.cloudCover > 60 && w.windSpeed > 6) {
        newMode = 'WIND';
        reason = "High Cloud Cover & Strong Wind";
      } else if (w.cloudCover < 30 && w.windSpeed < 4) {
        newMode = 'SOLAR';
        reason = "Clear Sky & Low Wind";
      }

      setStrategy({ mode: newMode, reason });
    };

    runStrategy();
  }, [weather, controls.sourcePriority, user]);

  const addNotification = (msg: string) => {
    setNotifications(prev => {
      if (prev.includes(msg)) return prev;
      return [msg, ...prev].slice(0, 5);
    });
  };

  const handleRpcCall = (key: keyof ControlState, value: any) => {
    // Permission check for sensitive controls
    if (key === 'emergencyShutdown' || key === 'gridTieEnabled') {
       if (user?.role === 'USER') {
          alert("Insufficient permissions. Contact Supervisor.");
          return;
       }
    }

    setTimeout(() => {
      setControls(prev => ({ ...prev, [key]: value }));
      console.log(`RPC Sent: set${key} -> ${value}`);
    }, 200);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('DASHBOARD');
  };

  // --- Render Sections ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard 
          title="Grid Status" 
          value={`${telemetry.grid.power > 0 ? 'IMPORT' : telemetry.grid.power < 0 ? 'EXPORT' : 'IDLE'}`} 
          subValue={`${Math.abs(telemetry.grid.power)} W • ${telemetry.grid.status}`}
          icon={<Server className={`${telemetry.grid.power < 0 ? 'text-green-400' : 'text-orange-400'} w-8 h-8`} />}
          colorClass={telemetry.grid.power < 0 ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}
        />
        <InfoCard 
          title="Total Load" 
          value={`${telemetry.loads.total_power} W`}
          subValue={`${(telemetry.loads.total_power / 230).toFixed(1)} Amps`}
          icon={<Zap className="text-purple-400 w-8 h-8" />}
          colorClass="bg-purple-500/10 text-purple-400"
        />
        <InfoCard 
          title="Renewable Gen" 
          value={`${(telemetry.dc_solar.power + telemetry.dc_wind.power).toFixed(0)} W`}
          subValue="Solar + Wind Combined"
          icon={<Activity className="text-cyan-400 w-8 h-8" />}
          colorClass="bg-cyan-500/10 text-cyan-400"
        />
         <InfoCard 
          title="Battery Status" 
          value={`${telemetry.dc_battery.soc}%`}
          subValue={telemetry.dc_battery.status}
          icon={<Battery className={`${telemetry.dc_battery.soc < 20 ? 'text-red-500' : 'text-green-500'} w-8 h-8`} />}
          colorClass={telemetry.dc_battery.soc < 20 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}
        />
      </div>

      {/* Main Visuals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Energy Flow Animation - Updated with GRID */}
        <div className="lg:col-span-2 bg-scada-panel border border-slate-700/50 rounded-xl p-6 min-h-[400px] flex flex-col relative overflow-hidden">
          <h2 className="text-lg font-bold text-scada-text flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-scada-accent" /> System Energy Map
          </h2>
          
          <div className="flex-1 flex items-center justify-center relative">
            <svg viewBox="0 0 700 350" className="w-full h-full max-w-[900px]">
              
              {/* Grid (Left) */}
              <rect x="20" y="130" width="50" height="50" rx="5" fill="#1e293b" stroke={telemetry.grid.power < 0 ? '#10b981' : '#f97316'} strokeWidth="3" />
              <text x="45" y="160" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">GRID</text>
              {/* Line Grid -> Bus */}
              <path d="M 70,155 L 280,155" fill="none" stroke="#334155" strokeWidth="4" />
              <path d="M 70,155 L 280,155" fill="none" stroke={telemetry.grid.power < 0 ? '#10b981' : '#f97316'} strokeWidth="4" strokeDasharray="10 5" 
                    className={Math.abs(telemetry.grid.power) > 10 ? (telemetry.grid.power > 0 ? 'animate-flow-fast' : 'animate-flow-fast reverse') : 'opacity-0'} />

              {/* Solar (Top) -> Bus */}
              <path d="M 300,60 L 300,130" fill="none" stroke="#334155" strokeWidth="4" />
              <path d="M 300,60 L 300,130" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="10 5" className={telemetry.dc_solar.power > 10 ? 'animate-flow-fast' : 'opacity-0'} />
              <circle cx="300" cy="40" r="30" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
              <text x="300" y="45" textAnchor="middle" fill="#f59e0b" className="text-xs font-bold">PV</text>
              <text x="300" y="85" textAnchor="middle" fill="#94a3b8" className="text-[10px]">{telemetry.dc_solar.power}W</text>

              {/* DC Bus Center */}
              <rect x="280" y="130" width="40" height="40" rx="5" fill="#334155" />
              <text x="300" y="155" textAnchor="middle" fill="white" fontSize="10">BUS</text>

              {/* Wind (Bottom) -> Bus */}
              <path d="M 300,280 L 300,170" fill="none" stroke="#334155" strokeWidth="4" />
              <path d="M 300,280 L 300,170" fill="none" stroke="#06b6d4" strokeWidth="4" strokeDasharray="10 5" className={telemetry.dc_wind.power > 10 ? 'animate-flow-fast' : 'opacity-0'} />
              <circle cx="300" cy="300" r="30" fill="#1e293b" stroke="#06b6d4" strokeWidth="3" />
              <text x="300" y="305" textAnchor="middle" fill="#06b6d4" className="text-xs font-bold">WIND</text>
              <text x="300" y="265" textAnchor="middle" fill="#94a3b8" className="text-[10px]">{telemetry.dc_wind.power}W</text>

              {/* Bus -> Inverter -> Load (Right) */}
              <path d="M 320,150 L 450,150" fill="none" stroke="#334155" strokeWidth="6" />
              <path d="M 320,150 L 450,150" fill="none" stroke="#a855f7" strokeWidth="4" strokeDasharray="10 5" className={controls.inverterState ? 'animate-flow-fast' : 'opacity-0'} />
              
              <rect x="450" y="125" width="50" height="50" rx="5" fill="#1e293b" stroke="#a855f7" strokeWidth="3" />
              <text x="475" y="155" textAnchor="middle" fill="#a855f7" fontSize="10">INV</text>

              <path d="M 500,150 L 580,150" fill="none" stroke="#334155" strokeWidth="4" />
              <path d="M 500,150 L 580,150" fill="none" stroke="#a855f7" strokeWidth="4" strokeDasharray="10 5" className={controls.loadState ? 'animate-flow-fast' : 'opacity-0'} />
              
              <circle cx="600" cy="150" r="25" fill={controls.loadState ? '#a855f7' : '#334155'} />
              <text x="600" y="155" textAnchor="middle" fill="white" className="text-xs font-bold">LOAD</text>

              {/* Bus -> Battery (Diagonal) */}
              <path d="M 310,165 L 400,250" fill="none" stroke="#334155" strokeWidth="4" />
              <path d="M 310,165 L 400,250" fill="none" stroke={telemetry.dc_battery.current > 0 ? '#10b981' : '#ef4444'} strokeWidth="4" strokeDasharray="10 5" className={Math.abs(telemetry.dc_battery.current) > 0.1 ? 'animate-flow-fast' : 'opacity-0'} />
              
              <rect x="400" y="250" width="60" height="30" rx="2" fill="#1e293b" stroke={telemetry.dc_battery.soc > 20 ? '#10b981' : '#ef4444'} strokeWidth="3" />
              <text x="430" y="270" textAnchor="middle" fill="white" fontSize="10">{telemetry.dc_battery.soc}%</text>

            </svg>
          </div>
        </div>

        {/* Load Breakdown Chart */}
        <div className="flex flex-col gap-4">
           <div className="bg-scada-panel border border-slate-700/50 rounded-xl p-4 flex-1">
             <h3 className="text-sm font-bold text-scada-muted mb-4 uppercase">Load Consumption Breakdown</h3>
             <div className="h-[200px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={[
                        { name: 'Critical', value: telemetry.loads.breakdown.critical },
                        { name: 'HVAC', value: telemetry.loads.breakdown.hvac },
                        { name: 'Lighting', value: telemetry.loads.breakdown.lighting },
                        { name: 'Aux', value: telemetry.loads.breakdown.aux },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#ef4444" /> {/* Critical */}
                      <Cell fill="#3b82f6" /> {/* HVAC */}
                      <Cell fill="#eab308" /> {/* Lighting */}
                      <Cell fill="#64748b" /> {/* Aux */}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: 'white' }} />
                    <Legend />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-scada-muted">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div>Critical: {telemetry.loads.breakdown.critical}W</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>HVAC: {telemetry.loads.breakdown.hvac}W</div>
             </div>
           </div>
        </div>
      </div>

      {/* Grid & Weather Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Grid Stats */}
         <div className="bg-scada-panel border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-scada-text flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-orange-500" /> Grid Interconnection
            </h2>
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-slate-800 p-3 rounded">
                  <span className="text-sm text-scada-muted">Import Today</span>
                  <span className="font-mono text-orange-400">{telemetry.grid.energy_import_today.toFixed(2)} kWh</span>
               </div>
               <div className="flex justify-between items-center bg-slate-800 p-3 rounded">
                  <span className="text-sm text-scada-muted">Export Today</span>
                  <span className="font-mono text-green-400">{telemetry.grid.energy_export_today.toFixed(2)} kWh</span>
               </div>
               <div className="flex justify-between items-center bg-slate-800 p-3 rounded">
                  <span className="text-sm text-scada-muted">Net Grid Interaction</span>
                  <span className={`font-mono ${telemetry.grid.power > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                    {Math.abs(telemetry.grid.power)} W {telemetry.grid.power > 0 ? 'FROM GRID' : 'TO GRID'}
                  </span>
               </div>
            </div>
         </div>

         {/* 7-Day Forecast */}
         <div className="lg:col-span-2 bg-scada-panel border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-scada-text flex items-center gap-2 mb-4">
              <CloudRain className="w-5 h-5 text-blue-400" /> 7-Day Production Forecast
            </h2>
            <div className="grid grid-cols-7 gap-2">
               {weather.weeklyForecast.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center bg-slate-800/50 p-2 rounded border border-slate-700/30">
                     <span className="text-xs font-bold text-scada-muted mb-1">{day.day}</span>
                     {day.condition === 'SUNNY' && <Sun size={20} className="text-amber-400 mb-1" />}
                     {day.condition === 'CLOUDY' && <CloudRain size={20} className="text-gray-400 mb-1" />}
                     {day.condition === 'RAINY' && <CloudRain size={20} className="text-blue-400 mb-1" />}
                     {day.condition === 'WINDY' && <Wind size={20} className="text-cyan-400 mb-1" />}
                     <span className="text-xs font-mono">{day.tempHigh}°</span>
                     <div className="flex items-center gap-1 mt-2">
                        <Wind size={10} className="text-cyan-500" />
                        <span className="text-[10px]">{day.windSpeed}</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );

  const renderControls = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      {/* Electrical Controls */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-scada-text border-b border-slate-700 pb-2">Electrical Bus Control</h2>
        
        <div className="grid grid-cols-1 gap-4">
          <ToggleSwitch 
            label="Master Load Output" 
            checked={controls.loadState} 
            onChange={(v) => handleRpcCall('loadState', v)} 
            color="bg-purple-600"
            disabled={controls.emergencyShutdown}
          />
           <ToggleSwitch 
            label="Inverter Online" 
            checked={controls.inverterState} 
            onChange={(v) => handleRpcCall('inverterState', v)} 
            color="bg-green-600"
            disabled={controls.emergencyShutdown}
          />
          <ToggleSwitch 
            label="Battery BMS Protection" 
            checked={controls.batteryProtection} 
            onChange={(v) => handleRpcCall('batteryProtection', v)} 
            color="bg-blue-600"
            disabled={controls.emergencyShutdown}
          />
          {/* Manager/Admin Only Control */}
          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <ToggleSwitch 
              label="Grid Tie Export Permit" 
              checked={controls.gridTieEnabled} 
              onChange={(v) => handleRpcCall('gridTieEnabled', v)} 
              color="bg-orange-600"
              disabled={controls.emergencyShutdown}
            />
          )}
        </div>

        <div className="bg-scada-panel p-4 rounded-xl border border-slate-700">
          <label className="block text-sm font-bold text-scada-muted mb-2 uppercase">Source Priority</label>
          <div className="grid grid-cols-3 gap-2">
            {['SOLAR', 'WIND', 'AUTO'].map((mode) => (
              <button
                key={mode}
                onClick={() => handleRpcCall('sourcePriority', mode)}
                className={`py-2 px-4 rounded font-mono font-bold transition-all ${
                  controls.sourcePriority === mode 
                  ? 'bg-scada-accent text-white shadow-lg shadow-sky-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                disabled={controls.emergencyShutdown}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => handleRpcCall('emergencyShutdown', !controls.emergencyShutdown)}
          className={`w-full py-4 ${controls.emergencyShutdown ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'} text-white font-bold rounded-xl shadow-lg shadow-red-500/20 uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2`}
        >
          <Power /> {controls.emergencyShutdown ? 'RESET SYSTEM' : 'Emergency Shutdown'}
        </button>
      </div>

      {/* Mechanical Controls */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-scada-text border-b border-slate-700 pb-2">Mechanical Actuators</h2>
        
        <div className="bg-scada-panel p-6 rounded-xl border border-slate-700">
           <div className="flex justify-between mb-4">
             <span className="font-bold flex items-center gap-2"><Sun size={18} /> Solar Pan Angle</span>
             <span className="font-mono text-scada-accent">{controls.solarPan}°</span>
           </div>
           <input 
             type="range" 
             min="0" 
             max="180" 
             value={controls.solarPan} 
             onChange={(e) => handleRpcCall('solarPan', parseInt(e.target.value))}
             className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
             disabled={controls.emergencyShutdown}
           />
        </div>

        <div className="bg-scada-panel p-6 rounded-xl border border-slate-700">
           <div className="flex justify-between mb-4">
             <span className="font-bold flex items-center gap-2"><Activity size={18} /> Solar Tilt Angle</span>
             <span className="font-mono text-scada-accent">{controls.solarTilt}°</span>
           </div>
           <input 
             type="range" 
             min="0" 
             max="90" 
             value={controls.solarTilt} 
             onChange={(e) => handleRpcCall('solarTilt', parseInt(e.target.value))}
             className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
             disabled={controls.emergencyShutdown}
           />
        </div>

        <div className="bg-scada-panel p-6 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
               <h3 className="font-bold flex items-center gap-2"><Fan className={controls.windBrake ? 'text-red-500' : 'text-green-500'} /> Wind Turbine Brake</h3>
            </div>
            <button
               onClick={() => handleRpcCall('windBrake', !controls.windBrake)}
               className={`px-6 py-3 rounded-lg font-bold shadow-lg transition-all ${
                 controls.windBrake ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300'
               }`}
               disabled={controls.emergencyShutdown}
            >
              {controls.windBrake ? 'ENGAGED' : 'DISENGAGED'}
            </button>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-scada-panel p-4 rounded-xl border border-slate-700/50 h-[400px]">
         <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 size={18} /> Real-time Power & Grid Balance</h3>
         <ResponsiveContainer width="100%" height="90%">
           <AreaChart data={history}>
             <defs>
               <linearGradient id="colorGrid" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                 <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
               </linearGradient>
             </defs>
             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
             <XAxis dataKey="time" stroke="#94a3b8" />
             <YAxis stroke="#94a3b8" />
             <Tooltip 
               contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
             />
             <Area type="monotone" dataKey="solar" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
             <Area type="monotone" dataKey="wind" stackId="1" stroke="#06b6d4" fill="#06b6d4" />
             <Area type="monotone" dataKey="grid" stroke="#f97316" fill="url(#colorGrid)" />
           </AreaChart>
         </ResponsiveContainer>
       </div>

       {/* Historical Metereology Data */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-scada-panel p-4 rounded-xl border border-slate-700/50 h-[300px]">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Wind size={18} className="text-cyan-400"/> Wind Speed History (30 Days)</h3>
             <ResponsiveContainer width="100%" height="90%">
                <BarChart data={weatherHistory}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                   <XAxis dataKey="day" stroke="#94a3b8" />
                   <YAxis stroke="#94a3b8" unit="m/s" />
                   <Tooltip contentStyle={{ backgroundColor: '#1e293b' }} />
                   <Bar dataKey="avgWind" fill="#06b6d4" name="Avg Speed" />
                   <Bar dataKey="peakWind" fill="#0ea5e9" name="Peak Gust" />
                </BarChart>
             </ResponsiveContainer>
          </div>

          <div className="bg-scada-panel p-4 rounded-xl border border-slate-700/50 h-[300px]">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Sun size={18} className="text-amber-400"/> Solar Irradiance History</h3>
             <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={weatherHistory}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                   <XAxis dataKey="day" stroke="#94a3b8" />
                   <YAxis stroke="#94a3b8" unit="W/m²" />
                   <Tooltip contentStyle={{ backgroundColor: '#1e293b' }} />
                   <Area type="monotone" dataKey="solarIrradiance" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl flex items-center gap-4">
          <AlertTriangle size={32} className="text-red-500" />
          <div>
            <h2 className="text-xl font-bold text-red-500">Administrator Zone</h2>
            <p className="text-scada-muted">Authorized personnel only. Actions here affect physical hardware configuration.</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-scada-panel p-6 rounded-xl border border-slate-700">
             <h3 className="font-bold flex items-center gap-2 mb-4"><Database size={20} /> System Management</h3>
             <div className="space-y-3">
               <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold flex items-center justify-center gap-2">
                 <RefreshCw size={16} /> Reboot Main Controller
               </button>
               <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold flex items-center justify-center gap-2">
                 <HardDrive size={16} /> Clear Telemetry Cache
               </button>
               <button className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold flex items-center justify-center gap-2">
                 <AlertTriangle size={16} /> Factory Reset
               </button>
             </div>
          </div>

          <div className="bg-scada-panel p-6 rounded-xl border border-slate-700">
             <h3 className="font-bold flex items-center gap-2 mb-4"><Users size={20} /> User Management (Mock)</h3>
             <ul className="space-y-2 text-sm">
                <li className="flex justify-between p-2 bg-slate-800 rounded">
                  <span>admin</span> <span className="text-xs bg-red-500/20 text-red-400 px-2 rounded">ADMIN</span>
                </li>
                <li className="flex justify-between p-2 bg-slate-800 rounded">
                  <span>manager</span> <span className="text-xs bg-blue-500/20 text-blue-400 px-2 rounded">MGR</span>
                </li>
                <li className="flex justify-between p-2 bg-slate-800 rounded">
                  <span>user</span> <span className="text-xs bg-green-500/20 text-green-400 px-2 rounded">USER</span>
                </li>
             </ul>
          </div>
          
          <div className="bg-scada-panel p-6 rounded-xl border border-slate-700">
             <h3 className="font-bold flex items-center gap-2 mb-4"><Server size={20} /> Firmware</h3>
             <div className="flex justify-between items-center mb-4">
               <span className="text-sm text-scada-muted">Current Version</span>
               <span className="font-mono font-bold">v2.1.0</span>
             </div>
             <button className="w-full py-2 bg-scada-accent text-white font-bold rounded">Check for Updates</button>
          </div>
       </div>
    </div>
  );

  // --- Auth Guard ---
  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-scada-bg text-scada-text font-sans selection:bg-scada-accent selection:text-white pb-10">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-scada-accent p-2 rounded-lg">
                <LayoutDashboard className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">EcoFlux <span className="text-scada-accent">SCADA</span></h1>
                <h1 className="text-xl font-bold tracking-tight text-white md:hidden">EcoFlux</h1>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-[10px] text-scada-muted uppercase tracking-wider font-bold">Online • {user.role}</span>
                </div>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex space-x-1">
                {[
                  { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Overview' },
                  { id: 'CONTROLS', icon: Settings, label: 'Controls' },
                  { id: 'ANALYTICS', icon: BarChart3, label: 'Analytics' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                      activeTab === item.id 
                      ? 'bg-slate-800 text-scada-accent shadow-inner' 
                      : 'text-scada-muted hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <item.icon size={16} /> {item.label}
                  </button>
                ))}
                
                {/* Admin Tab - Only for Admin/Manager */}
                {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                  <button
                    onClick={() => setActiveTab('ADMIN')}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                      activeTab === 'ADMIN' 
                      ? 'bg-red-900/20 text-red-400 shadow-inner' 
                      : 'text-scada-muted hover:text-red-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <ShieldCheck size={16} /> Admin
                  </button>
                )}
              </nav>

              <div className="h-6 w-px bg-slate-700 mx-2 hidden md:block"></div>
              
              <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-white">{user.username}</div>
                    <div className="text-[10px] text-scada-muted">{user.role}</div>
                 </div>
                 <button onClick={handleLogout} className="p-2 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-colors">
                    <LogOut size={18} />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'DASHBOARD' && renderDashboard()}
        {activeTab === 'CONTROLS' && renderControls()}
        {activeTab === 'ANALYTICS' && renderAnalytics()}
        {activeTab === 'ADMIN' && (user.role === 'ADMIN' || user.role === 'MANAGER') && renderAdmin()}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-50">
        <div className="flex justify-around p-3">
           {[
                { id: 'DASHBOARD', icon: LayoutDashboard },
                { id: 'CONTROLS', icon: Settings },
                { id: 'ANALYTICS', icon: BarChart3 },
           ].map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id as Tab)}
               className={`p-2 rounded-xl ${activeTab === item.id ? 'text-scada-accent bg-slate-800' : 'text-scada-muted'}`}
             >
               <item.icon size={24} />
             </button>
           ))}
           {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
              <button
                onClick={() => setActiveTab('ADMIN')}
                className={`p-2 rounded-xl ${activeTab === 'ADMIN' ? 'text-red-400 bg-red-900/20' : 'text-scada-muted'}`}
              >
                <ShieldCheck size={24} />
              </button>
           )}
        </div>
      </div>

    </div>
  );
};

export default App;