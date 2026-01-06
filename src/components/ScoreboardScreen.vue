<template>
  <div class="scoreboard-screen-container" tabindex="0" @keydown.space.stop.prevent="handleNextRound">
    <ScoreboardBlocks :score="sortedScores" />
    <GameActionButtons
      :game-status="gameStatus"
      @next-round="handleNextRound"
      @reset-game="$emit('reset-game')"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, onMounted, onUnmounted, nextTick } from 'vue';
import ScoreboardBlocks from './ScoreboardBlocks.vue';
import GameActionButtons from './GameActionButtons.vue';
import { GameStatus }  from '../types';
import { scoreStore } from '../store/scoreStore';

// Define a type for a score item, assuming it has at least a 'score' property for sorting
interface ScoreItem {
  name: string; // Adicionado 'name' para o nome da equipe
  score: number;
  [key: string]: any; // Permite outras propriedades no objeto de score
}

export default defineComponent({
  name: 'ScoreboardScreen',
  components: {
    ScoreboardBlocks,
    GameActionButtons,
  },
  props: {
    gameStatus: {
      type: String as PropType<GameStatus>,
      required: true,
    }
  },
  emits: ['next-round', 'reset-game', 'exit-scoreboard'],
  setup(_props, { emit }) {
    const scoresFromStore = computed(() => scoreStore.score);

    // Propriedade computada para ordenar os scores para exibição de ranking
    const sortedScores = computed(() => {
      const rawScores = scoresFromStore.value;

      // Verifica se rawScores é um objeto válido e não vazio
      if (!rawScores || typeof rawScores !== 'object' || Object.keys(rawScores).length === 0) {
        return []; // Retorna um array vazio se não houver dados válidos
      }

      // Transforma o objeto { NomeEquipe: Pontuacao } em um array de objetos { name: NomeEquipe, score: Pontuacao }
      const scoreArray: ScoreItem[] = Object.keys(rawScores).map(teamName => ({
        name: teamName,
        score: rawScores[teamName as keyof typeof rawScores]
      }));

      // Ordena o array em ordem decrescente com base na propriedade 'score'
      return scoreArray.sort((a: ScoreItem, b: ScoreItem) => b.score - a.score);
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        emit('exit-scoreboard');
      }
    };

    // Função para lidar com o Space e emitir next-round
    const handleNextRound = () => {
      emit('next-round');
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
      // Garante que o container do placar receba o foco ao ser montado
      nextTick(() => {
        const container = document.querySelector('.scoreboard-screen-container') as HTMLElement;
        if (container) {
          container.focus();
        }
      });
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });

    return {
      sortedScores, // Exponha os scores ordenados para o template
      handleNextRound,
    };
  },
});
</script>

<style scoped>
.scoreboard-screen-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background-color: #f8f9fa;
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  margin-top: 50px;
  max-width: 1000px; /* AUMENTADO PARA 1000px */
  text-align: center;
  position: relative;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.scoreboard-screen-container:focus {
  outline: none;
  border-color: #a0a0a0;
}

h2 {
  font-size: 2.8em;
  color: #2c3e50;
  margin-bottom: 30px;
  font-weight: 700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.05);
  background: linear-gradient(45deg, #3498db, #2ecc71);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>