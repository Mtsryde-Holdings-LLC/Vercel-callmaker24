import { useTheme } from '@/contexts/ThemeContext'

export function useThemeColors() {
  const { primaryColor, secondaryColor } = useTheme()
  
  return {
    primary: primaryColor,
    secondary: secondaryColor,
    
    // Helper to get button styles
    primaryButtonStyle: {
      backgroundColor: primaryColor,
      color: 'white',
    },
    secondaryButtonStyle: {
      backgroundColor: secondaryColor,
      color: 'white',
    },
    
    // Helper for borders/text
    primaryBorderStyle: {
      borderColor: primaryColor,
      color: primaryColor,
    },
  }
}
