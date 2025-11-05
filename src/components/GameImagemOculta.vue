<template>
  <div class="game-active-section">
    <!-- Seção da Dica (visível apenas na fase 'hint') -->
    <div v-if="gameStatus === 'hint' && currentRoundCharacter" class="hint-container">
      <span class="hint-label">A Dica é:</span>
      <p class="hint-content">
        {{ displayedHint }}<span v-if="isTyping" class="blinking-cursor">|</span>
      </p>
      <button @click="stopTypingAndProceed" class="proceed-button">
        Prosseguir para a Imagem
      </button>
    </div>

    <!-- Exibição da Imagem (visível em todas as fases, exceto 'hint' e 'scoreboard') -->
    <div v-show="gameStatus !== 'hint' && gameStatus !== 'scoreboard'" class="image-display" ref="imageDisplayRef">
      <ImageTiler
        :key="currentRoundCharacter?.id"
        :image-url="currentRoundCharacter?.imageUrl || ''"
        :reveal-progress="revealProgress"
        :grid-size="10"
        :image-width="calculatedImageWidth"
        :image-height="calculatedImageHeight"
      />
    </div>

    <!-- Texto de instrução sem quebras de linha indesejadas -->
    <p class="timer-info" v-if="gameStatus === 'revealing'">
      Pressione <strong style="color: blue;">1 (Azul)</strong>, <strong style="color: red;">2 (Vermelho)</strong>, <strong style="color: green;">3 (Verde)</strong> ou <strong style="color: yellow;">4 (Amarelo)</strong> para palpitar!
    </p>
    <!-- Mensagem "Aguardando resposta da equipe" -->
    <p class="timer-info guessing-message" v-if="gameStatus === 'guessing' && activeTeam">
      Aguardando resposta da equipe <strong :style="{ color: teamColorToHex(activeTeam) }">{{ activeTeam }}</strong>! ⏳
      <!-- Exibe a pontuação potencial da rodada -->
      <br>Pontos em jogo: <strong>{{ currentPotentialRoundScore }}</strong>
    </p>
    <!-- Container para a mensagem finalizada e o botão "Ver Placar" -->
    <div v-if="gameStatus === 'finished'" class="finished-status-container">
      <p class="timer-info no-margin-bottom">
        Rodada finalizada! Resposta Correta: <strong>{{ currentRoundCharacter?.name }}</strong>
      </p>
      <button @click="viewImagemOcultaScoreboard" class="view-scoreboard-button"> <!-- ATUALIZADO AQUI -->
        Ver Placar
      </button>
    </div>

    <!-- Componente de Feedback do Operador - Visível apenas na fase 'guessing' -->
    <AnswerFeedback
      v-if="gameStatus === 'guessing'"
      @correct-answer="handleCorrectAnswer"
      @wrong-answer="handleWrongAnswer"
    />

    <!-- Componente para exibir os toasts -->
    <ToastNotification />

    <!-- Elementos de áudio -->
    <audio ref="typingAudio" src="/sounds/typing-sound.mp3" preload="auto" loop></audio>
    <audio ref="correctAnswerAudio" src="/sounds/correct-answer.mp3" preload="auto"></audio>
    <audio ref="failAnswerAudio" src="/sounds/fail-answer.mp3" preload="auto"></audio>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch, nextTick, computed, PropType } from 'vue';
import ImageTiler from './ImageTiler.vue';
import ToastNotification from './ToastNotification.vue';
import AnswerFeedback from './AnswerFeedback.vue';
import { Character, GameStatus, TeamColor } from '../types';
import { 
  proceedToRevealImagemOculta, // ATUALIZADO: Usando o nome correto
  viewImagemOcultaScoreboard // ATUALIZADO: Usando o nome correto
} from '../store/imagemOcultaStore'; // Importando do store
import { scoreStore } from '../store/scoreStore'; // Importar scoreStore para acessar o score atual

