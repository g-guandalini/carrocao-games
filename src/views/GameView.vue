<template>
  <div class="game-container">
    <!-- Se o jogo está 'idle', mostra APENAS a SplashScreen -->
    <SplashScreen
      v-if="gameStore.gameStatus === ('idle' as GameStatus)"
      @start-game="startNewRound"
    />

    <!-- Se o jogo NÃO está 'idle', mostra o resto da interface do jogo -->
    <template v-else>
      <GameHeader />
      
      <!-- A GameImagemOculta só aparece se currentRoundCharacter estiver definido -->
      <GameImagemOculta
        v-if="gameStore.currentRoundCharacter"
        :current-round-character="gameStore.currentRoundCharacter"
        :reveal-progress="gameStore.revealProgress"
        :game-status="gameStore.gameStatus"
        :active-team="gameStore.activeTeam"
        :score="gameStore.score"
        @select-team="handleTeamSelect"
        @submit-guess="handleGuessSubmit"
        @close-guess-modal="handleGuessModalClose"
      />
      <!-- Você pode adicionar um else aqui para mostrar um "Carregando..."
           se gameStore.gameStatus não é idle mas currentRoundCharacter ainda é null -->
      <p v-else-if="gameStore.gameStatus !== 'idle'" class="loading-message">Carregando personagem...</p>

      <GameActionButtons
        :game-status="gameStore.gameStatus"
        @next-round="startNewRound"
        @reset-game="resetGameScores"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { gameStore, startNewRound, selectTeam, submitGuess, stopReveal, resetGameScores } from '../store/gameStore';
import { TeamColor, GameStatus } from '../types'; // <-- Importe GameStatus
import { addToast } from '../store/toastStore'; // <-- NOVA IMPORTAÇÃO

import SplashScreen from '../components/SplashScreen.vue';
import GameHeader from '../components/GameHeader.vue';
import GameActionButtons from '../components/GameActionButtons.vue';
import GameImagemOculta from '../components/GameImagemOculta.vue';

export default defineComponent({
  name: 'GameView',
  components: {
    SplashScreen,
    GameHeader,
    GameImagemOculta,
    GameActionButtons,
  },
  setup() {
    const handleTeamSelect = (team: TeamColor) => {
      selectTeam(team);
    };

    const handleGuessSubmit = (guess: string) => {
      submitGuess(guess);
    };

    const handleGuessModalClose = () => {
      stopReveal();
      gameStore.gameStatus = 'finished';
      addToast('Palpite cancelado. A rodada foi finalizada sem um palpite.', 'info'); // <-- CORRIGIDO AQUI
    };

    return {
      gameStore,
      startNewRound,
      resetGameScores,
      handleTeamSelect,
      handleGuessSubmit,
      handleGuessModalClose,
    };
  },
});
</script>

<style scoped>
/* ... seu estilo ... */
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