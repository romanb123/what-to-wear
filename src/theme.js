export const COLORS = {
  bg: '#0E0E0E',
  surface: '#181818',
  card: '#1E1E1E',
  cardHover: '#242424',
  gold: '#C8A96E',
  goldLight: '#E2C98A',
  goldDim: 'rgba(200,169,110,0.15)',
  textPrimary: '#EDE8DE',
  textSecondary: '#7E7870',
  textMuted: '#4A4640',
  border: '#2A2A2A',
  borderLight: '#333333',
  danger: '#C0544A',
  success: '#5A9A6A',
};

export const FONTS = {
  serif:      'CormorantGaramond_400Regular',
  serifMedium:'CormorantGaramond_500Medium',
  serifBold:  'CormorantGaramond_600SemiBold',
  serifItalic:'CormorantGaramond_400Italic',
  sans:       'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
};

export const CATEGORIES = [
  { id: 'all',         label: 'All',         emoji: '✦', bg: '#141414', accent: '#C8A96E' },
  { id: 'Shirts',      label: 'Shirts',      emoji: '👕', bg: '#101825', accent: '#5B7DB1' },
  { id: 'Pants',       label: 'Pants',       emoji: '👖', bg: '#0F1E1A', accent: '#4A7B6F' },
  { id: 'Dresses',     label: 'Dresses',     emoji: '👗', bg: '#1A1020', accent: '#8B5E83' },
  { id: 'Shoes',       label: 'Shoes',       emoji: '👟', bg: '#1E1408', accent: '#B87333' },
  { id: 'Jackets',     label: 'Jackets',     emoji: '🧥', bg: '#0C1018', accent: '#4A6080' },
  { id: 'Accessories', label: 'Accessories', emoji: '👜', bg: '#191208', accent: '#8A7050' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export const SEASONS = ['Summer', 'Winter', 'Spring/Fall', 'All Year'];
export const STYLES  = ['Casual', 'Formal', 'Sport', 'Evening'];

export const PRESET_COLORS = [
  '#FFFFFF', '#F5F0E8', '#E8D5B0', '#F0C8A0',
  '#D4A0A0', '#C084A0', '#9060A8', '#5070B8',
  '#4090B0', '#50A878', '#90B840', '#D4C828',
  '#E09020', '#C05030', '#803828', '#5A4030',
  '#404040', '#282828', '#181818', '#0A0A0A',
];