export default defineComponent({
  name: 'GameImagemOculta',
  components: {
    ImageTiler,
    ToastNotification,
    AnswerFeedback,
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
    // REMOVIDO: A prop 'score' não é mais necessária aqui, pois será acessada via scoreStore.
    // score: {
    //   type: Object as PropType<Record<TeamColor, number>>,
    //   required: true,
    // },
  },
  emits: ['evaluate-guess', 'view-scoreboard'], 
  setup(_props, { emit }) {
    const imageDisplayRef = ref<HTMLElement | null>(null);
    const typingAudio = ref<HTMLAudioElement | null>(null);
    const correctAnswerAudio = ref<HTMLAudioElement | null>(null);
    const failAnswerAudio = ref<HTMLAudioElement | null>(null);

    const calculatedImageWidth = ref(960);
    const calculatedImageHeight = ref(540);
    const originalAspectRatio = 16 / 9;
    const fixedGridSize = 10;

    const displayedHint = ref('');
    const isTyping = ref(false);
    let typingInterval: number | null = null;

    // ----- NOVA PROPRIEDADE COMPUTADA PARA A PONTUAÇÃO DA RODADA -----
    const currentPotentialRoundScore = computed(() => {
      const initialScore = 100;
      const tilesRevealed = Math.floor(_props.revealProgress * 100);
      const deductedPoints = tilesRevealed;
      return Math.max(0, initialScore - deductedPoints);
    });
    // ------------------------------------------------------------------

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
        typingAudio.value.play().catch(e => console.warn("Autoplay de áudio bloqueado:", e));
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
      proceedToRevealImagemOculta(); // ATUALIZADO: Usando o nome correto
    };

    const updateImageDimensions = () => {
      if (imageDisplayRef.value) {
        let newWidth = imageDisplayRef.value.offsetWidth;
        if (newWidth > 960) {
          newWidth = 960;
        }
        newWidth = Math.floor(newWidth / fixedGridSize) * fixedGridSize;
        if (newWidth < fixedGridSize) {
            newWidth = fixedGridSize;
        }
        calculatedImageWidth.value = newWidth;
        calculatedImageHeight.value = newWidth / originalAspectRatio;
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

      // Garante que o redimensionamento ocorra se a imagem for visível
      if (newGameStatus !== 'hint' && newGameStatus !== 'scoreboard' && newImageDisplayRef) {
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
      stopTypingAndAudio();
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
        if (correctAnswerAudio.value) {
            correctAnswerAudio.value.currentTime = 0;
            correctAnswerAudio.value.play().catch(e => console.warn("Autoplay de som de acerto bloqueado:", e));
        }
        // Emite true para acerto e a pontuação calculada
        emit('evaluate-guess', true, currentPotentialRoundScore.value);
    };

    const handleWrongAnswer = () => {
        console.log('Resposta confirmada como ERRADA!');
        if (failAnswerAudio.value) {
            failAnswerAudio.value.currentTime = 0;
            failAnswerAudio.value.play().catch(e => console.warn("Autoplay de som de erro bloqueado:", e));
        }
        // Emite false para erro e 0 pontos
        emit('evaluate-guess', false, 0);
    };

    return {
      stopTypingAndProceed,
      imageDisplayRef,
      typingAudio,
      correctAnswerAudio,
      failAnswerAudio,
      displayedHint,
      isTyping,
      currentPotentialRoundScore, 
      calculatedImageWidth,
      calculatedImageHeight,
      handleCorrectAnswer,
      handleWrongAnswer,
      teamColorToHex,
      viewImagemOcultaScoreboard, // ATUALIZADO: Retornar para o template
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
  max-width: 1060px;
  padding-top: 20px;
}

.hint-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  width: 100%;
  max-width: 700px;
  background-color: #fcfcfc;
  border-radius: 15px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 35px;
  padding: 30px;
  text-align: center;
  box-sizing: border-box;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.hint-label {
  font-size: 1.1em;
  font-weight: 500;
  color: #7f8c8d;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.hint-content {
  font-family: 'monospace', 'Courier New', Courier, monospace;
  font-size: 2.2em;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 40px;
  line-height: 1.4;
  white-space: pre-wrap;
  min-height: 3em;
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

.proceed-button {
  background-color: #3498db;
  color: white;
  padding: 16px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1.3em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.proceed-button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
}

.image-display {
  width: 100%;
  max-width: 960px;
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

.timer-info.no-margin-bottom {
  margin-bottom: 0;
}

.guessing-message {
  font-size: 1.5em;
  font-weight: bold;
  color: #34495e;
}

.finished-status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.view-scoreboard-button {
  background-color: #3498db;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.view-scoreboard-button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}
</style>