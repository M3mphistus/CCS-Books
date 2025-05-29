<template>
  <div class="page">
    <h1>{{$t('app.title')}}</h1>
    <h2>{{$t('app.newOrder')}}</h2>
    <!-- Money Type Buttons -->
    <div class="moneytype-buttons">
      <button
        v-for="type in moneyTypes"
        :key="type"
        :class="['moneytype-btn', { active: selectedMoneyTypes.includes(type) }]"
        @click="toggleMoneyType(type)"
      >{{ $t('moneyType.' + type) }}</button>
    </div>
    <!-- MarkedType Buttons: Nur bei Markiert, direkt unter MoneyType -->
    <div v-if="selectedMoneyTypes.includes('Markiert')" class="markedtype-buttons">
      <button
        v-for="type in markedTypes"
        :key="type.value"
        :class="['markedtype-btn', { active: selectedMarkedType === type.value }]"
        @click="selectMarkedType(type.value)"
      >
        {{ $t('markedType.' + type.value) }}
      </button>
    </div>
    <div class="currency-buttons">
      <button
        :class="['currency-btn', { active: selectedCurrency === 'Dollar' }]"
        @click="selectCurrency('Dollar')"
      >
        {{$t('currency.Dollar')}}
      </button>
      <button
        :class="['currency-btn', { active: selectedCurrency === 'Euro' }]"
        @click="selectCurrency('Euro')"
      >
        {{$t('currency.Euro')}}
      </button>
      <button
        :class="['currency-btn', { active: selectedCurrency === 'Yen' }]"
        @click="selectCurrency('Yen')"
      >
        {{$t('currency.Yen')}}
      </button>
    </div>
    <div v-if="selectedCurrency" class="denomination-buttons">
      <button
        v-for="denom in denominations[selectedCurrency]"
        :key="denom"
        :class="['denomination-btn', { active: selectedDenomination === denom }]"
        @click="selectDenomination(denom)"
      >
        {{$t('denomination.' + denom)}}
      </button>
    </div>
    <input
      class="number-input"
      type="text"
      v-model="inputValue"
      readonly
      :placeholder="$t('inventory.amount')"
    />
    <div class="keypad">
      <div class="keypad-row">
        <button class="key-btn" @click="appendKey('7')">7</button>
        <button class="key-btn" @click="appendKey('8')">8</button>
        <button class="key-btn" @click="appendKey('9')">9</button>
        <button class="key-btn del-btn" @click="deleteLast">⌫</button>
      </div>
      <div class="keypad-row">
        <button class="key-btn" @click="appendKey('4')">4</button>
        <button class="key-btn" @click="appendKey('5')">5</button>
        <button class="key-btn" @click="appendKey('6')">6</button>
        <div style="width: 60px"></div>
      </div>
      <div class="keypad-row">
        <button class="key-btn" @click="appendKey('1')">1</button>
        <button class="key-btn" @click="appendKey('2')">2</button>
        <button class="key-btn" @click="appendKey('3')">3</button>
        <button
          class="key-btn minus-btn"
          :disabled="!canAdd"
          @click="removeFromCart"
        >-</button>
      </div>
      <div class="keypad-row">
        <button class="key-btn" @click="appendKey('00')">00</button>
        <button class="key-btn" @click="appendKey('0')">0</button>
        <div style="width: 60px"></div>
        <button
          class="key-btn plus-btn"
          :disabled="!canAdd"
          @click="addToCart"
        >+</button>
      </div>
    </div>

    <!-- Warenkorb Button unter dem Keypad -->
    <button
      v-if="cart.length"
      class="cart-btn"
      @click="showCartModal = true"
    >
      🛒 Warenkorb ({{ cart.length }})
    </button>

    <!-- Modal für Warenkorb -->
    <div v-if="showCartModal" class="modal-backdrop" @click.self="showCartModal = false">
      <div class="modal">
        <h3>{{$t('modal.cart')}}</h3>
        <ul>
          <li v-for="(item, idx) in cart" :key="idx">
            {{ item.type === 'add' ? '+' : '-' }}
            {{ item.amount }}x {{ item.denomination }} {{ item.currency }} ({{ item.moneyType.join(', ') }})
            <button class="delete-entry-btn" @click="removeCartEntry(idx)">✕</button>
          </li>
        </ul>
        <button class="complete-btn" @click="completeOrder">{{$t('modal.completeOrder')}}</button>
        <button class="close-btn" @click="showCartModal = false">{{$t('modal.close')}}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// --- MARKED TYPE LOGIK ---
