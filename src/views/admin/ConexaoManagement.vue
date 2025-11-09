<template>
    <div class="conexao-management">
      <!-- Botão para Adicionar Nova Conexão (visível quando o formulário está escondido) -->
      <button v-if="!showForm" @click="showAddForm" class="btn-add-new">
        Adicionar Nova Conexão
      </button>
  
      <!-- Formulário para Adicionar/Editar Conexão (visível apenas quando showForm é true) -->
      <div v-if="showForm" class="form-container">
        <h3>{{ editingItem.id ? 'Editar Conexão' : 'Adicionar Conexão' }}</h3>
        <form @submit.prevent="saveConexao">
          <input type="text" v-model="editingItem.palavra" placeholder="Palavra da Conexão" required />
          
          <!-- Input para Ordem -->
          <!-- ========================================================= -->
          <!--              NOVO INPUT PARA ORDER_IDX -->
          <!-- ========================================================= -->
          <input type="number" v-model="editingItem.order_idx" placeholder="Ordem (opcional)" />
          <!-- ========================================================= -->
          <!--         FIM DO NOVO INPUT PARA ORDER_IDX -->
          <!-- ========================================================= -->
          
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
                          :id="`cat-conexao-${category.id}`" 
                          :value="category.id" 
                          v-model="editingItem.categoryIds"
                      />
                      <label :for="`cat-conexao-${category.id}`">{{ category.name }}</label>
                  </div>
              </div>
          </div>
  
          <button type="submit">{{ editingItem.id ? 'Salvar Edição' : 'Adicionar' }}</button>
          <button type="button" @click="cancelEdit" class="btn-cancel">Cancelar</button>
        </form>
      </div>
  
      <!-- Lista de Conexões em Tabela com Campo de Busca -->
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
              <!-- ========================================================= -->
              <!--                 NOVA COLUNA PARA ORDER_IDX -->
              <!-- ========================================================= -->
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
              <!-- ========================================================= -->
              <!--           FIM DA NOVA COLUNA PARA ORDER_IDX -->
              <!-- ========================================================= -->
              <th 
                  scope="col" 
                  @click="sortTable('palavra')" 
                  :class="{ 'sortable': true, 'sorted-asc': sortColumn === 'palavra' && sortDirection === 'asc', 'sorted-desc': sortColumn === 'palavra' && sortDirection === 'desc' }"
              >
                  Palavra
                  <span v-if="sortColumn === 'palavra'" class="sort-indicator">
                      <span v-if="sortDirection === 'asc'">&#9650;</span>
                      <span v-else>&#9660;</span>
                  </span>
              </th>
              <th scope="col">Categorias</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            <!-- Ajuste no colspan para a mensagem de nenhum item -->
            <tr v-if="sortedConexaoItems.length === 0">
              <td colspan="6" style="text-align: center;">Nenhum item encontrado.</td>
            </tr>
            <tr v-for="item in sortedConexaoItems" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.order_idx !== null ? item.order_idx : '-' }}</td>
              <td>{{ item.palavra }}</td>
              <td>
                <span v-if="item.categories && item.categories.length > 0">
                    {{ item.categories.map(c => c.name).join(', ') }}
                </span>
                <span v-else>Nenhuma</span>
              </td>
              <td>
                <button @click="editConexao(item)" class="btn-icon btn-edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                  </svg>
                </button>
                <button @click="deleteConexao(item.id)" class="btn-icon btn-delete">
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
  
  interface ConexaoItem {
    id: number;
    palavra: string;
    imageUrl: string; 
    order_idx?: number | null; // Adicionado order_idx aqui
    categories: Category[]; 
    categoryIds: number[]; 
  }
  
  export default defineComponent({
    name: 'ConexaoManagement',
    setup() {
      const conexaoItems = ref<ConexaoItem[]>([]);
      const availableCategories = ref<Category[]>([]); 
      const editingItem = ref<ConexaoItem>({ 
        id: 0, 
        palavra: '', 
        imageUrl: '', 
        order_idx: null, // Inicializa com null
        categories: [], 
        categoryIds: [] 
      });
      const searchTerm = ref<string>(''); 
      const showForm = ref(false); 
  
      const sortColumn = ref<string>(''); 
      const sortDirection = ref<'asc' | 'desc'>('asc'); 
  
      const selectedFile = ref<File | null>(null); 
      const imagePreviewUrl = ref<string | null>(null); 
  
      const baseURL = import.meta.env.VITE_API_BASE_URL; 
  
      const API_BASE_URL = baseURL + '/api/admin'; 
      const CONEXAO_API_URL = `${API_BASE_URL}/conexao`; 
      const CATEGORIES_API_URL = `${API_BASE_URL}/categories`;
  
      const getCleanImageUrl = (url: string | null | undefined): string => {
        if (!url) return '';
        return url.startsWith('/conexao_images/') ? url : url; 
      };
  
      const fetchConexaoItems = async () => {
        try {
          const response = await axios.get<ConexaoItem[]>(CONEXAO_API_URL);
          conexaoItems.value = response.data.map(item => ({
              ...item,
              imageUrl: getCleanImageUrl(item.imageUrl), 
              categoryIds: item.categories ? item.categories.map(c => c.id) : [] 
          }));
        } catch (error) {
          console.error('Erro ao buscar conexões:', error);
          alert('Erro ao carregar conexões.');
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
  
      const saveConexao = async () => {
        if (!editingItem.value.palavra.trim()) {
          alert('Palavra é obrigatória.');
          return;
        }
  
        if (!editingItem.value.id && !selectedFile.value && !editingItem.value.imageUrl) { 
          alert('Uma imagem é obrigatória para novos itens. Por favor, faça o upload de uma imagem.');
          return;
        }
        
        if (editingItem.value.id && !selectedFile.value && !editingItem.value.imageUrl) {
          alert('A imagem é obrigatória. Por favor, faça o upload de uma nova imagem ou restaure a existente.');
          return;
        }
  
        try {
          const formData = new FormData();
          formData.append('palavra', editingItem.value.palavra);
          
          if (editingItem.value.order_idx !== null && editingItem.value.order_idx !== undefined) {
              formData.append('order', editingItem.value.order_idx.toString());
          } else {
              formData.append('order', ''); 
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
            await axios.put(`${CONEXAO_API_URL}/${editingItem.value.id}`, formData);
            alert('Conexão atualizada com sucesso!');
          } else {
            await axios.post(CONEXAO_API_URL, formData);
            alert('Conexão adicionada com sucesso!');
          }
          resetForm(); 
          fetchConexaoItems(); 
          showForm.value = false; 
        } catch (error: any) {
          console.error('Erro ao salvar Conexão:', error);
          if (error.response && error.response.data && error.response.data.error) {
            alert(`Erro: ${error.response.data.error}`);
          } else {
            alert('Erro ao salvar Conexão.');
          }
        }
      };
  
      const showAddForm = () => {
        resetForm(); 
        showForm.value = true;
      };
  
      const editConexao = (item: ConexaoItem) => {
        editingItem.value = { 
          ...item, 
          imageUrl: getCleanImageUrl(item.imageUrl), 
          categoryIds: item.categories ? item.categories.map(c => c.id) : [] 
        };
        
        selectedFile.value = null; 
        imagePreviewUrl.value = null; 
        const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
        if (fileInput) fileInput.value = ''; 
        showForm.value = true; 
      };
  
      const cancelEdit = () => {
        resetForm();
        showForm.value = false; 
      };
  
      const resetForm = () => {
          editingItem.value = { 
              id: 0, 
              palavra: '', 
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
  
      const deleteConexao = async (id: number) => {
        if (confirm('Tem certeza que deseja excluir esta Conexão? Esta ação é irreversível.')) {
          try {
            await axios.delete(`${CONEXAO_API_URL}/${id}`);
            alert('Conexão excluída com sucesso!');
            fetchConexaoItems(); 
          } catch (error) {
            console.error('Erro ao excluir Conexão:', error);
            alert('Erro ao excluir Conexão.');
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
      const filteredConexaoItems = computed(() => {
        if (!searchTerm.value) {
          return conexaoItems.value;
        }
        const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
        return conexaoItems.value.filter(item => {
          const categoriesText = item.categories.map(c => c.name).join(' ').toLowerCase();
          return (
            item.palavra.toLowerCase().includes(lowerCaseSearchTerm) ||
            categoriesText.includes(lowerCaseSearchTerm)
          );
        });
      });
  
      // Nova propriedade computada para ordenar os itens filtrados
      const sortedConexaoItems = computed(() => {
          const items = [...filteredConexaoItems.value]; 
  
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
              else if (sortColumn.value === 'order_idx') {
                  // Trata null/undefined como maior valor para que fiquem no final na ordenação ASC
                  valA = a.order_idx === null || a.order_idx === undefined ? Infinity : a.order_idx;
                  valB = b.order_idx === null || b.order_idx === undefined ? Infinity : b.order_idx;
                  
                  // Se um dos valores é null/undefined e o outro não, prioriza o não-nulo na ASC
                  if ((a.order_idx === null || a.order_idx === undefined) && (b.order_idx !== null && b.order_idx !== undefined)) {
                      return sortDirection.value === 'asc' ? 1 : -1;
                  }
                  if ((b.order_idx === null || b.order_idx === undefined) && (a.order_idx !== null && a.order_idx !== undefined)) {
                      return sortDirection.value === 'asc' ? -1 : 1;
                  }
              }
              else if (sortColumn.value === 'palavra') {
                  valA = a.palavra.toLowerCase();
                  valB = b.palavra.toLowerCase();
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
        fetchConexaoItems();
      });
  
      return {
        conexaoItems,
        availableCategories,
        editingItem,
        searchTerm, 
        sortedConexaoItems, 
        imagePreviewUrl,
        baseURL, 
        showForm,
        getCleanImageUrl, 
        handleFileUpload,
        removeImage,
        saveConexao,
        showAddForm,
        editConexao,
        cancelEdit,
        deleteConexao,
        
        sortColumn,
        sortDirection,
        sortTable,
      };
    },
  });
  </script>
  
  <style scoped>
  /* Você pode copiar e colar o CSS de ImagemOcultaManagement.vue aqui,
     pois a estrutura visual é a mesma. Apenas altere .imagem-oculta-management
     para .conexao-management se quiser um CSS estritamente isolado.
     Mantive os estilos genéricos para botões e tabelas, que devem funcionar bem. */
  
  .conexao-management {
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