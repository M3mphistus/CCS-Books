<template>
  <div class="page">
    <h1>{{$t('inventory.title')}}</h1>
    <!-- Filter Buttons -->
    <div class="filter-row">
      <div class="moneytype-buttons">
        <button
          :class="['moneytype-btn', { active: selectedMoneyType === 'Alles' }]"
          @click="selectedMoneyType = 'Alles'"
        >{{ $t('app.all') }}</button>
        <button
          v-for="type in moneyTypes"
          :key="type"
          :class="['moneytype-btn', { active: selectedMoneyType === type }]"
          @click="selectedMoneyType = type"
        >{{ $t('moneyType.' + type) }}</button>
        <button
          :class="['moneytype-btn', { active: selectedEingefaerbt }]"
          @click="selectedEingefaerbt = !selectedEingefaerbt"
          style="margin-left:1.2em;"
          type="button"
        >
          <span style="margin-right:0.5em;">
            <input type="checkbox" v-model="selectedEingefaerbt" style="accent-color:#42b883;pointer-events:none;" />
          </span>
          {{ $t('moneyType.Eingefärbt') }}
        </button>
      </div>
      <div v-if="selectedMoneyType === 'Markiert'" class="markedtype-row">
        <button
          :class="['markedtype-btn', { active: selectedMarkedType === 'Alles' }]"
          @click="selectedMarkedType = 'Alles'"
        >{{$t('app.all')}}</button>
        <button
          v-for="mt in markedTypes"
          :key="mt"
          :class="['markedtype-btn', { active: selectedMarkedType === mt }]"
          @click="selectedMarkedType = mt"
        >{{ markedTypeDisplay(mt) }}</button>
      </div>
      <div class="currency-buttons">
        <button
          :class="['currency-btn', { active: selectedCurrency === 'Alles' }]"
          @click="selectedCurrency = 'Alles'"
        >{{$t('app.all')}}</button>
        <button
          v-for="currency in currencies"
          :key="currency"
          :class="['currency-btn', { active: selectedCurrency === currency }]"
          @click="selectedCurrency = currency"
        >{{ $t('currency.' + currency) }}</button>
      </div>
    </div>
    <!-- Inventory List -->
    <div class="inventory-list">
      <div class="inventory-header">
        <span>{{$t('inventory.value')}}</span>
        <span>{{$t('inventory.amount')}}</span>
        <span>{{$t('inventory.sum')}}</span>
      </div>
      <div
        v-for="(item, key) in filteredInventory"
        :key="key"
        class="inventory-item"
      >
        <span>
          {{$t('denomination.' + item.denomination)}}
          <span v-if="selectedMoneyType === 'Alles'">({{ item.type }})</span>
          <!-- Markiert: markedType immer anzeigen -->
          <span v-if="item.type.startsWith('Markiert') && item.markedType" style="margin-left:0.5em; color:#ffd700; font-weight:bold;">
            {{ markedTypeDisplay(item.markedType) }}
          </span>
          <!-- Eingefärbt: nur anzeigen, wenn Checkbox aktiv -->
          <span v-if="selectedEingefaerbt && item.hasEingefaerbt" style="margin-left:0.5em; color:#42b883; font-weight:bold;">
            + {{$t('moneyType.Eingefärbt')}}
          </span>
        </span>
        <span>
          {{ item.amount }}
        </span>
        <span>
          {{ formatBetrag(item.denomination, item.amount, item.currency) }}
        </span>
      </div>
      <div v-if="filteredInventory.length === 0" class="empty-info">
        {{$t('inventory.empty')}}
      </div>
      <div v-if="filteredInventory.length > 0" class="inventory-sum">
        <span>{{$t('inventory.total')}}</span>
        <span>{{ sumAnzahl }}</span>
        <span>
          {{ sumBetrag }}
          <span v-if="sumBetragDollar !== ''" style="color:#888; font-size:0.95em;">
            ({{ sumBetragDollar }} $)
          </span>
        </span>
      </div>
      <!-- Zusätzliche Auflistung bei "Alles"-Filter -->
      <div v-if="selectedMoneyType === 'Alles' || selectedCurrency === 'Alles'" class="inventory-breakdown">
        <div v-if="selectedMoneyType === 'Alles' && selectedCurrency !== 'Alles'">
          <div
            v-for="type in moneyTypes"
            :key="type"
            class="breakdown-row"
          >
            <span>{{ type }}</span>
            <span>
              {{
                sumByTypeAndCurrency(type, selectedCurrency)
              }}
            </span>
            <span>
              {{
                sumBetragByTypeAndCurrency(type, selectedCurrency)
              }}
            </span>
          </div>
        </div>
        <div v-else-if="selectedCurrency === 'Alles' && selectedMoneyType !== 'Alles'">
          <div
            v-for="currency in currencies"
            :key="currency"
            class="breakdown-row"
          >
            <span>{{ currency }}</span>
            <span>
              {{
                sumByTypeAndCurrency(selectedMoneyType, currency)
              }}
            </span>
            <span>
              {{
                sumBetragByTypeAndCurrency(selectedMoneyType, currency)
              }}
            </span>
          </div>
        </div>
        <div v-else-if="selectedMoneyType === 'Alles' && selectedCurrency === 'Alles'">
          <div
            v-for="type in moneyTypes"
            :key="type"
            class="breakdown-type"
          >
            <strong>{{ type }}</strong>
            <div
              v-for="currency in currencies"
              :key="currency"
              class="breakdown-row"
            >
              <span>{{ currency }}</span>
              <span>
                {{ sumByTypeAndCurrency(type, currency) }}
              </span>
              <span>
                {{ sumBetragByTypeAndCurrency(type, currency) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import globalState from '../store.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// Filter-States
const moneyTypes = ['Echt', 'Markiert', 'Falsch']
const markedTypes = ['unsorted', 'gang_diamond', 'gang_plus', 'gang_striped', 'police_x', 'fdi_eye', 'blood']
const currencies = ['Dollar', 'Euro', 'Yen']

const selectedMoneyType = ref('Echt')
const selectedEingefaerbt = ref(false)
const selectedMarkedType = ref('Alles')
const selectedCurrency = ref('Alles')

// Automatisch Checkbox aktivieren, wenn "Alles" gewählt wird
watch(selectedMoneyType, (val) => {
  if (val === 'Alles') {
    selectedEingefaerbt.value = true
  }
})

const inventory = ref({})

function getInventarKey() {
  return `inventar_slot${globalState.saveSlot}`
}

let Filesystem
if (Capacitor.isNativePlatform()) {
  import('@capacitor/filesystem').then(mod => { Filesystem = mod.Filesystem })
}

onMounted(loadInventory)
watch(() => globalState.saveSlot, loadInventory)


async function loadInventory() {
  // Electron Desktop: nutze window.ccsAPI
  if (typeof window !== 'undefined' && window.ccsAPI && window.ccsAPI.readInventory) {
    try {
      const filename = `inventar_slot${globalState.saveSlot}.json`;
      const data = await window.ccsAPI.readInventory(filename);
      inventory.value = data ? JSON.parse(data) : {};
    } catch (e) {
      inventory.value = {};
    }
    return;
  }
  // Mobile (Capacitor)
  if (Capacitor.isNativePlatform() && Filesystem) {
    try {
      const filename = `inventar_slot${globalState.saveSlot}.json`;
      const result = await Filesystem.readFile({ path: filename, directory: 'DATA' });
      inventory.value = JSON.parse(result.data);
    } catch (e) {
      inventory.value = {};
    }
    return;
  }
  // Web: localStorage
  const inv = localStorage.getItem(getInventarKey());
  inventory.value = inv ? JSON.parse(inv) : {};
}

// Speichern des Inventars (für Electron und Web)
async function saveInventory() {
  const data = JSON.stringify(inventory.value);
  // Electron Desktop
  if (typeof window !== 'undefined' && window.ccsAPI && window.ccsAPI.writeInventory) {
    try {
      const filename = `inventar_slot${globalState.saveSlot}.json`;
      await window.ccsAPI.writeInventory(filename, data);
    } catch (e) {}
    return;
  }
  // Mobile (Capacitor)
  if (Capacitor.isNativePlatform() && Filesystem) {
    try {
      const filename = `inventar_slot${globalState.saveSlot}.json`;
      await Filesystem.writeFile({ path: filename, data, directory: 'DATA' });
    } catch (e) {}
    return;
  }
  // Web: localStorage
  localStorage.setItem(getInventarKey(), data);
}

// Filtered Inventory
const filteredInventory = computed(() => {
  const result = []
  for (const key in inventory.value) {
    let [typeFull, currency, denomination] = key.split('|')
    let type = typeFull
    let markedType = undefined
    let hasEingefaerbt = false

    // Markiert-Parsing
    if (typeFull.startsWith('Markiert')) {
      const match = typeFull.match(/^Markiert\(([^)]+)\)(\+Eingefärbt)?$/)
      if (match) {
        type = 'Markiert'
        markedType = match[1]
        hasEingefaerbt = !!match[2]
      }
    } else if (typeFull === 'Eingefärbt') {
      type = 'Eingefärbt'
      hasEingefaerbt = true
    } else if (typeFull.endsWith('+Eingefärbt')) {
      type = typeFull.replace('+Eingefärbt', '')
      hasEingefaerbt = true
    }

    // Filterlogik
    let show = true

    // Argument 1: moneyType
    if (selectedMoneyType.value !== 'Alles' && selectedMoneyType.value !== type) show = false

    // Argument 2: markedType (nur wenn Markiert)
    if (show && selectedMoneyType.value === 'Markiert') {
      if (selectedMarkedType.value !== 'Alles' && markedType !== selectedMarkedType.value) show = false
    }

    // Argument 3: currency
    if (show && selectedCurrency.value !== 'Alles' && currency !== selectedCurrency.value) show = false

    // Eingefärbt-Filter: Wenn Checkbox aus UND Wert ist Eingefärbt, dann ausblenden
    if (!selectedEingefaerbt.value && hasEingefaerbt) show = false

    if (show) {
      result.push({
        type: typeFull,
        currency,
        denomination,
        amount: inventory.value[key],
        markedType,
        hasEingefaerbt
      })
    }
  }
  // Sortierung
  return result.sort((a, b) => {
    if (a.currency !== b.currency) return a.currency.localeCompare(b.currency)
    const numA = parseDenomination(a.denomination, a.currency)
    const numB = parseDenomination(b.denomination, b.currency)
    return numA - numB
  })
})

function markedTypeDisplay(mt) {
  return t('markedType.' + mt)
}
function parseDenomination(denomination, currency) {
  let num = denomination.replace(/[^\d.,]/g, '').replace('.', '').replace(',', '.')
  return parseFloat(num)
}
function formatBetrag(denomination, amount, currency) {
  const value = parseDenomination(denomination, currency)
  if (isNaN(value)) return '-'
  const sum = value * amount
  let symbol = ''
  if (currency === 'Dollar') symbol = '$'
  if (currency === 'Euro') symbol = '€'
  if (currency === 'Yen') symbol = '¥'
  return `${sum.toLocaleString()} ${symbol}`
}

const sumAnzahl = computed(() =>
  filteredInventory.value.reduce((a, b) => a + b.amount, 0)
)
const sumBetrag = computed(() => {
  let total = 0
  for (const item of filteredInventory.value) {
    const value = parseDenomination(item.denomination, item.currency)
    if (!isNaN(value)) total += value * item.amount
  }
  let symbol = ''
  if (selectedCurrency.value !== 'Alles') {
    if (selectedCurrency.value === 'Dollar') symbol = '$'
    if (selectedCurrency.value === 'Euro') symbol = '€'
    if (selectedCurrency.value === 'Yen') symbol = '¥'
  }
  return `${total.toLocaleString()} ${symbol}`
})

// Neue Computed Property für Dollar-Umrechnung
const sumBetragDollar = computed(() => {
  let totalDollar = 0
  for (const item of filteredInventory.value) {
    const value = parseDenomination(item.denomination, item.currency)
    if (isNaN(value)) continue
    let factor = 1
    if (item.currency === 'Euro') factor = 1
    if (item.currency === 'Yen') factor = 1 / 100
    // Dollar bleibt 1
    totalDollar += value * item.amount * factor
  }
  return totalDollar > 0 ? totalDollar.toLocaleString(undefined, {maximumFractionDigits: 2}) : ''
})

// Breakdown-Methoden
function sumByTypeAndCurrency(type, currency) {
  let sum = 0
  for (const key in inventory.value) {
    let [typeFull, c, denomination] = key.split('|')
    let t = typeFull
    let markedType = undefined
    if (typeFull.startsWith('Markiert')) {
      const match = typeFull.match(/^Markiert\(([^)]+)\)(\+Eingefärbt)?$/)
      if (match) {
        t = 'Markiert'
        markedType = match[1]
        if (match[2]) {
          t += '+Eingefärbt'
        }
      }
    }
    let typeMatch = (type === 'Alles' || t === type)
    // For Markiert, filter by markedType if selected
    if (type === 'Markiert' && selectedMarkedType.value !== 'Alles') {
      typeMatch = t === 'Markiert' && markedType === selectedMarkedType.value
    }
    if (typeMatch && (currency === 'Alles' || c === currency)) {
      sum += inventory.value[key]
    }
  }
  return sum
}

