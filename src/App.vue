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
      // console.log('DEBUG: Objeto de rota atual:', route); // Desativei para não poluir muito o console
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
/* Estilos globais para reset e controle de overflow */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  height: 100vh; /* Ocupa 100% da altura da viewport */
  width: 100vw;  /* Ocupa 100% da largura da viewport */
  margin: 0;
  padding: 0;
  overflow: hidden !important; /* FORÇA a ocultar qualquer rolagem */
}

body {
  font-family: 'Poppins', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f0f2f5;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100%; /* Ocupa 100% da altura do body (que é 100vh) */
  width: 100%; /* Ocupa 100% da largura do body (que é 100vw) */
  overflow: hidden; /* Garante que o app em si não tenha rolagem */
}

/* NOVO ESTILO PARA O WRAPPER */
.main-content-wrapper {
  flex-grow: 1; /* Permite que este wrapper ocupe o espaço vertical disponível */
  display: flex;
  /* Não centralize o conteúdo horizontalmente aqui, deixe o router-view (e seus componentes)
     decidirem sua própria centralização, como ImagemOcultaView com o .main-content-area */
  /* justify-content: center; */ 
  width: 100%; /* Garante que o wrapper ocupe a largura total do #app */
  overflow: hidden; /* Importante para cortar conteúdo excedente se router-view transbordar */
}
</style>