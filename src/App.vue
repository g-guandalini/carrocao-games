<template>
  <div id="app">
    <!-- Renderiza o layout administrativo se a rota atual começar com '/admin' -->
    <template v-if="currentRoutePathStartsWithAdmin">
      <AdminLayout>
        <router-view />
      </AdminLayout>
    </template>
    <!-- Caso contrário, renderiza o conteúdo principal (jogo) diretamente na router-view -->
    <template v-else>
      <!-- NOVO WRAPPER AQUI para centralizar o conteúdo não-admin -->
      <div class="main-content-wrapper">
        <router-view />
      </div>
    </template>
    
    <!-- Seu componente de Toast Notification -->
    <ToastNotification />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

import ToastNotification from './components/ToastNotification.vue';
import AdminLayout from './layouts/AdminLayout.vue';

export default defineComponent({
  name: 'App',
  components: {
    ToastNotification,
    AdminLayout,
  },
  setup() {
    const route = useRoute();

    // **Para depuração:** Observe o objeto route para ver o que ele contém
    watchEffect(() => {
      console.log('DEBUG: Objeto de rota atual:', route);
      if (route && !route.path) {
        console.warn('DEBUG: Objeto de rota existe, mas .path está indefinido/falso:', route);
      }
    });

    const currentRoutePathStartsWithAdmin = computed(() => {
      return (route.path || '').startsWith('/admin');
    });

    return {
      currentRoutePathStartsWithAdmin,
    };
  },
});
</script>

<style>
/* Estilos globais */
body {
  margin: 0;
  font-family: 'Poppins', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f0f2f5;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* REMOVA align-items: center; daqui */
}

/* NOVO ESTILO PARA O WRAPPER */
.main-content-wrapper {
  flex-grow: 1; /* Permite que este wrapper ocupe o espaço vertical disponível */
  display: flex;
  justify-content: center; /* Centraliza horizontalmente o conteúdo (por exemplo, o SplashScreen) */
  width: 100%; /* Garante que o wrapper ocupe a largura total do #app */
}
</style>