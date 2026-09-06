import React, { useState, useEffect } from 'react';
import { Type, Palette } from 'lucide-react';

export interface StyleObject {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
}

interface UniversalStyleControlProps {
  label: string;
  value: StyleObject | undefined;
  onChange: (newValue: StyleObject) => void;
  defaultFontFamily?: string;
  defaultFontSize?: number;
  defaultColor?: string;
  minSize?: number;
  maxSize?: number;
}

export const PREMIUM_FONTS = [
  { value: 'serif', name: 'Heritage Serif (Playfair Display)' },
  { value: 'cinzel', name: 'Cinzel Classic Display' },
  { value: 'cormorant', name: 'Cormorant Garamond' },
  { value: 'marcellus', name: 'Marcellus Royal' },
  { value: 'sans', name: 'Modern Sans (Inter)' },
  { value: 'poppins', name: 'Poppins Geometric' },
  { value: 'montserrat', name: 'Montserrat Elegant' },
  { value: 'lora', name: 'Lora Literary Serif' },
  { value: 'prata', name: 'Prata Fine Serif' },
  { value: 'cursive', name: 'Sacramento Cursive' },
  { value: 'mono', name: 'Courier Prime Monospace' }
];

export const UniversalStyleControl: React.FC<UniversalStyleControlProps> = ({
  label,
  value = {},
  onChange,
  defaultFontFamily = 'sans',
  defaultFontSize = 14,
  defaultColor = '#1c1917',
  minSize = 8,
  maxSize = 72,
}) => {
  const currentFontFamily = value.fontFamily || defaultFontFamily;
  const currentFontSize = value.fontSize || defaultFontSize;
  const currentColor = value.color || defaultColor;

  // Track raw input string for color text field to allow intermediate typing states without crashing
  const [hexInput, setHexInput] = useState(currentColor);

  useEffect(() => {
    setHexInput(currentColor);
  }, [currentColor]);

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...value,
      fontFamily: e.target.value,
    });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    onChange({
      ...value,
      fontSize: isNaN(size) ? defaultFontSize : size,
    });
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    onChange({
      ...value,
      color: val,
    });
  };

  const handleColorTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    
    // Simple hex regex validation to apply immediately if valid
    if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
      onChange({
        ...value,
        color: val,
      });
    }
  };

  const handleColorTextBlur = () => {
    // If invalid hex format on blur, restore valid color state
    if (!/^#[0-9A-F]{6}$/i.test(hexInput) && !/^#[0-9A-F]{3}$/i.test(hexInput)) {
      setHexInput(currentColor);
    }
  };

  return (
    <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800/60 space-y-3.5 select-none text-left">
      <div className="flex items-center gap-1.5 pb-1 border-b border-stone-800/40">
        <Type className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300">
          {label} Styling
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Font Family Dropdown */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide block">
            Font Family
          </label>
          <select
            value={currentFontFamily}
            onChange={handleFontFamilyChange}
            className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded px-2 py-1.5 text-xs text-stone-100 outline-none cursor-pointer"
          >
            {PREMIUM_FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.name}
              </option>
            ))}
          </select>
        </div>

        {/* Text Color Input */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide block">
            Text Color
          </label>
          <div className="flex gap-1.5 items-center bg-stone-950 border border-stone-800 rounded px-2 h-[30px]">
            <input
              type="color"
              value={currentColor.startsWith('#') ? currentColor : '#000000'}
              onChange={handleColorPickerChange}
              className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
            />
            <input
              type="text"
              value={hexInput}
              onChange={handleColorTextChange}
              onBlur={handleColorTextBlur}
              placeholder="#FFFFFF"
              className="w-full bg-transparent border-none text-[10px] font-mono text-stone-100 uppercase outline-none focus:ring-0 p-0"
            />
          </div>
        </div>
      </div>

      {/* Font Size Range Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase tracking-wide">
          <span>Font Size</span>
          <span className="font-mono text-amber-500 text-[10px]">{currentFontSize} px</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={minSize}
            max={maxSize}
            value={currentFontSize}
            onChange={handleFontSizeChange}
            className="flex-1 h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <input
            type="number"
            min={minSize}
            max={maxSize}
            value={currentFontSize}
            onChange={handleFontSizeChange}
            className="w-12 bg-stone-950 border border-stone-800 rounded px-1 py-0.5 text-center text-[10px] text-stone-200 font-mono focus:border-amber-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};
