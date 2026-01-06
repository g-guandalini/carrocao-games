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
      <div class="image-frame-container"
           :style="{
             border: imageBorderColor ? `${BORDER_SIZE_PX}px solid ${imageBorderColor}` : 'none',
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

    <!-- Texto de informação do jogo, agora usando v-if para remover do DOM quando não relevante -->
    <p v-if="gameStatus === 'guessing' || gameStatus === 'revealing' || gameStatus === 'finished'"
       class="game-info-text">
      <template v-if="gameStatus === 'guessing' || gameStatus === 'revealing'">
        Pontos em jogo: <strong>{{ currentPotentialRoundScore }}</strong>
      </template>
      <template v-else-if="gameStatus === 'finished' && currentRoundCharacter">
        Resposta: <strong>{{ currentRoundCharacter?.name }}</strong>
      </template>
    </p>

    <!-- Wrapper para o Componente de Feedback do Operador - Sempre presente para manter o layout -->
    <div class="answer-feedback-wrapper">
      <AnswerFeedback
        v-show="gameStatus === 'guessing'"
        @correct-answer="handleCorrectAnswer"
        @wrong-answer="handleWrongAnswer"
      />
    </div>

    <!-- Componente para exibir os toasts -->
    <ToastNotification />

    <!-- Elemento de áudio para som de digitação (MANTIDO) -->
    <audio ref="typingAudio" src="/sounds/typing-sound.mp3" preload="auto" loop></audio>
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

    const calculatedImageWidth = ref(0); // Dimensões do CONTEÚDO da imagem (para ImageTiler)
    const calculatedImageHeight = ref(0); // Dimensões do CONTEÚDO da imagem (para ImageTiler)

    const imageFrameComputedWidth = ref('0px'); // Dimensões do wrapper da borda (CONTEÚDO + BORDA)
    const imageFrameComputedHeight = ref('0px'); // Dimensões do wrapper da borda (CONTEÚDO + BORDA)

    const originalAspectRatio = 16 / 9;
    const fixedGridSize = 10;
    const BORDER_SIZE_PX = 20; // A espessura da borda desejada quando ativa

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
      return ''; // Retorna string vazia se não houver borda ativa
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
        const availableWidthForFrame = Math.floor(imageDisplayRef.value.offsetWidth);
        const availableHeightForFrame = Math.floor(imageDisplayRef.value.offsetHeight);

        let frameTargetWidth: number;
        let frameTargetHeight: number;

        // Determina o tamanho máximo que o `image-frame-container` (elemento externo) deve ocupar,
        // mantendo a proporção dentro do espaço disponível do pai.
        if (availableWidthForFrame / availableHeightForFrame > originalAspectRatio) {
            frameTargetHeight = availableHeightForFrame;
            frameTargetWidth = availableHeightForFrame * originalAspectRatio;
        } else {
            frameTargetWidth = availableWidthForFrame;
            frameTargetHeight = availableWidthForFrame / originalAspectRatio;
        }

        // Garante que as dimensões sejam positivas
        frameTargetWidth = Math.max(0, frameTargetWidth);
        frameTargetHeight = Math.max(0, frameTargetHeight);

        // Define as dimensões computadas do frame. Estas são as dimensões *externas* do contêiner.
        imageFrameComputedWidth.value = `${frameTargetWidth}px`;
        imageFrameComputedHeight.value = `${frameTargetHeight}px`;

        // Agora calcula as dimensões para o ImageTiler (o conteúdo dentro do frame).
        // Isso depende se uma borda está *atualmente* sendo aplicada.
        // Se a borda está ativa, o conteúdo interno deve ser menor, se não, deve preencher o frame.
        const currentBorderEffectiveThickness = _props.gameStatus === 'guessing' && _props.activeTeam ? BORDER_SIZE_PX : 0;

        let innerContentWidth = Math.max(0, frameTargetWidth - (2 * currentBorderEffectiveThickness));
        let innerContentHeight = Math.max(0, frameTargetHeight - (2 * currentBorderEffectiveThickness));

        // Ajusta o conteúdo interno para ser um múltiplo do gridSize
        calculatedImageWidth.value = Math.floor(innerContentWidth / fixedGridSize) * fixedGridSize;
        calculatedImageHeight.value = Math.floor(innerContentHeight / fixedGridSize) * fixedGridSize;

        // Garante um tamanho mínimo para o ImageTiler
        if (calculatedImageWidth.value < fixedGridSize) calculatedImageWidth.value = fixedGridSize;
        if (calculatedImageHeight.value < fixedGridSize) calculatedImageHeight.value = fixedGridSize;

        // Garante que as dimensões do ImageTiler não sejam negativas
        calculatedImageWidth.value = Math.max(0, calculatedImageWidth.value);
        calculatedImageHeight.value = Math.max(0, calculatedImageHeight.value);

      } else {
        calculatedImageWidth.value = 0;
        calculatedImageHeight.value = 0;
        imageFrameComputedWidth.value = '0px';
        imageFrameComputedHeight.value = '0px';
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

      // Chamar updateImageDimensions SEMPRE que o gameStatus mudar,
      // para recalcular as dimensões da imagem/tiler com base na borda ativa/inativa
      // e também quando o ImageDisplayRef ou Character mudam para reavaliar as dimensões.
      if (newImageDisplayRef) {
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
      BORDER_SIZE_PX,
    };
  },
});
</script>