function sumBetragByTypeAndCurrency(type, currency) {
  let total = 0
  for (const key in inventory.value) {
    let [typeFull, c, denomination] = key.split('|')
    let t = typeFull
    let markedType = undefined
    if (typeFull.startsWith('Markiert')) {
      const match = typeFull.match(/^Markiert\(([^)]+)\)(\+Eingefärbt)?$/)
      if (match) {
        t = 'Markiert'
        markedType = match[1]
        if (match[2]) {
          t += '+Eingefärbt'
        }
      }
    }
    let typeMatch = (type === 'Alles' || t === type)
    // For Markiert, filter by markedType if selected
    if (type === 'Markiert' && selectedMarkedType.value !== 'Alles') {
      typeMatch = t === 'Markiert' && markedType === selectedMarkedType.value
    }
    if (typeMatch && (currency === 'Alles' || c === currency)) {
      const value = parseDenomination(denomination, c)
      if (!isNaN(value)) total += value * inventory.value[key]
    }
  }
  let symbol = ''
  if (currency === 'Dollar') symbol = '$'
  if (currency === 'Euro') symbol = '€'
  if (currency === 'Yen') symbol = '¥'
  return `${total.toLocaleString()} ${symbol}`
}

function typeArrayToDisplay(arr) {
  return arr.join(' + ')
}

