<template>
  <div class="imagem-oculta-game-wrapper">
    <GameHeader />

    <GameImagemOculta
      v-if="['hint', 'revealing', 'guessing', 'finished'].includes(imagemOcultaStore.gameStatus)"
      :current-round-character="imagemOcultaStore.currentRoundCharacter"
      :reveal-progress="imagemOcultaStore.revealProgress"
      :game-status="imagemOcultaStore.gameStatus"
      :active-team="imagemOcultaStore.activeTeam"
      @evaluate-guess="handleOperatorFeedback"
      @view-scoreboard="viewScoreboardFromGame"
    />

    <ScoreboardScreen
      v-else-if="imagemOcultaStore.gameStatus === 'scoreboard'"
      :game-status="imagemOcultaStore.gameStatus"
      @next-round="handleNextRoundFromScoreboard"
      @reset-game="handleResetGame"
    />

    <p v-else-if="imagemOcultaStore.gameStatus === 'idle' && !imagemOcultaStore.currentRoundCharacter && !imagemOcultaStore.isLoadingCharacters" class="loading-message">
      Aguardando início do jogo...
    </p>
     <p v-else-if="imagemOcultaStore.isLoadingCharacters" class="loading-message">
      Carregando personagens...
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue';
import { 
  imagemOcultaStore, 
  initializeImagemOcultaGame, // ATUALIZADO: Nome da função de inicialização
  startNextImagemOcultaGameRound, // ATUALIZADO: Nome da função para próxima rodada
  selectImagemOcultaTeam, // ATUALIZADO: Nome da função para seleção de time
  handleOperatorImagemOcultaFeedback, // ATUALIZADO: Nome da função de feedback do operador
  resetImagemOcultaGameScores, // ATUALIZADO: Nome da função de reset de scores
  viewImagemOcultaScoreboard // ATUALIZADO: Nome da função para ver placar
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

    // Mapeia o feedback do operador para a função do store
    const handleOperatorFeedback = (isCorrect: boolean, scoreAwarded: number) => {
      console.log(`[ImagemOcultaView] Recebido feedback do operador: Correto? ${isCorrect}, Pontuação: ${scoreAwarded}`);
      // ATUALIZADO: Chama a função com o novo nome
      handleOperatorImagemOcultaFeedback(isCorrect, scoreAwarded);
    };

    // Lógica para seleção de time via teclado
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (imagemOcultaStore.gameStatus === 'revealing') {
        let selectedTeam: TeamColor | null = null;
        switch (event.key) {
          case '1': selectedTeam = TeamColor.BLUE; break; // Use TeamColor enum values
          case '2': selectedTeam = TeamColor.RED; break;
          case '3': selectedTeam = TeamColor.GREEN; break;
          case '4': selectedTeam = TeamColor.YELLOW; break;
        }

        if (selectedTeam) {
          event.preventDefault(); 
          // ATUALIZADO: Chama a função com o novo nome
          selectImagemOcultaTeam(selectedTeam);
        }
      }
    };

    // Mapeia a ação de ver placar para a função do store
    const viewScoreboardFromGame = () => {
      // ATUALIZADO: Chama a função com o novo nome
      viewImagemOcultaScoreboard();
    };
    
    // NOVO: Função para o botão "Próxima Rodada" do ScoreboardScreen
    const handleNextRoundFromScoreboard = () => {
      console.log('[ImagemOcultaView] handleNextRoundFromScoreboard: Chamando startNextImagemOcultaGameRound()...');
      // ATUALIZADO: Chama a função com o novo nome
      startNextImagemOcultaGameRound(); 
    };

    // Mapeia a ação de resetar jogo para a função do store
    const handleResetGame = () => {
      console.log('[ImagemOcultaView] handleResetGame: Chamando resetImagemOcultaGameScores()...');
      // ATUALIZADO: Chama a função com o novo nome
      resetImagemOcultaGameScores(); 
      router.push({ name: 'Home' }); // Volta para a tela inicial
    };

    onMounted(() => {
      document.addEventListener('keydown', handleGlobalKeyDown);
      console.log('[ImagemOcultaView] onMounted: Chamando initializeImagemOcultaGame()...');
      // ATUALIZADO: Chama a função com o novo nome
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
      handleResetGame,
    };
  },
});
</script>

<style scoped>
.imagem-oculta-game-wrapper {
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
</style>