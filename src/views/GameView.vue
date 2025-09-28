<template>
    <div class="game-container">
      <h1>Adivinhe o Personagem!</h1>
  
      <div v-if="gameStore.gameStatus === 'idle'">
        <p class="instruction-text">Pressione "Iniciar Jogo" para começar uma nova rodada e ver a imagem começar a se revelar.</p>
        <button class="action-button primary" @click="startNewRound">Iniciar Jogo</button>
      </div>
  
      <div v-if="gameStore.gameStatus !== 'idle'">
        <div class="image-display">
            <ImageTiler
            :image-url="gameStore.currentRoundCharacter?.imageUrl || ''"
            :reveal-progress="gameStore.revealProgress"
            :grid-size="15"
            :image-width="500"
            :image-height="350"
          />
        </div>
  
        <p class="timer-info" v-if="gameStore.gameStatus === 'revealing'">
          A imagem está revelando... **{{ (gameStore.revealProgress * 100).toFixed(0) }}%**
        </p>
        <p class="timer-info" v-if="gameStore.gameStatus === 'guessing' && gameStore.activeTeam">
          **{{ gameStore.activeTeam }}** é a vez de palpitar! ⏳
        </p>
        <p class="timer-info" v-if="gameStore.gameStatus === 'finished'">
          Rodada finalizada! Era: **{{ gameStore.currentRoundCharacter?.name }}**
        </p>
  
  
        <div class="team-buttons">
          <TeamButton
            v-for="color in Object.values(TeamColor)"
            :key="color"
            :team-color="color"
            :team-name="`Equipe ${color}`"
            :disabled="gameStore.gameStatus !== 'revealing'"
            @select-team="handleTeamSelect"
          />
        </div>
  
        <GuessModal
          :show="gameStore.gameStatus === 'guessing'"
          :active-team="gameStore.activeTeam"
          @submit-guess="handleGuessSubmit"
          @close="handleGuessModalClose"
        />
  
        <div class="score-board">
          <h2>Placar Atual 🏆</h2>
          <ul>
            <li v-for="(score, team) in gameStore.score" :key="team">
              <span :style="{ color: getTeamColorHex(team) }">{{ team }}</span>: {{ score }} pontos
            </li>
          </ul>
        </div>
  
        <div class="game-actions">
          <button
            v-if="gameStore.gameStatus === 'finished'"
            @click="startNewRound"
            class="action-button primary"
          >
            Próxima Rodada ➡️
          </button>
          <button
            v-if="gameStore.gameStatus === 'finished' || gameStore.gameStatus === 'idle'"
            @click="resetGameScores"
            class="action-button secondary"
          >
            Reiniciar Jogo (Zerar Placar) ↩️
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed } from 'vue';
  import { gameStore, startNewRound, selectTeam, submitGuess, stopReveal, resetGameScores } from '../store/gameStore';
  import { TeamColor } from '../types';
  import TeamButton from '../components/TeamButton.vue';
  import GuessModal from '../components/GuessModal.vue';
  import ImageTiler from '../components/ImageTiler.vue'; // Importa o novo componente
  
  export default defineComponent({
    name: 'GameView',
    components: {
      TeamButton,
      GuessModal,
      ImageTiler, // Registra o novo componente
    },
    setup() {
      // blurAmount não é mais necessário
  
      const handleTeamSelect = (team: TeamColor) => {
        selectTeam(team);
      };
  
      const handleGuessSubmit = (guess: string) => {
        submitGuess(guess);
      };
  
      const handleGuessModalClose = () => {
        // Se o usuário cancelar o palpite, a rodada é finalizada
        stopReveal(); // Garante que o intervalo de revelação seja limpo
        gameStore.gameStatus = 'finished';
        alert('Palpite cancelado. A rodada foi finalizada sem um palpite.');
      };
  
      const getTeamColorHex = (team: string) => {
        switch (team) {
          case TeamColor.BLUE: return '#3498db';
          case TeamColor.RED: return '#e74c3c';
          case TeamColor.GREEN: return '#2ecc71';
          case TeamColor.YELLOW: return '#f1c40f';
          default: return '#333';
        }
      };
  
      return {
        gameStore,
        TeamColor,
        startNewRound,
        resetGameScores,
        handleTeamSelect,
        handleGuessSubmit,
        handleGuessModalClose,
        getTeamColorHex,
      };
    },
  });
  </script>
  
  <style scoped>
  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-family: 'Poppins', sans-serif;
    background-color: #f0f2f5;
    min-height: 100vh;
    color: #333;
  }
  
  h1 {
    color: #2c3e50;
    margin-bottom: 30px;
    font-size: 2.8em;
    text-align: center;
  }
  
  .instruction-text {
    margin-bottom: 25px;
    font-size: 1.1em;
    text-align: center;
    color: #555;
    max-width: 600px;
  }
  
  .action-button {
    background-color: #3498db;
    color: white;
    padding: 15px 30px;
    border: none;
    border-radius: 8px;
    font-size: 1.3em;
    cursor: pointer;
    margin: 10px;
    transition: background-color 0.3s ease, transform 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .action-button.primary {
    background-color: #2ecc71; /* Verde para ação primária */
  }
  
  .action-button.secondary {
    background-color: #95a5a6; /* Cinza para ação secundária */
  }
  
  .action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
  }
  
  .action-button.primary:hover {
    background-color: #27ae60;
  }
  
  .action-button.secondary:hover {
    background-color: #7f8c8d;
  }
  
  .image-display {
    width: 500px; /* Largura fixa para o container da imagem */
    height: 350px; /* Altura fixa para o container da imagem */
    background-color: #ecf0f1;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 25px;
    /* Os estilos de sombra e borda serão agora gerenciados pelo ImageTiler para consistência */
    /* box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15); */
    /* border: 2px solid #bdc3c7; */
  }
  
  .timer-info {
    font-size: 1.3em;
    margin-bottom: 25px;
    color: #555;
    font-weight: 500;
    text-align: center;
  }
  
  .team-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
    margin-bottom: 35px;
    width: 100%;
    max-width: 650px;
  }
  
  .score-board {
    background-color: #ffffff;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    margin-top: 30px;
    width: 100%;
    max-width: 450px;
    text-align: left;
    border: 1px solid #eee;
  }
  
  .score-board h2 {
    color: #34495e;
    margin-bottom: 20px;
    text-align: center;
    font-size: 1.8em;
  }
  
  .score-board ul {
    list-style: none;
    padding: 0;
  }
  
  .score-board li {
    font-size: 1.2em;
    padding: 10px 0;
    border-bottom: 1px dashed #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .score-board li:last-child {
    border-bottom: none;
  }
  
  .game-actions {
    display: flex;
    justify-content: center;
    margin-top: 30px;
    gap: 15px;
  }
  </style>