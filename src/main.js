import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import i18n from './locales'


const app = createApp(App).use(router).use(i18n)
app.mount('#app')

// Dynamischer <title> mit Übersetzung
import { watch } from 'vue'
const setTitle = () => {
  const title = i18n.global.t('app.title') || 'CCS-Auftragsverwaltung';
  document.title = title;
  const el = document.getElementById('app-title');
  if (el) el.textContent = title;
}
setTitle();
// Reagiere auf Sprachwechsel
if (i18n.global.locale) {
  watch(i18n.global.locale, setTitle);
}
