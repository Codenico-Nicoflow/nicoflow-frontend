# Theme System

This directory contains the styled-components theme system for the NicoFlow frontend application.

## Files

- `theme.ts` - Color definitions and theme objects for light and dark modes
- `ThemeContext.tsx` - React context for theme switching functionality
- `globalStyles.ts` - Global CSS styles using styled-components
- `styled.d.ts` - TypeScript declarations for styled-components theme
- `../hooks/useTheme.ts` - Custom hook for accessing theme context

## Usage

### Basic Theme Usage

```tsx
import styled from 'styled-components';

const StyledComponent = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;
```

### Theme Toggle

```tsx
import { useTheme } from '../hooks/useTheme';

const MyComponent = () => {
  const { isDark, toggleTheme, setTheme } = useTheme();

  return <button onClick={toggleTheme}>Switch to {isDark ? 'light' : 'dark'} mode</button>;
};
```

### Available Colors

#### Light Theme

- `primary`: #7C3AED
- `primaryHover`: #C4B5FD
- `secondary`: #8B5CF6
- `background`: #F9FAFB
- `surface`: #FFFFFF
- `textPrimary`: #1F2937
- `textSecondary`: #6B7280
- `border`: #CCCED2
- `error`: #EF4444
- `success`: #22C55E
- `warning`: #F59E0B
- `gradient`: ['#7C3AED', '#C4B5FD']
- `gradientHovered`: ['#6B21D1', '#B3A3F3']
- `gradientActive`: ['#5B21B6', '#A78BFA']

#### Dark Theme

- `primary`: #A78BFA
- `primaryHover`: #9F88F5
- `primaryLight`: #5B21B6
- `secondary`: #7C3AED
- `background`: #1E1E2F
- `surface`: #2A2A40
- `textPrimary`: #E0E7FF
- `textSecondary`: #A5B4FC
- `border`: #4C4F67
- `error`: #4C4F67
- `success`: #4ADE80
- `warning`: #FBBF24
- `gradient`: ['#5B21B6', '#A78BFA']
- `gradientHovered`: ['#4C1D95', '#9F88F5']
- `gradientActive`: ['#3B0CA7', '#8B72E9']

### Toast Colors

Both themes include toast-specific colors for success, info, warning, and error states.

## Features

- ✅ Light and dark theme support
- ✅ Automatic system theme detection
- ✅ Theme persistence in localStorage
- ✅ Smooth transitions between themes
- ✅ TypeScript support with full type safety
- ✅ Global styles with styled-components
- ✅ Custom hook for easy theme access
