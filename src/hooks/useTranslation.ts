import { useTheme } from '@/contexts/ThemeContext'
import { translate } from '@/i18n'

export function useTranslation() {
  const { language } = useTheme()
  
  const t = (key: string) => translate(language, key)
  
  return { t, language }
}
