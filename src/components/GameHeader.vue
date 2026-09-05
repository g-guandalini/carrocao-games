<template>
  <header class="game-active-header">
    <div class="game-header-brand">
      <img src="/logo_sitio_horizontal.png" alt="Carroção Games Logo" class="game-header-logo-mini-img"> 
    </div>
    <!-- Você pode adicionar outros elementos de menu ou ações durante o jogo aqui -->
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'GameHeader',
});
</script>

<style scoped>
.game-active-header {
  width: 100%;
  height: 60px;
  flex: 0 0 60px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  z-index: 1000;
  justify-content:center
}

.game-header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* NOVO ESTILO PARA O LOGO MINI */
.game-header-logo-mini-img {
  height: 60px;
  width: auto; /* Mantém a proporção */
  display: block;
}

.game-header-logo-mini { /* Esta classe parece não estar sendo usada na tag img */
  font-size: 1.8em;
  color: #3498db;
}

.game-header-title-mini {
  font-size: 1.4em;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}
</style>
