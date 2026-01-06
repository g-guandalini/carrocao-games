<template>
  <div class="bug-boards-management">
    <!-- Botão para Adicionar Novo Tabuleiro BUG (visível quando o formulário está escondido) -->
    <button v-if="!showForm" @click="showAddForm" class="btn-add-new">
      Adicionar Tabuleiro BUG
    </button>

    <!-- Formulário para Adicionar/Editar Tabuleiro BUG (visível apenas quando showForm é true) -->
    <div v-if="showForm" class="form-container">
      <h3>{{ editingItem.id ? 'Editar Tabuleiro BUG' : 'Adicionar Tabuleiro BUG' }}</h3>
      <form @submit.prevent="saveBugBoard">
        <input type="text" v-model="editingItem.name" placeholder="Nome do Tabuleiro" required />
        
        <!-- Botão para abrir o editor visual -->
        <div class="form-group">
            <label>Configuração do Tabuleiro:</label>
            <button type="button" @click="showBoardEditor = true" class="btn-manage-board">
                <i class="fas fa-edit"></i> Gerenciar Tabuleiro
            </button>
            <small v-if="editingItem.board_config && editingItem.board_config.length > 0">
                Tabuleiro configurado ({{ editingItem.board_config.length }} linhas x {{ editingItem.board_config[0]?.length || 0 }} colunas).
            </small>
            <small v-else>Nenhum tabuleiro configurado.</small>
        </div>

        <button type="submit">{{ editingItem.id ? 'Salvar Edição' : 'Adicionar' }}</button>
        <button type="button" @click="cancelEdit" class="btn-cancel">Cancelar</button>
      </form>

      <!-- Editor Visual do Tabuleiro (aparece como um "modal" ou seção dentro do formulário) -->
      <BugBoardEditor 
        v-if="showBoardEditor"
        :initialBoardConfig="editingItem.board_config"
        @update:boardConfig="handleBoardConfigUpdate"
        @cancel:edit="showBoardEditor = false"
      />
    </div>

    <!-- Lista de Tabuleiros BUG em Tabela com Campo de Busca -->
    <div class="item-list">
      <div class="search-container">
        <input type="text" v-model="searchTerm" placeholder="Buscar por nome..." class="search-input" />
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th 
                scope="col" 
                @click="sortTable('id')" 
                :class="{ 'sortable': true, 'sorted-asc': sortColumn === 'id' && sortDirection === 'asc', 'sorted-desc': sortColumn === 'id' && sortDirection === 'desc' }"
            >
                ID
                <span v-if="sortColumn === 'id'" class="sort-indicator">
                    <span v-if="sortDirection === 'asc'">&#9650;</span> <!-- Seta para cima -->
                    <span v-else>&#9660;</span> <!-- Seta para baixo -->
                </span>
            </th>
            <th scope="col">Nome</th>
            <th scope="col">Configuração do Tabuleiro</th>
            <th scope="col">Ativo</th> <!-- NOVA COLUNA -->
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedBugBoardsItems.length === 0">
            <td colspan="5" style="text-align: center;">Nenhum item encontrado.</td>
          </tr>
          <tr v-for="item in sortedBugBoardsItems" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>
                <pre class="board-config-display">{{ formatBoardConfig(item.board_config) }}</pre>
            </td>
            <td class="text-center">
                <i v-if="item.selected" class="fas fa-check-circle active-icon"></i>
                <i v-else class="fas fa-times-circle inactive-icon"></i>
            </td>
            <td>
              <button @click="editBugBoard(item)" class="btn-icon btn-edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </button>
              <button @click="selectBugBoard(item.id)" class="btn-icon btn-select" :disabled="!!item.selected">
                <i class="fas fa-check"></i>
              </button>
              <button @click="deleteBugBoard(item.id)" class="btn-icon btn-delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1h2.5a1 1 0 0 1 1 1v1zM.5 2a.5.5 0 0 0 0 1H1V4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3h.5a.5.5 0 0 0 0-1H.5zM12 4H4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4z"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import axios from 'axios';
import BugBoardEditor from './BugBoardEditor.vue'; // Importar o novo componente

interface BugBoardItem {
  id: number;
  name: string;
  board_config: (string | number)[][]; // Agora sempre o array parseado
  selected: number; // NOVA PROPRIEDADE
}

