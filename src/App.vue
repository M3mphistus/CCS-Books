<script setup>
  import { useRoute, useRouter } from 'vue-router'

  const route = useRoute()
  const router = useRouter()

  function goBack() {
    router.back()
  }

  function goHome() {
    router.push('/')
  }
</script>

<template>
  <header class="app-header">
    <button v-if="route.path !== '/'" class="back-btn" @click="goBack">←</button>
    <div class="header-spacer"></div>
    <img src="/ccs.png" alt="CCS Logo" class="logo" @click="goHome" style="cursor:pointer"/>
  </header>
  <div class="app-content">
    <router-view />
  </div>
</template>

<style scoped>
:global(html, body, #app) {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-header {
  display: flex;
  flex-direction: row;
  width: 95%;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 1rem;
  background: purple;
  border-bottom: 1px solid #eee;
  position: fixed;
  left: 1.5%;
  top: 0;
  z-index: 10;
}
.app-content {
  min-height: calc(100vh - 56px); /* 56px ist die Header-Höhe */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.back-btn {
  font-size: 2rem;
  background: none;
  border: none;
  color: #42b883;
  cursor: pointer;
  padding: 0 1rem 0 0;
}
.header-spacer {
  flex: 1;
}
.logo {
  height: 40px;
  margin-left: auto;
}
</style>