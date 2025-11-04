<template>
  <div class="imagem-oculta-game-wrapper">
    <GameHeader />

    <GameImagemOculta
      v-if="['hint', 'revealing', 'guessing', 'finished'].includes(imagemOcultaStore.gameStatus)"
      :current-round-character="imagemOcultaStore.currentRoundCharacter"
      :reveal-progress="imagemOcultaStore.revealProgress"
      :game-status="imagemOcultaStore.gameStatus"
      :active-team="imagemOcultaStore.activeTeam"
      :score="imagemOcultaStore.scores"
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
// IMPORT ATUALIZADO: Importe initializeGame e startNextGameRound (os novos nomes)
import { 
  imagemOcultaStore, 
  initializeGame, // Chamada para montagem inicial
  startNextGameRound, // Chamada para o botão "Próxima Rodada"
  selectTeam, 
  handleOperatorFeedback as handleOperatorFeedbackInStore, 
  resetGameScores, 
  viewScoreboard 
} from '../store/imagemOcultaStore';
import { TeamColor } from '../types'; // Certifique-se que TeamColor está definido e importado corretamente
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
      handleOperatorFeedbackInStore(isCorrect, scoreAwarded);
    };

    // Lógica para seleção de time via teclado
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (imagemOcultaStore.gameStatus === 'revealing') {
        let selectedTeam: TeamColor | null = null;
        // Ajuste TeamColor para o tipo correto se necessário, ex: TeamColor.Azul
        // Exemplo: if (event.key === '1') selectedTeam = 'Azul';
        // É importante que 'TeamColor' seja um enum ou tipo literal que corresponda aos valores
        // Como você tem `TeamColor.BLUE`, etc, estou supondo que TeamColor é um enum.
        // Se for um tipo literal, você precisará ajustar o switch case para strings literais ('Azul', 'Vermelho', etc.)
        switch (event.key) {
          case '1': selectedTeam = 'Azul'; break;
          case '2': selectedTeam = 'Vermelho'; break;
          case '3': selectedTeam = 'Verde'; break;
          case '4': selectedTeam = 'Amarelo'; break;
        }

        if (selectedTeam) {
          event.preventDefault(); 
          selectTeam(selectedTeam);
        }
      }
    };

    // Mapeia a ação de ver placar para a função do store
    const viewScoreboardFromGame = () => {
      viewScoreboard();
    };
    
    // NOVO: Função para o botão "Próxima Rodada" do ScoreboardScreen
    const handleNextRoundFromScoreboard = () => {
      console.log('[ImagemOcultaView] handleNextRoundFromScoreboard: Chamando startNextGameRound()...');
      startNextGameRound(); // Esta função sempre inicia uma rodada limpa
    };

    // Mapeia a ação de resetar jogo para a função do store
    const handleResetGame = () => {
      console.log('[ImagemOcultaView] handleResetGame: Chamando resetGameScores()...');
      resetGameScores(); 
      router.push({ name: 'Home' }); // Volta para a tela inicial
    };

    onMounted(() => {
      document.addEventListener('keydown', handleGlobalKeyDown);
      console.log('[ImagemOcultaView] onMounted: Chamando initializeGame()...');
      // A função initializeGame() do store é responsável por restaurar uma rodada ou iniciar uma nova.
      initializeGame(); 
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    });

    return {
      imagemOcultaStore,
      handleNextRoundFromScoreboard, // Exponha a nova função para o template
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