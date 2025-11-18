'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  language: string
  setPrimaryColor: (color: string) => void
  setSecondaryColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  setLanguage: (lang: string) => void
  updateTheme: (primary: string, secondary: string, background?: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [primaryColor, setPrimaryColor] = useState('#3B82F6')
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF')
  const [backgroundColor, setBackgroundColor] = useState('#F9FAFB')
  const [language, setLanguage] = useState('en')

  // Load from localStorage on mount
  useEffect(() => {
    const savedPrimary = localStorage.getItem('theme-primary-color')
    const savedSecondary = localStorage.getItem('theme-secondary-color')
    const savedBackground = localStorage.getItem('theme-background-color')
    const savedLanguage = localStorage.getItem('organization-language')
    
    if (savedPrimary) setPrimaryColor(savedPrimary)
    if (savedSecondary) setSecondaryColor(savedSecondary)
    if (savedBackground) setBackgroundColor(savedBackground)
    if (savedLanguage) setLanguage(savedLanguage)
  }, [])

  // Apply colors to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', primaryColor)
    document.documentElement.style.setProperty('--color-secondary', secondaryColor)
    document.documentElement.style.setProperty('--color-background', backgroundColor)
    document.body.style.backgroundColor = backgroundColor
    
    // Save to localStorage
    localStorage.setItem('theme-primary-color', primaryColor)
    localStorage.setItem('theme-secondary-color', secondaryColor)
    localStorage.setItem('theme-background-color', backgroundColor)
  }, [primaryColor, secondaryColor, backgroundColor])

  // Save language and handle RTL
  useEffect(() => {
    localStorage.setItem('organization-language', language)
    
    // Handle RTL for Arabic
    if (language === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl')
      document.documentElement.setAttribute('lang', 'ar')
    } else {
      document.documentElement.setAttribute('dir', 'ltr')
      document.documentElement.setAttribute('lang', language)
    }
  }, [language])

  const updateTheme = (primary: string, secondary: string, background?: string) => {
    setPrimaryColor(primary)
    setSecondaryColor(secondary)
    if (background) setBackgroundColor(background)
  }

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        secondaryColor,
        backgroundColor,
        language,
        setPrimaryColor,
        setSecondaryColor,
        setBackgroundColor,
        setLanguage,
        updateTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
