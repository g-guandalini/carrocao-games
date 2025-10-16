<template>
    <div class="game-active-section">
      <div class="image-display">
        <ImageTiler
          :key="currentRoundCharacter.id"
          :image-url="currentRoundCharacter.imageUrl"
          :reveal-progress="revealProgress"
          :grid-size="10"
          :image-width="500"
          :image-height="350"
        />
      </div>
  
      <p class="timer-info" v-if="gameStatus === 'revealing'">
        A imagem está revelando... **{{ (revealProgress * 100).toFixed(0) }}%**
      </p>
      <p class="timer-info" v-if="gameStatus === 'guessing' && activeTeam">
        **{{ activeTeam }}** é a vez de palpitar! ⏳
      </p>
      <p class="timer-info" v-if="gameStatus === 'finished'">
        Rodada finalizada! Era: **{{ currentRoundCharacter.name }}**
      </p>
  
      <div class="team-buttons">
        <TeamButton
          v-for="color in Object.values(TeamColor)"
          :key="color"
          :team-color="color"
          :team-name="`Equipe ${color}`"
          :disabled="gameStatus !== 'revealing'"
          @select-team="$emit('select-team', color)"
        />
      </div>
  
      <GuessModal
        :show="gameStatus === 'guessing'"
        :active-team="activeTeam"
        @submit-guess="$emit('submit-guess', $event)"
        @close="$emit('close-guess-modal')"
      />
  
      <div class="score-board">
        <h2>Placar Atual 🏆</h2>
        <ul>
          <li v-for="(scoreVal, team) in score" :key="team">
            <span :style="{ color: getTeamColorHex(team as TeamColor) }">{{ team }}</span>: {{ scoreVal }} pontos
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, PropType } from 'vue';
  import ImageTiler from './ImageTiler.vue';
  import TeamButton from './TeamButton.vue';
  import GuessModal from './GuessModal.vue';
  import { Character, GameStatus, TeamColor } from '../types'; // Importe os tipos necessários
  
  export default defineComponent({
    name: 'GamePlayArea',
    components: {
      ImageTiler,
      TeamButton,
      GuessModal,
    },
    props: {
      currentRoundCharacter: {
        type: Object as PropType<Character>, // Use PropType para tipos complexos
        required: true,
      },
      revealProgress: {
        type: Number,
        required: true,
      },
      gameStatus: {
        type: String as PropType<GameStatus>, // Use PropType para enums ou string literals
        required: true,
      },
      activeTeam: {
        type: String as PropType<TeamColor | null>,
        default: null,
      },
      score: {
        type: Object as PropType<Record<TeamColor, number>>,
        required: true,
      },
    },
    emits: ['select-team', 'submit-guess', 'close-guess-modal'],
    setup() {
      // getTeamColorHex fica aqui, pois é uma função de display para o placar.
      const getTeamColorHex = (team: TeamColor) => {
        switch (team) {
          case TeamColor.BLUE: return '#3498db';
          case TeamColor.RED: return '#e74c3c';
          case TeamColor.GREEN: return '#2ecc71';
          case TeamColor.YELLOW: return '#f1c40f';
          default: return '#333';
        }
      };
  
      return {
        TeamColor, // Expor TeamColor para o template (para v-for)
        getTeamColorHex,
      };
    },
  });
  </script>
  
  <style scoped>
  .game-active-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 800px;
    padding-top: 20px; /* Espaço para o cabeçalho fixo */
  }
  
  .image-display {
    width: 500px;
    height: 350px;
    background-color: #ecf0f1;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 25px;
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
  </style>