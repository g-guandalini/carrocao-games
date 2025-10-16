<template>
    <header class="game-active-header">
      <div class="game-header-brand">
        <span class="game-header-logo-mini">🎮</span>
        <!-- Se você tiver uma imagem de logo, substitua o span: -->
        <!-- <img src="/caminho/para/seu/logo-mini.png" alt="Carroção Games Logo" class="game-header-logo-mini-img"> -->
        <span class="game-header-title-mini">Carroção Games</span>
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
    background-color: #ffffff;
    padding: 15px 25px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    position: sticky;
    top: 0;
    z-index: 1000;
    margin-bottom: 25px;
  }
  
  .game-header-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .game-header-logo-mini {
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