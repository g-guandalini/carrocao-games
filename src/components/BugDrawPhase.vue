<template>
  <div class="bug-phase-container draw-phase" @keydown="handleKeyDown" tabindex="0" ref="bugPhaseContainer">
    <div class="main-content">
      <p class="current-team-info">É a vez do time: <span :class="currentTurnTeamClass">{{ currentTurnTeam }}</span></p>

      <!-- Condição ajustada para que o grid de opções fique visível durante a animação de sorteio e o destaque pós-sorteio -->
      <div v-if="!selectedOption || highlightedOption" class="options-grid">
        <button
          v-for="(option, _index) in orderedRoundOptions"
          :key="option"
          :class="['option-button', getOptionClass(option), {'drawing': isDrawing && currentDrawingOption === option}]"
          :disabled="true"
        >
          {{ option }}
        </button>
      </div>
      
      <!-- Mensagem pós-sorteio para "Fora", "Ganhe 20", "Perca 20" -->
      <p v-if="postDrawMessage" class="instructions-message" v-html="postDrawMessage"></p>


      <div v-if="selectedOption === '10 a 50'" class="points-selection">
        <p class="option-drawn-text">Opção sorteada: <strong>{{ selectedOption }}</strong></p>
        <div class="points-selection-grid">
          <button
            v-for="points in [10, 20, 30, 40, 50]"
            :key="points"
            @click="togglePointSelection(points)"
            :class="['point-button', { 'selected': selectedPointsOption === points }]"
          >
            {{ points }}
          </button>
        </div>
        <button v-show="false" @click="confirmPoints()" class="btn-confirm-points">Confirmar Pontos</button>
      </div>

      <div v-if="selectedOption === 'Tire uma' || selectedOption === 'Tire duas'" class="team-removal-section">
        <p class="option-drawn-text">Opção sorteada: <strong>{{ selectedOption }}</strong></p>
        <div class="team-selection-grid">
          <button
            v-for="team in teamsOrder"
            :key="team"
            @click="toggleTeamSelection(team)"
            :class="['team-select-button', getTeamClass(team), { 'selected': selectedTeamsToRemove.includes(team), 'disabled': isTeamButtonDisabled(team) }]"
            :disabled="isTeamButtonDisabled(team)"
          >
            {{ team }}
          </button>
        </div>
        <button
          v-show="false"
          @click="confirmTeamRemoval()"
          :disabled="selectedTeamsToRemove.length < (selectedOption === 'Tire uma' ? 1 : 2)"
          class="btn-confirm-removal"
        >
          Confirmar Remoção
        </button>
      </div>
    </div>

    <!-- Elemento de áudio para o som de sorteio -->
    <audio ref="sorteioAudio" src="/sounds/sorteio.mp3" preload="auto"></audio>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { TeamColor } from '../types';

