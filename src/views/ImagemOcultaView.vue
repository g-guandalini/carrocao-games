<!-- views/ImagemOcultaView.vue -->
<template>
    <div class="imagem-oculta-game-wrapper">
      <GameHeader />
  
      <GameImagemOculta
        v-if="['hint', 'revealing', 'guessing', 'finished'].includes(imagemOcultaStore.gameStatus)"
        :current-round-character="imagemOcultaStore.currentRoundCharacter"
        :reveal-progress="imagemOcultaStore.revealProgress"
        :game-status="imagemOcultaStore.gameStatus"
        :active-team="imagemOcultaStore.activeTeam"
        :score="imagemOcultaStore.score"
        @evaluate-guess="handleOperatorFeedback" 
        @view-scoreboard="viewScoreboardFromGame"
      />
  
      <ScoreboardScreen
        v-else-if="imagemOcultaStore.gameStatus === 'scoreboard'"
        :score="imagemOcultaStore.score"
        :game-status="imagemOcultaStore.gameStatus"
        @next-round="startNewRound"
        @reset-game="handleResetGame"
      />
  
      <p v-else-if="imagemOcultaStore.gameStatus !== 'idle' && !imagemOcultaStore.currentRoundCharacter" class="loading-message">
        Carregando personagem...
      </p>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, onMounted, onUnmounted } from 'vue';
  // ATUALIZADO: Importando da nova store com o nome correto
  import { imagemOcultaStore, startNewRound as startNewRoundInStore, selectTeam, handleOperatorFeedback as handleOperatorFeedbackInStore, resetGameScores, viewScoreboard } from '../store/imagemOcultaStore';
  import { TeamColor, GameStatus } from '../types';
  
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
    emits: ['go-to-main-menu'],
    setup(_props, { emit }) {
      const handleOperatorFeedback = (isCorrect: boolean, scoreAwarded: number) => {
        console.log(`[ImagemOcultaView] Recebido feedback do operador: Correto? ${isCorrect}, Pontuação: ${scoreAwarded}`);
        handleOperatorFeedbackInStore(isCorrect, scoreAwarded);
      };
  
      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        // ATUALIZADO: Usando imagemOcultaStore
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
            selectTeam(selectedTeam);
          }
        }
      };
  
      const viewScoreboardFromGame = () => {
        viewScoreboard();
      };
      
      const startNewRound = () => {
        startNewRoundInStore();
      };
  
      const handleResetGame = () => {
        resetGameScores(); // Reseta o estado do jogo na store de Imagem Oculta
        emit('go-to-main-menu');
      };
  
      onMounted(() => {
        document.addEventListener('keydown', handleGlobalKeyDown);
        // ATUALIZADO: Usando imagemOcultaStore
        if (imagemOcultaStore.gameStatus === 'idle' || imagemOcultaStore.gameStatus === 'scoreboard') {
          startNewRound();
        }
      });
  
      onUnmounted(() => {
        document.removeEventListener('keydown', handleGlobalKeyDown);
      });
  
      return {
        imagemOcultaStore, // ATUALIZADO: Retornando a nova store
        startNewRound,
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