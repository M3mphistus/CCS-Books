<template>
  <div class="page">
    <h1>{{$t('app.history')}}</h1>
    <div class="history-table">
      <div class="history-header">
        <span>#</span>
        <span>{{$t('booksHistory.date') || 'Datum'}}</span>
        <span>{{$t('booksHistory.currencies') || 'Währungen'}}</span>
        <span>{{$t('booksHistory.amount') || 'Betrag'}}</span>
        <span>{{$t('booksHistory.amountDollar') || 'Betrag ($)'}} </span>
      </div>
      <div
        v-for="(order, idx) in orders"
        :key="idx"
        class="history-row"
        @click="openModal(idx)"
      >
        <span>{{ idx + 1 }}</span>
        <span>{{ formatDate(order.timestamp) }}</span>
        <span>{{ getCurrencies(order.items).join(', ') }}</span>
        <span>{{ formatBetrag(order.items) }}</span>
        <span>{{ formatBetragDollar(order.items) }}</span>
      </div>
      <div v-if="orders.length === 0" class="empty-info">
        {{$t('booksHistory.empty') || 'Keine Aufträge vorhanden.'}}
      </div>
    </div>

    <!-- Modal für Auftragsdetails -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <h3>{{$t('booksHistory.details')}} #{{ selectedOrderIdx + 1 }}</h3>
        <div class="modal-date">{{ formatDate(selectedOrder?.timestamp) }}</div>
        <div class="inventory-list">
          <div class="inventory-header">
            <span>{{$t('inventory.value')}}</span>
            <span>{{$t('inventory.amount')}}</span>
            <span>{{$t('inventory.sum')}}</span>
          </div>
          <div
            v-for="(item, idx) in selectedOrderSummary"
            :key="idx"
            class="inventory-item"
          >
            <span>
              {{$t('denomination.' + item.denomination)}} ({{$t('currency.' + item.currency)}}, {{ $t('moneyType.' + item.moneyType) }})
            </span>
            <span>{{ item.amount }}</span>
            <span>{{ formatBetragSingle(item) }}</span>
          </div>
          <div class="inventory-sum">
            <span>Gesamt:</span>
            <span>{{ sumAnzahl(selectedOrderSummary) }}</span>
            <span>
              {{ sumBetrag(selectedOrderSummary) }}
              <span v-if="sumBetragDollar(selectedOrderSummary) !== ''" style="color:#888; font-size:0.95em;">
                ({{ sumBetragDollar(selectedOrderSummary) }} $)
              </span>
            </span>
          </div>
        </div>
        <button class="close-btn" @click="closeModal">{{$t('modal.close')}}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import globalState from '../store.js'
let Filesystem
if (Capacitor.isNativePlatform()) {
  import('@capacitor/filesystem').then(mod => { Filesystem = mod.Filesystem })
}


const orders = ref([])
const showModal = ref(false)
const selectedOrderIdx = ref(-1)
const selectedOrder = computed(() => orders.value[selectedOrderIdx.value] || null)
const selectedOrderSummary = computed(() => selectedOrder.value ? summarizeOrder(selectedOrder.value.items) : [])

function getAuftraegeKey() {
  return `auftraege_slot${globalState.saveSlot}`
}

onMounted(loadOrders)

// Wenn sich der Slot ändert, neu laden
watch(() => globalState.saveSlot, loadOrders)

async function loadOrders() {
  if (Capacitor.isNativePlatform() && Filesystem) {
    try {
      const filename = `auftraege_slot${globalState.saveSlot}.json`
      const result = await Filesystem.readFile({ path: filename, directory: 'DATA' })
      orders.value = JSON.parse(result.data)
    } catch (e) {
      orders.value = []
    }
  } else {
    const data = localStorage.getItem(getAuftraegeKey())
    orders.value = data ? JSON.parse(data) : []
  }
}

// Hilfsfunktionen für die Übersicht
function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString()
}
function getCurrencies(items) {
  return [...new Set(items.map(i => i.currency))]
}
function formatBetrag(items) {
  let total = 0
  for (const item of items) {
    const value = parseDenomination(item.denomination, item.currency)
    if (!isNaN(value)) total += value * item.amount * (item.type === 'add' ? 1 : -1)
  }
  // Symbol, wenn nur eine Währung
  const currencies = getCurrencies(items)
  let symbol = ''
  if (currencies.length === 1) {
    if (currencies[0] === 'Dollar') symbol = '$'
    if (currencies[0] === 'Euro') symbol = '€'
    if (currencies[0] === 'Yen') symbol = '¥'
  }
  return `${total.toLocaleString()} ${symbol}`
}
function formatBetragDollar(items) {
  let totalDollar = 0
  for (const item of items) {
    const value = parseDenomination(item.denomination, item.currency)
    if (isNaN(value)) continue
    let factor = 1
    if (item.currency === 'Euro') factor = 1
    if (item.currency === 'Yen') factor = 1 / 100
    totalDollar += value * item.amount * factor * (item.type === 'add' ? 1 : -1)
  }
  return totalDollar > 0 ? totalDollar.toLocaleString(undefined, {maximumFractionDigits: 2}) : ''
}
function parseDenomination(denomination, currency) {
  let num = denomination.replace(/[^\d.,]/g, '').replace('.', '').replace(',', '.')
  return parseFloat(num)
}

