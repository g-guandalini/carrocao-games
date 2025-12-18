<template>
  <div class="game-page-container bug-game">
    <div v-if="bugStore.isLoadingBugWords || bugStore.isLoadingBugBoards" class="overlay-message loading-overlay">
      <p>Carregando jogo BUG...</p>
    </div>

    <div v-else-if="bugStore.gameStatus === 'idle'" class="overlay-message game-message">
      <p>Nenhuma palavra ou tabuleiro disponível para o jogo BUG.</p>
      <button @click="startNewRound" class="btn-action start-game">Iniciar Nova Rodada</button>
    </div>

    <div v-else-if="bugStore.gameStatus === 'scoreboard'" class="overlay-message game-message">
      <p>Fim da rodada! Veja o placar final.</p>
      <ScoreboardScreen :scores="scoreStore.score" />
      <button @click="startNewRound" class="btn-action next-round">Iniciar Próxima Rodada</button>
    </div>

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
        :disabledTeams="bugStore.disabledTeamsForRound"
        @set-guessing-team="setGuessingTeam"
        @correct-guess="handleCorrectGuess"
        @wrong-guess="handleWrongGuess"
      />

      <BugBoardPhase
        v-else-if="bugStore.gameStatus === 'bug_board_phase' && bugStore.currentBugBoard"
        :currentBoard="bugStore.currentBugBoard"
        :revealedTiles="bugStore.revealedBoardTiles"
        :currentTurnTeam="bugStore.currentTurnTeam"
        :awaitingTileConfirmation="bugStore.awaitingTileConfirmation"
        @tile-selected="handleTileSelected"
        @confirm-board-action="confirmBoardTileAction"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, computed, watch } from 'vue';
import { bugStore, initializeBugGame, startNewCleanBugRound, selectLotteryOption, setGuessingTeam, handleOperatorBugFeedback, selectBoardTile, confirmTileAction, viewBugScoreboard, selectTeamToRemove, currentWordPotentialScore } from '../store/bugStore';
import { scoreStore, fetchScores } from '../store/scoreStore';
import { TeamColor, GameStatus } from '../types';
import ScoreboardScreen from '../components/ScoreboardScreen.vue'; 
import BugDrawPhase from '../components/BugDrawPhase.vue';
import BugWordPhase from '../components/BugWordPhase.vue';
import BugBoardPhase from '../components/BugBoardPhase.vue';

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
  },
  setup() {
    onMounted(async () => {
      await fetchScores();
      await initializeBugGame();
    });

    const startNewRound = async () => {
        await startNewCleanBugRound();
    };

    const scrambledWordComputed = computed(() => {
        return bugStore.currentRoundWord ? scrambleWord(bugStore.currentRoundWord.word) : '';
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
        const teamWhoGuessed = bugStore.guessingTeam;
        await handleOperatorBugFeedback(true, bugStore.guessingTeam);
        console.log(`Time ${teamWhoGuessed} acertou a palavra e ganhou ${currentWordPotentialScore.value} pontos!`);
      }
    };

    const handleWrongGuess = async () => {
      if (bugStore.guessingTeam) {
        const teamWhoGuessed = bugStore.guessingTeam;
        await handleOperatorBugFeedback(false, bugStore.guessingTeam);
        console.log(`Time ${teamWhoGuessed} errou e está fora da rodada!`);
      }
    };

    const handleTileSelected = async (row: number, col: number) => {
        await selectBoardTile(row, col);
        console.log(`Tile selecionado! Aguardando confirmação.`);
    };

    const confirmBoardTileAction = () => {
      confirmTileAction();
    };

    watch(() => bugStore.gameStatus, (newStatus) => {
      if (newStatus === 'bug_draw_phase') {
        console.log("Iniciando Fase de Sorteio");
      } else if (newStatus === 'bug_word_phase') {
        console.log("Iniciando Fase da Palavra");
      } else if (newStatus === 'bug_board_phase') {
        console.log("Iniciando Fase do Tabuleiro");
      } else if (newStatus === 'scoreboard') {
        console.log("Exibindo Placar");
      }
    });

    return {
      bugStore,
      scoreStore,
      startNewRound,
      scrambledWordComputed,
      handleOptionSelected,
      handleTeamsRemoved,
      setGuessingTeam,
      handleCorrectGuess,
      handleWrongGuess,
      handleTileSelected,
      confirmBoardTileAction,
    };
  },
});
</script>

<style scoped>
html, body { /* Adicionado para garantir que o html/body não tenham margens */
  margin: 0;
  padding: 0;
  overflow: hidden; /* Garante que não haja rolagem vertical no nível do body */
}

.game-page-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Centraliza verticalmente o conteúdo principal */
  width: 100vw; /* Ocupa a largura total da viewport */
  height: 100vh; /* Ocupa a altura total da viewport */
  padding: 10px; /* Um pouco de padding para não grudar nas bordas */
  background-color: #f0f2f5;
  color: #333;
  box-sizing: border-box; /* Garante que padding não cause overflow */
  overflow: hidden; /* Remove rolagem vertical para o container */
}

.overlay-message { /* Classes combinadas para loading/idle/scoreboard */
  padding: 30px; /* Reduzido um pouco */
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-size: 1.5em; /* Reduzido um pouco */
  color: #555;
  /* margin-top removido, o justify-content: center do parent lida com isso */
  max-height: 90vh; /* Para garantir que não estoure em telas pequenas */
  overflow-y: auto; /* Adiciona rolagem se a mensagem for muito grande, mas tenta evitar */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.overlay-message p {
  margin-bottom: 20px;
}

.btn-action {
  padding: 12px 25px; /* Reduzido um pouco */
  font-size: 1.1em; /* Reduzido um pouco */
  font-weight: bold;
  margin-top: 20px; /* Reduzido um pouco */
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
    height: 100%; /* Ocupa toda a altura disponível do flex container */
    display: flex;
    justify-content: center;
    align-items: center; /* Centraliza a fase do jogo */
    /* margin-top removido, o justify-content do parent lida com isso */
    flex-grow: 1; /* Permite que esta área ocupe o espaço extra */
}
</style>