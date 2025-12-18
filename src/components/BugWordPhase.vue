<template>
  <div class="bug-phase-container word-phase">
    <div class="main-content">
      <h2 class="phase-title">Fase da Palavra</h2>
      <p class="info-text">A palavra embaralhada para adivinhar é:</p>
      <div class="scrambled-word">{{ scrambledWord }}</div>
      
      <p class="active-team-prompt">Qual time irá adivinhar?</p>
      <div class="team-buttons-grid">
        <button
          v-for="team in teamsOrderFiltered"
          :key="team"
          @click="selectGuessingTeam(team)"
          :class="['team-button', getTeamClass(team), { 'active-guessing': activeTeam === team }]"
          :disabled="disabledTeams.has(team)"
        >
          {{ team }}
        </button>
      </div>

      <div v-if="activeTeam" class="guess-controls">
        <p class="guessing-team-message">O time <span :class="getTeamClass(activeTeam)">{{ activeTeam }}</span> está tentando!</p>
        <div class="guess-buttons">
          <button @click="emitCorrectGuess()" class="btn-action btn-correct">ACERTOU!</button>
          <button @click="emitWrongGuess()" class="btn-action btn-wrong">ERROU!</button>
        </div>
      </div>
      <p v-if="!activeTeam" class="waiting-message">Aguardando um time clicar para adivinhar a palavra...</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { TeamColor } from '../types';

export default defineComponent({
  name: 'BugWordPhase',
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
      type: Set as PropType<Set<TeamColor>>,
      required: true,
    }
  },
  emits: ['set-guessing-team', 'correct-guess', 'wrong-guess'],
  setup(props, { emit }) {
    const teamsOrder = [TeamColor.RED, TeamColor.BLUE, TeamColor.GREEN, TeamColor.YELLOW];

    const teamsOrderFiltered = computed(() => {
      // Filtra apenas os times que NÃO estão desabilitados para a rodada
      return teamsOrder.filter(team => !props.disabledTeams.has(team));
    });

    const getTeamClass = (team: TeamColor) => {
      switch (team) {
        case TeamColor.BLUE: return 'blue';
        case TeamColor.RED: return 'red';
        case TeamColor.GREEN: return 'green';
        case TeamColor.YELLOW: return 'yellow';
        default: return '';
      }
    };

    const selectGuessingTeam = (team: TeamColor) => {
      if (props.activeTeam !== team) { // Só permite mudar se não for o mesmo time
        emit('set-guessing-team', team);
      }
    };

    const emitCorrectGuess = () => {
      emit('correct-guess');
    };

    const emitWrongGuess = () => {
      emit('wrong-guess');
    };

    return {
      teamsOrderFiltered,
      getTeamClass,
      selectGuessingTeam,
      emitCorrectGuess,
      emitWrongGuess,
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
  width: 90%; /* Ajuste a largura para ser mais responsiva */
  max-width: 900px;
  height: 90vh; /* Tentar ocupar a maior parte da altura disponível */
  margin: auto; /* Centraliza o componente na tela */
  padding: 30px; /* Reduzido o padding */
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  box-sizing: border-box;
  max-height: 95vh; /* Garante que não estoure em telas pequenas */
  overflow-y: auto; /* Adiciona rolagem se o conteúdo for muito grande, mas tenta evitar */
}

.phase-title {
  font-size: 2.2em; /* Reduzido */
  color: #34495e;
  margin-bottom: 15px; /* Reduzido */
  font-weight: bold;
}

.info-text {
  font-size: 1.2em; /* Reduzido */
  color: #777;
  margin-bottom: 10px;
}

.scrambled-word {
  font-size: 3.5em; /* Ligeiramente reduzido */
  font-weight: bold;
  color: #2c3e50;
  letter-spacing: 3px;
  margin-bottom: 25px;
  padding: 10px 20px;
  background-color: #ecf0f1;
  border-radius: 8px;
}

.active-team-prompt {
  font-size: 1.3em; /* Reduzido */
  color: #555;
  margin-bottom: 15px;
}

.team-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); /* Mais flexível */
  gap: 10px; /* Reduzido */
  width: 100%;
  max-width: 500px; /* Limita a largura do grid de botões */
  margin-bottom: 20px;
}

.team-button {
  padding: 12px 15px; /* Reduzido */
  font-size: 1.1em; /* Reduzido */
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.team-button:hover:not(:disabled) {
  opacity: 0.8;
  transform: translateY(-2px);
}

.team-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.team-button.blue { background-color: #3498db; }
.team-button.red { background-color: #e74c3c; }
.team-button.green { background-color: #2ecc71; }
.team-button.yellow { background-color: #f1c40f; color: #333; }

.team-button.active-guessing {
  border: 3px solid #f39c12; /* Borda laranja para o time ativo */
  transform: scale(1.05);
}

.guess-controls {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.guessing-team-message {
  font-size: 1.5em;
  margin-bottom: 15px;
}

.guessing-team-message span {
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 5px;
  color: white;
}

.guess-buttons {
  display: flex;
  gap: 15px;
}

.btn-action {
  padding: 15px 30px;
  font-size: 1.2em;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.btn-action.btn-correct {
  background-color: #2ecc71; /* Green */
}

.btn-action.btn-wrong {
  background-color: #e74c3c; /* Red */
}

.btn-action:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

.waiting-message {
  font-size: 1.1em;
  color: #999;
  margin-top: 20px;
}
</style>