function isBaseType(type) {
  return ['Echt', 'Markiert', 'Falsch'].includes(type)
}

function toggleMoneyType(type) {
  if (type === 'Eingefärbt') {
    if (selectedMoneyType.value.includes('Eingefärbt')) {
      selectedMoneyType.value = selectedMoneyType.value.filter(t => t !== 'Eingefärbt')
    } else {
      selectedMoneyType.value.push('Eingefärbt')
    }
    return
  }
  if (selectedMoneyType.value.includes(type)) {
    selectedMoneyType.value = selectedMoneyType.value.filter(t => t !== type)
    if (selectedMoneyType.value.length === 0) {
      selectedMoneyType.value = []
    }
  } else {
    const hasEingefaerbt = selectedMoneyType.value.includes('Eingefärbt')
    selectedMoneyType.value = hasEingefaerbt ? [type, 'Eingefärbt'] : [type]
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 60vh;
  padding-top: 2rem;
}
h1 {
  margin-bottom: 1.5rem;
}
.filter-row {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 2rem;
  width: 100%;
  align-items: center;
}
.moneytype-buttons,
.currency-buttons {
  display: flex;
  flex-direction: row;
  gap: 1.2rem;
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
.currency-btn {
  font-size: 1.1rem;
  padding: 0.7rem 2rem;
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
.inventory-list {
  width: 100%;
  max-width: 400px;
  margin-top: 1.5rem;
  background: none;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  padding: 1.2rem;
}
.inventory-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 1.1rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}
.inventory-header span:nth-child(1),
.inventory-item span:nth-child(1),
.inventory-sum span:nth-child(1),
.breakdown-row span:nth-child(1) {
  text-align: left;
  flex: 2 1 0;
  display: inline-block;
}
.inventory-header span:nth-child(2),
.inventory-item span:nth-child(2),
.inventory-sum span:nth-child(2),
.breakdown-row span:nth-child(2) {
  text-align: right;
  flex: 1 1 0;
  display: inline-block;
}
.inventory-header span:nth-child(3),
.inventory-item span:nth-child(3),
.inventory-sum span:nth-child(3),
.breakdown-row span:nth-child(3) {
  text-align: right;
  flex: 1.5 1 0;
  display: inline-block;
}

.inventory-item {
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}
.inventory-item:last-child {
  border-bottom: none;
}
.inventory-sum {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 1.15rem;
  margin-top: 1.2rem;
  border-top: 2px solid #eee;
  padding-top: 0.7rem;
}
.empty-info {
  text-align: center;
  color: #aaa;
  margin-top: 1rem;
}
.inventory-breakdown {
  margin-top: 1.5rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}
.breakdown-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.05rem;
  padding: 0.3rem 0;
}
.breakdown-type {
  margin-bottom: 1.2rem;
}
.breakdown-type strong {
  display: block;
  margin-bottom: 0.3rem;
}
</style>
