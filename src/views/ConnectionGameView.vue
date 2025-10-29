<!-- views/ConnectionGameView.vue -->
<template>
    <div class="connection-game-view">
      <h1>Em Desenvolvimento</h1>
      <button @click="goHome">Voltar ao Menu Principal</button>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { resetGameScores } from '../store/imagemOcultaStore'; // Para resetar o gameStore ao sair
  
  export default defineComponent({
    name: 'ConnectionGameView',
    emits: ['go-to-main-menu'], // Emitirá este evento para o GameView
    setup(_props, { emit }) {
      const goHome = () => {
        resetGameScores(); // Reseta o estado do jogo Imagem Oculta se algo estiver ativo
        emit('go-to-main-menu'); // Notifica GameView para voltar à SplashScreen
      };
  
      return {
        goHome,
      };
    },
  });
  </script>
  
  <style scoped>
  .connection-game-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 80vh; /* Apenas para centralizar na tela */
    font-family: 'Poppins', sans-serif;
    color: #333;
  }
  .connection-game-view h1 {
    font-size: 2.5em;
    color: #3498db;
  }
  .connection-game-view p {
    font-size: 1.2em;
    margin-top: 15px;
  }
  .connection-game-view button {
    margin-top: 30px;
    padding: 10px 20px;
    font-size: 1em;
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  .connection-game-view button:hover {
    background-color: #27ae60;
  }
  </style>