import { createI18n } from 'vue-i18n'
import de from './de.json'
import en from './en.json'

const messages = {
  de,
  en
}

const i18n = createI18n({
  legacy: false,
  locale: 'de', // default language
  fallbackLocale: 'en',
  messages
})

export default i18n