export default defineComponent({
  name: 'BugDrawPhase',
  props: {
    currentTurnTeam: {
      type: String as PropType<TeamColor | null>,
      required: true,
    },
    roundOptions: {
      type: Array as PropType<string[]>,
      required: true,
    },
    disabledTeams: {
      type: Set as PropType<Set<TeamColor>>,
      required: true,
    },
  },
  emits: ['option-selected', 'teams-removed', 'start-new-round-shortcut', 'view-scoreboard-shortcut', 'option-confirmed-and-next-action'],
  setup(props, { emit }) {
    const selectedOption = ref<string | null>(null);
    const highlightedOption = ref<string | null>(null);
    const chosenPoints = ref<number>(20);
    const selectedPointsOption = ref<number | null>(null);
    const selectedTeamsToRemove = ref<TeamColor[]>([]);
    const isDrawing = ref(false);
    const currentDrawingOption = ref<string | null>(null);

    const bugPhaseContainer = ref<HTMLElement | null>(null);
    const sorteioAudio = ref<HTMLAudioElement | null>(null);

    const teamsOrder = [TeamColor.RED, TeamColor.BLUE, TeamColor.GREEN, TeamColor.YELLOW];
    const teamKeyMap: { [key: string]: TeamColor } = {
      '1': TeamColor.RED,
      '2': TeamColor.BLUE,
      '3': TeamColor.GREEN,
      '4': TeamColor.YELLOW,
    };

    const optionKeyMap: { [key: string]: string } = {
      '1': 'Ganhe 20',
      '2': 'Perca 20',
      '3': 'Fora',
      '4': '10 a 50',
      '5': 'Tire uma',
      '6': 'Tire duas',
    };

    const pointKeyMap: { [key: string]: number } = {
      '1': 10,
      '2': 20,
      '3': 30,
      '4': 40,
      '5': 50,
    };

    const orderedRoundOptions = computed(() => {
      const order = ['Ganhe 20', 'Perca 20', 'Fora', '10 a 50', 'Tire uma', 'Tire duas'];
      return order.filter(option => props.roundOptions.includes(option));
    });

    const optionKeyMapReverse = computed(() => {
      const reverseMap: { [key: string]: string } = {};
      for (const key in optionKeyMap) {
        reverseMap[optionKeyMap[key]] = key;
      }
      return reverseMap;
    });

    const safeDisabledTeams = computed(() => props.disabledTeams || new Set<TeamColor>());

    const getTeamClass = (team: TeamColor) => {
      switch (team) {
        case TeamColor.BLUE: return 'blue';
        case TeamColor.RED: return 'red';
        case TeamColor.GREEN: return 'green';
        case TeamColor.YELLOW: return 'yellow';
        default: return '';
      }
    };

    const currentTurnTeamClass = computed(() => {
      return props.currentTurnTeam ? getTeamClass(props.currentTurnTeam) : '';
    });

    const getOptionClass = (option: string) => {
      if (highlightedOption.value === option) {
        return 'selected';
      }
      if (isDrawing.value && currentDrawingOption.value === option) {
        return 'drawing';
      }
      if (selectedOption.value === option && !highlightedOption.value) {
        return 'selected';
      }
      return '';
    };

    const executeOptionSelection = (option: string, points?: number) => {
      selectedOption.value = option;
      chosenPoints.value = points || 20;
      selectedPointsOption.value = null;
      selectedTeamsToRemove.value = [];
    };

    const playSorteioSound = async (): Promise<number> => {
      if (sorteioAudio.value) {
        sorteioAudio.value.pause();
        sorteioAudio.value.currentTime = 0;
        try {
          await sorteioAudio.value.play();
          if (sorteioAudio.value.readyState < sorteioAudio.value.HAVE_METADATA) {
            await new Promise<void>(resolve => {
              sorteioAudio.value?.addEventListener('loadedmetadata', () => {
                console.log('Audio loaded, duration:', sorteioAudio.value?.duration, 'seconds'); // Log para depuração
                resolve();
              }, { once: true });
              sorteioAudio.value?.addEventListener('error', (e) => {
                console.warn('Erro ao carregar metadata de sorteio.mp3:', e);
                resolve();
              }, { once: true });
            });
          } else {
            console.log('Audio already loaded, duration:', sorteioAudio.value?.duration, 'seconds'); // Log para depuração
          }
          return sorteioAudio.value.duration * 1000;
        } catch (e) {
          console.warn("Autoplay de sorteio.mp3 bloqueado ou erro durante a reprodução:", e);
          return 0;
        }
      }
      return Promise.resolve(0);
    };

    const startDrawingAnimation = async (finalOption: string, callback: (drawnOption: string) => void) => {
      if (isDrawing.value || selectedOption.value || highlightedOption.value) {
        return;
      }

      isDrawing.value = true;
      let currentIndex = 0;
      const animationInterval = setInterval(() => {
        currentDrawingOption.value = orderedRoundOptions.value[currentIndex];
        currentIndex = (currentIndex + 1) % orderedRoundOptions.value.length;
      }, 100);

      const audioDuration = await playSorteioSound();

      const minCyclingDuration = 2000; // Duração mínima do ciclo da animação
      const minHighlightDuration = 2500; // Duração mínima do destaque pós-sorteio
      const totalOriginalAnimationTime = minCyclingDuration + minHighlightDuration; // 4500ms

      // A duração total da animação deve ser pelo menos a duração do áudio, ou a duração original se o áudio for mais curto.
      const effectiveTotalAnimationTime = Math.max(totalOriginalAnimationTime, audioDuration);

      // A fase de cycling deve durar o tempo total efetivo menos o tempo mínimo de destaque,
      // mas nunca menos que a duração mínima de cycling.
      const calculatedCyclingDuration = effectiveTotalAnimationTime - minHighlightDuration;
      const cyclingStopDelay = Math.max(minCyclingDuration, calculatedCyclingDuration);

      console.log('Audio duration (ms):', audioDuration); // Log para depuração
      console.log('Effective total animation time (ms):', effectiveTotalAnimationTime); // Log para depuração
      console.log('Calculated cycling duration (ms):', calculatedCyclingDuration); // Log para depuração
      console.log('Cycling stop delay (ms):', cyclingStopDelay); // Log para depuração

      // Timeout para parar o ciclo e começar a destacar a opção final
      setTimeout(() => {
        clearInterval(animationInterval);
        currentDrawingOption.value = null;
        highlightedOption.value = finalOption;
      }, cyclingStopDelay);

      // Timeout para limpar o destaque e definir a opção final selecionada, garantindo que dure o tempo total efetivo
      setTimeout(() => {
        isDrawing.value = false;
        highlightedOption.value = null;
        selectedOption.value = finalOption;
        callback(finalOption);
      }, effectiveTotalAnimationTime);
    };

    const drawRandomOption = () => {
      const randomIndex = Math.floor(Math.random() * props.roundOptions.length);
      const drawn = props.roundOptions[randomIndex];
      startDrawingAnimation(drawn, (finalDrawnOption) => {
        executeOptionSelection(finalDrawnOption);
      });
    };

    const confirmDrawnOption = () => {
      if (selectedOption.value) {
        emit('option-selected', selectedOption.value, chosenPoints.value);
      }
    };

    const togglePointSelection = (points: number) => {
      if (selectedPointsOption.value === points) {
        selectedPointsOption.value = null;
      } else {
        selectedPointsOption.value = points;
      }
    };

    const confirmPoints = () => {
      if (selectedPointsOption.value !== null && selectedPointsOption.value >= 10 && selectedPointsOption.value <= 50) {
        emit('option-selected', selectedOption.value!, selectedPointsOption.value);
        selectedOption.value = null;
        selectedPointsOption.value = null;
      } else {
        alert('Por favor, selecione um valor entre 10 e 50.');
      }
    };

    const toggleTeamSelection = (team: TeamColor) => {
      const index = selectedTeamsToRemove.value.indexOf(team);
      const limit = selectedOption.value === 'Tire uma' ? 1 : 2;

      const isTeamGloballyDisabled = safeDisabledTeams.value.has(team) || team === props.currentTurnTeam;

      if (isTeamGloballyDisabled) {
        return;
      }

      if (index === -1) {
          if (selectedTeamsToRemove.value.length >= limit) {
              return;
          }
          selectedTeamsToRemove.value.push(team);
      } else {
          selectedTeamsToRemove.value.splice(index, 1);
      }
    };

    const confirmTeamRemoval = () => {
      const limit = selectedOption.value === 'Tire uma' ? 1 : 2;
      if (selectedTeamsToRemove.value.length === limit) {
        emit('teams-removed', selectedTeamsToRemove.value);
        selectedOption.value = null;
      } else {
        // Log removido
      }
    };

    const isTeamButtonDisabled = (team: TeamColor) => {
      const limit = selectedOption.value === 'Tire uma' ? 1 : 2;
      const isSelected = selectedTeamsToRemove.value.includes(team);
      const isGloballyDisabled = safeDisabledTeams.value.has(team) || team === props.currentTurnTeam;

      return isGloballyDisabled || (selectedTeamsToRemove.value.length >= limit && !isSelected);
    };

    const postDrawMessage = computed(() => {
      if (!selectedOption.value || highlightedOption.value || isDrawing.value || !props.currentTurnTeam) {
        return null;
      }

      const teamSpan = `<span class="${currentTurnTeamClass.value}">${props.currentTurnTeam}</span>`;

      switch (selectedOption.value) {
        case 'Fora':
          return `O time ${teamSpan} não participa da rodada! 😔`;
        case 'Ganhe 20':
          return `O time ${teamSpan} ganhou 20 pontos! 😊`;
        case 'Perca 20':
          return `O time ${teamSpan} perdeu 20 pontos! 😔`;
        default:
          return null;
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDrawing.value || highlightedOption.value) {
        event.preventDefault();
        return;
      }

      if (selectedOption.value) {
        if (selectedOption.value === '10 a 50') {
          const points = pointKeyMap[event.key];
          if (points) {
            event.preventDefault();
            togglePointSelection(points);
          } else if (event.code === 'Space') {
            event.preventDefault();
            confirmPoints();
          }
        } else if (selectedOption.value === 'Tire uma' || selectedOption.value === 'Tire duas') {
          const team = teamKeyMap[event.key];
          if (team) {
            event.preventDefault();
            toggleTeamSelection(team);
          } else if (event.code === 'Space') {
            event.preventDefault();
            const limit = selectedOption.value === 'Tire uma' ? 1 : 2;
            if (selectedTeamsToRemove.value.length === limit) {
              confirmTeamRemoval();
            }
          }
        } else if (selectedOption.value === 'Ganhe 20' || selectedOption.value === 'Perca 20') {
          if (event.code === 'Space') {
            event.preventDefault();
            // Emite um evento combinado para aplicar pontos e iniciar nova rodada
            emit('option-confirmed-and-next-action', selectedOption.value, chosenPoints.value, 'newRound');
          } else if (event.key === 'p' || event.key === 'P') {
            event.preventDefault();
            // Emite um evento combinado para aplicar pontos e ir para o placar
            emit('option-confirmed-and-next-action', selectedOption.value, chosenPoints.value, 'scoreboard');
          }
        } else { // Cobre 'Fora' e outras opções simples que só precisam de ESPAÇO para confirmar
          if (event.code === 'Space') {
            event.preventDefault();
            confirmDrawnOption();
          }
        }
      } else { // Nenhuma opção selecionada ainda, fase de sorteio inicial
        if (event.key === 's' || event.key === 'S') {
          drawRandomOption();
        } else {
          const manualOption = optionKeyMap[event.key];
          if (manualOption) {
            event.preventDefault();
            if (props.roundOptions.includes(manualOption)) {
              startDrawingAnimation(manualOption, (finalManualOption) => {
                executeOptionSelection(finalManualOption);
              });
            }
          }
        }
      }
    };

    watch(() => props.currentTurnTeam, (newTeam, oldTeam) => {
      if (newTeam && newTeam !== oldTeam) {
        if (sorteioAudio.value) {
          sorteioAudio.value.pause();
          sorteioAudio.value.currentTime = 0;
        }
        selectedOption.value = null;
        highlightedOption.value = null;
        isDrawing.value = false;
        currentDrawingOption.value = null;
        selectedTeamsToRemove.value = [];
        chosenPoints.value = 20;
        selectedPointsOption.value = null;
        nextTick(() => {
          if (bugPhaseContainer.value) {
            bugPhaseContainer.value.focus();
          }
        });
      }
    }, { immediate: true });

    onMounted(() => {
      nextTick(() => {
        if (bugPhaseContainer.value) {
          bugPhaseContainer.value.focus();
        }
      });
    });

    onUnmounted(() => {
      // O elemento de áudio nativo é automaticamente limpo quando o componente é destruído.
    });

    return {
      selectedOption,
      highlightedOption,
      chosenPoints,
      selectedPointsOption,
      selectedTeamsToRemove,
      teamsOrder,
      getTeamClass,
      currentTurnTeamClass,
      getOptionClass,
      drawRandomOption,
      confirmPoints,
      confirmDrawnOption,
      togglePointSelection,
      toggleTeamSelection,
      confirmTeamRemoval,
      handleKeyDown,
      isDrawing,
      currentDrawingOption,
      safeDisabledTeams,
      isTeamButtonDisabled,
      bugPhaseContainer,
      optionKeyMapReverse,
      orderedRoundOptions,
      postDrawMessage,
      sorteioAudio
    };
  },
});
</script>

<style scoped>
/* Seu estilo existente permanece inalterado */
.bug-phase-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 90vw;
  height: 100vh;
  margin: 0 auto;
  padding: 5vh 3vw;
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
  text-align: center;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
  font-size: 16px;
}

