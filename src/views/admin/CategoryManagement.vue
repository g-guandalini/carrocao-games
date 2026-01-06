<!-- src/views/admin/CategoryManagement.vue -->
<template>
  <div class="category-management">
    <!-- Botão para Adicionar Nova Categoria (visível quando o formulário está escondido) -->
    <button v-if="!showForm" @click="showAddForm" class="btn-add-new">
      Adicionar Nova Categoria
    </button>

    <!-- Formulário para Adicionar/Editar Categoria (visível apenas quando showForm é true) -->
    <div v-if="showForm" class="form-container">
      <h3>{{ editingCategory.id ? 'Editar Categoria' : 'Adicionar Nova Categoria' }}</h3>
      <form @submit.prevent="saveCategory">
        <input type="text" v-model="editingCategory.name" placeholder="Nome da Categoria" required />
        
        <div class="checkbox-group">
          <label>
            <input type="checkbox" v-model="editingCategory.imagem_oculta_start" />
            Selecionar para o jogo Imagem Oculta
          </label>
          <label>
            <input type="checkbox" v-model="editingCategory.conexao_start" />
            Selecionar para o jogo Conexão
          </label>
          <label>
            <input type="checkbox" v-model="editingCategory.bug_start" />
            Selecionar para o jogo Bug
          </label>
        </div>

        <button type="submit">{{ editingCategory.id ? 'Salvar Edição' : 'Adicionar' }}</button>
        <button type="button" @click="cancelEdit" class="btn-cancel">Cancelar</button> 
      </form>
    </div>

    <!-- Lista de Categorias em Tabela -->
    <div class="category-list">
      <!-- Campo de Busca -->
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
                    <span v-if="sortDirection === 'asc'">&#9650;</span>
                    <span v-else>&#9660;</span>
                </span>
            </th>
            <th 
                scope="col" 
                @click="sortTable('name')" 
                :class="{ 'sortable': true, 'sorted-asc': sortColumn === 'name' && sortDirection === 'asc', 'sorted-desc': sortColumn === 'name' && sortDirection === 'desc' }"
            >
                Nome
                <span v-if="sortColumn === 'name'" class="sort-indicator">
                    <span v-if="sortDirection === 'asc'">&#9650;</span>
                    <span v-else>&#9660;</span>
                </span>
            </th>
            <th scope="col">Imagem Oculta</th>
            <th scope="col">Conexão</th>
            <th scope="col">Bug</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedCategories.length === 0">
            <td colspan="6" style="text-align: center;">Nenhuma categoria encontrada.</td>
          </tr>
          <tr v-for="category in sortedCategories" :key="category.id">
            <td>{{ category.id }}</td>
            <td>{{ category.name }}</td>
            <td>
              <span v-if="category.imagem_oculta_start" class="status-icon success">&#10003;</span>
              <span v-else class="status-icon error">&#10006;</span>
            </td>
            <td>
              <span v-if="category.conexao_start" class="status-icon success">&#10003;</span>
              <span v-else class="status-icon error">&#10006;</span>
            </td>
            <td>
              <span v-if="category.bug_start" class="status-icon success">&#10003;</span>
              <span v-else class="status-icon error">&#10006;</span>
            </td>
            <td>
              <button @click="editCategory(category)" class="btn-icon btn-edit">
                <!-- Ícone de caneta SVG -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </button>
              <button @click="deleteCategory(category.id)" class="btn-icon btn-delete">
                <!-- Ícone de lixeira SVG -->
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

// Usando a interface Category do types.ts para consistência
import { Category } from '../../types'; 