const markedTypes = [
  { value: 'unsorted', label: 'Unsortiert' },
  { value: 'gang_diamond', label: 'Gang (♦)' },
  { value: 'gang_plus', label: 'Gang (+)' },
  { value: 'gang_striped', label: 'Gang (≡)' },
  { value: 'police_x', label: 'Polizei (X)' },
  { value: 'fdi_eye', label: 'FDI (Auge)' },
  { value: 'blood', label: 'Blut' },
]
const selectedMarkedType = ref('unsorted')

function selectMarkedType(type) {
  selectedMarkedType.value = type
}

import { ref, computed, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import globalState from '../store.js'
let Filesystem
if (Capacitor.isNativePlatform()) {
  import('@capacitor/filesystem').then(mod => { Filesystem = mod.Filesystem })
}

const selectedCurrency = ref('Dollar')
const selectedDenomination = ref(null)
const inputValue = ref('')
const cart = ref([])
const showCartModal = ref(false)

const moneyTypes = ['Echt', 'Markiert', 'Falsch', 'Eingefärbt']
const selectedMoneyTypes = ref(['Echt'])

// Hilfsfunktion: Prüft, ob ein Basis-Typ (Echt, Markiert, Falsch) gewählt ist
function isBaseType(type) {
  return ['Echt', 'Markiert', 'Falsch'].includes(type)
}

// Anpassung: Nur "Eingefärbt" darf beliebig kombiniert werden
function toggleMoneyType(type) {
  if (type === 'Eingefärbt') {
    // Eingefärbt kann immer beliebig zu- oder abgewählt werden
    if (selectedMoneyTypes.value.includes('Eingefärbt')) {
      selectedMoneyTypes.value = selectedMoneyTypes.value.filter(t => t !== 'Eingefärbt')
    } else {
      selectedMoneyTypes.value.push('Eingefärbt')
    }
    return
  }
  // Für Basis-Typen: Nur einer auswählbar, aber immer mit/ohne Eingefärbt
  if (selectedMoneyTypes.value.includes(type)) {
    // Wenn abgewählt wird, entferne nur den Basis-Typ, Eingefärbt bleibt ggf.
    selectedMoneyTypes.value = selectedMoneyTypes.value.filter(t => t !== type)
    // Falls gar nichts mehr gewählt ist, Eingefärbt bleibt erhalten
    if (selectedMoneyTypes.value.length === 0) {
      selectedMoneyTypes.value = []
    }
  } else {
    // Nur dieser Basis-Typ, plus ggf. Eingefärbt
    const hasEingefaerbt = selectedMoneyTypes.value.includes('Eingefärbt')
    selectedMoneyTypes.value = hasEingefaerbt ? [type, 'Eingefärbt'] : [type]
  }
}

const denominations = {
  Dollar: ['10 $', '20 $', '50 $', '100 $'],
  Euro: ['20 €', '50 €', '100 €'],
  Yen: ['1000 ¥', '5000 ¥', '10000 ¥'],
}

// --- INVENTAR-LOGIK ---

const inventory = ref(loadInventory())

function getInventarKey() {
  return `inventar_slot${globalState.saveSlot}`
}

function loadInventory() {
  const inv = localStorage.getItem(getInventarKey())
  if (inv) return JSON.parse(inv)
  return {}
}

function saveInventory() {
  localStorage.setItem(getInventarKey(), JSON.stringify(inventory.value))
}

// Wenn sich der Slot ändert, Inventar neu laden
watch(() => globalState.saveSlot, () => {
  inventory.value = loadInventory()
})

// Hilfsfunktion für Inventar-Key
// Wenn Markiert enthalten ist, markedType als Suffix im Key
function inventoryKey(typeArr, currency, denomination, markedType = null) {
  let typeKey;
  if (Array.isArray(typeArr) && typeArr.includes('Markiert')) {
    // markedType MUSS gesetzt sein, sonst nicht "undefined" speichern
    const safeMarkedType = (markedType === undefined || markedType === null) ? 'unsorted' : markedType;
    typeKey = `Markiert(${safeMarkedType})`;
    if (typeArr.includes('Eingefärbt')) typeKey += '+Eingefärbt';
  } else {
    typeKey = typeArr.join('+');
  }
  return `${typeKey}|${currency}|${denomination}`;
}


// Inventar aktualisieren (add/sub)
function updateInventoryFromCart(cartItems) {
  cartItems.forEach(item => {
    // markedType nur für Markiert
    const key = inventoryKey(item.moneyType, item.currency, item.denomination, item.markedType)
    if (!inventory.value[key]) inventory.value[key] = 0
    if (item.type === 'add') {
      inventory.value[key] += item.amount
    } else {
      inventory.value[key] -= item.amount
    }
  })
  saveInventory()
}

// --- RESTLICHE LOGIK ---
function selectCurrency(currency) {
  selectedCurrency.value = currency
  selectedDenomination.value = null
}

function selectDenomination(denom) {
  selectedDenomination.value = denom
}

function appendKey(key) {
  inputValue.value += key
}

function deleteLast() {
  inputValue.value = inputValue.value.slice(0, -1)
}

const canAdd = computed(() =>
  selectedCurrency.value &&
  selectedDenomination.value &&
  inputValue.value &&
  !isNaN(Number(inputValue.value)) &&
  Number(inputValue.value) > 0
)

function addToCart() {
  if (!canAdd.value) return
  const baseTypes = selectedMoneyTypes.value.filter(isBaseType)
  const hasEingefaerbt = selectedMoneyTypes.value.includes('Eingefärbt')

  // Nur Eingefärbt gewählt
  if (baseTypes.length === 0 && hasEingefaerbt) {
    mergeCartEntry('add', ['Eingefärbt'])
  }
  // Nur ein Basis-Typ (ggf. mit Eingefärbt)
  if (baseTypes.length === 1) {
    // Markiert: markedType speichern
    if (baseTypes[0] === 'Markiert') {
      if (hasEingefaerbt) {
        mergeCartEntry('add', ['Markiert', 'Eingefärbt'], selectedMarkedType.value)
      } else {
        mergeCartEntry('add', ['Markiert'], selectedMarkedType.value)
      }
    } else {
      if (hasEingefaerbt) {
        mergeCartEntry('add', [baseTypes[0], 'Eingefärbt'])
      } else {
        mergeCartEntry('add', [baseTypes[0]])
      }
    }
  }
  // Falls gar nichts gewählt ist, nichts tun
  inputValue.value = ''
  selectedDenomination.value = null
}

function removeFromCart() {
  if (!canAdd.value) return
  const baseTypes = selectedMoneyTypes.value.filter(isBaseType)
  const hasEingefaerbt = selectedMoneyTypes.value.includes('Eingefärbt')

  if (baseTypes.length === 0 && hasEingefaerbt) {
    mergeCartEntry('remove', ['Eingefärbt'])
  }
  if (baseTypes.length === 1) {
    if (baseTypes[0] === 'Markiert') {
      if (hasEingefaerbt) {
        mergeCartEntry('remove', ['Markiert', 'Eingefärbt'], selectedMarkedType.value)
      } else {
        mergeCartEntry('remove', ['Markiert'], selectedMarkedType.value)
      }
    } else {
      if (hasEingefaerbt) {
        mergeCartEntry('remove', [baseTypes[0], 'Eingefärbt'])
      } else {
        mergeCartEntry('remove', [baseTypes[0]])
      }
    }
  }
  inputValue.value = ''
  selectedDenomination.value = null
}

// Die Cart-Einträge speichern moneyType jetzt als Array!
function mergeCartEntry(type, moneyTypeArr = [], markedType = null) {
  const amount = Number(inputValue.value)
  const idx = cart.value.findIndex(item =>
    item.type === type &&
    item.currency === selectedCurrency.value &&
    item.denomination === selectedDenomination.value &&
    JSON.stringify(item.moneyType) === JSON.stringify(moneyTypeArr) &&
    (item.markedType || 'unsorted') === (markedType || 'unsorted')
  )
  if (idx !== -1) {
    cart.value[idx].amount += amount
  } else {
    const entry = {
      type,
      currency: selectedCurrency.value,
      denomination: selectedDenomination.value,
      amount,
      moneyType: moneyTypeArr
    }
    if (Array.isArray(moneyTypeArr) && moneyTypeArr.includes('Markiert')) {
      entry.markedType = markedType || 'unsorted'
    }
    cart.value.push(entry)
  }
}

function removeCartEntry(idx) {
  cart.value.splice(idx, 1)
}

async function completeOrder() {
  const order = {
    timestamp: new Date().toISOString(),
    items: [...cart.value]
  }
  // Inventar aktualisieren
  updateInventoryFromCart(cart.value)

  if (Capacitor.isNativePlatform() && Filesystem) {
    try {
      const filename = `auftraege_slot${globalState.saveSlot}.json`
      let existing = []
      try {
        const result = await Filesystem.readFile({ path: filename, directory: 'DATA' })
        existing = JSON.parse(result.data)
      } catch (e) {
        existing = []
      }
      existing.push(order)
      await Filesystem.writeFile({
        path: filename,
        data: JSON.stringify(existing),
        directory: 'DATA'
      })
    } catch (e) {
      alert('Fehler beim Speichern in Datei: ' + e)
    }
  } else {
    const key = `auftraege_slot${globalState.saveSlot}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.push(order)
    localStorage.setItem(key, JSON.stringify(existing))
  }
  cart.value = []
  showCartModal.value = false
}
</script>

<style scoped>
.markedtype-buttons {
  display: flex;
  flex-direction: row;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
}
.markedtype-btn {
  font-size: 1.05rem;
  padding: 0.5rem 1.2rem;
  border-radius: 0.7rem;
  border: 2px solid #ffd700;
  background: #fffbe6;
  color: #b8860b;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.markedtype-btn.active,
.markedtype-btn:active {
  background: #ffd700;
  color: #fff;
}
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 60vh;
  padding-top: 2rem;
}
h1 {
  margin-bottom: 0.5rem;
}
h2 {
  color: #42b883;
  margin-bottom: 1.5rem;
}
.moneytype-buttons {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  margin-bottom: 1.2rem;
}
.moneytype-btn {
  font-size: 1.1rem;
  padding: 0.7rem 2rem;
  border-radius: 1rem;
  border: 2px solid #8e44ad;
  background: #fff;
  color: #8e44ad;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.moneytype-btn.active,
.moneytype-btn:active {
  background: #8e44ad;
  color: #fff;
}
.currency-buttons {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.currency-btn {
  font-size: 1.2rem;
  padding: 1rem 2.5rem;
  border-radius: 1rem;
  border: 2px solid #42b883;
  background: #fff;
  color: #42b883;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.currency-btn.active,
.currency-btn:active {
  background: #42b883;
  color: #fff;
}
.denomination-buttons {
  display: flex;
  flex-direction: row;
  gap: 1.2rem;
  margin-bottom: 2rem;
}
.denomination-btn {
  font-size: 1.1rem;
  padding: 0.8rem 2rem;
  border-radius: 0.8rem;
  border: 2px solid #888;
  background: #fff;
  color: #333;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.denomination-btn.active,
.denomination-btn:active {
  background: #42b883;
  color: #fff;
  border-color: #42b883;
}
.number-input {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  width: 220px;
  padding: 0.5rem 1rem;
  border-radius: 0.8rem;
  border: 2px solid #42b883;
  background: #f9f9f9;
  color: #222;
}
.keypad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 1.5rem;
}
.keypad-row {
  display: flex;
  flex-direction: row;
  gap: 0.3rem;
}
.key-btn {
  font-size: 1.5rem;
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  border: 2px solid #42b883;
  background: #fff;
  color: #42b883;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.key-btn:active {
  background: #42b883;
  color: #fff;
}
.key-btn.del-btn {
  background: #ffdddd;
  color: #b80000;
  border-color: #b80000;
}
.key-btn.del-btn:active {
  background: #b80000;
  color: #fff;
}
.key-btn.plus-btn {
  background: #42b883;
  color: #fff;
  border-color: #42b883;
}
.key-btn.plus-btn:disabled {
  background: #b2e2d1;
  color: #fff;
  cursor: not-allowed;
}
.key-btn.minus-btn {
  background: #b80000;
  color: #fff;
  border-color: #b80000;
}
.key-btn.minus-btn:disabled {
  background: #ffb2b2;
  color: #fff;
  cursor: not-allowed;
}
.cart-btn {
  margin-top: 1.5rem;
  font-size: 1.3rem;
  padding: 1rem 2.5rem;
  border-radius: 1rem;
  border: none;
  background: #8e44ad;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: background 0.2s;
}
.cart-btn:active {
  background: #5e3370;
}
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: purple;
  border-radius: 1.2rem;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  min-width: 300px;
  max-width: 95vw;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal h3 {
  margin-bottom: 1rem;
}
.modal ul {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
  width: 100%;
}
.modal li {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.delete-entry-btn {
  background: #ffdddd;
  color: #b80000;
  border: none;
  border-radius: 0.6rem;
  font-size: 1.1rem;
  margin-left: 1rem;
  padding: 0.2rem 0.7rem;
  cursor: pointer;
  transition: background 0.2s;
}
.delete-entry-btn:active {
  background: #b80000;
  color: #fff;
}
.complete-btn {
  background: #42b883;
  color: #fff;
  border: none;
  border-radius: 1rem;
  font-size: 1.2rem;
  padding: 0.7rem 2.2rem;
  margin-bottom: 0.7rem;
  cursor: pointer;
  transition: background 0.2s;
}
.complete-btn:active {
  background: #2c8f6b;
}
.close-btn {
  background: #eee;
  color: #333;
  border: none;
  border-radius: 1rem;
  font-size: 1.1rem;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
}
.close-btn:active {
  background: #bbb;
}
</style>