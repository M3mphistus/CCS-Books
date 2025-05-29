<template>
  <div class="page">
    <h1>{{$t('app.title')}}</h1>
    <div class="button-group">
      <router-link to="/books/new">
        <button class="big-btn">{{$t('app.newOrder')}}</button>
      </router-link>
      <router-link to="/books/history">
        <button class="big-btn">{{$t('app.history')}}</button>
      </router-link>
    </div>
  </div>
</template>

<script setup>
// Add logic here if needed
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
.button-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
  width: 100%;
  align-items: center;
}
.big-btn {
  font-size: 1.5rem;
  padding: 1.2rem 3rem;
  border-radius: 1rem;
  border: none;
  background: #42b883;
  color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: background 0.2s;
  width: 90%;
  max-width: 350px;
}
.big-btn:active {
  background: #2c8f6b;
}
</style>
