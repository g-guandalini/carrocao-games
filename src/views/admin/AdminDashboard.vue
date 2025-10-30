<template>
    <div class="admin-dashboard">
      <h1>Bem-vindo à Área Administrativa</h1>
      <p>Use o menu lateral para navegar.</p>
      <router-view /> <!-- Renderiza as sub-rotas aqui -->
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'AdminDashboard',
  });
  </script>
  
  <style scoped>
  .admin-dashboard {
    padding: 20px;
    text-align: center;
  }
  </style>