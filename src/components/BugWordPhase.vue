<template>
  <div class="bug-phase-container word-phase" @keydown="handleKeyDown" tabindex="0">
    <div class="main-content">
      <!-- Condicionalmente exibe a palavra embaralhada ou a palavra correta -->
      <div v-if="!showCorrectWord && !activeTeam" class="scrambled-word-container">
        <span v-for="(letter, index) in scrambledWord.split('')" :key="index" class="letter-square" :style="letterSquareDynamicStyles">
          {{ letter }}
        </span>
      </div>
      <div v-else-if="showCorrectWord" class="correct-word-display">
        <span v-for="(letter, index) in currentWord.split('')" :key="index" class="letter-square correct-letter" :style="letterSquareDynamicStyles">
          {{ letter }}
        </span>
        <!-- NOVO: Mensagem de acerto com nome e cor da equipe -->
        <p class="instructions-message">
          <span :class="['team-name-display', getTeamClass(activeTeam)]">{{ activeTeam }}</span>
          Resposta Correta!
        </p>
      </div>
      
      <div v-if="activeTeam && !showCorrectWord" class="guess-controls">
        <p class="guessing-team-message">Aguardando resposta da equipe <span :class="['team-name-display', getTeamClass(activeTeam)]">{{ activeTeam }}</span></p>
        
        <!-- Componente AnswerFeedback para lidar com acerto/erro e sons -->
        <!-- Visível apenas se a palavra correta ainda não foi exibida -->
        <AnswerFeedback
          @correct-answer="handleCorrectAnswerFromFeedback"
          @wrong-answer="emitWrongGuess"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, onMounted, onUnmounted, nextTick, ref, watch } from 'vue';
import { TeamColor } from '../types';
import AnswerFeedback from './AnswerFeedback.vue';

export default defineComponent({
  name: 'BugWordPhase',
  components: {
    AnswerFeedback,
  },
  props: {
    currentWord: {
      type: String,
      required: true,
    },
    scrambledWord: {
      type: String,
      required: true,
    },
    activeTeam: {
      type: String as PropType<TeamColor | null>,
      default: null,
    },
    disabledTeams: {
      type: Object as PropType<Set<TeamColor>>,
      required: true,
    }
  },
  emits: ['set-guessing-team', 'correct-guess', 'wrong-guess'],
  setup(props, { emit }) {
    const showCorrectWord = ref(false); // Controla a exibição da palavra correta
    const waitingForSpace = ref(false); // Controla se está aguardando a tecla Espaço

    // CORREÇÃO AQUI: Mapeamento correto das teclas para os times
    const teamKeyMap: { [key: string]: TeamColor } = {
      '1': TeamColor.RED,    // Tecla 1 para Vermelho
      '2': TeamColor.BLUE,   // Tecla 2 para Azul
      '3': TeamColor.GREEN,  // Tecla 3 para Verde
      '4': TeamColor.YELLOW, // Tecla 4 para Amarelo
    };

    // Propriedade computada para estilos dinâmicos dos quadrados das letras
    const letterSquareDynamicStyles = computed(() => {
      const wordLength = props.currentWord.length;
      if (wordLength < 10) {
        // Palavras curtas: um pouco maiores
        return {
          'min-width': '10vh',
          'min-height': '12vh',
          'font-size': '12vh',
        };
      } else {
        // Palavras longas: tamanho atual
        return {
          'min-width': '8vh',
          'min-height': '10vh',
          'font-size': '9vh',
        };
      }
    });

    const getTeamClass = (team: TeamColor | null) => { // Ajustado para aceitar null
      switch (team) {
        case TeamColor.BLUE: return 'blue';
        case TeamColor.RED: return 'red';
        case TeamColor.GREEN: return 'green';
        case TeamColor.YELLOW: return 'yellow';
        default: return ''; // Retorna vazio se não houver time ativo
      }
    };

    const selectGuessingTeam = (team: TeamColor) => {
      if (props.activeTeam) {
        console.warn(`Um time (${props.activeTeam}) já está tentando adivinhar. Não é possível selecionar outro time (${team}) agora.`);
        return;
      }

      // Verifica se o time está desabilitado (seja por sorteio ou por ter errado antes)
      if (!props.disabledTeams.has(team)) {
        emit('set-guessing-team', team);
      } else {
        console.warn(`Time ${team} está desabilitado e não pode adivinhar.`);
      }
    };

    const handleCorrectAnswerFromFeedback = () => {
      showCorrectWord.value = true;
      waitingForSpace.value = true;
    };

    const emitWrongGuess = () => {
      emit('wrong-guess');
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      nextTick(() => {
        const container = document.querySelector('.bug-phase-container.word-phase') as HTMLElement;
        if (container) {
          container.focus();
        }
      });

      if (waitingForSpace.value && event.code === 'Space') {
        event.preventDefault();
        waitingForSpace.value = false;
        showCorrectWord.value = false;
        emit('correct-guess');
        return;
      }

      if (showCorrectWord.value) {
        event.preventDefault();
        return;
      }

      const team = teamKeyMap[event.key];
      if (team) {
        event.preventDefault();
        selectGuessingTeam(team);
      }
    };

    watch(() => props.activeTeam, (newTeam, oldTeam) => {
      if (newTeam !== oldTeam) {
        showCorrectWord.value = false;
        waitingForSpace.value = false;
      }
    });

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
      nextTick(() => {
        const container = document.querySelector('.bug-phase-container.word-phase') as HTMLElement;
        if (container) {
          container.focus();
        }
      });
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });

    return {
      showCorrectWord,
      waitingForSpace,
      getTeamClass,
      selectGuessingTeam,
      handleCorrectAnswerFromFeedback,
      emitWrongGuess,
      handleKeyDown,
      letterSquareDynamicStyles, // Expor a propriedade computada
    };
  },
});
</script>

