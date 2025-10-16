<template>
  <div class="game-container">
    <!-- Se o jogo está 'idle', mostra APENAS a SplashScreen -->
    <SplashScreen
      v-if="gameStore.gameStatus === 'idle'"
      @start-game="startNewRound"
      @select-connection="handleConexaoClick"
      @select-bug="handleBugClick"
    />

    <!-- Se o jogo NÃO está 'idle', mostra o resto da interface do jogo -->
    <template v-else>
      <GameHeader />
      
      <!-- A GamePlayArea só aparece se currentRoundCharacter estiver definido -->
      <GamePlayArea
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
import { TeamColor } from '../types';

import SplashScreen from '../components/SplashScreen.vue';
import GameHeader from '../components/GameHeader.vue';
import GamePlayArea from '../components/GamePlayArea.vue';
import GameActionButtons from '../components/GameActionButtons.vue';

export default defineComponent({
  name: 'GameView',
  components: {
    SplashScreen,
    GameHeader,
    GamePlayArea,
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
      alert('Palpite cancelado. A rodada foi finalizada sem um palpite.');
    };

    const handleConexaoClick = () => {
      alert('Funcionalidade de "Conexão" ainda não implementada.');
      console.log('Botão Conexão clicado.');
    };

    const handleBugClick = () => {
      alert('Funcionalidade de "Bug" ainda não implementada.');
      console.log('Botão Bug clicado.');
    };

    return {
      gameStore,
      startNewRound,
      resetGameScores,
      handleTeamSelect,
      handleGuessSubmit,
      handleGuessModalClose,
      handleConexaoClick,
      handleBugClick,
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