<template>
  <div class="bug-board-editor">
    <h4>Editar Configuração do Tabuleiro</h4>
    <p class="editor-info">Selecione o valor para cada célula do tabuleiro (4 linhas x 5 colunas).</p>
    
    <div class="board-grid">
      <div v-for="(row, rowIndex) in localBoardConfig" :key="rowIndex" class="board-row">
        <div v-for="(_cell, colIndex) in row" :key="`${rowIndex}-${colIndex}`" class="board-cell">
          <select v-model="localBoardConfig[rowIndex][colIndex]">
            <option v-for="option in cellOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="editor-actions">
      <button type="button" @click="saveChanges" class="btn-save-editor">Salvar Configuração</button>
      <button type="button" @click="cancelChanges" class="btn-cancel-editor">Cancelar</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from 'vue';

export default defineComponent({
  name: 'BugBoardEditor',
  props: {
    // A configuração inicial do tabuleiro, que será um array de arrays
    initialBoardConfig: {
      type: Array as PropType<(string | number)[][]>,
      required: true,
    },
  },
  emits: ['update:boardConfig', 'cancel:edit'],
  setup(props, { emit }) {
    // Opções disponíveis para cada célula
    const cellOptions = ref<(string | number)[]>([
      10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 'Bug', 'Carroção'
    ]);

    // Estado local do tabuleiro para edição
    const localBoardConfig = ref<(string | number)[][]>([]);

    // Função para inicializar o estado local a partir da prop
    const initializeLocalConfig = () => {
      // Garante uma cópia profunda para não modificar a prop diretamente
      if (props.initialBoardConfig && props.initialBoardConfig.length > 0) {
        localBoardConfig.value = props.initialBoardConfig.map(row => [...row]);
      } else {
        // Se não houver configuração inicial, cria um tabuleiro vazio 4x5
        localBoardConfig.value = Array(4).fill(null).map(() => Array(5).fill(10));
      }
    };

    // Observa a prop initialBoardConfig para re-inicializar se ela mudar
    watch(() => props.initialBoardConfig, () => {
      initializeLocalConfig();
    }, { immediate: true, deep: true }); // immediate para rodar na montagem, deep para arrays aninhados

    const saveChanges = () => {
      emit('update:boardConfig', localBoardConfig.value);
    };

    const cancelChanges = () => {
      emit('cancel:edit');
    };

    return {
      cellOptions,
      localBoardConfig,
      saveChanges,
      cancelChanges,
    };
  },
});
</script>

<style scoped>
.bug-board-editor {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.bug-board-editor h4 {
  margin-top: 0;
  color: #333;
}

.editor-info {
    font-size: 0.9em;
    color: #666;
    margin-bottom: 15px;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 5 colunas */
  gap: 10px;
  margin-bottom: 20px;
}

.board-row {
  display: contents; /* Faz com que os filhos sejam colocados diretamente no grid pai */
}

.board-cell {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.board-cell select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
  -webkit-appearance: none; /* Remove estilo padrão do navegador */
  -moz-appearance: none;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007bff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-6.5%200-12.3%203.2-16.1%208.1-3.8%204.9-4.3%2011.9-1.3%2017.4l133.3%20166c4.5%205.7%2011.3%209.3%2018.4%209.3s13.9-3.6%2018.4-9.3l133.3-166c3-5.5%202.5-12.5-.9-17.4z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 12px;
  padding-right: 30px; /* Espaço para a seta */
}

.board-cell select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.editor-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 15px;
}

.btn-save-editor, .btn-cancel-editor {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

.btn-save-editor {
  background-color: #28a745;
  color: white;
}
.btn-save-editor:hover {
  background-color: #218838;
}

.btn-cancel-editor {
  background-color: #6c757d;
  color: white;
}
.btn-cancel-editor:hover {
  background-color: #5a6268;
}
</style>