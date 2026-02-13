import React from 'react';

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Gauge: React.FC<GaugeProps> = ({ value, min, max, label, unit, color = '#0ea5e9', size = 'md' }) => {
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const angle = percentage * 180;
  
  const width = size === 'sm' ? 100 : size === 'md' ? 160 : 220;
  const strokeWidth = size === 'sm' ? 8 : 12;
  const radius = (width / 2) - strokeWidth;
  const circumference = Math.PI * radius;
  
  return (
    <div className={`flex flex-col items-center justify-center p-4 bg-scada-panel rounded-xl shadow-lg border border-slate-700/50`}>
      <div className="relative" style={{ width, height: width / 2 }}>
        {/* Background Arc */}
        <svg className="overflow-visible w-full h-full">
          <path
            d={`M ${strokeWidth},${width/2} A ${radius},${radius} 0 0,1 ${width-strokeWidth},${width/2}`}
            fill="none"
            stroke="#334155"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Value Arc */}
          <path
            d={`M ${strokeWidth},${width/2} A ${radius},${radius} 0 0,1 ${width-strokeWidth},${width/2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percentage)}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 text-center translate-y-2">
            <span className="text-2xl font-bold font-mono text-scada-text">{value}</span>
            <span className="text-xs text-scada-muted ml-1">{unit}</span>
        </div>
      </div>
      <span className="mt-4 text-sm uppercase tracking-wider text-scada-muted font-semibold">{label}</span>
    </div>
  );
};
