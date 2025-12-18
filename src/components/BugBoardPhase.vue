<template>
  <div class="bug-phase-container board-phase">
    <div class="main-content">
      <h2 class="phase-title">Fase do Tabuleiro</h2>
      <p class="current-team-info">Time que acertou a palavra: <span :class="currentTurnTeamClass">{{ currentTurnTeam }}</span></p>

      <div v-if="currentBoard" class="board-grid">
        <div
          v-for="(row, rowIndex) in currentBoard.board_config"
          :key="'row-' + rowIndex"
          class="board-row"
        >
          <div
            v-for="(tileValue, colIndex) in row"
            :key="'col-' + rowIndex + '-' + colIndex"
            :class="['board-tile', { 'revealed': isTileRevealed(rowIndex, colIndex), 'bug-tile': tileValue === 'Bug', 'carrocao-tile': tileValue === 'Carroção', 'disabled': awaitingTileConfirmation }]"
            @click="selectTile(rowIndex, colIndex, tileValue)"
          >
            <span v-if="isTileRevealed(rowIndex, colIndex)" class="tile-value">{{ formatTileValue(tileValue) }}</span>
            <span v-else class="tile-hidden-text">?</span>
          </div>
        </div>
      </div>
      <p v-else class="info-message">Carregando tabuleiro...</p>

      <button
        v-if="awaitingTileConfirmation"
        @click="$emit('confirm-board-action')"
        class="btn-confirm-tile"
      >
        Confirmar e Seguir
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { BugBoard, TeamColor, BoardValue } from '../types';

export default defineComponent({
  name: 'BugBoardPhase',
  props: {
    currentBoard: {
      type: Object as PropType<BugBoard | null>,
      required: true,
    },
    revealedTiles: {
      type: Set as PropType<Set<string>>,
      required: true,
    },
    currentTurnTeam: {
      type: String as PropType<TeamColor | null>,
      required: true,
    },
    awaitingTileConfirmation: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['tile-selected', 'confirm-board-action'],
  setup(props, { emit }) {
    const getTeamClass = (team: TeamColor) => {
      switch (team) {
        case TeamColor.BLUE: return 'blue';
        case TeamColor.RED: return 'red';
        case TeamColor.GREEN: return 'green';
        case TeamColor.YELLOW: return 'yellow';
        default: return '';
      }
    };

    const currentTurnTeamClass = computed(() => getTeamClass(props.currentTurnTeam!));

    const isTileRevealed = (row: number, col: number) => {
      return props.revealedTiles.has(`${row}-${col}`);
    };

    const selectTile = (row: number, col: number, value: BoardValue) => {
      if (props.awaitingTileConfirmation) {
        console.log("Já aguardando confirmação. Clique no botão 'Confirmar e Seguir'.");
        return;
      }
      if (!props.currentTurnTeam) {
        console.warn("Nenhuma equipe na vez para selecionar um tile.");
        return;
      }
      if (isTileRevealed(row, col)) {
        console.log("Este tile já foi revelado.");
        return;
      }
      emit('tile-selected', row, col, value);
    };

    const formatTileValue = (value: BoardValue) => {
      if (typeof value === 'number') {
        return value > 0 ? `+${value}` : `${value}`; 
      }
      return value;
    };

    return {
      currentTurnTeamClass,
      isTileRevealed,
      selectTile,
      formatTileValue,
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
.current-team-info .yellow { background-color: #f1c40f; color: #333; }

.board-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px; /* Reduzido o gap */
  width: 100%;
  max-width: 600px; /* Limitando a largura máxima para o grid */
  margin-top: 20px; /* Reduzido */
  flex-grow: 1; /* Permite que o grid se estique verticalmente */
  align-items: center; /* Centraliza verticalmente os itens do grid */
}

.board-row {
  display: contents; /* Para que os tiles sigam o grid principal */
}

.board-tile {
  background-color: #34495e; 
  color: white;
  /* Altura agora é baseada na largura para manter aspecto quadrado */
  padding-bottom: 100%; /* Isso faz com que a altura seja igual à largura */
  position: relative; /* Para posicionar o conteúdo dentro do tile */
  display: flex; /* Para centralizar o conteúdo */
  justify-content: center;
  align-items: center;
  font-size: 2em; /* Ligeiramente reduzido */
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  user-select: none;
  text-transform: uppercase;
  box-sizing: border-box; /* Garante que padding-bottom não adicione ao tamanho total */
}

.board-tile > * { /* Garante que o conteúdo (span) se posicione corretamente */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 90%; /* Evita que o texto saia do tile */
  word-break: break-word; /* Quebra palavras longas */
}

.board-tile.disabled {
  pointer-events: none;
  opacity: 0.7;
  cursor: not-allowed;
}

.board-tile:hover:not(.revealed):not(.disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.board-tile.revealed {
  background-color: #2ecc71;
  cursor: default;
  color: #fff;
  font-size: 1.8em; /* Ajustado */
  box-shadow: none;
  transform: none;
}

.board-tile.bug-tile.revealed {
  background-color: #e74c3c;
}

.board-tile.carrocao-tile.revealed {
  background-color: #f1c40f;
  color: #333;
}

.tile-value {
  animation: popIn 0.3s ease-out;
}

.tile-hidden-text {
  font-size: 3em; /* Reduzido */
  color: rgba(255, 255, 255, 0.8);
}

.info-message {
  font-size: 1.2em;
  color: #777;
  margin-top: 20px;
}

.btn-confirm-tile {
  margin-top: 20px; /* Reduzido */
  padding: 12px 25px; /* Reduzido */
  font-size: 1.2em; /* Reduzido */
  font-weight: bold;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.btn-confirm-tile:hover {
  background-color: #218838;
  transform: translateY(-2px);
}

@keyframes popIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>