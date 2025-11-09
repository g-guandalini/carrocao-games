<template>
  
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
  mounted() {
    // Adiciona o listener de evento de teclado ao objeto window quando o componente é montado
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeUnmount() {
    // Remove o listener de evento de teclado do objeto window antes do componente ser destruído
    window.removeEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    handleKeyDown(event: KeyboardEvent) {
      // Verifica se o jogo está no estado onde os botões seriam visíveis/ativos
      if (this.gameStatus === 'finished' || this.gameStatus === 'scoreboard') {
        if (event.code === 'Space') {
          event.preventDefault(); // Previne o comportamento padrão da tecla Espaço (como rolar a página)
          this.$emit('next-round');
        } else if (event.code === 'Escape') {
          event.preventDefault(); // Previne o comportamento padrão da tecla Esc
          this.$emit('reset-game');
        }
      }
    },
  },
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