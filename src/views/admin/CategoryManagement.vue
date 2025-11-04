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
        <button type="submit">{{ editingCategory.id ? 'Salvar Edição' : 'Adicionar' }}</button>
        <!-- O botão cancelar agora aparece sempre que o formulário está aberto, para poder fechar -->
        <button type="button" @click="cancelEdit" class="btn-cancel">Cancelar</button> 
      </form>
    </div>

    <!-- Lista de Categorias em Tabela -->
    <div class="category-list">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Nome</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="categories.length === 0">
            <td colspan="3" style="text-align: center;">Nenhuma categoria cadastrada.</td>
          </tr>
          <tr v-for="category in categories" :key="category.id">
            <td>{{ category.id }}</td>
            <td>{{ category.name }}</td>
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
import { defineComponent, ref, onMounted } from 'vue';
import axios from 'axios';

interface Category {
  id: number;
  name: string;
}

export default defineComponent({
  name: 'CategoryManagement',
  setup() {
    const categories = ref<Category[]>([]);
    const editingCategory = ref<Category>({ id: 0, name: '' }); // Usado para adicionar e editar
    const showForm = ref(false); // NOVO: Estado para controlar a visibilidade do formulário

    const API_URL = 'http://localhost:3001/api/admin/categories'; // Ajuste a porta se necessário

    const fetchCategories = async () => {
      try {
        const response = await axios.get<Category[]>(API_URL);
        categories.value = response.data;
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
        if (editingCategory.value.id) {
          // Atualizar categoria existente
          await axios.put(`${API_URL}/${editingCategory.value.id}`, { name: editingCategory.value.name });
          alert('Categoria atualizada com sucesso!');
        } else {
          // Adicionar nova categoria
          await axios.post(API_URL, { name: editingCategory.value.name });
          alert('Categoria adicionada com sucesso!');
        }
        resetForm(); // Limpa o formulário
        fetchCategories(); // Recarrega a lista
        showForm.value = false; // NOVO: Esconde o formulário após salvar
      } catch (error: any) {
        console.error('Erro ao salvar categoria:', error);
        if (error.response && error.response.data && error.response.data.error) {
          alert(`Erro: ${error.response.data.error}`);
        } else {
          alert('Erro ao salvar categoria.');
        }
      }
    };

    // NOVO: Função para exibir o formulário de adição
    const showAddForm = () => {
      resetForm(); // Limpa o formulário antes de mostrar para adicionar
      showForm.value = true;
    };

    const editCategory = (category: Category) => {
      editingCategory.value = { ...category }; // Copia a categoria para edição
      showForm.value = true; // NOVO: Exibe o formulário ao clicar em editar
    };

    const cancelEdit = () => {
      resetForm(); // Limpa o formulário
      showForm.value = false; // NOVO: Esconde o formulário ao cancelar
    };
    
    // NOVO: Função para resetar o formulário, extraída de saveCategory e cancelEdit
    const resetForm = () => {
        editingCategory.value = { id: 0, name: '' };
    }

    const deleteCategory = async (id: number) => {
      if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        try {
          await axios.delete(`${API_URL}/${id}`);
          alert('Categoria excluída com sucesso!');
          fetchCategories(); // Recarrega a lista
        } catch (error) {
          console.error('Erro ao excluir categoria:', error);
          alert('Erro ao excluir categoria.');
        }
      }
    };

    onMounted(() => {
      fetchCategories();
    });

    return {
      categories,
      editingCategory,
      showForm, // NOVO: Exporta o estado showForm
      saveCategory,
      showAddForm, // NOVO: Exporta a função showAddForm
      editCategory,
      cancelEdit,
      deleteCategory,
    };
  },
});
</script>

<style scoped>
.category-management {
  padding: 20px;
  max-width: 800px;
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
/* NOVO: Estilo para o botão "Adicionar Nova Categoria" */
.btn-add-new {
  padding: 10px 20px;
  background-color: #28a745; /* Verde */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  margin-bottom: 20px;
  display: block; /* Ocupa a largura total para fácil clique */
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}
.btn-add-new:hover {
  background-color: #218838; /* Verde mais escuro no hover */
}

form {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
input[type="text"] {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
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

/* Estilos da Tabela */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
.data-table th, .data-table td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: left;
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

/* Estilos para botões com ícones */
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  margin: 0 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px; /* Tamanho fixo para botões de ícone */
  height: 30px; /* Tamanho fixo para botões de ícone */
  border-radius: 4px;
}
.btn-icon svg {
  width: 16px;
  height: 16px;
}

.btn-edit {
  color: #ffc107; /* Amarelo */
}
.btn-edit:hover {
  background-color: #ffedb8;
  color: #e0a800;
}
.btn-edit svg {
    fill: #ffc107;
}

.btn-delete {
  color: #dc3545; /* Vermelho */
}
.btn-delete:hover {
  background-color: #f5c6cb;
  color: #c82333;
}
.btn-delete svg {
    fill: #dc3545;
}
</style>