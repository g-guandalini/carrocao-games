<template>
  <div class="imagem-oculta-management">
    <!-- Botão para Adicionar Nova Imagem Oculta (visível quando o formulário está escondido) -->
    <button v-if="!showForm" @click="showAddForm" class="btn-add-new">
      Adicionar Imagem Oculta
    </button>

    <!-- Formulário para Adicionar/Editar Imagem Oculta (visível apenas quando showForm é true) -->
    <div v-if="showForm" class="form-container">
      <h3>{{ editingItem.id ? 'Editar Imagem Oculta' : 'Adicionar Imagem Oculta' }}</h3>
      <form @submit.prevent="saveImagemOculta">
        <input type="text" v-model="editingItem.hint" placeholder="Dica" required />
        <input type="text" v-model="editingItem.answer" placeholder="Resposta" required />
        
        <!-- Input para Ordem -->
        <input type="number" v-model="editingItem.order_idx" placeholder="Ordem (opcional)" />
        
        <!-- Input para Upload de Imagem -->
        <div class="image-upload-section">
            <label for="imageUpload">Upload da Imagem (Exato: 960x540px):</label>
            <input type="file" id="imageUpload" @change="handleFileUpload" accept="image/*" />
            
            <!-- Preview da Imagem -->
            <div v-if="imagePreviewUrl || editingItem.imageUrl" class="image-preview-wrapper">
                <img :src="imagePreviewUrl || (baseURL + editingItem.imageUrl)" alt="Preview da Imagem" class="image-preview" />
                <button type="button" @click="removeImage" class="btn-remove-image" title="Remover Imagem">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                    </svg>
                </button>
            </div>
            <p v-else class="no-image-selected">Nenhuma imagem selecionada.</p>
        </div>
        
        <div class="category-selection">
            <h4>Categorias:</h4>
            <div class="checkbox-group">
                <div v-for="category in availableCategories" :key="category.id" class="checkbox-item">
                    <input 
                        type="checkbox" 
                        :id="`cat-${category.id}`" 
                        :value="category.id" 
                        v-model="editingItem.categoryIds"
                    />
                    <label :for="`cat-${category.id}`">{{ category.name }}</label>
                </div>
            </div>
        </div>

        <button type="submit">{{ editingItem.id ? 'Salvar Edição' : 'Adicionar' }}</button>
        <button type="button" @click="cancelEdit" class="btn-cancel">Cancelar</button>
      </form>
    </div>

    <!-- Lista de Imagens Ocultas em Tabela com Campo de Busca -->
    <div class="item-list">
      <div class="search-container">
        <input type="text" v-model="searchTerm" placeholder="Buscar por dica, resposta ou categoria..." class="search-input" />
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
            <th scope="col">Dica</th>
            <th scope="col">Resposta</th>
            <th scope="col">Categorias</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedImagemOcultaItems.length === 0">
            <td colspan="6" style="text-align: center;">Nenhum item encontrado.</td>
          </tr>
          <tr v-for="item in sortedImagemOcultaItems" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.order_idx !== null ? item.order_idx : '-' }}</td>
            <td>{{ item.hint }}</td>
            <td>{{ item.answer }}</td>
            <td>
              <span v-if="item.categories && item.categories.length > 0">
                  {{ item.categories.map(c => c.name).join(', ') }}
              </span>
              <span v-else>Nenhuma</span>
            </td>
            <td>
              <button @click="editImagemOculta(item)" class="btn-icon btn-edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </button>
              <button @click="deleteImagemOculta(item.id)" class="btn-icon btn-delete">
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

interface ImagemOcultaItem {
  id: number;
  hint: string;
  answer: string;
  imageUrl: string; // Caminho da imagem no servidor
  order_idx?: number | null; // Adicionado: nova propriedade para ordem
  categories: Category[]; 
  categoryIds: number[]; 
}

