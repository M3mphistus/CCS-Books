import { createI18n } from 'vue-i18n'
import de from './de.json'
import en from './en.json'

const messages = {
  de,
  en
}

const i18n = createI18n({
  legacy: false,
  locale: 'en', // default language
  fallbackLocale: 'de',
  messages
})

export default i18n
