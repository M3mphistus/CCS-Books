import { createRouter, createWebHashHistory } from 'vue-router'

import mainPage from './components/mainPage.vue'
import books from './components/books.vue'
import booksNew from './components/booksNew.vue'
import inventory from './components/inventory.vue'
import history from './components/booksHistory.vue'
import settings from './components/settings.vue'

const routes = [
  { path: '/', component: mainPage },
  { path: '/books', component: books },
  { path: '/books/new', component: booksNew },
  { path: '/inventory', component: inventory },
  { path: '/books/history', component: history },
  { path: '/settings', component: settings },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