export default defineComponent({
  name: 'ImagemOcultaManagement',
  setup() {
    const imagemOcultaItems = ref<ImagemOcultaItem[]>([]);
    const availableCategories = ref<Category[]>([]); 
    const editingItem = ref<ImagemOcultaItem>({ 
      id: 0, 
      hint: '', 
      answer: '', 
      imageUrl: '', 
      order_idx: null, // Inicializado como null
      categories: [], 
      categoryIds: [] 
    });
    const searchTerm = ref<string>(''); 
    const showForm = ref(false); // Novo estado para controlar a visibilidade do formulário

    // Variáveis reativas para ordenação
    const sortColumn = ref<string>(''); // Armazena a coluna atual para ordenação (ex: 'id', 'order_idx')
    const sortDirection = ref<'asc' | 'desc'>('asc'); // Armazena a direção da ordenação ('asc' ou 'desc')

    const selectedFile = ref<File | null>(null); // Para o arquivo sendo enviado
    const imagePreviewUrl = ref<string | null>(null); // Para o preview local do arquivo

    const baseURL = 'http://localhost:3001'; // Base URL para acessar as imagens estáticas

    const API_BASE_URL = 'http://localhost:3001/api/admin'; 
    const IMAGEM_OCULTA_API_URL = `${API_BASE_URL}/imagem-oculta`;
    const CATEGORIES_API_URL = `${API_BASE_URL}/categories`;

    const getCleanImageUrl = (url: string | null | undefined): string => {
      if (!url) return '';
      return url.startsWith('/public/characters/') ? url.replace('/public', '') : url;
    };

    const fetchImagemOcultaItems = async () => {
      try {
        const response = await axios.get<ImagemOcultaItem[]>(IMAGEM_OCULTA_API_URL);
        imagemOcultaItems.value = response.data.map(item => ({
            ...item,
            imageUrl: getCleanImageUrl(item.imageUrl),
            categoryIds: item.categories ? item.categories.map(c => c.id) : []
        }));
      } catch (error) {
        console.error('Erro ao buscar imagens ocultas:', error);
        alert('Erro ao carregar imagens ocultas.');
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

    const handleFileUpload = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione um arquivo de imagem.');
                selectedFile.value = null;
                imagePreviewUrl.value = null;
                target.value = '';
                return;
            }

            const img = new Image();
            img.onload = () => {
                const expectedWidth = 960;
                const expectedHeight = 540;

                console.log(`DEBUG: Imagem carregada. Dimensões: ${img.width}x${img.height}. Esperado: ${expectedWidth}x${expectedHeight}.`);

                if (img.width !== expectedWidth || img.height !== expectedHeight) {
                    alert(`A imagem deve ter exatamente ${expectedWidth}x${expectedHeight} pixels. Sua imagem tem ${img.width}x${img.height} pixels.`);
                    selectedFile.value = null;
                    imagePreviewUrl.value = null;
                    target.value = '';
                } else {
                    selectedFile.value = file;
                    imagePreviewUrl.value = URL.createObjectURL(file);
                }
            };
            img.onerror = () => {
                alert('Não foi possível carregar a imagem para validação.');
                selectedFile.value = null;
                imagePreviewUrl.value = null;
                target.value = '';
            };
            img.src = URL.createObjectURL(file);
        } else {
            selectedFile.value = null;
            imagePreviewUrl.value = null;
        }
    };

    const removeImage = () => {
        selectedFile.value = null;
        imagePreviewUrl.value = null;
        editingItem.value.imageUrl = ''; 
        const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const saveImagemOculta = async () => {
      if (!editingItem.value.hint.trim() || !editingItem.value.answer.trim()) {
        alert('Dica e Resposta são obrigatórios.');
        return;
      }

      if (!selectedFile.value && !editingItem.value.imageUrl && !editingItem.value.id) { // Verifica se há imagem ao adicionar item novo
        alert('Uma imagem é obrigatória. Por favor, faça o upload de uma imagem ou selecione uma existente.');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('hint', editingItem.value.hint);
        formData.append('answer', editingItem.value.answer);
        
        // Adiciona o campo de ordem ao FormData
        if (editingItem.value.order_idx !== null && editingItem.value.order_idx !== undefined) {
            formData.append('order', editingItem.value.order_idx.toString());
        } else {
            formData.append('order', ''); // Envia uma string vazia para representar null no backend
        }
        
        if (selectedFile.value) {
            formData.append('image', selectedFile.value); 
        } else if (editingItem.value.imageUrl) {
            formData.append('existingImageUrl', editingItem.value.imageUrl);
        } else {
            formData.append('existingImageUrl', '');
        }

        if (editingItem.value.categoryIds && editingItem.value.categoryIds.length > 0) {
            formData.append('categoryIds', JSON.stringify(editingItem.value.categoryIds));
        } else {
            formData.append('categoryIds', JSON.stringify([])); 
        }
        
        if (editingItem.value.id) {
          await axios.put(`${IMAGEM_OCULTA_API_URL}/${editingItem.value.id}`, formData);
          alert('Imagem Oculta atualizada com sucesso!');
        } else {
          await axios.post(IMAGEM_OCULTA_API_URL, formData);
          alert('Imagem Oculta adicionada com sucesso!');
        }
        resetForm(); 
        fetchImagemOcultaItems(); 
        showForm.value = false; // Esconde o formulário após salvar
      } catch (error: any) {
        console.error('Erro ao salvar Imagem Oculta:', error);
        if (error.response && error.response.data && error.response.data.error) {
          alert(`Erro: ${error.response.data.error}`);
        } else {
          alert('Erro ao salvar Imagem Oculta.');
        }
      }
    };

    const showAddForm = () => {
      resetForm(); // Limpa o formulário antes de mostrar para adicionar
      showForm.value = true;
    };

    const editImagemOculta = (item: ImagemOcultaItem) => {
      editingItem.value = { 
        ...item, 
        imageUrl: getCleanImageUrl(item.imageUrl), 
        categoryIds: item.categories ? item.categories.map(c => c.id) : [] 
      };
      
      selectedFile.value = null; 
      imagePreviewUrl.value = null; 
      const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = ''; 
      showForm.value = true; // Exibe o formulário ao clicar em editar
    };

    const cancelEdit = () => {
      resetForm();
      showForm.value = false; // Esconde o formulário ao cancelar
    };

    const resetForm = () => {
        editingItem.value = { 
            id: 0, 
            hint: '', 
            answer: '', 
            imageUrl: '', 
            order_idx: null, // Resetar para null
            categories: [], 
            categoryIds: [] 
        };
        selectedFile.value = null;
        imagePreviewUrl.value = null;
        const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }

    const deleteImagemOculta = async (id: number) => {
      if (confirm('Tem certeza que deseja excluir esta Imagem Oculta? Esta ação é irreversível.')) {
        try {
          await axios.delete(`${IMAGEM_OCULTA_API_URL}/${id}`);
          alert('Imagem Oculta excluída com sucesso!');
          fetchImagemOcultaItems(); 
        } catch (error) {
          console.error('Erro ao excluir Imagem Oculta:', error);
          alert('Erro ao excluir Imagem Oculta.');
        }
      }
    };

    // Função para alternar a ordenação
    const sortTable = (column: string) => {
        if (sortColumn.value === column) {
            // Se a mesma coluna for clicada, inverte a direção
            sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
        } else {
            // Se uma nova coluna for clicada, define a coluna e a direção inicial como ascendente
            sortColumn.value = column;
            sortDirection.value = 'asc';
        }
    };

    // Propriedade computada para filtrar os itens
    const filteredImagemOcultaItems = computed(() => {
      if (!searchTerm.value) {
        return imagemOcultaItems.value;
      }
      const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
      return imagemOcultaItems.value.filter(item => {
        const categoriesText = item.categories.map(c => c.name).join(' ').toLowerCase();
        return (
          item.hint.toLowerCase().includes(lowerCaseSearchTerm) ||
          item.answer.toLowerCase().includes(lowerCaseSearchTerm) ||
          categoriesText.includes(lowerCaseSearchTerm)
        );
      });
    });

    // Nova propriedade computada para ordenar os itens filtrados
    const sortedImagemOcultaItems = computed(() => {
        const items = [...filteredImagemOcultaItems.value]; // Cria uma cópia para não mutar o array original

        if (!sortColumn.value) {
            return items; // Retorna sem ordenar se nenhuma coluna de ordenação estiver definida
        }

        return items.sort((a, b) => {
            let valA: any;
            let valB: any;

            if (sortColumn.value === 'id') {
                valA = a.id;
                valB = b.id;
            } else if (sortColumn.value === 'order_idx') {
                // Trata valores nulos/indefinidos para order_idx para que fiquem no final
                valA = a.order_idx === null || a.order_idx === undefined ? Infinity : a.order_idx;
                valB = b.order_idx === null || b.order_idx === undefined ? Infinity : b.order_idx;
                
                // Coloca itens com order_idx nulo/indefinido no final da lista
                if (a.order_idx === null || a.order_idx === undefined) return sortDirection.value === 'asc' ? 1 : -1;
                if (b.order_idx === null || b.order_idx === undefined) return sortDirection.value === 'asc' ? -1 : 1;
            } else {
                return 0; // Caso a coluna não seja reconhecida para ordenação
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
      fetchImagemOcultaItems();
    });

    return {
      imagemOcultaItems,
      availableCategories,
      editingItem,
      searchTerm, 
      // Não exportamos mais filteredImagemOcultaItems diretamente para o v-for,
      // mas ele ainda é usado internamente pela sortedImagemOcultaItems.
      sortedImagemOcultaItems, // Exporta a lista já ordenada para o template
      imagePreviewUrl,
      baseURL, 
      showForm,
      getCleanImageUrl, 
      handleFileUpload,
      removeImage,
      saveImagemOculta,
      showAddForm,
      editImagemOculta,
      cancelEdit,
      deleteImagemOculta,
      
      // Exporta as variáveis e função de ordenação
      sortColumn,
      sortDirection,
      sortTable,
    };
  },
});
</script>

<style scoped>
/* Seu CSS existente, com as novas adições para ordenação */
.imagem-oculta-management {
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

.image-upload-section {
    border: 1px dashed #ccc;
    padding: 15px;
    border-radius: 8px;
    background-color: #f0f0f0;
    text-align: center;
}
.image-upload-section label {
    display: block;
    margin-bottom: 10px;
    font-weight: bold;
}
.image-upload-section input[type="file"] {
    display: block;
    width: fit-content;
    margin: 0 auto 15px auto;
    padding: 5px;
    background-color: white;
    border: 1px solid #eee;
    border-radius: 4px;
}
.image-preview-wrapper {
    position: relative;
    max-width: 320px;
    width: 100%;
    aspect-ratio: 16 / 9;
    margin: 15px auto 0 auto;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    background-color: #e9ecef;
}
.image-preview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}
.btn-remove-image {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: rgba(220, 53, 69, 0.8);
    color: white;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    z-index: 10;
}
.btn-remove-image:hover {
    background-color: rgba(220, 53, 69, 1);
}
.btn-remove-image svg {
    width: 12px;
    height: 12px;
    fill: white;
}
.no-image-selected {
    color: #666;
    font-style: italic;
    margin-top: 10px;
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

.list-image-thumb {
    width: 80px;
    height: auto;
    border-radius: 4px;
    border: 1px solid #eee;
    display: block;
    margin: 0 auto;
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