import themeColors from './theme.colors.json';

export type ThemeMode = 'light' | 'dark';

export type AppColors = {
  background: string;
  surface: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  textPrimary: string;
  textMuted: string;
  border: string;
  overlay: string;
  success: string;
  danger: string;
};

const typedThemeColors = themeColors as Record<ThemeMode, AppColors>;

export const getThemeColors = (mode: ThemeMode): AppColors => typedThemeColors[mode];

export const colors = getThemeColors('light');

export const classifierTagPalette = {
  infrastructure: { bg: '#bbf7d0', text: '#1f2937' },
  environmental: { bg: '#a5f3fc', text: '#1f2937' },
  wildlife: { bg: '#e9d5ff', text: '#1f2937' },
  hazards: { bg: '#fed7aa', text: '#1f2937' },
  general: { bg: '#bfdbfe', text: '#1f2937' },
  default: { bg: '#1e293b', text: '#94a3b8' },
};

export const classifierTagCategoryMap: Record<string, keyof typeof classifierTagPalette> = {
  bridge: 'infrastructure',
  'power line': 'infrastructure',
  'boat launch': 'infrastructure',
  dam: 'infrastructure',
  'water withdrawal': 'infrastructure',
  pipe: 'infrastructure',
  inlet: 'infrastructure',
  shoreline: 'infrastructure',
  'old infrastructure': 'infrastructure',
  erosion: 'environmental',
  algae: 'environmental',
  'aquatic invasive': 'environmental',
  'terrestrial invasive': 'environmental',
  'water quality': 'environmental',
  foam: 'environmental',
  bottom: 'environmental',
  odor: 'environmental',
  trash: 'environmental',
  junk: 'environmental',
  bird: 'wildlife',
  'bird call': 'wildlife',
  sound: 'wildlife',
  fish: 'wildlife',
  mammal: 'wildlife',
  wetland: 'wildlife',
  obstruction: 'hazards',
  time: 'general',
  comment: 'general',
};
