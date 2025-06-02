<script setup>
// Migration von alten Daten (ohne Slot) nach Slot 1
import { onMounted } from 'vue'
import globalState from '../store.js'

onMounted(() => {
  // Nur im Browser/LocalStorage-Modus
  try {
    let migrated = false
    // Inventar migrieren
    const oldInv = localStorage.getItem('inventar')
    if (oldInv && !localStorage.getItem('inventar_slot1')) {
      localStorage.setItem('inventar_slot1', oldInv)
      localStorage.removeItem('inventar')
      migrated = true
    }
    // Aufträge migrieren
    const oldOrders = localStorage.getItem('auftraege')
    if (oldOrders && !localStorage.getItem('auftraege_slot1')) {
      localStorage.setItem('auftraege_slot1', oldOrders)
      localStorage.removeItem('auftraege')
      migrated = true
    }
    // Info-Flag setzen, falls migriert
    if (migrated) {
      localStorage.setItem('migrationInfoShown', '1')
      // Optional: Slot auf 1 setzen, falls noch nicht gesetzt
      if (globalState.saveSlot !== 1) globalState.saveSlot = 1
    }
  } catch (e) {}

  // Migration beim Start ausführen (entfernt)
})
</script>

<template>
  <div class="main-buttons">
    <router-link to="/books"><button class="big-btn">{{$t('app.title')}}</button></router-link>
    <router-link to="/inventory"><button class="big-btn">{{$t('inventory.title')}}</button></router-link>
    <router-link to="/settings"><button class="big-btn">{{$t('app.settings')}}</button></router-link>
  </div>
  <!-- Ko-Fi Unterstützung Button -->
  <div class="kofi-support">
    <a href="https://ko-fi.com/m3mphistus" target="_blank" rel="noopener">
      <img src="../assets/kofi.jpg" alt="Unterstütze mich auf Ko-Fi" class="kofi-btn" />
    </a>
  </div>
</template>

<style scoped>
.main-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 2rem;
}
.big-btn {
  font-size: 2rem;
  padding: 2rem 4rem;
  border-radius: 1.5rem;
  border: none;
  background: #42b883;
  color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: background 0.2s;
}
.big-btn:active {
  background: #2c8f6b;
}
.kofi-support {
  margin-top: 1.5rem;
  text-align: center;
}
.kofi-btn {
  width: 120px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s;
  cursor: pointer;
}
.kofi-btn:hover {
  transform: scale(1.07);
}
.cart-info {
  margin-top: 2rem;
}
.cart-button {
  font-size: 1.5rem;
  padding: 1rem 2rem;
  border-radius: 1rem;
  border: none;
  background: #35495e;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}
.cart-button:hover {
  background: #42b883;
}
</style>
