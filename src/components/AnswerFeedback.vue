<!-- src/components/AnswerFeedback.vue -->
<template>
  <div 
    class="answer-feedback-container" 
    @mousemove="handleMouseMove" 
    @mouseleave="handleMouseLeave"
  >
    <!-- Tags de áudio ocultas no DOM -->
    <audio ref="correctAudioRef" src="/sounds/correct-answer.mp3" preload="auto"></audio>
    <audio ref="wrongAudioRef" src="/sounds/fail-answer.mp3" preload="auto"></audio>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';

export default defineComponent({
  name: 'AnswerFeedback',
  emits: ['correct-answer', 'wrong-answer'],
  props: {
    activeTeam: { 
      type: String,
      default: null
    },
    disabledTeams: {
      type: Object,
      default: () => new Set()
    }
  },
  setup(_props, { emit }) {
    const activeEffect = ref<'correct' | 'wrong' | null>(null);
    
    const correctAudioRef = ref<HTMLAudioElement | null>(null);
    const wrongAudioRef = ref<HTMLAudioElement | null>(null);

    const playAudio = (audioElement: HTMLAudioElement | null) => {
      if (audioElement) {
        // Debug para garantir que o elemento existe e tem uma fonte
        console.log('Attempting to play audio element:', audioElement);
        console.log('Audio element src:', audioElement.src);
        console.log('Audio element networkState:', audioElement.networkState, 'readyState:', audioElement.readyState);

        // Adiciona um pequeno atraso antes de tentar tocar
        setTimeout(() => {
          audioElement.currentTime = 0; 
          audioElement.play().catch(e => {
            console.error("Erro ao tocar áudio no elemento DOM (após atraso):", e); 
            if (audioElement) {
              console.error('Audio element src at error time:', audioElement.src);
            }
          }); 
        }, 50); // Atraso de 50ms
      }
    };

    const handleCorrectClick = () => {
      playAudio(correctAudioRef.value); 
      emit('correct-answer');
      activeEffect.value = null; 
    };

    const handleWrongClick = () => {
      playAudio(wrongAudioRef.value); 
      emit('wrong-answer');
      activeEffect.value = null; 
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'o' || event.key === 'O') {
        event.preventDefault();
        handleCorrectClick();
      } else if (event.key === 'x' || event.key === 'X') {
        event.preventDefault();
        handleWrongClick();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const container = event.currentTarget as HTMLElement;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      
      const mouseX = event.clientX - containerRect.left; 
      const containerMidpointX = containerRect.width / 2;

      if (mouseX < containerMidpointX) {
        activeEffect.value = 'correct';
      } else {
        activeEffect.value = 'wrong';
      }
    };

    const handleMouseLeave = () => {
      activeEffect.value = null;
    };

    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown);
      console.log('Correct Audio Ref (onMounted):', correctAudioRef.value);
      console.log('Wrong Audio Ref (onMounted):', wrongAudioRef.value);
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown);
      if (correctAudioRef.value) correctAudioRef.value.pause();
      if (wrongAudioRef.value) wrongAudioRef.value.pause();
    });

    return {
      activeEffect,
      handleCorrectClick,
      handleWrongClick,
      handleMouseMove,
      handleMouseLeave,
      correctAudioRef,
      wrongAudioRef,
    };
  },
});
</script>

<style scoped>
/* Seus estilos CSS permanecem os mesmos */
.answer-feedback-container {
  display: flex;
  gap: 30px; 
  justify-content: center;
  width: 100%;
  max-width: 600px; 
  padding: 20px;
  border-radius: 15px;
  cursor: crosshair; 
}

.feedback-button {
  padding: 20px 40px;
  font-size: 1.8em;
  font-weight: bold;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer; 
  transition: all 0.3s ease;
  flex-grow: 1; 
  max-width: 250px; 
  position: relative;
  overflow: hidden;
}

.correct-button {
  background-color: #2ecc71; 
}

.wrong-button {
  background-color: #e74c3c; 
}

.feedback-button:hover {
  transform: translateY(-5px); 
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.active-glow {
  transform: scale(1.05); 
  border: 3px solid; 
}

.correct-button.active-glow {
    border-color: #76ff03; 
    box-shadow: 0 0 20px 8px rgba(118, 255, 3, 0.6), inset 0 0 10px 4px rgba(178, 255, 89, 0.4);
}

.wrong-button.active-glow {
    border-color: #ff1744; 
    box-shadow: 0 0 20px 8px rgba(255, 23, 68, 0.6), inset 0 0 10px 4px rgba(255, 82, 82, 0.4);
}

@media (max-width: 600px) {
  .answer-feedback-container {
    flex-direction: column; 
    gap: 20px;
    padding: 15px;
  }
  .feedback-button {
    width: 100%; 
    max-width: none; 
    font-size: 1.5em;
    padding: 15px 30px;
  }
}
</style>