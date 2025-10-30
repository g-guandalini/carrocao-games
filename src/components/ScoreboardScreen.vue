<template>
  <div class="scoreboard-screen-container">
    <h2>Placar Atual</h2>
    <!-- O ScoreboardBlocks agora recebe a pontuação do computed "scoresFromStore" -->
    <ScoreboardBlocks :score="scoresFromStore" />
    <GameActionButtons
      :game-status="gameStatus"
      @next-round="$emit('next-round')"
      @reset-game="$emit('reset-game')"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'; // Importar 'computed'
import ScoreboardBlocks from './ScoreboardBlocks.vue';
import GameActionButtons from './GameActionButtons.vue';
import { GameStatus }  from '../types'; // TeamColor não é mais necessário aqui
// Importar a scoreStore global
import { scoreStore } from '../store/scoreStore';

export default defineComponent({
  name: 'ScoreboardScreen',
  components: {
    ScoreboardBlocks,
    GameActionButtons,
  },
  props: {
    // REMOVIDO: A prop 'score' não é mais necessária aqui, pois pegaremos da store.
    // score: {
    //   type: Object as PropType<Record<TeamColor, number>>,
    //   required: true,
    // },
    gameStatus: { // gameStatus ainda é necessário para GameActionButtons
      type: String as PropType<GameStatus>,
      required: true,
    }
  },
  emits: ['next-round', 'reset-game'],
  setup() {
    // NOVO: Acessa o score da scoreStore global
    const scoresFromStore = computed(() => scoreStore.score);

    return {
      scoresFromStore, // Expor para ser usado no template
      // 'score' não é mais retornado aqui.
    };
  },
});
</script>

<style scoped>
.scoreboard-screen-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-top: 50px;
  max-width: 600px;
  width: 90%;
  text-align: center;
}

h2 {
  font-size: 2.2em;
  color: #2c3e50;
  margin-bottom: 30px;
}
</style>