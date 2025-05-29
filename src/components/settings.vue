<template>
  <div class="settings-page">
    <h1>{{$t('app.settings')}}</h1>
    <div class="settings-section">
      <label for="lang-select">{{$t('settings.language')}}:</label>
      <select id="lang-select" v-model="$i18n.locale">
        <option value="de">Deutsch</option>
        <option value="en">English</option>
      </select>
    </div>
    <div class="settings-section">
      <label for="slot-select">{{$t('settings.saveslot')}}:</label>
      <select id="slot-select" v-model="globalState.saveSlot">
        <option v-for="n in 3" :key="n" :value="n">{{$t('settings.slot')}} {{n}}</option>
      </select>
    </div>
    <div class="settings-section delete-section">
      <button class="delete-btn" @click="showDeleteConfirm = true">
        {{$t('settings.deleteSave')}}
      </button>
      <div v-if="showDeleteConfirm" class="delete-confirm">
        <div>{{$t('settings.deleteConfirm')}}</div>
        <input
          v-model="deleteInput"
          :placeholder="$t('settings.deletePlaceholder')"
        />
        <button
          class="delete-btn"
          :disabled="deleteInput !== deleteWord"
          @click="deleteSave"
        >{{$t('settings.deleteNow')}}</button>
        <button class="cancel-btn" @click="cancelDelete">{{$t('settings.cancel')}}</button>
      </div>
    </div>
    <div v-if="showMigrationInfo" class="migration-info">
      {{$t('settings.migrationInfo')}}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import globalState from '../store.js'

// Migration-Info aus dem Store oder localStorage holen
const showMigrationInfo = computed(() => {
  return localStorage.getItem('migrationInfoShown') === '1'
})

// Delete Save Logic
const showDeleteConfirm = ref(false)
const deleteInput = ref('')
const deleteWord = 'Löschen'

function cancelDelete() {
  showDeleteConfirm.value = false
  deleteInput.value = ''
}

function deleteSave() {
  const slot = globalState.saveSlot
  localStorage.removeItem(`inventar_slot${slot}`)
  localStorage.removeItem(`auftraege_slot${slot}`)
  showDeleteConfirm.value = false
  deleteInput.value = ''
  alert(`Save Slot ${slot} wurde gelöscht!`)
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 60vh;
  padding-top: 2rem;
}
.settings-section {
  margin-top: 2rem;
  font-size: 1.2rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}
.delete-section {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}
.delete-btn {
  background: #fff0f0;
  color: #b22222;
  border: 1px solid #b22222;
  border-radius: 0.5rem;
  padding: 0.4rem 1.2rem;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 0.5rem;
}
.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.cancel-btn {
  background: #eee;
  color: #333;
  border: 1px solid #aaa;
  border-radius: 0.5rem;
  padding: 0.4rem 1.2rem;
  font-size: 1.1rem;
  margin-left: 0.7rem;
  cursor: pointer;
}
.delete-confirm {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.migration-info {
  margin-top: 2.5rem;
  color: #b8860b;
  background: #fffbe6;
  border: 1px solid #ffd700;
  border-radius: 0.7rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  max-width: 500px;
  text-align: center;
}
select {
  font-size: 1.1rem;
  padding: 0.3rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #42b883;
}
</style>
