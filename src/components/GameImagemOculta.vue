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
    <div v-show="gameStatus !== 'hint'" class="image-display" ref="imageDisplayRef">
      <ImageTiler
        :key="currentRoundCharacter?.id"
        :image-url="currentRoundCharacter?.imageUrl || ''"
        :reveal-progress="revealProgress"
        :grid-size="10"
        :image-width="calculatedImageWidth"
        :image-height="calculatedImageHeight"
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

    <!-- NOVO: Componente de Feedback do Operador -->
    <!-- Visível durante as fases de 'guessing' (quando se espera uma resposta) e 'finished' (para avaliação final) -->
    <AnswerFeedback
      v-if="gameStatus === 'guessing' || gameStatus === 'finished'"
      @correct-answer="handleCorrectAnswer"
      @wrong-answer="handleWrongAnswer"
    />

    <ScoreboardBlocks :score="score" />
  </div>
  <!-- Componente para exibir os toasts -->
  <ToastNotification />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch, nextTick, PropType } from 'vue';
import ImageTiler from './ImageTiler.vue';
import ToastNotification from './ToastNotification.vue';
import ScoreboardBlocks from './ScoreboardBlocks.vue';
import AnswerFeedback from './AnswerFeedback.vue'; // NOVO: Importe o componente AnswerFeedback
import { Character, GameStatus, TeamColor } from '../types';
import { proceedToReveal } from '../store/gameStore'; // Mantém proceedToReveal, mas remove selectTeam e submitGuess

export default defineComponent({
  name: 'GameImagemOculta',
  components: {
    ImageTiler,
    ToastNotification,
    ScoreboardBlocks,
    AnswerFeedback, // NOVO: Registre o componente AnswerFeedback
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
  // O emit 'evaluate-guess' é uma sugestão para a lógica do jogo
  emits: ['evaluate-guess'], // Removidos 'select-team' e 'submit-guess' pois não são mais usados neste componente
  setup(_props, { emit }) {
    const imageDisplayRef = ref<HTMLElement | null>(null);
    const calculatedImageWidth = ref(500);
    const calculatedImageHeight = ref(350);
    const originalAspectRatio = 500 / 350;
    const fixedGridSize = 10;

    const updateImageDimensions = () => {
      if (imageDisplayRef.value) {
        let newWidth = imageDisplayRef.value.offsetWidth;
        if (newWidth > 500) {
          newWidth = 500;
        }
        newWidth = Math.floor(newWidth / fixedGridSize) * fixedGridSize;
        if (newWidth < fixedGridSize) {
            newWidth = fixedGridSize;
        }
        calculatedImageWidth.value = newWidth;
        calculatedImageHeight.value = newWidth / originalAspectRatio;
      }
    };

    watch([() => _props.gameStatus, imageDisplayRef], ([newGameStatus, newImageDisplayRef]) => {
      if (newGameStatus !== 'hint' && newImageDisplayRef) {
        nextTick(() => {
          updateImageDimensions();
        });
      }
    }, { immediate: true });

    onMounted(() => {
      window.addEventListener('resize', updateImageDimensions);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateImageDimensions);
    });

    // NOVO: Funções para lidar com o feedback do operador (Correto/Errado)
    const handleCorrectAnswer = () => {
        console.log('Resposta confirmada como CORRETA!');
        // Aqui você chamaria a lógica da sua store para registrar a pontuação
        // Por exemplo: emit('evaluate-guess', true);
        // Ou diretamente: gameStore.evaluateGuess(true, _props.activeTeam);
        // Estou usando emit para manter a separação de responsabilidades
        emit('evaluate-guess', true);
    };

    const handleWrongAnswer = () => {
        console.log('Resposta confirmada como ERRADA!');
        // Aqui você chamaria a lógica da sua store para não registrar pontos, etc.
        // Por exemplo: emit('evaluate-guess', false);
        // Ou diretamente: gameStore.evaluateGuess(false, _props.activeTeam);
        emit('evaluate-guess', false);
    };

    return {
      proceedToReveal,
      imageDisplayRef,
      calculatedImageWidth,
      calculatedImageHeight,
      handleCorrectAnswer, // NOVO: Exponha para o template
      handleWrongAnswer,   // NOVO: Exponha para o template
      // Removidos `selectTeamFromStore` e `submitGuessFromStore` pois não são usados mais no template atual
    };
  },
});
</script>

<style scoped>
/* Seus estilos CSS para GameImagemOculta.vue permanecem inalterados. */
/* A seção .team-buttons foi removida no template fornecido, então seus estilos também podem ser removidos */

.game-active-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  padding-top: 20px;
}

.hint-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;
  max-width: 500px;
  background-color: #f8f8f8;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
  padding: 20px;
  text-align: center;
  box-sizing: border-box;
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
  width: 100%;
  max-width: 500px;
  background-color: #ecf0f1;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 25px;
  min-height: 200px;
  box-sizing: border-box;
}

.timer-info {
  font-size: 1.3em;
  margin-bottom: 25px;
  color: #555;
  font-weight: 500;
  text-align: center;
}

/* Os estilos para .team-buttons foram removidos, pois o componente TeamButton não está mais no template */
/* Você pode remover a regra @media (max-width: 600px) que se refere a .team-buttons também */
/* ... (Mantenha o restante dos seus estilos se ainda forem relevantes para outros elementos) */
</style>