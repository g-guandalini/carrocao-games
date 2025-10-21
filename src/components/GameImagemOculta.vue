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
    <!-- Adicionamos uma ref para capturar a largura do elemento -->
    <div v-show="gameStatus !== 'hint'" class="image-display" ref="imageDisplayRef">
      <ImageTiler
        :key="currentRoundCharacter?.id"
        :image-url="currentRoundCharacter?.imageUrl || ''"
        :reveal-progress="revealProgress"
        :grid-size="10"
        :image-width="calculatedImageWidth.value"
        :image-height="calculatedImageHeight.value" 
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
import { defineComponent, ref, onMounted, onUnmounted, PropType } from 'vue'; // Importe ref, onMounted, onUnmounted
import ImageTiler from './ImageTiler.vue';
import TeamButton from './TeamButton.vue';
import GuessModal from './GuessModal.vue';
import ToastNotification from './ToastNotification.vue';
import { Character, GameStatus, TeamColor } from '../types';
import { proceedToReveal, selectTeam, submitGuess } from '../store/gameStore';

export default defineComponent({
  name: 'GameImagemOculta',
  components: {
    ImageTiler,
    TeamButton,
    GuessModal,
    ToastNotification,
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
  emits: ['select-team', 'submit-guess', 'close-guess-modal'],

  setup(_props, { emit }) {
    // --- NOVO: Lógica de responsividade da imagem ---
    const imageDisplayRef = ref<HTMLElement | null>(null);
    const calculatedImageWidth = ref(500); // Valor inicial
    const calculatedImageHeight = ref(350); // Valor inicial
    const originalAspectRatio = 500 / 350; // Aspect ratio da imagem original

    const updateImageDimensions = () => {
      if (imageDisplayRef.value) {
        let newWidth = imageDisplayRef.value.offsetWidth;
        // Limita a largura ao tamanho original máximo de 500px para desktop
        if (newWidth > 500) {
          newWidth = 500;
        }
        calculatedImageWidth.value = newWidth;
        calculatedImageHeight.value = newWidth / originalAspectRatio;
      }
    };

    onMounted(() => {
      updateImageDimensions(); // Calcula as dimensões no carregamento inicial
      window.addEventListener('resize', updateImageDimensions); // Recalcula ao redimensionar a janela
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateImageDimensions); // Remove o listener ao destruir o componente
    });
    // --- FIM: Lógica de responsividade da imagem ---


    const selectTeamFromStore = (team: TeamColor) => {
      selectTeam(team);
      emit('select-team', team);
    };

    const submitGuessFromStore = (guessText: string) => {
      submitGuess(guessText);
      emit('submit-guess', guessText);
    };

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
      proceedToReveal,
      selectTeamFromStore,
      submitGuessFromStore,
      // --- NOVO: Expor as refs e valores calculados para o template ---
      imageDisplayRef,
      calculatedImageWidth,
      calculatedImageHeight,
      // --- FIM ---
    };
  },
});
</script>

<style scoped>
.game-active-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%; /* Garante que ocupe 100% da largura do pai */
  max-width: 800px;
  padding-top: 20px;
}

.hint-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* min-height: 350px; <-- REMOVIDO OU AJUSTADO para ser responsivo */
  min-height: 200px; /* Min-height menor para mobile, ou ajuste conforme o conteúdo */
  width: 100%; /* Ocupa 100% da largura disponível */
  max-width: 500px; /* Limita a largura em telas maiores */
  background-color: #f8f8f8;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
  padding: 20px;
  text-align: center;
  box-sizing: border-box; /* Garante que padding e border sejam incluídos na largura total */
}

.hint-text {
  font-size: 1.8em;
  font-weight: 600;
  color: #34495e;
  margin-bottom: 30px;
}

.proceed-button {
  background-color: #2ecc71;
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

.image-display {
  width: 100%; /* Ocupa 100% da largura disponível */
  /* height: 350px; <-- REMOVIDO, a altura será definida pelo ImageTiler dinamicamente */
  max-width: 500px; /* Limita a largura em telas maiores */
  background-color: #ecf0f1;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 25px;
  min-height: 200px; /* Adiciona um min-height para evitar colapso em mobile */
  box-sizing: border-box; /* Garante que padding e border sejam incluídos na largura total */
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
  box-sizing: border-box; /* Garante que padding e border sejam incluídos na largura total */
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

/* Ajustes para telas menores (mobile) */
@media (max-width: 600px) {
  .hint-text {
    font-size: 1.5em; /* Fonte menor para a dica em mobile */
  }
  .timer-info {
    font-size: 1.1em; /* Fonte menor para info do timer */
  }
  .proceed-button {
    padding: 12px 25px;
    font-size: 1.1em;
  }
  .team-buttons {
    gap: 10px; /* Espaçamento menor entre botões */
  }
  .score-board {
    padding: 15px; /* Padding menor no placar */
  }
  .score-board h2 {
    font-size: 1.5em;
  }
  .score-board li {
    font-size: 1.1em;
  }
}
</style>