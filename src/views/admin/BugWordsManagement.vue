<template>
  <div class="bug-words-management">
    <!-- Botão para Adicionar Nova Palavra BUG (visível quando o formulário está escondido) -->
    <button v-if="!showForm" @click="showAddForm" class="btn-add-new">
      Adicionar Palavra BUG
    </button>

    <!-- Formulário para Adicionar/Editar Palavra BUG (visível apenas quando showForm é true) -->
    <div v-if="showForm" class="form-container">
      <h3>{{ editingItem.id ? 'Editar Palavra BUG' : 'Adicionar Palavra BUG' }}</h3>
      <form @submit.prevent="saveBugWord">
        <input type="text" v-model="editingItem.word" placeholder="Palavra (ex: COMPUTADOR)" required />
        
        <!-- Input para Ordem -->
        <input type="number" v-model="editingItem.order_idx" placeholder="Ordem (opcional)" />
        
        <div class="category-selection">
            <h4>Categorias:</h4>
            <div class="checkbox-group">
                <div v-for="category in availableCategories" :key="category.id" class="checkbox-item">
                    <input 
                        type="checkbox" 
                        :id="`bug-word-cat-${category.id}`" 
                        :value="category.id" 
                        v-model="editingItem.categoryIds"
                    />
                    <label :for="`bug-word-cat-${category.id}`">{{ category.name }}</label>
                </div>
            </div>
        </div>

        <button type="submit">{{ editingItem.id ? 'Salvar Edição' : 'Adicionar' }}</button>
        <button type="button" @click="cancelEdit" class="btn-cancel">Cancelar</button>
      </form>
    </div>

    <!-- Lista de Palavras BUG em Tabela com Campo de Busca -->
    <div class="item-list">
      <div class="search-container">
        <input type="text" v-model="searchTerm" placeholder="Buscar por palavra ou categoria..." class="search-input" />
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
            <th 
                scope="col" 
                @click="sortTable('order_idx')" 
                :class="{ 'sortable': true, 'sorted-asc': sortColumn === 'order_idx' && sortDirection === 'asc', 'sorted-desc': sortColumn === 'order_idx' && sortDirection === 'desc' }"
            >
                Ordem
                <span v-if="sortColumn === 'order_idx'" class="sort-indicator">
                    <span v-if="sortDirection === 'asc'">&#9650;</span>
                    <span v-else>&#9660;</span>
                </span>
            </th>
            <th scope="col">Palavra</th>
            <th scope="col">Categorias</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedBugWordsItems.length === 0">
            <td colspan="5" style="text-align: center;">Nenhum item encontrado.</td>
          </tr>
          <tr v-for="item in sortedBugWordsItems" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.order_idx !== null ? item.order_idx : '-' }}</td>
            <td>{{ item.word }}</td>
            <td>
              <span v-if="item.categories && item.categories.length > 0">
                  {{ item.categories.map(c => c.name).join(', ') }}
              </span>
              <span v-else>Nenhuma</span>
            </td>
            <td>
              <button @click="editBugWord(item)" class="btn-icon btn-edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </button>
              <button @click="deleteBugWord(item.id)" class="btn-icon btn-delete">
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

interface Category {
  id: number;
  name: string;
}

interface BugWordItem {
  id: number;
  word: string;
  order_idx?: number | null; 
  categories: Category[];
  categoryIds: number[];
}

