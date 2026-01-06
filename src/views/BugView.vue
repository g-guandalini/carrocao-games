BugView.vue
<template>
  <div class="game-page-container bug-game">
    <GameHeader />

    <div class="game-content-wrapper">
      <!-- 1. Mostra o estado de carregamento global se o jogo estiver inicializando -->
      <div v-if="bugStore.isInitializing" class="overlay-message loading-overlay">
        <p>Carregando jogo BUG...</p>
      </div>

      <!-- 2. Se não estiver inicializando, mas ainda estiver carregando dados específicos da rodada -->
      <div v-else-if="bugStore.isLoadingBugWords || bugStore.isLoadingBugBoards" class="overlay-message loading-overlay">
        <p>Carregando dados da rodada...</p>
      </div>

      <!-- 3. Se estiver idle E NÃO houver palavras/tabuleiros disponíveis (após inicialização/carregamento) -->
      <div v-else-if="bugStore.gameStatus === 'idle' && (!bugStore.availableWords.length || !bugStore.availableBoards.length)" class="overlay-message game-message">
        <p>Nenhuma palavra ou tabuleiro disponível para o jogo BUG.</p>
        <!-- Não há botão de iniciar aqui, pois não há dados para começar -->
      </div>

      <!-- 5. Tela do placar -->
      <ScoreboardScreen
        v-else-if="bugStore.gameStatus === 'scoreboard'"
        :game-status="bugStore.gameStatus"
        @next-round="startNewRound"
        @reset-game="handleResetGame"
        @exit-scoreboard="handleExitScoreboard"
        class="scoreboard-area-layout"
      />

      <!-- 6. Fases ativas do jogo -->
      <div v-else class="game-active-area">
        <BugDrawPhase
          v-if="bugStore.gameStatus === 'bug_draw_phase'"
          :currentTurnTeam="bugStore.currentTurnTeam"
          :roundOptions="bugStore.roundOptions"
          :disabledTeams="bugStore.disabledTeamsForRound" 
          @option-selected="handleOptionSelected"
          @teams-removed="handleTeamsRemoved"
        />

        <BugWordPhase
          v-else-if="bugStore.gameStatus === 'bug_word_phase' && bugStore.currentRoundWord"
          :currentWord="bugStore.currentRoundWord.word"
          :scrambledWord="scrambledWordComputed"
          :activeTeam="bugStore.guessingTeam"
          :disabledTeams="combinedDisabledTeamsForWordPhase" 
          @set-guessing-team="setGuessingTeam"
          @correct-guess="handleCorrectGuess"
          @wrong-guess="handleWrongGuess"
        />

        <BugBoardPhase
          v-else-if="bugStore.gameStatus === 'bug_board_phase' && bugStore.currentBugBoard"
          :currentBoard="bugStore.currentBugBoard"
          :revealedTiles="bugStore.revealedBoardTiles"
          :teamPlayingBoard="bugStore.guessingTeam"
          :awaitingTileConfirmation="bugStore.awaitingTileConfirmation"
          @tile-selected="handleTileSelected"
          @confirm-board-action="confirmBoardAction"
          @start-new-round-shortcut="handleStartNewRoundShortcut"
          @view-scoreboard-shortcut="handleViewScoreboardShortcut"
        ></BugBoardPhase>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, computed, watch } from 'vue';
import { bugStore, initializeBugGame, startNewCleanBugRound, selectLotteryOption, setGuessingTeam, handleOperatorBugFeedback, selectBoardTile, confirmTileAction, viewBugScoreboard, selectTeamToRemove } from '../store/bugStore'; // currentWordPotentialScore removido
import { scoreStore, fetchScores } from '../store/scoreStore';
import { TeamColor } from '../types'; // GameStatus removido
import ScoreboardScreen from '../components/ScoreboardScreen.vue';
import BugDrawPhase from '../components/BugDrawPhase.vue';
import BugWordPhase from '../components/BugWordPhase.vue';
import BugBoardPhase from '../components/BugBoardPhase.vue';
import GameHeader from '../components/GameHeader.vue';
import { useRouter } from 'vue-router';

