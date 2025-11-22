export const colors = {
  light: {
    // Backgrounds - soft off-white with subtle warmth
    background: '#F5F5F0',        // Light warm gray (not pure white)
    surface: '#FFFFFF',           // Clean white for cards
    surfaceSecondary: '#E8E8E3',  // Subtle gray for secondary surfaces
    surfaceElevated: '#FAFAF8',   // Elevated surfaces (modals, sheets)
    
    // Borders & Dividers - minimal, subtle
    border: '#D4D4CE',            // Soft neutral gray
    borderLight: '#E8E8E3',       // Very light borders
    
    // Text - high contrast but not pure black
    text: '#1A1A1A',              // Near-black (not pure black)
    textSecondary: '#5A5A52',     // Medium gray with slight warm tone
    textTertiary: '#8F8F87',      // Light gray for de-emphasized text
    
    // Brand & Interactive
    primary: '#5B5FC7',           // Desaturated indigo (elegant, not harsh)
    primaryHover: '#4A4DB0',      // Slightly darker for hover
    accent: '#7B7FE8',            // Lighter accent for highlights
    
    // Status Colors - desaturated for elegance
    success: '#059669',           // Rich emerald (not bright green)
    successBg: '#D1FAE5',         // Soft success background
    error: '#DC2626',             // Deep red (not bright)
    errorBg: '#FEE2E2',           // Soft error background
    warning: '#D97706',           // Amber (warm, not garish)
    warningBg: '#FEF3C7',         // Soft warning background
    
    // Overlays
    overlay: 'rgba(26, 26, 26, 0.4)', // Subtle dark overlay

    // Navigation (light)
    headerBackground: '#FFFFFF',
    headerBorder: '#E8E8E3',
    tabBarBackground: '#F7F7FB',
    tabBarBorder: '#E8E8E3',
  },
  dark: {
    // Backgrounds - deep gray with elevation layers
    background: '#121212',        // Charcoal (not pure black) - base layer
    surface: '#1E1E1E',           // Slightly elevated surface (cards)
    surfaceSecondary: '#2A2A2A',  // Secondary surfaces
    surfaceElevated: '#2F2F2F',   // Elevated surfaces (modals, sheets)
    
    // Borders & Dividers - subtle separation without harsh lines
    border: '#3A3A3A',            // Medium gray for borders
    borderLight: '#2F2F2F',       // Very subtle borders
    
    // Text - off-white for reduced eye strain
    text: '#E8E8E8',              // Off-white (not pure white)
    textSecondary: '#A0A0A0',     // Medium gray
    textTertiary: '#6B6B6B',      // Darker gray for de-emphasized text
    
    // Brand & Interactive - slightly brighter in dark mode for contrast
    primary: '#6B6FE8',           // Vibrant but not harsh indigo
    primaryHover: '#7B7FED',      // Lighter on hover (dark mode reversal)
    accent: '#8B8FF5',            // Bright accent for highlights
    
    // Status Colors - vibrant enough to stand out in dark mode
    success: '#10B981',           // Emerald green
    successBg: '#064E3B',         // Dark success background
    error: '#EF4444',             // Bright red (needs visibility in dark)
    errorBg: '#7F1D1D',           // Dark error background
    warning: '#F59E0B',           // Amber
    warningBg: '#78350F',         // Dark warning background
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.6)', // Darker overlay for dark mode

    // Navigation (dark)
    headerBackground: '#1A1A1A',
    headerBorder: '#2A2A2A',
    tabBarBackground: '#171717',
    tabBarBorder: '#2A2A2A',
  },
};

export type ThemeColors = typeof colors.light;
