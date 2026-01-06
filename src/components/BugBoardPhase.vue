<template>
  <div class="bug-phase-container board-phase" tabindex="0">
    <div class="main-content">
      <p class="current-team-info">Equipe vencedora: <span :class="['team-name-display', teamPlayingBoardClass]">{{ teamPlayingBoard }}</span></p>

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
            <!-- ALTERADO: Lógica para exibir imagem ou texto, incluindo 'Bug' -->
            <template v-if="isTileRevealed(rowIndex, colIndex)">
              <img v-if="tileValue === 'Carroção'" src="/logo_sitio.png" alt="Logo Sítio do Carroção" class="carrocao-logo">
              <img v-else-if="tileValue === 'Bug'" src="/bug.png" alt="Bug" class="bug-logo">
              <span v-else class="tile-value">{{ formatTileValue(tileValue) }}</span>
            </template>
            <span v-else class="tile-hidden-text">{{ getRowLabel(rowIndex) }}{{ colIndex + 1 }}</span>
          </div>
        </div>
      </div>
      <p v-else class="info-message">Carregando tabuleiro...</p>

    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, onMounted, onUnmounted, nextTick, ref } from 'vue';
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
    teamPlayingBoard: {
      type: String as PropType<TeamColor | null>,
      required: true,
    },
    awaitingTileConfirmation: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['tile-selected', 'confirm-board-action', 'start-new-round-shortcut', 'view-scoreboard-shortcut'], // ADICIONADOS NOVOS EMITS
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

    const teamPlayingBoardClass = computed(() => getTeamClass(props.teamPlayingBoard!));

    const isTileRevealed = (row: number, col: number) => {
      return props.revealedTiles.has(`${row}-${col}`);
    };

    const selectTile = (row: number, col: number, value: BoardValue) => {
      if (props.awaitingTileConfirmation) {
        return;
      }
      if (!props.currentBoard || !props.teamPlayingBoard || isTileRevealed(row, col)) {
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

    const getRowLabel = (rowIndex: number): string => {
      return String.fromCharCode(65 + rowIndex); // 0 -> A, 1 -> B, etc.
    };

    // --- Lógica de Navegação por Teclado ---
    const firstKeyPressed = ref<string | null>(null);
    let firstKeyTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearFirstKey = () => {
      firstKeyPressed.value = null;
      if (firstKeyTimeout) {
        clearTimeout(firstKeyTimeout);
        firstKeyTimeout = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // NOVO: Lógica para barra de espaço e 'P' quando awaitingTileConfirmation é true
      if (props.awaitingTileConfirmation) {
        if (event.key === ' ') {
          event.preventDefault(); // Previne o scroll da página
          emit('start-new-round-shortcut'); // Emite o novo evento para iniciar nova rodada
          clearFirstKey();
          return;
        } else if (event.key.toLowerCase() === 'p') {
          event.preventDefault(); // Previne ação padrão da tecla 'P'
          emit('view-scoreboard-shortcut'); // Emite o novo evento para ir ao placar
          clearFirstKey();
          return;
        }
        // Se estiver aguardando confirmação, impede outras teclas de selecionar tiles
        // e a lógica original de 'confirm-board-action' pela barra de espaço foi removida
        clearFirstKey();
        return;
      }

      // Ignora eventos de repetição de tecla (quando a tecla é mantida pressionada)
      if (event.repeat) {
        return;
      }

      const key = event.key.toLowerCase();
      const rowLabels = ['a', 'b', 'c', 'd']; // Baseado nas 4 linhas (A, B, C, D)
      const colNumbers = ['1', '2', '3', '4', '5']; // Baseado nas 5 colunas (1, 2, 3, 4, 5)

      // Se uma tecla de linha foi previamente pressionada
      if (firstKeyPressed.value) {
        // Verifica se a tecla atual é um número de coluna
        if (colNumbers.includes(key)) {
          const rowKey = firstKeyPressed.value;
          const colKey = parseInt(key);

          const rowIndex = rowKey.charCodeAt(0) - 'a'.charCodeAt(0);
          const colIndex = colKey - 1;

          // Garante que currentBoard exista e que os índices sejam válidos
          if (props.currentBoard && rowIndex >= 0 && rowIndex < props.currentBoard.board_config.length &&
              colIndex >= 0 && colIndex < props.currentBoard.board_config[0].length) {
            const tileValue = props.currentBoard.board_config[rowIndex][colIndex];
            selectTile(rowIndex, colIndex, tileValue);
          }
          clearFirstKey(); // Limpa após a seleção (bem-sucedida ou tentativa)
          event.preventDefault(); // Previne ação padrão para teclas numéricas
          return;
        } else {
          // Se uma tecla de linha foi pressionada, mas a próxima não é um número de coluna,
          // limpa a primeira tecla e tenta processar a tecla atual como uma nova primeira tecla.
          clearFirstKey();
        }
      }

      // Se nenhuma primeira tecla foi pressionada, ou foi limpa, verifica se a tecla atual é uma letra de linha
      if (rowLabels.includes(key)) {
        firstKeyPressed.value = key;
        // Inicia um timeout para limpar firstKeyPressed se nenhum número de coluna seguir
        if (firstKeyTimeout) {
          clearTimeout(firstKeyTimeout);
        }
        firstKeyTimeout = setTimeout(() => {
          clearFirstKey();
        }, 800); // 800ms para pressionar a segunda tecla
        event.preventDefault(); // Previne ação padrão para teclas de letra
        return;
      }

      // Se for qualquer outra tecla não tratada acima, limpa qualquer primeira tecla pendente.
      clearFirstKey();
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
      nextTick(() => {
        const container = document.querySelector('.bug-phase-container.board-phase') as HTMLElement;
        if (container) {
          container.focus();
        }
      });
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
      clearFirstKey(); // Garante que o timeout seja limpo ao desmontar o componente
    });

    return {
      teamPlayingBoardClass,
      isTileRevealed,
      selectTile,
      formatTileValue,
      getRowLabel,
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
  padding: 5vh 1vw;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  box-sizing: border-box;
  max-height: 100vh;
  overflow-y: hidden;
  font-size: 16px;
}

.bug-phase-container[tabindex="0"]:focus {
  outline: none;
}

.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1.5vh;
  justify-content: center;
  align-items: center;
}

.current-team-info {
  font-size: 2em; /* MODIFICADO: Reduzido de 2.5em para 2em */
  color: #555;
  margin-bottom: 0;
}

.team-name-display {
  font-weight: bold;
  padding: 0.8vh 2vw; /* MODIFICADO: Reduzido de 1vh para 0.8vh (padding superior/inferior) */
  border-radius: 1.5vh;
  color: white;
  display: inline-block;
}

.team-name-display.red { background-color: #e74c3c; }
.team-name-display.blue { background-color: #3498db; }
.team-name-display.green { background-color: #2ecc71; }
.team-name-display.yellow { background-color: #f1c40f; color: #333; }

.board-grid {
  display: grid;
  grid-template-columns: repeat(5, 19.5vh); /* MODIFICADO: Reduzido de 20vh para 19.5vh */
  grid-template-rows: repeat(4, 19.5vh);    /* MODIFICADO: Reduzido de 20vh para 19.5vh */
  gap: 1.5vh;
  width: auto;
  margin: 0 auto;
  margin-top: 0;
}

.board-row {
  display: contents;
}

.board-tile {
  background-color: #34495e;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1 / 1; /* Mantém os tiles quadrados, preenchendo as células de 20vh */
  font-weight: bold;
  border-radius: 1.5vh;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  user-select: none;
  text-transform: uppercase;
  box-sizing: border-box;
  overflow: hidden; /* Garante que o conteúdo não transborde */
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
  box-shadow: none;
  transform: none;
}

 .board-tile.bug-tile.revealed {
  background-color: #e74c3c;
}

.carrocao-tile.revealed {
  background-color: #f1c40f56;
}

.tile-value {
  animation: popIn 0.3s ease-out;
  font-size: 6vh;
  white-space: nowrap;
}

/* NOVO: Estilos para a imagem do Carroção */
.carrocao-tile.revealed .carrocao-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  padding: 0.5vh;
  box-sizing: border-box;
  animation: popIn 0.3s ease-out;
}

/* NOVO: Estilos para a imagem do Bug */
.bug-tile.revealed .bug-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* Ou 'cover' se preferir que preencha todo o espaço */
  display: block;
  padding: 0.5vh; /* Adiciona um pequeno padding para a imagem não ficar colada nas bordas */
  box-sizing: border-box;
  animation: popIn 0.3s ease-out;
}

.tile-hidden-text {
  font-size: 6vh;
  color: rgba(255, 255, 255, 0.8);
}

.info-message {
  font-size: 2em;
  color: #777;
  margin-top: 0;
}

.confirm-instruction {
  font-size: 2em;
  color: #444;
  text-shadow: 0 0 5px rgba(0,0,0,0.2);
  margin-top: 0;
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