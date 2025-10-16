<template>
    <div class="game-actions">
      <button
        v-if="gameStatus === 'finished'"
        @click="$emit('next-round')"
        class="action-button primary"
      >
        Próxima Rodada ➡️
      </button>
      <button
        v-if="gameStatus === 'finished'"
        @click="$emit('reset-game')"
        class="action-button secondary"
      >
        Reiniciar Jogo (Zerar Placar) ↩️
      </button>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, PropType } from 'vue';
  import { GameStatus } from '../types'; // Importe o tipo GameStatus
  
  export default defineComponent({
    name: 'GameActionButtons',
    props: {
      gameStatus: {
        type: String as PropType<GameStatus>,
        required: true,
      },
    },
    emits: ['next-round', 'reset-game'],
  });
  </script>
  
  <style scoped>
  .game-actions {
    display: flex;
    justify-content: center;
    margin-top: 30px;
    gap: 15px;
  }
  
  .action-button {
    background-color: #3498db;
    color: white;
    padding: 15px 30px;
    border: none;
    border-radius: 8px;
    font-size: 1.3em;
    cursor: pointer;
    margin: 10px;
    transition: background-color 0.3s ease, transform 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .action-button.primary {
    background-color: #2ecc71;
  }
  
  .action-button.secondary {
    background-color: #95a5a6;
  }
  
  .action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
  }
  
  .action-button.primary:hover {
    background-color: #27ae60;
  }
  
  .action-button.secondary:hover {
    background-color: #7f8c8d;
  }
  </style>