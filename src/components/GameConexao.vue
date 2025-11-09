<template>
  <div class="game-conexao-container">
    <!-- Componente de Fogos de Artifício, visível apenas quando showFireworks for true -->
    <FireworksCanvas :color="winningTeamColorHex || '#FFFFFF'" :trigger="showFireworks" />

    <!-- Imagem da Conexão -->
    <div class="image-display-area">
      <img
          v-if="currentRoundConexao?.imageUrl"
          :src="baseURL + currentRoundConexao.imageUrl"
          alt="Conexao"
          class="game-image"
          :style="{ border: imageBorderColor ? '10px solid ' + imageBorderColor : 'none' }"
      />
    </div>

    <!-- ÁREA PARA PONTOS, PALAVRA E CONTROLES -->
    <div class="bottom-content-area">
      <!-- Informação de quantos pontos está valendo a rodada -->
      <!-- AJUSTE: Ocultar quando o gameStatus for 'finished' -->
      <div v-if="gameStatus !== 'finished'" class="round-score-display">
        <p>Pontos da Rodada: <span class="score-value">{{ currentPotentialScore }}</span></p>
      </div>

      <!-- Palavra sendo revelada -->
      <div class="word-display">
        <span v-for="(char, index) in formattedPalavra" :key="index" class="letter"
              :class="{ 'revealed': char !== '_' && char !== ' ' }"
              :style="gameStatus === 'finished' && winningTeamColorHex ? { color: winningTeamColorHex } : {}">
            {{ char }}
        </span>
      </div>

      <!-- Controles do Jogo (visualmene ocultos, mas presentes no DOM) -->
      <div class="game-controls">
        <div v-if="gameStatus === 'guessing' && activeTeam" class="guessing-state">
          <!-- Passando activeTeam e disabledTeams para AnswerFeedback -->
          <AnswerFeedback
              :activeTeam="activeTeam"
              :disabledTeams="disabledTeams"
              @correct-answer="evaluateGuess(true, 0)"
              @wrong-answer="evaluateGuess(false, 0)"
          />
        </div>
        <div v-if="gameStatus === 'finished'" class="finished-state">
          <!-- O botão "Ver Placar" ainda existe como alternativa ao 'P' -->
          <button @click="viewConexaoScoreboard" class="btn-action info">Ver Placar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Conexao, GameStatus, TeamColor } from '../types';
import AnswerFeedback from './AnswerFeedback.vue';
import FireworksCanvas from './FireworksCanvas.vue';

