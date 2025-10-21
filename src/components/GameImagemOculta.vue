<template>
  <div class="game-active-section">
    <!-- NOVO: Seção da Dica (visível apenas na fase 'hint') -->
    <div v-if="gameStatus === 'hint' && currentRoundCharacter" class="hint-container">
      <p class="hint-text">Dica: <strong>{{ currentRoundCharacter.hint }}</strong></p>
      <button @click="proceedToReveal" class="proceed-button">
        Prosseguir
      </button>
    </div>

    <!-- Exibição da Imagem (visível em todas as fases, exceto 'hint') -->
    <div v-show="gameStatus !== 'hint'" class="image-display">
      <ImageTiler
        :key="currentRoundCharacter?.id"
        :image-url="currentRoundCharacter?.imageUrl || ''"
        :reveal-progress="revealProgress"
        :grid-size="10"
        :image-width="500"
        :image-height="350"
      />
    </div>

    <p class="timer-info" v-if="gameStatus === 'revealing'">
      A imagem está revelando... <strong>{{ (revealProgress * 100).toFixed(0) }}%</strong>
    </p>
    <p class="timer-info" v-if="gameStatus === 'guessing' && activeTeam">
      <strong>{{ activeTeam }}</strong> é a vez de palpitar! ⏳
    </p>
    <p class="timer-info" v-if="gameStatus === 'finished'">
      Rodada finalizada! Era: <strong>{{ currentRoundCharacter?.name }}</strong>
    </p>

    <!-- Botões das Equipes (visíveis apenas na fase 'revealing') -->
    <div class="team-buttons" v-if="gameStatus === 'revealing'">
      <TeamButton
        v-for="color in Object.values(TeamColor)"
        :key="color"
        :team-color="color"
        :team-name="`Equipe ${color}`"
        :disabled="gameStatus !== 'revealing'"
        @select-team="selectTeamFromStore"
      />
    </div>

    <GuessModal
      :show="gameStatus === 'guessing'"
      :active-team="activeTeam"
      @submit-guess="submitGuessFromStore"
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
  <!-- NOVO: Componente para exibir os toasts -->
  <ToastNotification />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import ImageTiler from './ImageTiler.vue';
import TeamButton from './TeamButton.vue';
import GuessModal from './GuessModal.vue';
import ToastNotification from './ToastNotification.vue'; // NOVO: Importe o componente de toast
import { Character, GameStatus, TeamColor } from '../types';
import { proceedToReveal, selectTeam, submitGuess } from '../store/gameStore'; // Importe as funções do gameStore

export default defineComponent({
  name: 'GameImagemOculta',
  components: {
    ImageTiler,
    TeamButton,
    GuessModal,
    ToastNotification, // NOVO: Adicione aos componentes
  },
  props: {
    currentRoundCharacter: {
      type: Object as PropType<Character | null>,
      required: true,
    },
    revealProgress: {
      type: Number,
      required: true,
    },
    gameStatus: {
      type: String as PropType<GameStatus>,
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
  emits: ['select-team', 'submit-guess', 'close-guess-modal'], // Esses emits agora chamarão as funções do gameStore

  setup(props, { emit }) {
    // Função para chamar o selectTeam do gameStore
    const selectTeamFromStore = (team: TeamColor) => {
      selectTeam(team);
      emit('select-team', team); // Mantém o emit para compatibilidade caso o pai esteja ouvindo
    };

    // Função para chamar o submitGuess do gameStore
    const submitGuessFromStore = (guessText: string) => {
      submitGuess(guessText);
      emit('submit-guess', guessText); // Mantém o emit para compatibilidade caso o pai esteja ouvindo
    };

    // Função para obter a cor hexadecimal da equipe para exibição no placar
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
      TeamColor,
      getTeamColorHex,
      proceedToReveal, // Exponha a função para o template
      selectTeamFromStore, // Use esta função no template para os botões das equipes
      submitGuessFromStore, // Use esta função no template para o GuessModal
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

/* NOVO: Estilos para a seção da Dica */
.hint-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 350px; /* Mantém a altura similar à área da imagem para consistência */
  width: 500px; /* Mantém a largura similar à área da imagem */
  background-color: #f8f8f8; /* Um fundo suave para a caixa da dica */
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
  padding: 20px;
  text-align: center;
}

.hint-text {
  font-size: 1.8em;
  font-weight: 600;
  color: #34495e;
  margin-bottom: 30px;
}

.proceed-button {
  background-color: #2ecc71; /* Cor primária, similar ao botão de iniciar */
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 1.3em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.proceed-button:hover {
  background-color: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

/* Estilos existentes */
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