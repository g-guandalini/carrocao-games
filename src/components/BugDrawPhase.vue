<template>
  <div class="bug-phase-container draw-phase">
    <div class="main-content">
      <h2 class="phase-title">Fase de Sorteio</h2>
      <p class="current-team-info">É a vez do time: <span :class="currentTurnTeamClass">{{ currentTurnTeam }}</span></p>

      <div class="options-grid">
        <button
          v-for="option in roundOptions"
          :key="option"
          @click="selectOption(option)"
          :class="['option-button', getOptionClass(option)]"
        >
          {{ option }}
        </button>
      </div>

      <div v-if="selectedOption === '10 a 50'" class="points-selection">
        <p>Escolha o valor da palavra (10 a 50):</p>
        <input type="number" v-model.number="chosenPoints" min="10" max="50" step="1" />
        <button @click="confirmPoints()" class="btn-confirm-points">Confirmar Pontos</button>
      </div>

      <div v-if="selectedOption === 'Tire uma' || selectedOption === 'Tire duas'" class="team-removal-section">
        <p>Selecione {{ selectedOption === 'Tire uma' ? '1 time' : '2 times' }} para remover da rodada:</p>
        <div class="team-selection-grid">
          <button
            v-for="team in teamsOrderFiltered"
            :key="team"
            @click="toggleTeamSelection(team)"
            :class="['team-select-button', getTeamClass(team), { 'selected': selectedTeamsToRemove.includes(team), 'disabled': (selectedTeamsToRemove.length >= (selectedOption === 'Tire uma' ? 1 : 2) && !selectedTeamsToRemove.includes(team)) }]"
            :disabled="(selectedTeamsToRemove.length >= (selectedOption === 'Tire uma' ? 1 : 2) && !selectedTeamsToRemove.includes(team))"
          >
            {{ team }}
          </button>
        </div>
        <button
          @click="confirmTeamRemoval()"
          :disabled="selectedTeamsToRemove.length < (selectedOption === 'Tire uma' ? 1 : 2)"
          class="btn-confirm-removal"
        >
          Confirmar Remoção
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed } from 'vue';
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
  emits: ['option-selected', 'teams-removed'],
  setup(props, { emit }) {
    const selectedOption = ref<string | null>(null);
    const chosenPoints = ref<number>(20); // Default para 20
    const selectedTeamsToRemove = ref<TeamColor[]>([]);

    const teamsOrder = [TeamColor.RED, TeamColor.BLUE, TeamColor.GREEN, TeamColor.YELLOW];

    const teamsOrderFiltered = computed(() => {
      // Filtra times que já estão desabilitados ou que é o time da vez
      return teamsOrder.filter(team =>
        !props.disabledTeams.has(team) && team !== props.currentTurnTeam
      );
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

    const currentTurnTeamClass = computed(() => {
      return props.currentTurnTeam ? getTeamClass(props.currentTurnTeam) : '';
    });

    const getOptionClass = (option: string) => {
      if (option === selectedOption.value) {
        return 'selected';
      }
      return '';
    };

    const selectOption = (option: string) => {
      selectedOption.value = option;
      chosenPoints.value = 20; // Reseta pontos ao selecionar nova opção
      selectedTeamsToRemove.value = []; // Reseta seleção de times

      if (option === 'Ganhe 20' || option === 'Perca 20' || option === 'Fora') {
        emit('option-selected', option);
      }
    };

    const confirmPoints = () => {
      if (chosenPoints.value >= 10 && chosenPoints.value <= 50) {
        emit('option-selected', selectedOption.value, chosenPoints.value);
      } else {
        alert('Por favor, insira um valor entre 10 e 50.');
      }
    };

    const toggleTeamSelection = (team: TeamColor) => {
      const index = selectedTeamsToRemove.value.indexOf(team);
      const limit = selectedOption.value === 'Tire uma' ? 1 : 2;

      if (index > -1) {
        selectedTeamsToRemove.value.splice(index, 1);
      } else if (selectedTeamsToRemove.value.length < limit) {
        selectedTeamsToRemove.value.push(team);
      }
    };

    const confirmTeamRemoval = () => {
      const limit = selectedOption.value === 'Tire uma' ? 1 : 2;
      if (selectedTeamsToRemove.value.length === limit) {
        emit('teams-removed', selectedTeamsToRemove.value);
      } else {
        alert(`Por favor, selecione exatamente ${limit} time(s).`);
      }
    };

    return {
      selectedOption,
      chosenPoints,
      selectedTeamsToRemove,
      teamsOrderFiltered,
      getTeamClass,
      currentTurnTeamClass,
      getOptionClass,
      selectOption,
      confirmPoints,
      toggleTeamSelection,
      confirmTeamRemoval,
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

.current-team-info {
  font-size: 1.5em; /* Reduzido */
  color: #555;
  margin-bottom: 25px; /* Reduzido */
}

.current-team-info span {
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 8px;
  color: white;
}

.current-team-info .red { background-color: #e74c3c; }
.current-team-info .blue { background-color: #3498db; }
.current-team-info .green { background-color: #2ecc71; }
.current-team-info .yellow { background-color: #f1c40f; }

.options-grid, .team-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); /* Mais flexível */
  gap: 10px; /* Reduzido */
  width: 100%;
  margin-top: 20px; /* Reduzido */
}

.option-button, .btn-confirm-points, .team-select-button, .btn-confirm-removal {
  padding: 12px 15px; /* Reduzido */
  font-size: 1.1em; /* Reduzido */
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  background-color: #3498db;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.option-button:hover:not(.selected), .btn-confirm-points:hover, .btn-confirm-removal:hover, .team-select-button:hover:not(.selected):not(.disabled) {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.option-button.selected {
  background-color: #2ecc71; /* Green for selected */
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.points-selection {
  margin-top: 20px;
}

.points-selection input {
  padding: 8px;
  font-size: 1.1em;
  width: 80px;
  text-align: center;
  border-radius: 5px;
  border: 1px solid #ccc;
  margin-right: 10px;
}

.btn-confirm-points {
  background-color: #2ecc71;
}

.team-removal-section {
  margin-top: 20px;
}

.team-select-button {
  background-color: #95a5a6; /* Default gray for teams */
  color: #333;
}

.team-select-button.selected {
  background-color: #e74c3c; /* Red when selected */
  color: white;
}

.team-select-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.team-select-button.blue { background-color: #3498db; color: white; }
.team-select-button.red { background-color: #e74c3c; color: white; }
.team-select-button.green { background-color: #2ecc71; color: white; }
.team-select-button.yellow { background-color: #f1c40f; color: #333; }

.btn-confirm-removal {
  background-color: #f39c12; /* Orange */
  margin-top: 15px;
}
.btn-confirm-removal:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>