// Modal-Logik
function openModal(idx) {
  selectedOrderIdx.value = idx
  showModal.value = true
}
function closeModal() {
  showModal.value = false
  selectedOrderIdx.value = -1
}

// Einzelposten im Modal zusammenfassen wie in inventory.vue
// Stellt sicher, dass "Eingefärbt" als moneyType korrekt behandelt wird
function summarizeOrder(items) {
  const summary = {}
  for (const item of items) {
    // moneyType kann auch "Eingefärbt" sein
    const key = `${item.moneyType}|${item.currency}|${item.denomination}`
    if (!summary[key]) {
      summary[key] = {
        moneyType: item.moneyType,
        currency: item.currency,
        denomination: item.denomination,
        amount: 0
      }
    }
    summary[key].amount += item.type === 'add' ? item.amount : -item.amount
  }
  // Nur Einträge mit amount ≠ 0 anzeigen
  return Object.values(summary).filter(i => i.amount !== 0)
}
function formatBetragSingle(item) {
  const value = parseDenomination(item.denomination, item.currency)
  if (isNaN(value)) return '-'
  let symbol = ''
  if (item.currency === 'Dollar') symbol = '$'
  if (item.currency === 'Euro') symbol = '€'
  if (item.currency === 'Yen') symbol = '¥'
  return `${(value * item.amount).toLocaleString()} ${symbol}`
}
function sumAnzahl(items) {
  return items.reduce((a, b) => a + b.amount, 0)
}
function sumBetrag(items) {
  let total = 0
  for (const item of items) {
    const value = parseDenomination(item.denomination, item.currency)
    if (!isNaN(value)) total += value * item.amount
  }
  // Symbol, wenn nur eine Währung
  const currencies = [...new Set(items.map(i => i.currency))]
  let symbol = ''
  if (currencies.length === 1) {
    if (currencies[0] === 'Dollar') symbol = '$'
    if (currencies[0] === 'Euro') symbol = '€'
    if (currencies[0] === 'Yen') symbol = '¥'
  }
  return `${total.toLocaleString()} ${symbol}`
}
function sumBetragDollar(items) {
  let totalDollar = 0
  for (const item of items) {
    const value = parseDenomination(item.denomination, item.currency)
    if (isNaN(value)) continue
    let factor = 1
    if (item.currency === 'Euro') factor = 1
    if (item.currency === 'Yen') factor = 1 / 100
    totalDollar += value * item.amount * factor
  }
  return totalDollar > 0 ? totalDollar.toLocaleString(undefined, {maximumFractionDigits: 2}) : ''
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
.history-table {
  width: 100%;
  max-width: 900px;
  margin-top: 1.5rem;
  background: none;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  padding: 1.2rem;
}
.history-header, .history-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.1rem;
  padding: 0.5rem 0;
}
.history-header {
  font-weight: bold;
  border-bottom: 2px solid #eee;
  margin-bottom: 0.5rem;
}
.history-row {
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.15s;
}
.history-row:hover {
  background: #e6f7f1;
}
.history-header span, .history-row span {
  flex: 1 1 0;
  text-align: center;
}
.history-header span:nth-child(1),
.history-row span:nth-child(1) {
  flex: 0.5 1 0;
}
.history-header span:nth-child(2),
.history-row span:nth-child(2) {
  flex: 1.5 1 0;
}
.history-header span:nth-child(3),
.history-row span:nth-child(3) {
  flex: 1.5 1 0;
}
.history-header span:nth-child(4),
.history-row span:nth-child(4),
.history-header span:nth-child(5),
.history-row span:nth-child(5) {
  flex: 1 1 0;
  text-align: right;
}
.empty-info {
  text-align: center;
  color: #aaa;
  margin-top: 1rem;
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
  min-width: 350px;
  max-width: 95vw;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal h3 {
  margin-bottom: 0.5rem;
}
.modal-date {
  color: #888;
  font-size: 1.05rem;
  margin-bottom: 1.2rem;
}
.inventory-list {
  width: 100%;
  max-width: 500px;
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
.inventory-sum span:nth-child(1) {
  text-align: left;
  flex: 2 1 0;
  display: inline-block;
}
.inventory-header span:nth-child(2),
.inventory-item span:nth-child(2),
.inventory-sum span:nth-child(2) {
  text-align: right;
  flex: 1 1 0;
  display: inline-block;
}
.inventory-header span:nth-child(3),
.inventory-item span:nth-child(3),
.inventory-sum span:nth-child(3) {
  text-align: right;
  flex: 1.5 1 0;
  display: inline-block;
}
.inventory-item {
  display: flex;
  justify-content: space-between;
  font-size: 1.1rem;
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
.close-btn {
  background: #eee;
  color: #333;
  border: none;
  border-radius: 1rem;
  font-size: 1.1rem;
  padding: 0.5rem 1.5rem;
  margin-top: 1.2rem;
  cursor: pointer;
  transition: background 0.2s;
}
.close-btn:active {
  background: #bbb;
}
</style>