<style scoped>
.bug-phase-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 90vw;
  max-width: none;
  height: 100vh;
  margin: auto;
  padding: 5vh 3vw;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  box-sizing: border-box;
  max-height: 100vh;
  overflow-y: auto;
  font-size: 16px; /* Base font-size */
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

.scrambled-word-container,
.correct-word-display { /* Aplicar estilos comuns a ambos os containers de palavras */
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1vw; /* Espaçamento entre os quadrados */
  margin-bottom: 5vh;
}

.letter-square {
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1 / 1;
  /* Os tamanhos min-width, min-height e font-size agora são definidos dinamicamente via :style */
  background-color: #ecf0f1;
  border: 2px solid #bdc3c7;
  border-radius: 1vh;
  font-weight: bold;
  color: #2c3e50;
  box-shadow: 0 0.5vh 1.5vh rgba(0, 0, 0, 0.1);
  text-transform: uppercase;
  line-height: 1; /* Ajuda a centralizar e conter o texto dentro do quadrado */
}

.correct-letter { /* Estilo para as letras da palavra correta */
  background-color: #2ecc71; /* Verde para indicar acerto */
  color: white;
  border-color: #27ae60;
}

.guessing-team-message {
  font-size: 3em;
  margin-bottom: 2.5vh;
}

.instructions-message { /* Estilo para a mensagem de instrução */
  font-size: 2.5em;
  color: #444;
  text-shadow: 0 0 5px rgba(0,0,0,0.2);
  margin-top: 2.5vh;
  width: 100%; /* Garante que a mensagem ocupe a largura total */
}

.team-name-display {
  font-weight: bold;
  padding: 1vh 2vw;
  border-radius: 1.5vh;
  color: white;
  display: inline-block;
}

.team-name-display.red { background-color: #e74c3c; }
.team-name-display.blue { background-color: #3498db; }
.team-name-display.green { background-color: #2ecc71; }
.team-name-display.yellow { background-color: #f1c40f; color: #333; }

.waiting-message {
  font-size: 2.5em;
  color: #999;
  margin-top: 2.5vh;
}
</style>