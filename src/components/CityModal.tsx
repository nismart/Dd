import React from 'react';
import { X, MapPin, Check, Truck } from 'lucide-react';
import { DeliveryCity } from '../types';

interface CityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: DeliveryCity;
  onSelectCity: (city: DeliveryCity) => void;
}

const CITIES: { name: DeliveryCity; district: string; pin: string; info: string }[] = [
  { name: 'Dewas', district: 'Dewas District', pin: '455001', info: 'Express Delivery Available · Chamunda Mata Foothills' },
  { name: 'Hatpipliya', district: 'Dewas District', pin: '455223', info: 'Local Hub Delivery · Fast dispatch' },
  { name: 'Bagli', district: 'Dewas District', pin: '455227', info: 'Direct Farm & Village Delivery' },
  { name: 'Indore', district: 'Indore District', pin: '452001', info: 'Metro Hub · Same-Day / Next-Day Delivery' }
];

export const CityModal: React.FC<CityModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Choose Delivery City</h3>
              <p className="text-xs text-slate-400">Serving Madhya Pradesh with local care</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* City List */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>NisKart offers express delivery across these selected MP locations:</span>
          </div>

          <div className="grid gap-2.5 pt-1">
            {CITIES.map((c) => {
              const isSelected = selectedCity === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => {
                    onSelectCity(c.name);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{c.name}</span>
                      <span className="text-[11px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded-sm border border-slate-200">
                        {c.district}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{c.info}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>PIN codes verified automatically</span>
          <button
            onClick={onClose}
            className="font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
