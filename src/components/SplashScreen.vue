<template>
    <div class="splash-screen-wrapper">
      <div class="splash-header-content">
        <h1 class="splash-main-title">Carroção Games</h1>
        <div class="splash-logo-area">
          <span class="splash-logo-placeholder">🎮</span>
          <!-- Se você tiver uma imagem de logo, substitua o span: -->
          <!-- <img src="/caminho/para/seu/logo.png" alt="Carroção Games Logo" class="splash-logo-img"> -->
        </div>
      </div>
  
      <p class="instruction-text">Selecione um modo de jogo para começar!</p>
      <div class="menu-options">
        <button class="menu-button primary" @click="$emit('start-game')">
          Imagem Oculta
        </button>
        <button class="menu-button" @click="$emit('select-connection')">
          Conexão
        </button>
        <button class="menu-button" @click="$emit('select-bug')">
          Bug
        </button>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'SplashScreen',
    emits: ['start-game', 'select-connection', 'select-bug'],
  });
  </script>
  
  <style scoped>
  .splash-screen-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    width: 100%;
    max-width: 800px;
    margin-top: 50px;
  }
  
  .splash-header-content {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .splash-main-title {
    color: #2c3e50;
    margin-bottom: 15px;
    font-size: 3.5em;
    font-weight: 700;
    letter-spacing: 1px;
  }
  
  .splash-logo-area {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 350px;
    height: 350px;
    background-color: #ffffff;
    border-radius: 12px;
    margin: 0 auto;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border: 4px solid #3498db;
  }
  
  .splash-logo-placeholder {
    font-size: 10em;
    color: #3498db;
  }
  
  /* --- Estilos do Menu Principal --- */
  .instruction-text {
    margin-bottom: 25px;
    font-size: 1.1em;
    text-align: center;
    color: #555;
    max-width: 600px;
  }
  
  .menu-options {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 300px;
  }
  
  .menu-button {
    background-color: #3498db;
    color: white;
    padding: 15px 30px;
    border: none;
    border-radius: 8px;
    font-size: 1.3em;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
  }
  
  .menu-button.primary {
    background-color: #2ecc71;
  }
  
  .menu-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
  }
  
  .menu-button.primary:hover {
    background-color: #27ae60;
  }
  </style>