function scrambleWord(word: string): string {
    const a = word.split('');
    const n = a.length;

    for(let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join('');
}

export default defineComponent({
  name: 'BugView',
  components: {
    ScoreboardScreen,
    BugDrawPhase,
    BugWordPhase,
    BugBoardPhase,
    GameHeader,
  },
  setup() {
    const router = useRouter();

    onMounted(async () => {
      await fetchScores();
      await initializeBugGame(); // Garante que a inicialização ocorra ao montar
    });

    const startNewRound = async () => {
        await startNewCleanBugRound();
    };

    const handleResetGame = () => {
      router.push({ name: 'Home' });
    };

    const handleExitScoreboard = () => {
      router.push({ name: 'Home' });
    };

    const scrambledWordComputed = computed(() => {
        return bugStore.currentRoundWord ? scrambleWord(bugStore.currentRoundWord.word) : '';
    });

    // NOVO: Propriedade computada para combinar os times desabilitados
    const combinedDisabledTeamsForWordPhase = computed(() => {
      return new Set([...bugStore.disabledTeamsForRound, ...bugStore.disabledTeamsForGuessing]);
    });

    const handleOptionSelected = async (option: string, chosenPoints?: number) => {
        await selectLotteryOption(option as string, chosenPoints);
    };

    const handleTeamsRemoved = async (teams: TeamColor[]) => {
      for (const team of teams) {
        selectTeamToRemove(team);
      }
      bugStore.gameStatus = 'bug_word_phase';
    };

    const handleCorrectGuess = async () => {
      if (bugStore.guessingTeam) {
        // const teamWhoGuessed = bugStore.guessingTeam; // Variável não utilizada
        await handleOperatorBugFeedback(true, bugStore.guessingTeam);
      }
    };

    const handleWrongGuess = async () => {
      if (bugStore.guessingTeam) {
        // const teamWhoGuessed = bugStore.guessingTeam; // Variável não utilizada
        await handleOperatorBugFeedback(false, bugStore.guessingTeam);
      }
    };

    const handleTileSelected = async (row: number, col: number) => {
        await selectBoardTile(row, col);
    };

    const confirmBoardAction = () => {
      confirmTileAction();
    };

    // NOVO: Lógica para atalho de iniciar nova rodada
    const handleStartNewRoundShortcut = async () => {
      if (bugStore.awaitingTileConfirmation) {
        await confirmTileAction(); // Garante que o tile pendente seja processado
      }
      await startNewRound(); // Inicia uma nova rodada
    };

    // NOVO: Lógica para atalho de ir para o placar
    const handleViewScoreboardShortcut = async () => {
      if (bugStore.awaitingTileConfirmation) {
        await confirmTileAction(); // Garante que o tile pendente seja processado
      }
      await viewBugScoreboard(); // Vai para o placar
    };

    watch(() => bugStore.gameStatus, (_newStatus, _oldStatus) => { // Parâmetros prefixados com _
      // Logs de status de jogo removidos
    });

    return {
      bugStore,
      scoreStore,
      startNewRound,
      handleResetGame,
      handleExitScoreboard,
      scrambledWordComputed,
      combinedDisabledTeamsForWordPhase,
      handleOptionSelected,
      handleTeamsRemoved,
      setGuessingTeam,
      handleCorrectGuess,
      handleWrongGuess,
      handleTileSelected,
      confirmBoardAction,
      handleStartNewRoundShortcut, // EXPOR NOVO MÉTODO
      handleViewScoreboardShortcut, // EXPOR NOVO MÉTODO
    };
  },
});
</script>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.game-page-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: #f0f2f5;
  color: #333;
  box-sizing: border-box;
  overflow: hidden;
}

.game-content-wrapper {
  flex-grow: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-sizing: border-box;
}

.overlay-message {
  padding: 30px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-size: 1.5em;
  color: #555;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.overlay-message p {
  margin-bottom: 20px;
}

.btn-action {
  padding: 12px 25px;
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.btn-action.start-game, .btn-action.next-round {
  background-color: #007bff;
}

.btn-action.start-game:hover, .btn-action.next-round:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.game-active-area {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
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