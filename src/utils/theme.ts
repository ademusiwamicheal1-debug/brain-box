import { ThemeConfig, ThemePresetId } from '../types';

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  primaryHex: string;
  accentHex: string;
  bgDark: string;
  surfaceDark: string;
  surfaceSubtleDark: string;
  borderDark: string;
  bgLight: string;
  surfaceLight: string;
  surfaceSubtleLight: string;
  borderLight: string;
  previewGradient: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'high-density',
    name: 'High Density Pro',
    primaryHex: '#6366f1', // Indigo
    accentHex: '#f97316',  // Orange
    bgDark: '#020617',     // Slate 950
    surfaceDark: '#0f172a',
    surfaceSubtleDark: '#1e293b',
    borderDark: '#1e293b',
    bgLight: '#f8fafc',    // Slate 50
    surfaceLight: '#ffffff',
    surfaceSubtleLight: '#f1f5f9',
    borderLight: '#e2e8f0',
    previewGradient: 'from-indigo-600 to-orange-500',
  },
  {
    id: 'violet',
    name: 'Violet Glow',
    primaryHex: '#8b5cf6', // Violet
    accentHex: '#ec4899',  // Pink
    bgDark: '#0b0816',
    surfaceDark: '#16102a',
    surfaceSubtleDark: '#231b3e',
    borderDark: '#292048',
    bgLight: '#faf5ff',    // Purple 50
    surfaceLight: '#ffffff',
    surfaceSubtleLight: '#f3e8ff',
    borderLight: '#e9d5ff',
    previewGradient: 'from-purple-600 to-pink-500',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    primaryHex: '#06b6d4', // Cyan
    accentHex: '#f43f5e',  // Rose
    bgDark: '#040d1a',
    surfaceDark: '#0a192f',
    surfaceSubtleDark: '#132847',
    borderDark: '#1b3a63',
    bgLight: '#f0fdfa',    // Cyan 50
    surfaceLight: '#ffffff',
    surfaceSubtleLight: '#ccfbf1',
    borderLight: '#99f6e4',
    previewGradient: 'from-cyan-500 to-rose-500',
  },
  {
    id: 'sunset',
    name: 'Sunset Ember',
    primaryHex: '#f97316', // Orange
    accentHex: '#eab308',  // Yellow
    bgDark: '#150906',
    surfaceDark: '#22110c',
    surfaceSubtleDark: '#361c14',
    borderDark: '#45251a',
    bgLight: '#fffbeb',    // Amber 50
    surfaceLight: '#ffffff',
    surfaceSubtleLight: '#fef3c7',
    borderLight: '#fde68a',
    previewGradient: 'from-orange-500 to-yellow-500',
  },
  {
    id: 'emerald',
    name: 'Emerald Aurora',
    primaryHex: '#10b981', // Emerald
    accentHex: '#06b6d4',  // Cyan
    bgDark: '#03120e',
    surfaceDark: '#08211b',
    surfaceSubtleDark: '#0f352c',
    borderDark: '#16483c',
    bgLight: '#f0fdf4',    // Green 50
    surfaceLight: '#ffffff',
    surfaceSubtleLight: '#dcfce7',
    borderLight: '#bbf7d0',
    previewGradient: 'from-emerald-500 to-teal-400',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    primaryHex: '#3b82f6', // Blue
    accentHex: '#6366f1',  // Indigo
    bgDark: '#070f21',
    surfaceDark: '#0d1d3a',
    surfaceSubtleDark: '#152c56',
    borderDark: '#1e3c73',
    bgLight: '#eff6ff',    // Blue 50
    surfaceLight: '#ffffff',
    surfaceSubtleLight: '#dbeafe',
    borderLight: '#bfdbfe',
    previewGradient: 'from-blue-600 to-indigo-500',
  },
  {
    id: 'monochrome',
    name: 'Slate Minimal',
    primaryHex: '#64748b', // Slate
    accentHex: '#38bdf8',  // Sky
    bgDark: '#090d16',
    surfaceDark: '#131926',
    surfaceSubtleDark: '#1e2638',
    borderDark: '#2a344a',
    bgLight: '#f8fafc',    // Neutral slate
    surfaceLight: '#ffffff',
    surfaceSubtleLight: '#f1f5f9',
    borderLight: '#e2e8f0',
    previewGradient: 'from-slate-700 to-slate-900',
  },
];

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  presetId: 'high-density',
  primaryColor: '#6366f1',
  accentColor: '#f97316',
  bgStyle: 'gradient',
};

function hexToRgb(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '99, 102, 241';
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export function applyThemeToDocument(config: ThemeConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  const preset = THEME_PRESETS.find(p => p.id === config.presetId) || THEME_PRESETS[0];
  const isDark = config.mode === 'dark';

  // Toggle dark class on root
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // Derive theme variables
  const appBg = isDark ? preset.bgDark : preset.bgLight;
  const appSurface = isDark ? preset.surfaceDark : preset.surfaceLight;
  const appSurfaceSubtle = isDark ? preset.surfaceSubtleDark : preset.surfaceSubtleLight;
  const appBorder = isDark ? preset.borderDark : preset.borderLight;
  const appText = isDark ? '#f8fafc' : '#0f172a';
  const appTextMuted = isDark ? '#94a3b8' : '#475569';
  const appTextSubtle = isDark ? '#64748b' : '#64748b';
  const appNavBg = isDark ? `${preset.surfaceDark}ee` : `${preset.surfaceLight}f2`;

  const primaryHex = config.primaryColor || preset.primaryHex;
  const accentHex = config.accentColor || preset.accentHex;

  // Set CSS Variables on Root
  root.style.setProperty('--app-bg', appBg);
  root.style.setProperty('--app-surface', appSurface);
  root.style.setProperty('--app-surface-subtle', appSurfaceSubtle);
  root.style.setProperty('--app-border', appBorder);
  root.style.setProperty('--app-text', appText);
  root.style.setProperty('--app-text-muted', appTextMuted);
  root.style.setProperty('--app-text-subtle', appTextSubtle);
  root.style.setProperty('--app-nav-bg', appNavBg);

  root.style.setProperty('--color-primary', primaryHex);
  root.style.setProperty('--color-primary-rgb', hexToRgb(primaryHex));
  root.style.setProperty('--color-accent', accentHex);
  root.style.setProperty('--color-accent-rgb', hexToRgb(accentHex));

  if (body) {
    body.style.backgroundColor = appBg;
    body.style.color = appText;
  }
}