<style scoped>
/* REMOVIDO: Estilos globais para html, body, e box-sizing. Agora estão em App.vue. */

.game-active-section {
  display: flex;
  flex-direction: column;
  justify-content: center; /* CENTRALIZA O CONTEÚDO VERTICALMENTE */
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
  /* flex-grow: 1; REMOVIDO - para que a altura seja definida pelo conteúdo */
  width: 100%;
  max-width: 1200px;
  background-color: #fcfcfc;
  border-radius: 22.5px;
  box-shadow: 0 9px 22.5px rgba(0, 0, 0, 0.1);
  padding: 60px;
  text-align: center;
  box-sizing: border-box;
  border: 1.5px solid #e0e0e0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 200px;
  /* margin-top: auto; REMOVIDO - centralização feita pelo pai */
  /* margin-bottom: auto; REMOVIDO - centralização feita pelo pai */
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
  min-height: 6em; /* AQUI ESTÁ A ALTERAÇÃO: Aumentado o min-height para garantir espaço vertical */
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
  transition: border-color 0.2s ease-in-out, border 0.2s ease-in-out; /* Adicionado transição para a propriedade 'border' */
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
  font-size: 3.2em; /* AQUI ESTÁ A ALTERAÇÃO: Aumentado o font-size */
  color: #34495e;
  font-weight: 500;
  text-align: center;
  width: 100%;
  flex-shrink: 0; /* Impede que esses elementos encolham */
  min-height: 1.2em; /* Garante que o elemento ocupe um mínimo de altura */
}

.game-info-text strong {
  font-weight: 700; /* Novo estilo para dar mais destaque ao valor/resposta */
  color: #2c3e50; /* Nova cor para o valor/resposta */
}

/* .u-hidden-text-placeholder foi removido, pois o v-if já cuida da remoção do DOM */

.answer-feedback-wrapper {
  /* ESTE É O NOVO BLOCO CSS CHAVE */
  /* Ajuste este min-height conforme a altura que o AnswerFeedback ocupa quando visível */
  min-height: 100px; /* Valor exemplo. Inspecione o AnswerFeedback para um valor preciso. */
  display: flex; /* Para centralizar o AnswerFeedback quando visível */
  justify-content: center;
  align-items: center;
  flex-shrink: 0; /* Impede que o wrapper encolha */
  width: 100%; /* Ocupa a largura total para alinhamento */
  box-sizing: border-box;
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