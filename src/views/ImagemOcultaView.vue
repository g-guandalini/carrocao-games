<template>
  <div class="imagem-oculta-game-wrapper">
    <GameHeader class="game-header-fixed-height" /> <!-- Added a class for potential sizing -->

    <GameImagemOculta
      v-if="['hint', 'revealing', 'guessing', 'finished'].includes(imagemOcultaStore.gameStatus)"
      :current-round-character="imagemOcultaStore.currentRoundCharacter"
      :reveal-progress="imagemOcultaStore.revealProgress"
      :game-status="imagemOcultaStore.gameStatus"
      :active-team="imagemOcultaStore.activeTeam"
      @evaluate-guess="handleOperatorFeedback"
      @view-scoreboard="viewScoreboardFromGame"
      @start-new-round-imagem-oculta="handleStartNewRoundImagemOculta"
      class="main-content-area"
    />

    <ScoreboardScreen
      v-else-if="imagemOcultaStore.gameStatus === 'scoreboard'"
      :game-status="imagemOcultaStore.gameStatus"
      @next-round="handleNextRoundFromScoreboard"
      @reset-game="handleResetGame"
      class="main-content-area"
    />

    <p v-else-if="imagemOcultaStore.isLoadingCharacters" class="loading-message main-content-area">
      Carregando personagens...
    </p>
    <p v-else-if="imagemOcultaStore.gameStatus === 'idle' && !imagemOcultaStore.currentRoundCharacter" class="loading-message main-content-area">
      Aguardando início do jogo...
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue';
import {
  imagemOcultaStore,
  initializeImagemOcultaGame,
  startNextImagemOcultaGameRound,
  selectImagemOcultaTeam,
  handleOperatorImagemOcultaFeedback,
  resetImagemOcultaGameScores,
  viewImagemOcultaScoreboard
} from '../store/imagemOcultaStore';
import { TeamColor } from '../types';
import { useRouter } from 'vue-router';

import GameHeader from '../components/GameHeader.vue';
import GameImagemOculta from '../components/GameImagemOculta.vue';
import ScoreboardScreen from '../components/ScoreboardScreen.vue';

export default defineComponent({
  name: 'ImagemOcultaView',
  components: {
    GameHeader,
    GameImagemOculta,
    ScoreboardScreen,
  },
  setup() {
    const router = useRouter();

    const handleOperatorFeedback = (isCorrect: boolean, scoreAwarded: number) => {
      console.log(`[ImagemOcultaView] Recebido feedback do operador: Correto? ${isCorrect}, Pontuação: ${scoreAwarded}`);
      handleOperatorImagemOcultaFeedback(isCorrect, scoreAwarded);
    };

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (imagemOcultaStore.gameStatus === 'revealing') {
        let selectedTeam: TeamColor | null = null;
        switch (event.key) {
          case '1': selectedTeam = TeamColor.BLUE; break;
          case '2': selectedTeam = TeamColor.RED; break;
          case '3': selectedTeam = TeamColor.GREEN; break;
          case '4': selectedTeam = TeamColor.YELLOW; break;
        }

        if (selectedTeam) {
          event.preventDefault();
          selectImagemOcultaTeam(selectedTeam);
        }
      }
    };

    const viewScoreboardFromGame = () => {
      viewImagemOcultaScoreboard();
    };

    const handleNextRoundFromScoreboard = () => {
      console.log('[ImagemOcultaView] handleNextRoundFromScoreboard: Chamando startNextImagemOcultaGameRound()...');
      startNextImagemOcultaGameRound();
    };

    const handleStartNewRoundImagemOculta = () => {
      console.log('[ImagemOcultaView] handleStartNewRoundImagemOculta: Chamando startNextImagemOcultaGameRound()...');
      startNextImagemOcultaGameRound();
    };

    const handleResetGame = () => {
      console.log('[ImagemOcultaView] handleResetGame: Chamando resetImagemOcultaGameScores()...');
      resetImagemOcultaGameScores();
      router.push({ name: 'Home' });
    };

    onMounted(() => {
      document.addEventListener('keydown', handleGlobalKeyDown);
      console.log('[ImagemOcultaView] onMounted: Chamando initializeImagemOcultaGame()...');
      initializeImagemOcultaGame();
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    });

    return {
      imagemOcultaStore,
      handleNextRoundFromScoreboard,
      handleOperatorFeedback,
      viewScoreboardFromGame,
      handleStartNewRoundImagemOculta,
      handleResetGame,
    };
  },
});
</script>

<style scoped>
/* REMOVIDO: Estilos globais para html, body, e box-sizing. Agora estão em App.vue. */

.imagem-oculta-game-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  font-family: 'Poppins', sans-serif;
  background-color: #f0f2f5;
  height: 100%; /* Important: Refers to parent's height (which is 100vh from global CSS) */
  overflow: hidden; /* Hide any overflow within this wrapper */
  color: #333;
  width: 100%;
}

.game-header-fixed-height { /* Added class to GameHeader */
  flex-shrink: 0; /* Ensures GameHeader doesn't shrink */
  /* You might want to define a fixed height here, e.g., height: 80px; */
  /* Or ensure GameHeader manages its own height and doesn't have external margins */
}

.main-content-area {
  flex-grow: 1; /* Occupy all remaining vertical space */
  overflow: hidden; /* Hide any overflow within this content area */
  width: 100%; /* Ensure it takes full width */
  display: flex; /* Maintain flex structure */
  flex-direction: column;
  justify-content: center; /* Center content vertically */
  align-items: center; /* Center content horizontally */
}

.loading-message {
  /* Removido margin-top, para que o flexbox gerencie o espaçamento */
  font-size: 1.2em;
  color: #555;
  /* Considerar adicionar um padding ou gap no pai se precisar de espaçamento */
}
</style>