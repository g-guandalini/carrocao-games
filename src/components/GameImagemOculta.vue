<template>
  <div class="game-active-section">
    <!-- Componente de Fogos de Artifício, visível apenas quando showFireworks for true -->
    <FireworksCanvas :color="winningTeamColorHex || '#FFFFFF'" :trigger="showFireworks" />

    <!-- Seção da Dica (visível apenas na fase 'hint') -->
    <div v-if="gameStatus === 'hint' && currentRoundCharacter" class="hint-container">
      <span class="hint-label">A Dica é:</span>
      <p class="hint-content">
        {{ displayedHint }}<span v-if="isTyping" class="blinking-cursor">|</span>
      </p>
    </div>

    <!-- Exibição da Imagem (visível em todas as fases, exceto 'hint' e 'scoreboard') -->
    <div v-show="gameStatus !== 'hint' && gameStatus !== 'scoreboard'"
         class="image-display"
         ref="imageDisplayRef">
      <!-- NOVO: image-frame-container para envolver o ImageTiler e aplicar a borda dinamicamente -->
      <div class="image-frame-container"
           :style="{
             borderColor: imageBorderColor ? imageBorderColor : 'transparent',
             width: imageFrameComputedWidth,
             height: imageFrameComputedHeight
           }">
        <ImageTiler
          :key="currentRoundCharacter?.id"
          :image-url="currentRoundCharacter?.imageUrl || ''"
          :reveal-progress="revealProgress"
          :grid-size="10"
          :image-width="calculatedImageWidth"
          :image-height="calculatedImageHeight"
          class="image-tiler-content"
        />
      </div>
    </div>

    <!-- Texto "Pontos em jogo" visível durante as fases 'guessing' ou 'revealing' -->
    <p class="game-info-text" v-if="gameStatus === 'guessing' || gameStatus === 'revealing'">
      Pontos em jogo: <strong>{{ currentPotentialRoundScore }}</strong>
    </p>

    <!-- Exibição da resposta correta quando o jogo está finalizado -->
    <p class="game-info-text" v-if="gameStatus === 'finished' && currentRoundCharacter">
      Resposta: <strong>{{ currentRoundCharacter?.name }}</strong>
    </p>

    <!-- Componente de Feedback do Operador - Visível apenas na fase 'guessing' -->
    <AnswerFeedback
      v-if="gameStatus === 'guessing'"
      @correct-answer="handleCorrectAnswer"
      @wrong-answer="handleWrongAnswer"
    />

    <!-- Componente para exibir os toasts -->
    <ToastNotification />

    <!-- Elemento de áudio para som de digitação (MANTIDO) -->
    <audio ref="typingAudio" src="/sounds/typing-sound.mp3" preload="auto" loop></audio>
    <!-- NOVO: Elemento de áudio para som de resposta correta -->
    <audio ref="correctAnswerAudio" src="/sounds/correct-answer.mp3" preload="auto"></audio>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch, nextTick, computed, PropType } from 'vue';
import ImageTiler from './ImageTiler.vue';
import ToastNotification from './ToastNotification.vue';
import AnswerFeedback from './AnswerFeedback.vue';
import FireworksCanvas from './FireworksCanvas.vue';
import { Character, GameStatus, TeamColor } from '../types';
import {
  proceedToRevealImagemOculta,
  viewImagemOcultaScoreboard
} from '../store/imagemOcultaStore';

