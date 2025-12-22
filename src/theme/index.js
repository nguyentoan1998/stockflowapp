// Theme configuration for StockFlow App
// Soft cream background with coral accent and electric blue highlights

export const Colors = {
  // Primary palette - Coral
  primary: '#FF6B6B',        // Coral red (màu nhấn chính)
  primaryLight: '#FF8E8E',   // Light coral
  primaryDark: '#E85555',    // Dark coral
  
  // Secondary palette - Electric Blue
  secondary: '#4ECDC4',      // Electric blue/cyan
  secondaryLight: '#7FD9D1', // Light electric blue
  secondaryDark: '#3AB8AF',  // Dark electric blue
  
  // Accent colors
  accent: '#FFE66D',         // Soft yellow accent
  success: '#51CF66',        // Soft green
  warning: '#FFB84D',        // Soft orange
  error: '#FF6B6B',          // Coral (same as primary)
  info: '#4ECDC4',           // Electric blue (same as secondary)
  
  // Neutral colors - Cream theme
  background: '#FFF8F0',     // Soft cream background
  surface: '#FFFFFF',        // White surface
  surfaceVariant: '#FFF5EB', // Light cream variant
  cardBackground: '#FFFBF5', // Card background
  
  // Text colors
  text: '#2C3E50',           // Dark slate for text
  textSecondary: '#7F8C8D',  // Gray for secondary text
  textLight: '#BDC3C7',      // Light gray
  textOnPrimary: '#FFFFFF',  // White on coral
  textOnSecondary: '#FFFFFF', // White on blue
  
  // Border colors
  border: '#EAEAEA',         // Very light gray
  borderLight: '#F5F5F5',    // Almost white
  
  // Chart colors
  chartPrimary: '#4ECDC4',   // Electric blue for charts
  chartSecondary: '#FF6B6B', // Coral for charts
  chartTertiary: '#FFE66D',  // Yellow for charts
  chartQuaternary: '#95E1D3', // Mint for charts
  
  // Status colors
  statusActive: '#51CF66',   // Green
  statusInactive: '#BDC3C7', // Gray
  statusPending: '#FFE66D',  // Yellow
  
  // Gradient presets
  gradients: {
    primary: ['#FF6B6B', '#FF8E8E'],        // Coral gradient
    secondary: ['#4ECDC4', '#7FD9D1'],      // Blue gradient
    sunset: ['#FF6B6B', '#FFE66D'],         // Coral to yellow
    ocean: ['#4ECDC4', '#95E1D3'],          // Blue to mint
    warm: ['#FFE66D', '#FF6B6B'],           // Yellow to coral
    cool: ['#95E1D3', '#4ECDC4'],           // Mint to blue
    card: ['#FFFFFF', '#FFF8F0'],           // White to cream
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 12,   // More rounded
  md: 16,   // Card default
  lg: 20,   // Large cards
  xl: 28,   // Extra large
  full: 9999, // Circular
};

export const Shadows = {
  // Soft, subtle shadows for cream theme
  sm: {
    shadowColor: '#FF6B6B', // Coral tint
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#FF6B6B', // Coral tint
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#FF6B6B', // Coral tint
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  card: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  colored: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  }),
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
};

// Animation durations
export const AnimationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export default {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
  AnimationDurations,
};
