import React from 'react';
import { X, Check, Sun, Moon, Palette, Sparkles, CheckCircle2 } from 'lucide-react';
import { ThemeConfig, ThemePresetId } from '../types';
import { THEME_PRESETS } from '../utils/theme';

interface ThemeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
}

export const ThemeBuilderModal: React.FC<ThemeBuilderModalProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
}) => {
  if (!isOpen) return null;

  const handleSelectPreset = (presetId: ThemePresetId) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setTheme(prev => ({
        ...prev,
        presetId,
        primaryColor: preset.primaryHex,
        accentColor: preset.accentHex,
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg app-surface rounded-2xl shadow-2xl app-border border overflow-hidden app-text transition-colors"
        id="theme-builder-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 app-border border-b">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-none app-text">Theme & Appearance</h3>
              <p className="text-xs app-text-muted mt-1 font-mono">
                Switch modes, palettes, and custom accent colors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg app-text-muted hover:app-text app-surface-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Mode Selector */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider app-text-subtle block mb-3">
              Appearance Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme(prev => ({ ...prev, mode: 'light' }))}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border font-bold text-xs transition-all ${
                  theme.mode === 'light'
                    ? 'shadow-md ring-2'
                    : 'app-surface-subtle app-border border app-text-muted hover:opacity-90'
                }`}
                style={
                  theme.mode === 'light'
                    ? {
                        borderColor: theme.primaryColor,
                        backgroundColor: `rgba(var(--color-primary-rgb), 0.1)`,
                        color: theme.primaryColor,
                      }
                    : {}
                }
              >
                <Sun className="w-4 h-4 text-amber-500" />
                Light Mode
                {theme.mode === 'light' && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
              </button>

              <button
                onClick={() => setTheme(prev => ({ ...prev, mode: 'dark' }))}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border font-bold text-xs transition-all ${
                  theme.mode === 'dark'
                    ? 'shadow-md ring-2'
                    : 'app-surface-subtle app-border border app-text-muted hover:opacity-90'
                }`}
                style={
                  theme.mode === 'dark'
                    ? {
                        borderColor: theme.primaryColor,
                        backgroundColor: `rgba(var(--color-primary-rgb), 0.1)`,
                        color: theme.primaryColor,
                      }
                    : {}
                }
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                Dark Mode
                {theme.mode === 'dark' && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
              </button>
            </div>
          </div>

          {/* Theme Presets */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider app-text-subtle block mb-3">
              Curated Theme Palettes
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEME_PRESETS.map(preset => {
                const isSelected = theme.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'shadow-md ring-2 app-surface'
                        : 'app-surface-subtle app-border hover:border-slate-400'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: preset.primaryHex,
                          }
                        : {}
                    }
                  >
                    <div
                      className={`h-10 rounded-lg bg-gradient-to-r ${preset.previewGradient} mb-2 shadow-inner flex items-center justify-center text-white`}
                    >
                      {isSelected && <Check className="w-4 h-4 drop-shadow-md stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold block truncate font-mono app-text">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Pickers */}
          <div className="pt-2 app-border border-t">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider app-text-subtle block mb-3">
              Custom Hex Colors
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-mono app-text-muted block mb-1">
                  Primary Theme Color
                </span>
                <div className="flex items-center gap-2 app-surface-subtle p-2 rounded-xl app-border border">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={e =>
                      setTheme(prev => ({ ...prev, primaryColor: e.target.value }))
                    }
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono uppercase font-bold app-text">
                    {theme.primaryColor}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-mono app-text-muted block mb-1">
                  Secondary Accent
                </span>
                <div className="flex items-center gap-2 app-surface-subtle p-2 rounded-xl app-border border">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={e =>
                      setTheme(prev => ({ ...prev, accentColor: e.target.value }))
                    }
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono uppercase font-bold app-text">
                    {theme.accentColor}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Component Preview */}
          <div className="p-4 rounded-xl app-surface-subtle app-border border space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold app-text-subtle block">
              Live Preview
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-md transition-transform hover:scale-105"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                Primary Button
              </button>

              <span
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-white shadow-sm"
                style={{ backgroundColor: theme.accentColor }}
              >
                Accent Badge
              </span>

              <span
                className="px-3 py-1 rounded-full text-xs font-bold font-mono border"
                style={{
                  color: theme.primaryColor,
                  borderColor: theme.primaryColor,
                  backgroundColor: `rgba(var(--color-primary-rgb), 0.1)`,
                }}
              >
                Outline Tag
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 app-surface-subtle app-border border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: theme.primaryColor }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
