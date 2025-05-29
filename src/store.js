import { reactive, watch } from 'vue'

// Try to load global state from localStorage
const defaultState = {
  saveSlot: 3, // 1, 2, 3
  language: 'de',
}
let loaded = false
let state = { ...defaultState }
try {
  const saved = localStorage.getItem('globalState')
  if (saved) {
    state = { ...state, ...JSON.parse(saved) }
    loaded = true
  }
} catch (e) {}

const globalState = reactive(state)

// Persist changes
watch(
  () => ({ saveSlot: globalState.saveSlot, language: globalState.language }),
  (val) => {
    localStorage.setItem('globalState', JSON.stringify(val))
  },
  { deep: true }
)

export default globalState
