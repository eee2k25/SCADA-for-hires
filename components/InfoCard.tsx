import React, { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  colorClass?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, value, subValue, icon, colorClass = 'text-scada-accent' }) => {
  return (
    <div className="bg-scada-panel border border-slate-700/50 p-4 rounded-xl shadow-lg flex items-center justify-between">
      <div>
        <p className="text-scada-muted text-xs uppercase font-bold tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-mono font-bold text-white">{value}</h3>
            {subValue && <span className="text-xs text-scada-muted">{subValue}</span>}
        </div>
      </div>
      <div className={`p-3 rounded-lg bg-slate-800/50 ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};
