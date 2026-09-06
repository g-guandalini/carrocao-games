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
import { defineComponent, computed, watchEffect, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

import ToastNotification from './components/ToastNotification.vue';
import AdminLayout from './layouts/AdminLayout.vue';
import { loadShortcuts } from './store/shortcutStore';

export default defineComponent({
  name: 'App',
  components: {
    ToastNotification,
    AdminLayout,
  },
  setup() {
    const route = useRoute();
    loadShortcuts().catch(error => console.warn('[Atalhos] Não foi possível carregar configurações:', error));
    let hidSequence = 0;
    let hidTimer: ReturnType<typeof setInterval> | null = null;
    let hidMappingTimer: ReturnType<typeof setInterval> | null = null;
    let gamepadTimer: ReturnType<typeof setInterval> | null = null;
    let hidMappings: { inputCode: string; outputKey: string; deviceIdentifier?: string | null; deviceName?: string | null }[] = [];
    const previousGamepadButtons = new Map<string, boolean[]>();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

    const loadHidMappings = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/hid/config`);
        if (response.ok) hidMappings = await response.json();
      } catch {
        // O backend pode estar reiniciando; mantém a última configuração válida.
      }
    };

    const findGamepadMapping = (gamepad: Gamepad, inputCode: string) => {
      const candidates = hidMappings.filter(mapping => mapping.inputCode === inputCode);
      const exact = candidates.find(mapping => mapping.deviceIdentifier === gamepad.id);
      if (exact) return exact;
      const normalizedName = gamepad.id.toLocaleLowerCase();
      const named = candidates.find(mapping => {
        const deviceName = mapping.deviceName?.toLocaleLowerCase();
        return deviceName && (normalizedName.includes(deviceName) || deviceName.includes(normalizedName));
      });
      if (named) return named;
      const generic = candidates.find(mapping => !mapping.deviceIdentifier && !mapping.deviceName);
      return generic || (candidates.length === 1 ? candidates[0] : undefined);
    };

    const dispatchHidKey = (key: string) => {
      const eventTarget = document.activeElement || document.body;
      eventTarget.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    };

    const pollGamepads = () => {
      if (!navigator.getGamepads) return;
      const gamepads = Array.from(navigator.getGamepads()).filter(Boolean) as Gamepad[];
      const connectedKeys = new Set<string>();
      for (const gamepad of gamepads) {
        const gamepadKey = `${gamepad.index}:${gamepad.id}`;
        connectedKeys.add(gamepadKey);
        const previous = previousGamepadButtons.get(gamepadKey) || [];
        gamepad.buttons.forEach((button, index) => {
          if (!button.pressed || previous[index]) return;
          const mapping = findGamepadMapping(gamepad, `button:${index}`);
          if (mapping) dispatchHidKey(mapping.outputKey);
        });
        previousGamepadButtons.set(gamepadKey, gamepad.buttons.map(button => button.pressed));
      }
      for (const key of previousGamepadButtons.keys()) {
        if (!connectedKeys.has(key)) previousGamepadButtons.delete(key);
      }
    };

    const pollHidEvents = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/hid/events?after=${hidSequence}`);
        if (!response.ok) return;
        const events = await response.json() as { sequence: number; key: string }[];
        for (const hidEvent of events) {
          hidSequence = Math.max(hidSequence, hidEvent.sequence);
          // Dispara no elemento focado para atender tanto listeners em
          // `document`/`window` quanto as fases do BUG que usam @keydown no
          // próprio container focado.
          dispatchHidKey(hidEvent.key);
        }
      } catch {
        // O backend pode estar reiniciando; a próxima consulta tenta novamente.
      }
    };
    onMounted(() => {
      loadHidMappings();
      hidMappingTimer = setInterval(loadHidMappings, 2000);
      hidTimer = setInterval(pollHidEvents, 50);
      gamepadTimer = setInterval(pollGamepads, 50);
    });
    onUnmounted(() => {
      if (hidTimer) clearInterval(hidTimer);
      if (hidMappingTimer) clearInterval(hidMappingTimer);
      if (gamepadTimer) clearInterval(gamepadTimer);
    });

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
  height: 100%;
  width: 100%;
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
  height: 100dvh;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden; /* Garante que o app em si não tenha rolagem */
}

/* NOVO ESTILO PARA O WRAPPER */
.main-content-wrapper {
  flex: 1 1 auto;
  display: flex;
  /* Não centralize o conteúdo horizontalmente aqui, deixe o router-view (e seus componentes)
     decidirem sua própria centralização, como ImagemOcultaView com o .main-content-area */
  /* justify-content: center; */ 
  width: 100%; /* Garante que o wrapper ocupe a largura total do #app */
  min-width: 0;
  min-height: 0;
  overflow: hidden; /* Importante para cortar conteúdo excedente se router-view transbordar */
}
</style>