export default defineComponent({
  name: 'CategoryManagement',
  setup() {
    const categories = ref<Category[]>([]);
    const editingCategory = ref<Category>({ 
      id: 0, 
      name: '', 
      // Garante que os defaults são booleanos para o v-model do checkbox
      imagem_oculta_start: 0, 
      conexao_start: 0,       
      bug_start: 0            
    }); 
    const showForm = ref(false);

    // --- Adição para Busca e Ordenação ---
    const searchTerm = ref<string>(''); 
    const sortColumn = ref<string>(''); 
    const sortDirection = ref<'asc' | 'desc'>('asc'); 
    // --- Fim Adição ---

    const API_URL = import.meta.env.VITE_API_BASE_URL + '/api/admin/categories';

    const fetchCategories = async () => {
      try {
        const response = await axios.get<Category[]>(API_URL);
        // Mapeia os valores 0/1 do backend para booleanos no frontend
        categories.value = response.data.map(cat => ({
          ...cat,
          imagem_oculta_start: (cat.imagem_oculta_start),
          conexao_start: (cat.conexao_start),
          bug_start: (cat.bug_start),
        }));
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        alert('Erro ao carregar categorias.');
      }
    };

    const saveCategory = async () => {
      if (!editingCategory.value.name.trim()) {
        alert('O nome da categoria não pode ser vazio.');
        return;
      }

      try {
        // Envia os booleanos diretamente; categoryRoutes.js no backend converterá para 0/1
        if (editingCategory.value.id) {
          await axios.put(`${API_URL}/${editingCategory.value.id}`, { 
            name: editingCategory.value.name,
            imagem_oculta_start: editingCategory.value.imagem_oculta_start,
            conexao_start: editingCategory.value.conexao_start,
            bug_start: editingCategory.value.bug_start,
          });
          alert('Categoria atualizada com sucesso!');
        } else {
          await axios.post(API_URL, { 
            name: editingCategory.value.name,
            imagem_oculta_start: editingCategory.value.imagem_oculta_start,
            conexao_start: editingCategory.value.conexao_start,
            bug_start: editingCategory.value.bug_start,
          });
          alert('Categoria adicionada com sucesso!');
        }
        resetForm();
        fetchCategories();
        showForm.value = false;
      } catch (error: any) {
        console.error('Erro ao salvar categoria:', error);
        if (error.response && error.response.data && error.response.data.error) {
          alert(`Erro: ${error.response.data.error}`);
        } else {
          alert('Erro ao salvar categoria.');
        }
      }
    };

    const showAddForm = () => {
      resetForm();
      showForm.value = true;
    };

    const editCategory = (category: Category) => {
      // Copia a categoria, garantindo que os valores são booleanos para o v-model do checkbox
      editingCategory.value = { 
        ...category,
        imagem_oculta_start: (category.imagem_oculta_start),
        conexao_start: (category.conexao_start),
        bug_start: (category.bug_start),
      }; 
      showForm.value = true;
    };

    const cancelEdit = () => {
      resetForm();
      showForm.value = false;
    };
    
    const resetForm = () => {
        editingCategory.value = { 
            id: 0, 
            name: '', 
            imagem_oculta_start: 0, 
            conexao_start: 0, 
            bug_start: 0 
        };
    }

    const deleteCategory = async (id: number) => {
      if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        try {
          await axios.delete(`${API_URL}/${id}`);
          alert('Categoria excluída com sucesso!');
          fetchCategories();
        } catch (error) {
          console.error('Erro ao excluir categoria:', error);
          alert('Erro ao excluir categoria.');
        }
      }
    };

    // --- Lógica de Busca e Ordenação ---
    const filteredCategories = computed(() => {
      if (!searchTerm.value) {
        return categories.value;
      }
      const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
      return categories.value.filter(category => {
        return (
          category.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
      });
    });

    const sortTable = (column: string) => {
        if (sortColumn.value === column) {
            sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn.value = column;
            sortDirection.value = 'asc';
        }
    };

    const sortedCategories = computed(() => {
        const items = [...filteredCategories.value]; 

        if (!sortColumn.value) {
            return items; 
        }

        return items.sort((a, b) => {
            let valA: any;
            let valB: any;

            if (sortColumn.value === 'id') {
                valA = a.id;
                valB = b.id;
            } 
            else if (sortColumn.value === 'name') {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
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
    // --- Fim da Lógica de Busca e Ordenação ---

    onMounted(() => {
      fetchCategories();
    });

    return {
      categories, 
      editingCategory,
      showForm,
      saveCategory,
      showAddForm,
      editCategory,
      cancelEdit,
      deleteCategory,
      
      // Adicionado para Busca e Ordenação
      searchTerm,
      sortColumn,
      sortDirection,
      sortTable,
      sortedCategories, 
    };
  },
});
</script>

<style scoped>
.category-management {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  font-family: sans-serif;
}
.form-container, .category-list {
  background: #f9f9f9;
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 8px;
}
h2, h3 {
  color: #333;
  margin-bottom: 15px;
}
.btn-add-new {
  padding: 10px 20px;
  background-color: #28a745;
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
  background-color: #218838;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}
input[type="text"] {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 5px;
    margin-bottom: 5px;
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
    background-color: #fff;
}
.checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9em;
    color: #555;
}
.checkbox-group input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

form button {
    width: fit-content;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background-color: #007bff;
    color: white;
    margin-top: 5px;
}
form button:hover {
  background-color: #0056b3;
}
.btn-cancel {
  background-color: #6c757d;
}
.btn-cancel:hover {
  background-color: #5a6268;
}

/* --- Estilos de Busca e Ordenação --- */
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

.data-table th.sortable {
    cursor: pointer;
    position: relative;
    padding-right: 25px;
    user-select: none;
}

.data-table th.sortable:hover {
    background-color: #e0e4e7;
}

.sort-indicator {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8em;
    line-height: 1;
    color: #666;
}

.data-table th.sortable.sorted-asc,
.data-table th.sortable.sorted-desc {
    background-color: #d1e7dd;
}
.data-table th.sortable.sorted-asc .sort-indicator {
    color: #28a745;
}
.data-table th.sortable.sorted-desc .sort-indicator {
    color: #dc3545;
}
/* --- Fim Estilos de Busca e Ordenação --- */


/* Estilos da Tabela */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
.data-table th, .data-table td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: center;
}
.data-table th {
  background-color: #e9ecef;
  font-weight: bold;
  font-size: 0.85em;
}
.data-table td:nth-child(2) {
  text-align: left;
}
.data-table tbody tr:nth-child(even) {
  background-color: #f8f9fa;
}
.data-table tbody tr:hover {
  background-color: #e2e6ea;
}

.status-icon {
    font-size: 1.1em;
    font-weight: bold;
}
.status-icon.success {
    color: #28a745;
}
.status-icon.error {
    color: #dc3545;
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