export default defineComponent({
  name: 'GameConexao',
  components: {
    AnswerFeedback,
    FireworksCanvas,
  },
  props: {
    currentRoundConexao: {
      type: Object as PropType<Conexao | null>,
      required: true,
    },
    revealedLettersCount: {
      type: Number,
      required: true,
    },
    gameStatus: {
      type: String as PropType<GameStatus>,
      required: true,
    },
    activeTeam: {
      type: [String, null] as PropType<TeamColor | null>,
      required: true,
    },
    disabledTeams: {
      type: Object as PropType<Set<TeamColor>>,
      required: true,
    },
    currentPotentialScore: {
      type: Number,
      required: true,
    },
  },
  // ADIÇÃO: 'start-new-round' foi adicionado aos eventos emitidos
  emits: ['evaluate-guess', 'view-scoreboard', 'start-new-round'],
  setup(props, { emit }) {

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    const imageBorderColor = ref('');
    const showGameFinishedOverlay = ref(false);
    const isColorSelectionLocked = ref(false);
    const winningTeamColorHex = ref<string | null>(null);
    const showFireworks = ref(false);
    let fireworksTimeout: ReturnType<typeof setTimeout> | null = null;

    const teamNameToHex: Record<string, string> = {
      'Azul': '#3498db',
      'Vermelho': '#e74c3c',
      'Verde': '#2ecc71',
      'Amarelo': '#f1c40f',
    };

    watch(() => props.gameStatus, (newStatus, oldStatus) => {
      console.log(`[GameConexao Watcher DEBUG] Novo Status: ${newStatus}, Status Anterior: ${oldStatus}`);
      console.log(`[GameConexao Watcher DEBUG] Valor de props.activeTeam NO INÍCIO do watcher: ${props.activeTeam}`);

      if (newStatus === 'finished') {
        showGameFinishedOverlay.value = true;
        if (oldStatus !== 'finished' && props.activeTeam) {
          console.log(`[GameConexao Watcher DEBUG] Condição interna de fogos ATENDIDA.`);
          winningTeamColorHex.value = teamNameToHex[props.activeTeam];
          console.log(`[GameConexao Watcher DEBUG] teamNameToHex[props.activeTeam] resultou em: ${winningTeamColorHex.value}`);

          showFireworks.value = true;
          console.log('Fireworks activated.');
          console.log(`[GameConexao Watcher DEBUG] Cor FINAL sendo enviada para FireworksCanvas: ${winningTeamColorHex.value}`);

          if (fireworksTimeout) clearTimeout(fireworksTimeout);
          fireworksTimeout = setTimeout(() => {
            showFireworks.value = false;
            console.log('Fireworks deactivated after 2 seconds.');
            fireworksTimeout = null;
          }, 2000);
        } else {
          console.log(`[GameConexao Watcher DEBUG] Condição interna de fogos NÃO atendida.`);
          console.log(`[GameConexao Watcher DEBUG] oldStatus !== 'finished': ${oldStatus !== 'finished'}`);
          console.log(`[GameConexao Watcher DEBUG] props.activeTeam é válido: ${!!props.activeTeam}, valor: ${props.activeTeam}`);
        }
      } else {
        showGameFinishedOverlay.value = false;
        imageBorderColor.value = '';
        isColorSelectionLocked.value = false;
        winningTeamColorHex.value = null;
        showFireworks.value = false;
        console.log('Game status changed, resetting visual states.');

        if (fireworksTimeout) {
          clearTimeout(fireworksTimeout);
          fireworksTimeout = null;
        }
      }
    }, { immediate: true });

    const evaluateGuess = (isCorrect: boolean, scoreAwarded: number) => {
      isColorSelectionLocked.value = false;
      emit('evaluate-guess', isCorrect, scoreAwarded);
    };

    const viewConexaoScoreboard = () => {
      showGameFinishedOverlay.value = false;
      emit('view-scoreboard');
    };

    const formattedPalavra = computed(() => {
        if (!props.currentRoundConexao || !props.currentRoundConexao.palavra) return '';
        const palavra = props.currentRoundConexao.palavra.toUpperCase();

        if (props.gameStatus === 'finished') {
            return palavra;
        }

        const revealed = props.currentRoundConexao.revealedLetters || new Set<number>();

        return palavra.split('').map((char, index) => {
            if (char === ' ') return ' ';
            return revealed.has(index) ? char : '_';
        }).join('');
    });

    const handleKeyPress = (event: KeyboardEvent) => {
      // MODIFICAÇÃO AQUI: Lógica para 'Espaço' e 'P' quando o jogo está 'finished'
      if (props.gameStatus === 'finished' && showGameFinishedOverlay.value) {
        if (event.code === 'Space') { // Iniciar nova rodada
          event.preventDefault();
          emit('start-new-round'); // Emite o novo evento para iniciar uma rodada
          return;
        } else if (event.key === 'p' || event.key === 'P') { // Ir para o placar
          event.preventDefault();
          viewConexaoScoreboard(); // Chama a função existente para ir ao placar
          return;
        }
      }

      if (!isColorSelectionLocked.value && props.gameStatus !== 'finished' && props.gameStatus === 'guessing') {
        let teamNameKey: string | null = null;

        switch (event.key) {
          case '1':
            teamNameKey = 'Azul';
            break;
          case '2':
            teamNameKey = 'Vermelho';
            break;
          case '3':
            teamNameKey = 'Verde';
            break;
          case '4':
            teamNameKey = 'Amarelo';
            break;
        }

        if (teamNameKey) {
          const colorToApply = teamNameToHex[teamNameKey];
          console.log(`Key pressed: ${event.key}, Team Name Key: ${teamNameKey}, Applying Color (HEX): ${colorToApply}`);
          imageBorderColor.value = colorToApply;
          isColorSelectionLocked.value = true;
        }
      }
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeyPress);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyPress);
      if (fireworksTimeout) {
        clearTimeout(fireworksTimeout);
      }
    });

    return {
      baseURL,
      formattedPalavra,
      TeamColor,
      evaluateGuess,
      viewConexaoScoreboard,
      imageBorderColor,
      showGameFinishedOverlay,
      winningTeamColorHex,
      showFireworks,
    };
  },
});
</script>