.bug-phase-container[tabindex="0"]:focus {
  outline: none;
}

.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 2.5vh;
  justify-content: center;
}

.main-content > * {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.phase-title {
  font-size: 4.5em;
  color: #34495e;
  font-weight: bold;
}

.current-team-info {
  font-size: 3em;
  color: #555;
  text-shadow: 0 0 5px rgba(0,0,0,0.1);
}

.current-team-info span {
  font-weight: bold;
  padding: 1vh 2vw;
  border-radius: 1.5vh;
  color: white;
}

.current-team-info .red { background-color: #e74c3c; }
.current-team-info .blue { background-color: #3498db; }
.current-team-info .green { background-color: #2ecc71; }
.current-team-info .yellow { background-color: #f1c40f; color: #333; }

.options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1.5vw 1.5vh;
  width: 100%;
  position: relative;
}

.team-selection-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1.5vw 1.5vh;
  width: 100%;
  position: relative;
}

.points-selection-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5vw 1.5vh;
  width: 100%;
}

.option-button, .btn-confirm-points, .btn-confirm-removal, .point-button {
  padding: 2.5vh 2.5vh; /* Padding mais simétrico para botões mais quadrados */
  font-size: 2.2em;
  font-weight: bold;
  border: none;
  border-radius: 1vh;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  background-color: #3498db;
  box-shadow: 0 0.5vh 1.5vh rgba(0, 0, 0, 0.1);
  opacity: 0.7;
  pointer-events: none;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1 / 1; /* Garante que o botão seja quadrado */
}

/* Estilos para os botões de seleção de time (retangulares) */
.team-select-button {
  padding: 2.5vh 1.5vw; /* Padding retangular */
  font-size: 2.2em;
  font-weight: bold;
  border: none;
  border-radius: 1vh;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333; /* Cor do texto padrão para times */
  background-color: #95a5a6; /* Cor de fundo padrão para times */
  box-shadow: 0 0.5vh 1.5vh rgba(0, 0, 0, 0.1);
  opacity: 1;
  pointer-events: auto;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* Removido aspect-ratio para que seja retangular */
}


.point-button {
  pointer-events: auto;
  opacity: 1;
  background-color: #6c7a89;
}

.point-button:hover:not(.selected) {
  background-color: #566573;
  transform: translateY(-0.5vh);
}

.option-button.selected, .point-button.selected {
  background-color: #2ecc71;
  transform: scale(1.05);
  box-shadow: 0 1vh 2vh rgba(0, 0, 0, 0.2);
  opacity: 1;
}

.option-button.drawing {
  background-color: #FFD700; /* Amarelo vibrante */
  transform: scale(1.02);
  opacity: 1;
  box-shadow: 0 0.8vh 1.5vh rgba(0, 0, 0, 0.3);
}

.instructions-message,
.option-drawn-text,
.points-instruction-text,
.team-removal-instruction-text {
  font-size: 3em;
  color: #444;
  text-shadow: 0 0 5px rgba(0,0,0,0.2);
}

.points-selection {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5vh;
}

.btn-confirm-points {
  background-color: #2ecc71;
}

.team-removal-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5vh;
}

.team-select-button:hover:not(.selected):not(.disabled) {
  background-color: #7f8c8d;
  transform: translateY(-0.5vh);
}

.team-select-button.selected {
  background-color: #e74c3c;
  color: white;
  border: 0.6vh solid #f39c12;
  box-shadow: 0 0.8vh 1.5vh rgba(0, 0, 0, 0.4);
  z-index: 2;
  position: relative;
}

.team-select-button.selected.disabled {
  opacity: 0.7;
  cursor: default;
  border-color: #e67e22;
}

.team-select-button:not(.selected).disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.team-select-button.blue { background-color: #3498db; color: white; }
.team-select-button.red { background-color: #e74c3c; color: white; }
.team-select-button.green { background-color: #2ecc71; color: white; }
.team-select-button.yellow { background-color: #f1c40f; color: #333; }

.btn-confirm-removal {
  background-color: #f39c12;
}
.btn-confirm-removal:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>