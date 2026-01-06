<template>
  <div class="conexao-game-wrapper">
    <GameHeader />

    <GameConexao
      v-if="['revealing', 'guessing', 'finished'].includes(conexaoStore.gameStatus)"
      :current-round-conexao="conexaoStore.currentRoundConexao"
      :revealed-letters-count="conexaoStore.revealedLettersCount"
      :game-status="conexaoStore.gameStatus"
      :active-team="conexaoStore.activeTeam"
      :disabled-teams="conexaoStore.disabledTeams"
      :current-potential-score="currentRoundPotentialScore"
      @evaluate-guess="handleOperatorFeedback"
      @view-scoreboard="viewScoreboardFromGame"
      @start-new-round="handleStartNewRound"
    />

    <ScoreboardScreen
      v-else-if="conexaoStore.gameStatus === 'scoreboard'"
      :game-status="conexaoStore.gameStatus"
      @next-round="handleNextRoundFromScoreboard"
      @reset-game="handleResetGame"
      class="scoreboard-area-layout"
    />

    <p v-else-if="conexaoStore.gameStatus === 'idle' && !conexaoStore.currentRoundConexao && !conexaoStore.isLoadingConexoes" class="loading-message">
      Aguardando início do jogo de Conexão...
    </p>
     <p v-else-if="conexaoStore.isLoadingConexoes" class="loading-message">
      Carregando conexões...
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue';
import {
  conexaoStore,
  initializeConexaoGame,
  startNextConexaoGameRound,
  selectConexaoTeam,
  handleOperatorConexaoFeedback,
  resetConexaoGameScores,
  viewConexaoScoreboard,
  currentRoundPotentialScore
} from '../store/conexaoStore';
import { TeamColor } from '../types';
import { useRouter } from 'vue-router';

import GameHeader from '../components/GameHeader.vue';
import ScoreboardScreen from '../components/ScoreboardScreen.vue';
import GameConexao from '../components/GameConexao.vue';

export default defineComponent({
  name: 'ConexaoView',
  components: {
    GameHeader,
    GameConexao,
    ScoreboardScreen,
  },
  setup() {
    const router = useRouter();

    const handleOperatorFeedback = (isCorrect: boolean, scoreAwarded: number) => {
      console.log(`[ConexaoView] Recebido feedback do operador: Correto? ${isCorrect}, Pontuação: ${scoreAwarded}`);
      handleOperatorConexaoFeedback(isCorrect);
    };

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (conexaoStore.gameStatus === 'revealing') {
        let selectedTeam: TeamColor | null = null;
        switch (event.key) {
          case '1': selectedTeam = TeamColor.BLUE; break;
          case '2': selectedTeam = TeamColor.RED; break;
          case '3': selectedTeam = TeamColor.GREEN; break;
          case '4': selectedTeam = TeamColor.YELLOW; break;
        }

        if (selectedTeam) {
          event.preventDefault();
          selectConexaoTeam(selectedTeam);
        }
      }
    };

    const viewScoreboardFromGame = () => {
      viewConexaoScoreboard();
    };

    const handleNextRoundFromScoreboard = () => {
      console.log('[ConexaoView] handleNextRoundFromScoreboard: Chamando startNextConexaoGameRound()...');
      startNextConexaoGameRound();
    };

    // NOVO: Função para lidar com o evento 'start-new-round'
    const handleStartNewRound = () => {
      console.log('[ConexaoView] handleStartNewRound: Chamando startNextConexaoGameRound()...');
      startNextConexaoGameRound();
    };

    const handleResetGame = () => {
      console.log('[ConexaoView] handleResetGame: Chamando resetConexaoGameScores()...');
      resetConexaoGameScores();
      router.push({ name: 'Home' });
    };

    onMounted(() => {
      document.addEventListener('keydown', handleGlobalKeyDown);
      console.log('[ConexaoView] onMounted: Chamando initializeConexaoGame()...');
      initializeConexaoGame();
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    });

    return {
      conexaoStore,
      handleNextRoundFromScoreboard,
      handleOperatorFeedback,
      viewScoreboardFromGame,
      handleStartNewRound, // ADIÇÃO: Expondo a nova função
      handleResetGame,
      currentRoundPotentialScore,
    };
  },
});
</script>

<style scoped>
.conexao-game-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  font-family: 'Poppins', sans-serif;
  background-color: #f0f2f5;
  min-height: 100vh;
  color: #333;
  width: 100%;
}

.loading-message {
  margin-top: 50px;
  font-size: 1.2em;
  color: #555;
}

.scoreboard-area-layout {
  flex-grow: 1;
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>