export default defineComponent({
  name: 'BugWordsManagement',
  setup() {
    const bugWordsItems = ref<BugWordItem[]>([]);
    const availableCategories = ref<Category[]>([]); 
    const editingItem = ref<BugWordItem>({ 
      id: 0, 
      word: '', 
      order_idx: null, 
      categories: [], 
      categoryIds: [] 
    });
    const searchTerm = ref<string>(''); 
    const showForm = ref(false); 

    const sortColumn = ref<string>(''); 
    const sortDirection = ref<'asc' | 'desc'>('asc'); 

    const baseURL = import.meta.env.VITE_API_BASE_URL; 

    const API_BASE_URL = baseURL + '/api/admin'; 
    const BUG_WORDS_API_URL = `${API_BASE_URL}/bug/words`;
    const CATEGORIES_API_URL = `${API_BASE_URL}/categories`;

    const fetchBugWordsItems = async () => {
      try {
        const response = await axios.get<BugWordItem[]>(BUG_WORDS_API_URL);
        bugWordsItems.value = response.data.map(item => ({
            ...item,
            categoryIds: item.categories ? item.categories.map(c => c.id) : [] 
        }));
      } catch (error) {
        console.error('Erro ao buscar palavras BUG:', error);
        alert('Erro ao carregar palavras BUG.');
      }
    };

    const fetchAvailableCategories = async () => {
      try {
        const response = await axios.get<Category[]>(CATEGORIES_API_URL);
        availableCategories.value = response.data;
      } catch (error) {
        console.error('Erro ao buscar categorias disponíveis:', error);
        alert('Erro ao carregar categorias disponíveis.');
      }
    };

    const saveBugWord = async () => {
      if (!editingItem.value.word.trim()) {
        alert('A palavra é obrigatória.');
        return;
      }

      try {
        const payload = {
            word: editingItem.value.word,
            order_idx: editingItem.value.order_idx,
            categoryIds: editingItem.value.categoryIds
        };
        
        if (editingItem.value.id) {
          await axios.put(`${BUG_WORDS_API_URL}/${editingItem.value.id}`, payload);
          alert('Palavra BUG atualizada com sucesso!');
        } else {
          await axios.post(BUG_WORDS_API_URL, payload);
          alert('Palavra BUG adicionada com sucesso!');
        }
        resetForm(); 
        fetchBugWordsItems(); 
        showForm.value = false; 
      } catch (error: any) {
        console.error('Erro ao salvar Palavra BUG:', error);
        if (error.response && error.response.data && error.response.data.error) {
          alert(`Erro: ${error.response.data.error}`);
        } else {
          alert('Erro ao salvar Palavra BUG.');
        }
      }
    };

    const showAddForm = () => {
      resetForm(); 
      showForm.value = true;
    };

    const editBugWord = (item: BugWordItem) => {
      editingItem.value = { 
        ...item, 
        categoryIds: item.categories ? item.categories.map(c => c.id) : [] 
      };
      showForm.value = true; 
    };

    const cancelEdit = () => {
      resetForm();
      showForm.value = false; 
    };

    const resetForm = () => {
        editingItem.value = { 
            id: 0, 
            word: '', 
            order_idx: null, 
            categories: [], 
            categoryIds: [] 
        };
    }

    const deleteBugWord = async (id: number) => {
      if (confirm('Tem certeza que deseja excluir esta Palavra BUG? Esta ação é irreversível.')) {
        try {
          await axios.delete(`${BUG_WORDS_API_URL}/${id}`);
          alert('Palavra BUG excluída com sucesso!');
          fetchBugWordsItems(); 
        } catch (error) {
          console.error('Erro ao excluir Palavra BUG:', error);
          alert('Erro ao excluir Palavra BUG.');
        }
      }
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
    const filteredBugWordsItems = computed(() => {
      if (!searchTerm.value) {
        return bugWordsItems.value;
      }
      const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
      return bugWordsItems.value.filter(item => {
        const categoriesText = item.categories.map(c => c.name).join(' ').toLowerCase();
        return (
          item.word.toLowerCase().includes(lowerCaseSearchTerm) ||
          categoriesText.includes(lowerCaseSearchTerm)
        );
      });
    });

    // Nova propriedade computada para ordenar os itens filtrados
    const sortedBugWordsItems = computed(() => {
        const items = [...filteredBugWordsItems.value]; 

        if (!sortColumn.value) {
            return items; 
        }

        return items.sort((a, b) => {
            let valA: any;
            let valB: any;

            if (sortColumn.value === 'id') {
                valA = a.id;
                valB = b.id;
            } else if (sortColumn.value === 'order_idx') {
                valA = a.order_idx === null || a.order_idx === undefined ? Infinity : a.order_idx;
                valB = b.order_idx === null || b.order_idx === undefined ? Infinity : b.order_idx;
                
                if ((a.order_idx === null || a.order_idx === undefined) && (b.order_idx === null || b.order_idx === undefined)) return 0;
                if (a.order_idx === null || a.order_idx === undefined) return sortDirection.value === 'asc' ? 1 : -1;
                if (b.order_idx === null || b.order_idx === undefined) return sortDirection.value === 'asc' ? -1 : 1;
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
      fetchAvailableCategories(); 
      fetchBugWordsItems();
    });

    return {
      bugWordsItems,
      availableCategories,
      editingItem,
      searchTerm, 
      sortedBugWordsItems, 
      showForm,
      saveBugWord,
      showAddForm,
      editBugWord,
      cancelEdit,
      deleteBugWord,
      
      sortColumn,
      sortDirection,
      sortTable,
    };
  },
});
</script>

<style scoped>
/* Reutilizando o CSS do ImagemOcultaManagement.vue */
.bug-words-management {
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
input[type="text"], input[type="number"], textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.category-selection {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
    background-color: #fff;
}
.checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.checkbox-item {
    display: inline-flex;
    align-items: center;
}
.checkbox-item input[type="checkbox"] {
    margin-right: 5px;
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
</style>