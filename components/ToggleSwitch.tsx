import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  color?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, color = 'bg-scada-success', disabled = false }) => {
  return (
    <div className={`flex items-center justify-between bg-scada-panel p-4 rounded-lg border border-slate-700 ${disabled ? 'opacity-50' : ''}`}>
      <span className="font-medium text-scada-text">{label}</span>
      <button
        onClick={() => !disabled && onChange(!checked)}
        className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${checked ? color : 'bg-slate-700'}`}
        disabled={disabled}
      >
        <div
          className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : ''}`}
        />
      </button>
    </div>
  );
};
