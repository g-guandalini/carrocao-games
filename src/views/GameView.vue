<template>
  <div class="game-container">
    <GameHeader v-if="gameStore.gameStatus !== 'idle'" />

    <SplashScreen
      v-if="gameStore.gameStatus === ('idle' as GameStatus)"
      @start-game="startNewRound"
    />

    <GameImagemOculta
      v-else-if="['hint', 'revealing', 'guessing', 'finished'].includes(gameStore.gameStatus)"
      :current-round-character="gameStore.currentRoundCharacter"
      :reveal-progress="gameStore.revealProgress"
      :game-status="gameStore.gameStatus"
      :active-team="gameStore.activeTeam"
      :score="gameStore.score"
      @evaluate-guess="handleOperatorFeedback" 
      @view-scoreboard="viewScoreboardFromGame"
    />

    <ScoreboardScreen
      v-else-if="gameStore.gameStatus === 'scoreboard'"
      :score="gameStore.score"
      :game-status="gameStore.gameStatus"
      @next-round="startNewRound"
      @reset-game="resetGameScores"
    />

    <p v-else-if="gameStore.gameStatus !== 'idle' && !gameStore.currentRoundCharacter" class="loading-message">
      Carregando personagem...
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue';
import { gameStore, startNewRound, selectTeam, handleOperatorFeedback as handleOperatorFeedbackInStore, resetGameScores, viewScoreboard } from '../store/gameStore';
import { TeamColor, GameStatus } from '../types';

import SplashScreen from '../components/SplashScreen.vue';
import GameHeader from '../components/GameHeader.vue';
import GameImagemOculta from '../components/GameImagemOculta.vue';
import ScoreboardScreen from '../components/ScoreboardScreen.vue';

export default defineComponent({
  name: 'GameView',
  components: {
    SplashScreen,
    GameHeader,
    GameImagemOculta,
    ScoreboardScreen,
  },
  setup() {
    // ALTERAÇÃO AQUI: A função agora aceita o segundo argumento (scoreAwarded)
    const handleOperatorFeedbackLocal = (isCorrect: boolean, scoreAwarded: number) => {
      console.log(`[GameView] Recebido feedback do operador: Correto? ${isCorrect}, Pontuação: ${scoreAwarded}`);
      // E passa ambos os argumentos para a função da store
      handleOperatorFeedbackInStore(isCorrect, scoreAwarded);
    };

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (gameStore.gameStatus === 'revealing') {
        let selectedTeam: TeamColor | null = null;
        switch (event.key) {
          case '1': selectedTeam = TeamColor.BLUE; break;
          case '2': selectedTeam = TeamColor.RED; break;
          case '3': selectedTeam = TeamColor.GREEN; break;
          case '4': selectedTeam = TeamColor.YELLOW; break;
        }

        if (selectedTeam) {
          event.preventDefault();
          selectTeam(selectedTeam);
        }
      }
    };

    const viewScoreboardFromGame = () => {
      viewScoreboard();
    };

    onMounted(() => {
      document.addEventListener('keydown', handleGlobalKeyDown);
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    });

    return {
      gameStore,
      startNewRound,
      resetGameScores,
      handleOperatorFeedback: handleOperatorFeedbackLocal, // Exportando a função local alterada
      viewScoreboardFromGame,
    };
  },
});
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  font-family: 'Poppins', sans-serif;
  background-color: #f0f2f5;
  min-height: 100vh;
  color: #333;
}

.loading-message {
  margin-top: 50px;
  font-size: 1.2em;
  color: #555;
}
</style>