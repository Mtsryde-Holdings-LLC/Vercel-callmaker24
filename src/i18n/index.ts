// Simplified i18n system for the platform
import en from './translations/en.json'
import es from './translations/es.json'
import fr from './translations/fr.json'

const translations: Record<string, any> = {
  en,
  es,
  fr,
  de: en, // Placeholder - use English for German
  pt: es, // Placeholder - use Spanish for Portuguese (similar)
  zh: en, // Placeholder - use English for Chinese
}

export function getTranslations(locale: string) {
  return translations[locale] || translations.en
}

export function translate(locale: string, key: string): string {
  const t = getTranslations(locale)
  const keys = key.split('.')
  let value = t
  
  for (const k of keys) {
    value = value?.[k]
    if (!value) break
  }
  
  return value || key
}