export default defineComponent({
  name: 'BugBoardsManagement',
  components: {
    BugBoardEditor, // Registrar o componente
  },
  setup() {
    const bugBoardsItems = ref<BugBoardItem[]>([]);
    const editingItem = ref<BugBoardItem>({ 
      id: 0, 
      name: '', 
      board_config: [],
      selected: 0, // Valor padrão
    });
    const searchTerm = ref<string>(''); 
    const showForm = ref(false); 
    const showBoardEditor = ref(false); // Novo estado para controlar a visibilidade do editor

    const sortColumn = ref<string>(''); 
    const sortDirection = ref<'asc' | 'desc'>('asc'); 

    const baseURL = import.meta.env.VITE_API_BASE_URL; 

    const API_BASE_URL = baseURL + '/api/admin'; 
    const BUG_BOARDS_API_URL = `${API_BASE_URL}/bug/boards`;

    const fetchBugBoardsItems = async () => {
      try {
        const response = await axios.get<BugBoardItem[]>(BUG_BOARDS_API_URL);
        bugBoardsItems.value = response.data.map(item => ({
            ...item,
            board_config: item.board_config || [],
            selected: item.selected || 0 // Garante que selected é 0 se não vier
        }));
      } catch (error) {
        console.error('Erro ao buscar tabuleiros BUG:', error);
        alert('Erro ao carregar tabuleiros BUG.');
      }
    };

    const saveBugBoard = async () => {
      if (!editingItem.value.name.trim()) {
        alert('O nome do tabuleiro é obrigatório.');
        return;
      }
      if (!editingItem.value.board_config || editingItem.value.board_config.length === 0) {
        alert('A configuração do tabuleiro não pode estar vazia. Por favor, gerencie o tabuleiro.');
        return;
      }

      try {
        const payload = {
            name: editingItem.value.name,
            board_config: editingItem.value.board_config // O backend fará o JSON.stringify
        };
        
        if (editingItem.value.id) {
          await axios.put(`${BUG_BOARDS_API_URL}/${editingItem.value.id}`, payload);
          alert('Tabuleiro BUG atualizado com sucesso!');
        } else {
          await axios.post(BUG_BOARDS_API_URL, payload);
          alert('Tabuleiro BUG adicionado com sucesso!');
        }
        resetForm(); 
        fetchBugBoardsItems(); 
        showForm.value = false; 
      } catch (error: any) {
        console.error('Erro ao salvar Tabuleiro BUG:', error);
        if (error.response && error.response.data && error.response.data.error) {
          alert(`Erro: ${error.response.data.error}`);
        } else {
          alert('Erro ao salvar Tabuleiro BUG.');
        }
      }
    };

    const showAddForm = () => {
      resetForm(); 
      showForm.value = true;
    };

    const editBugBoard = (item: BugBoardItem) => {
      editingItem.value = { 
        ...item, 
        board_config: item.board_config || [],
        selected: item.selected || 0
      };
      showForm.value = true; 
      showBoardEditor.value = false; // Esconde o editor ao abrir o formulário de edição
    };

    const cancelEdit = () => {
      resetForm();
      showForm.value = false; 
      showBoardEditor.value = false; // Esconde o editor ao cancelar
    };

    const resetForm = () => {
        editingItem.value = { 
            id: 0, 
            name: '', 
            board_config: [],
            selected: 0,
        };
        showBoardEditor.value = false; // Garante que o editor esteja escondido
    }

    const deleteBugBoard = async (id: number) => {
      if (confirm('Tem certeza que deseja excluir este Tabuleiro BUG? Esta ação é irreversível.')) {
        try {
          await axios.delete(`${BUG_BOARDS_API_URL}/${id}`);
          alert('Tabuleiro BUG excluído com sucesso!');
          fetchBugBoardsItems(); 
        } catch (error) {
          console.error('Erro ao excluir Tabuleiro BUG:', error);
          alert('Erro ao excluir Tabuleiro BUG.');
        }
      }
    };

    // NOVA FUNÇÃO: Definir um tabuleiro como ativo
    const selectBugBoard = async (id: number) => {
        if (confirm('Tem certeza que deseja definir este tabuleiro como o ativo? Isso desativará qualquer outro tabuleiro selecionado.')) {
            try {
                await axios.put(`${BUG_BOARDS_API_URL}/${id}/select`);
                alert('Tabuleiro definido como ativo com sucesso!');
                fetchBugBoardsItems(); // Recarrega a lista para atualizar o status visual
            } catch (error) {
                console.error('Erro ao definir tabuleiro como ativo:', error);
                alert('Erro ao definir tabuleiro como ativo.');
            }
        }
    };

    // Handler para quando o BugBoardEditor emitir a configuração atualizada
    const handleBoardConfigUpdate = (newConfig: (string | number)[][]) => {
        editingItem.value.board_config = newConfig;
        showBoardEditor.value = false; // Fecha o editor após salvar
    };

    const formatBoardConfig = (config: (string | number)[][]): string => {
        if (!config || config.length === 0) return 'Vazio';
        // Exibe uma versão mais compacta para a tabela
        return JSON.stringify(config);
    };

    // Função para alternar a ordenação
    const sortTable = (column: string) => {
        if (sortColumn.value === column) {
            sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn.value = column;
            sortDirection.value = 'asc';
        }
    };

    // Propriedade computada para filtrar os itens
    const filteredBugBoardsItems = computed(() => {
      if (!searchTerm.value) {
        return bugBoardsItems.value;
      }
      const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
      return bugBoardsItems.value.filter(item => {
        return (
          item.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          JSON.stringify(item.board_config).toLowerCase().includes(lowerCaseSearchTerm)
        );
      });
    });

    // Nova propriedade computada para ordenar os itens filtrados
    const sortedBugBoardsItems = computed(() => {
        const items = [...filteredBugBoardsItems.value]; 

        if (!sortColumn.value) {
            return items; 
        }

        return items.sort((a, b) => {
            let valA: any;
            let valB: any;

            if (sortColumn.value === 'id') {
                valA = a.id;
                valB = b.id;
            } else {
                return 0; 
            }

            if (valA < valB) {
                return sortDirection.value === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortDirection.value === 'asc' ? 1 : -1;
            }
            return 0;
        });
    });

    onMounted(() => {
      fetchBugBoardsItems();
    });

    return {
      bugBoardsItems,
      editingItem,
      searchTerm, 
      sortedBugBoardsItems, 
      showForm,
      showBoardEditor, // Expor para o template
      saveBugBoard,
      showAddForm,
      editBugBoard,
      cancelEdit,
      deleteBugBoard,
      selectBugBoard, // Expor a nova função
      handleBoardConfigUpdate, // Expor o handler
      formatBoardConfig,
      
      sortColumn,
      sortDirection,
      sortTable,
    };
  },
});
</script>