export default defineComponent({
  name: 'GameImagemOculta',
  components: {
    ImageTiler,
    ToastNotification,
    AnswerFeedback,
    FireworksCanvas,
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
  },
  emits: ['evaluate-guess', 'view-scoreboard', 'start-new-round-imagem-oculta'],
  setup(_props, { emit }) {
    const imageDisplayRef = ref<HTMLElement | null>(null);
    const typingAudio = ref<HTMLAudioElement | null>(null);
    const correctAnswerAudio = ref<HTMLAudioElement | null>(null); // NOVO: Ref para o áudio de resposta correta

    const calculatedImageWidth = ref(0); // Dimensões do CONTEÚDO da imagem (para ImageTiler)
    const calculatedImageHeight = ref(0); // Dimensões do CONTEÚDO da imagem (para ImageTiler)

    const imageFrameComputedWidth = ref('0px'); // Dimensões do wrapper da borda (CONTEÚDO + BORDA)
    const imageFrameComputedHeight = ref('0px'); // Dimensões do wrapper da borda (CONTEÚDO + BORDA)

    const originalAspectRatio = 16 / 9;
    const fixedGridSize = 10;
    const BORDER_SIZE_PX = 20;

    const displayedHint = ref('');
    const isTyping = ref(false);
    let typingInterval: ReturnType<typeof setInterval> | null = null;

    const winningTeamColorHex = ref<string | null>(null);
    const showFireworks = ref(false);
    let fireworksTimeout: ReturnType<typeof setTimeout> | null = null;

    const currentPotentialRoundScore = computed(() => {
      const initialScore = 100;
      const tilesRevealed = Math.floor(_props.revealProgress * 100);
      const deductedPoints = tilesRevealed;
      return Math.max(0, initialScore - deductedPoints);
    });

    const imageBorderColor = computed(() => {
      if (_props.gameStatus === 'guessing' && _props.activeTeam) {
        return teamColorToHex(_props.activeTeam);
      }
      return '';
    });

    const typeHint = (fullHint: string) => {
      if (typingInterval !== null) clearInterval(typingInterval);

      if (typingAudio.value) {
        typingAudio.value.pause();
        typingAudio.value.currentTime = 0;
      }

      displayedHint.value = '';
      isTyping.value = true;

      let charIndex = 0;
      const typingSpeed = 77;

      if (typingAudio.value) {
        typingAudio.value.play().catch(e => console.warn("Autoplay de audio de digitação bloqueado:", e));
      }

      typingInterval = setInterval(() => {
        if (charIndex < fullHint.length) {
          displayedHint.value += fullHint[charIndex];
          charIndex++;
        } else {
          if (typingInterval !== null) clearInterval(typingInterval);
          typingInterval = null;
          isTyping.value = false;
          if (typingAudio.value) typingAudio.value.pause();
        }
      }, typingSpeed);
    };

    const stopTypingAndAudio = () => {
      if (typingInterval !== null) clearInterval(typingInterval);
      typingInterval = null;
      isTyping.value = false;
      if (typingAudio.value) {
        typingAudio.value.pause();
        typingAudio.value.currentTime = 0;
      }
    };

    const stopTypingAndProceed = () => {
      stopTypingAndAudio();
      proceedToRevealImagemOculta();
    };

    const updateImageDimensions = () => {
      if (imageDisplayRef.value) {
        const availableWidthForDisplay = Math.floor(imageDisplayRef.value.offsetWidth);
        const availableHeightForDisplay = Math.floor(imageDisplayRef.value.offsetHeight);

        const contentWidthLimit = availableWidthForDisplay - (2 * BORDER_SIZE_PX);
        const contentHeightLimit = availableHeightForDisplay - (2 * BORDER_SIZE_PX);

        let finalImageContentWidth: number;
        let finalImageContentHeight: number;

        if (contentWidthLimit <= 0 || contentHeightLimit <= 0) {
          if (calculatedImageWidth.value !== 0) calculatedImageWidth.value = 0;
          if (calculatedImageHeight.value !== 0) calculatedImageHeight.value = 0;
          if (imageFrameComputedWidth.value !== '0px') imageFrameComputedWidth.value = '0px';
          if (imageFrameComputedHeight.value !== '0px') imageFrameComputedHeight.value = '0px';
          return;
        }

        if (contentWidthLimit / contentHeightLimit > originalAspectRatio) {
          finalImageContentHeight = contentHeightLimit;
          finalImageContentWidth = contentHeightLimit * originalAspectRatio;
        } else {
          finalImageContentWidth = contentWidthLimit;
          finalImageContentHeight = contentWidthLimit / originalAspectRatio;
        }

        finalImageContentWidth = Math.floor(finalImageContentWidth / fixedGridSize) * fixedGridSize;
        finalImageContentHeight = Math.floor(finalImageContentHeight / fixedGridSize) * fixedGridSize;

        if (finalImageContentWidth < fixedGridSize) finalImageContentWidth = fixedGridSize;
        if (finalImageContentHeight < fixedGridSize) finalImageContentHeight = fixedGridSize;

        if (calculatedImageWidth.value !== finalImageContentWidth) {
          calculatedImageWidth.value = finalImageContentWidth;
        }
        if (calculatedImageHeight.value !== finalImageContentHeight) {
          calculatedImageHeight.value = finalImageContentHeight;
        }

        const newFrameWidth = `${finalImageContentWidth + (2 * BORDER_SIZE_PX)}px`;
        const newFrameHeight = `${finalImageContentHeight + (2 * BORDER_SIZE_PX)}px`;

        if (imageFrameComputedWidth.value !== newFrameWidth) {
          imageFrameComputedWidth.value = newFrameWidth;
        }
        if (imageFrameComputedHeight.value !== newFrameHeight) {
          imageFrameComputedHeight.value = newFrameHeight;
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (_props.gameStatus === 'finished') {
        if (event.code === 'Space') {
          event.preventDefault();
          emit('start-new-round-imagem-oculta');
          return;
        } else if (event.key.toLowerCase() === 'p') {
          event.preventDefault();
          viewImagemOcultaScoreboard();
          return;
        }
      }

      if (event.code === 'Space' && _props.gameStatus === 'hint') {
        event.preventDefault();
        stopTypingAndProceed();
        return;
      }
    };

    watch([() => _props.gameStatus, imageDisplayRef, () => _props.currentRoundCharacter], ([newGameStatus, newImageDisplayRef, newCharacter]) => {
      if (newGameStatus === 'hint' && newCharacter?.hint) {
        nextTick(() => {
          typeHint(newCharacter.hint);
        });
      } else {
        stopTypingAndAudio();
      }

      if (newGameStatus !== 'hint' && newGameStatus !== 'scoreboard' && newImageDisplayRef) {
        nextTick(() => {
          updateImageDimensions();
        });
      }
      if (newGameStatus !== 'guessing' && newGameStatus !== 'finished') {
          showFireworks.value = false;
          winningTeamColorHex.value = null;
          if (fireworksTimeout) {
            clearTimeout(fireworksTimeout);
            fireworksTimeout = null;
          }
      }
    }, { immediate: true });

    onMounted(() => {
      window.addEventListener('resize', updateImageDimensions);
      window.addEventListener('keydown', handleKeyDown);
      nextTick(() => {
        updateImageDimensions();
      });
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateImageDimensions);
      window.removeEventListener('keydown', handleKeyDown);
      stopTypingAndAudio();
      if (fireworksTimeout) {
        clearTimeout(fireworksTimeout);
        fireworksTimeout = null;
      }
    });

    const teamColorToHex = (team: TeamColor | null) => {
      switch (team) {
        case TeamColor.BLUE: return '#3498db';
        case TeamColor.RED: return '#e74c3c';
        case TeamColor.GREEN: return '#2ecc71';
        case TeamColor.YELLOW: return '#f1c40f';
        default: return '#555';
      }
    };

    const handleCorrectAnswer = () => {
        console.log('Resposta confirmada como CORRETA!');
        // NOVO: Tocar som de resposta correta
        if (correctAnswerAudio.value) {
            correctAnswerAudio.value.currentTime = 0; // Reinicia o áudio se já estiver tocando
            correctAnswerAudio.value.play().catch(e => console.warn("Autoplay de audio de resposta correta bloqueado:", e));
        }

        if (_props.activeTeam) {
          winningTeamColorHex.value = teamColorToHex(_props.activeTeam);
          showFireworks.value = true;
          if (fireworksTimeout) clearTimeout(fireworksTimeout);
          fireworksTimeout = setTimeout(() => {
            showFireworks.value = false;
            fireworksTimeout = null;
          }, 2000);
        }
        emit('evaluate-guess', true, currentPotentialRoundScore.value);
    };

    const handleWrongAnswer = () => {
        console.log('Resposta confirmada como ERRADA!');
        showFireworks.value = false;
        if (fireworksTimeout) {
          clearTimeout(fireworksTimeout);
          fireworksTimeout = null;
        }
        emit('evaluate-guess', false, 0);
    };

    return {
      stopTypingAndProceed,
      imageDisplayRef,
      typingAudio,
      correctAnswerAudio, // NOVO: Retorna a ref do áudio de resposta correta
      displayedHint,
      isTyping,
      currentPotentialRoundScore,
      calculatedImageWidth,
      calculatedImageHeight,
      imageFrameComputedWidth,
      imageFrameComputedHeight,
      handleCorrectAnswer,
      handleWrongAnswer,
      teamColorToHex,
      imageBorderColor,
      winningTeamColorHex,
      showFireworks,
      viewImagemOcultaScoreboard,
    };
  },
});
</script>

<style scoped>
/* REMOVIDO: Estilos globais para html, body, e box-sizing. Agora estão em App.vue. */

.game-active-section {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  height: 100%; /* Ocupa 100% da altura do PARENT (agora, o main-content-area flexível) */
  overflow: hidden; /* Garante que NADA transborde deste container */
  box-sizing: border-box;
  padding: 10px;
  gap: 20px;
}

.full-content-area {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 30px;
}

.hint-container {
  flex-grow: 1;
  width: 100%;
  max-width: 1200px;
  background-color: #fcfcfc;
  border-radius: 22.5px;
  box-shadow: 0 9px 22.5px rgba(0, 0, 0, 0.1);
  padding: 45px;
  text-align: center;
  box-sizing: border-box;
  border: 1.5px solid #e0e0e0;
  transition: all 0.3s ease;
  min-height: 375px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.hint-label {
  font-size: 2.2em;
  font-weight: 500;
  color: #7f8c8d;
  margin-bottom: 30px;
  text-transform: uppercase;
  letter-spacing: 2.5px;
}

.hint-content {
  font-family: 'monospace', 'Courier New', Courier, monospace;
  font-size: 5.5em;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 60px;
  line-height: 1.2;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 5em;
}

.blinking-cursor {
  font-weight: 300;
  color: #2c3e50;
  animation: blink 0.7s infinite;
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}

.image-display {
  flex-grow: 1;
  flex-shrink: 1; /* Permite que o item encolha */
  min-height: 0;  /* Permite que ele encolha abaixo do tamanho de seu conteúdo */
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: transparent;
  border-radius: 0;
  box-sizing: border-box;
  box-shadow: none;
  overflow: hidden; /* Garante que o image-frame-container não transborde */
}

.image-frame-container {
  box-sizing: border-box;
  border: 20px solid transparent;
  transition: border-color 0.2s ease-in-out;
  border-radius: 0;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-tiler-content {
  display: block;
}

.game-info-text {
  font-size: 2.2em;
  color: #34495e;
  font-weight: 500;
  text-align: center;
  width: 100%;
  flex-shrink: 0; /* Impede que esses elementos encolham */
}

.finished-status-container {
  gap: 30px;
}

.view-scoreboard-button {
  background-color: #3498db;
  color: white;
  padding: 24px 48px;
  border: none;
  border-radius: 12px;
  font-size: 2em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 6px 9px rgba(0, 0, 0, 0.1);
}

.view-scoreboard-button:hover {
  background-color: #2980b9;
  transform: translateY(-3px);
  box-shadow: 0 9px 15px rgba(0, 0, 0, 0.15);
}
</style>