<style scoped>
/* Seu CSS existente (sem alterações significativas aqui) */
.game-conexao-container {
  position: fixed;
  top: var(--header-height, 75px);
  left: 0;
  width: 100vw;
  height: calc(100vh - var(--header-height, 80px));
  display: grid;
  grid-template-columns: 100vw;
  grid-template-rows: 1fr auto;
  box-sizing: border-box;
  background-color: #f0f2f5;
  font-family: 'Poppins', sans-serif;
  overflow: hidden;
  z-index: 100;
  padding: 0;
}

.image-display-area {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
}

.game-image {
  position: relative;
  width: auto;
  height: 100%;
  max-width: 100%;
  object-fit: contain;
  display: block;
  z-index: 1;
  transition: border 0.2s ease-in-out;
  box-sizing: border-box;
}

.bottom-content-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  padding: 1vh 1vw;
}

.round-score-display {
  margin-bottom: 1.5vh;
  font-size: clamp(0.9em, 2vw, 1.5em);
  font-weight: bold;
  color: #34495e;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  padding: 0 1vw;
  white-space: nowrap;
}

.round-score-display .score-value {
  color: #363435;
  font-size: 1.1em;
}

.word-display {
  font-family: 'Monospace', monospace;
  font-size: clamp(6em, 6vw, 6em);
  font-weight: bold;
  letter-spacing: 0.4vw;
  color: #34495e; /* Cor padrão, será sobrescrita se winningTeamColorHex estiver definido */
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.4vw;
  max-width: 100%;
  box-sizing: border-box;
  flex-shrink: 1;
  min-width: 0.5em;
  overflow-wrap: break-word;
  height: auto;
  text-align: center;
}
.letter {
  display: inline-block;
  padding: 0 0.05em;
  text-align: center;
  line-height: 1;
  transition: color 0.3s ease, border-color 0.3s ease;
  flex-shrink: 1;
  min-width: 0.5em;
  box-sizing: border-box;
  overflow-wrap: break-word;
}
.letter.revealed {
  border-color: transparent;
  color: #363435; /* Cor padrão para letras reveladas, será sobrescrita se winningTeamColorHex estiver definido */
}

.game-controls {
  height: 0;
  overflow: hidden;
  visibility: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: center;
  flex-shrink: 0;
  flex-grow: 0;
  max-width: 100%;
  box-sizing: border-box;
  gap: 1vh;
}

.guessing-state, .finished-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1vh;
  width: 100%;
  overflow: hidden;
}
.guessing-message {
    font-size: clamp(0.8em, 1.8vh, 1.4em);
    font-weight: bold;
    color: #34495e;
    margin-bottom: 0.5vh;
    max-width: 100%;
    overflow-wrap: break-word;
    box-sizing: border-box;
}
.guessing-message strong {
    font-size: 1.1em;
}
.btn-action {
    padding: 1vh 2vw;
    font-size: clamp(0.7em, 1.5vh, 1.1em);
    width: auto;
    max-width: 95vw;
    margin: 0.5vh auto;
    box-sizing: border-box;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
    display: block;
}
.guessing-message strong.blue { color: #007bff; }
.guessing-message strong.red { color: #dc3545; }
.guessing-message strong.green { color: #28a745; }
.guessing-message strong.yellow { color: #f1c40f; }
</style>