<style scoped>
/* Reutilizando o CSS do ImagemOcultaManagement.vue */
.bug-boards-management {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: sans-serif;
}
.form-container, .item-list {
  background: #f9f9f9;
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 8px;
}
h2, h3, h4 {
  color: #333;
  margin-bottom: 15px;
}
.btn-add-new {
  padding: 10px 20px;
  background-color: #28a745; /* Verde */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  margin-bottom: 20px;
  display: block;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}
.btn-add-new:hover {
  background-color: #218838; /* Verde mais escuro no hover */
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}
input[type="text"], input[type="number"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.form-group label {
    font-weight: bold;
    margin-bottom: 5px;
}

.form-group small {
    font-size: 0.85em;
    color: #666;
}

.btn-manage-board {
    background-color: #007bff;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
    display: flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
}
.btn-manage-board:hover {
    background-color: #0056b3;
}
.btn-manage-board i {
    font-size: 1.1em;
}


button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
}
button:hover {
  background-color: #0056b3;
}
.btn-cancel {
  background-color: #6c757d;
}
.btn-cancel:hover {
  background-color: #5a6268;
}

.search-container {
    margin-bottom: 15px;
}
.search-input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
.data-table th, .data-table td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: left;
  vertical-align: top;
}

/* Estilos para colunas ordenáveis */
.data-table th.sortable {
    cursor: pointer;
    position: relative;
    padding-right: 25px; /* Espaço para a seta */
    user-select: none; /* Impede a seleção de texto ao clicar para ordenar */
}

.data-table th.sortable:hover {
    background-color: #e0e4e7;
}

/* Indicador de ordenação (seta) */
.sort-indicator {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8em;
    line-height: 1;
    color: #666; /* Cor da seta */
}

/* Estilo para a coluna atualmente ordenada */
.data-table th.sortable.sorted-asc,
.data-table th.sortable.sorted-desc {
    background-color: #d1e7dd; /* Um verde claro para indicar que está ativa */
}
.data-table th.sortable.sorted-asc .sort-indicator {
    color: #28a745; /* Seta mais escura quando ativa */
}
.data-table th.sortable.sorted-desc .sort-indicator {
    color: #dc3545; /* Seta mais escura quando ativa */
}


.data-table th {
  background-color: #e9ecef;
  font-weight: bold;
}
.data-table tbody tr:nth-child(even) {
  background-color: #f8f9fa;
}
.data-table tbody tr:hover {
  background-color: #e2e6ea;
}

.board-config-display {
    white-space: pre-wrap; /* Mantém quebras de linha e espaços */
    word-break: break-all; /* Quebra palavras longas */
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.85em;
    background-color: #eef;
    padding: 5px;
    border-radius: 4px;
    max-height: 150px; /* Limita a altura */
    overflow-y: auto; /* Adiciona scroll se necessário */
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  margin: 0 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
}
.btn-icon svg {
  width: 16px;
  height: 16px;
}

.btn-edit {
  color: #ffc107;
}
.btn-edit:hover {
  background-color: #ffedb8;
  color: #e0a800;
}
.btn-edit svg {
    fill: #ffc107;
}

.btn-delete {
  color: #dc3545;
}
.btn-delete:hover {
  background-color: #f5c6cb;
  color: #c82333;
}
.btn-delete svg {
    fill: #dc3545;
}

/* Estilos para o botão de seleção */
.btn-select {
    color: #28a745; /* Verde */
}
.btn-select:hover:not(:disabled) {
    background-color: #d4edda; /* Verde claro no hover */
    color: #1e7e34;
}
.btn-select:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    color: #6c757d; /* Cinza quando desabilitado */
}
.btn-select i {
    font-size: 1.1em;
}

/* Estilos para os ícones de status ativo/inativo */
.active-icon {
    color: #28a745; /* Verde */
    font-size: 1.2em;
}
.inactive-icon {
    color: #dc3545; /* Vermelho */
    font-size: 1.2em;
}
.text-center {
    text-align: center;
}
</style>