<template>
    <div class="category-selection-wrapper">
      <h2 class="category-selection-title">Selecione as Categorias para Jogar</h2>
      <p class="category-selection-subtitle">Escolha pelo menos uma categoria para iniciar o jogo de Imagem Oculta.</p>
  
      <div v-if="isLoading" class="loading-message">
        Carregando categorias... ⏳
      </div>
  
      <div v-else-if="categories.length === 0" class="no-categories-message">
        Nenhuma categoria encontrada. Por favor, adicione categorias no painel de administração.
      </div>
  
      <div v-else class="categories-list">
        <label v-for="category in categories" :key="category.id" class="category-checkbox-label">
          <input
            type="checkbox"
            :value="category.id"
            v-model="selectedCategoryIds"
            class="category-checkbox"
          />
          <span class="checkbox-custom"></span>
          {{ category.name }}
        </label>
      </div>
  
      <div v-if="!isValidSelection" class="error-message">
        Por favor, selecione pelo menos uma categoria para continuar.
      </div>
  
      <button
        @click="startGame"
        :disabled="!isValidSelection"
        class="start-game-button"
      >
        Iniciar Jogo de Imagem Oculta ▶️
      </button>
  
      <button @click="goBack" class="back-button">
        Voltar para o Menu Principal
      </button>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { imagemOcultaStore, setSelectedCategories } from '../store/imagemOcultaStore';
  import { addToast } from '../store/toastStore';
  import { Category } from '../types';
  
  const API_BASE_URL = 'http://localhost:3001';
  
  export default defineComponent({
    name: 'CategorySelectionScreen',
    setup() {
      const router = useRouter();
      const categories = ref<Category[]>([]);
      const selectedCategoryIds = ref<number[]>([]);
      const isLoading = ref(true);
  
      const isValidSelection = computed(() => selectedCategoryIds.value.length > 0);
  
      const fetchCategories = async () => {
        isLoading.value = true;
        try {
          // MUDANÇA AQUI: Adicionado '/admin' à URL
          const response = await fetch(`${API_BASE_URL}/api/admin/categories`);
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data: Category[] = await response.json();
          categories.value = data; 
          
          // Carrega as categorias previamente selecionadas do store
          selectedCategoryIds.value = [...imagemOcultaStore.selectedCategoryIds];
          
          // Se nenhuma categoria estiver selecionada e houver categorias disponíveis, pré-selecione todas
          if (selectedCategoryIds.value.length === 0 && categories.value.length > 0) {
              selectedCategoryIds.value = categories.value.map(cat => cat.id);
          }
  
        } catch (error) {
          console.error('Erro ao buscar categorias:', error);
          addToast('Erro ao carregar categorias do servidor!', 'error');
          categories.value = [];
        } finally {
          isLoading.value = false;
        }
      };
  
      const startGame = async () => {
        if (isValidSelection.value) {
          setSelectedCategories(selectedCategoryIds.value);
          router.push({ name: 'ImagemOcultaGame' });
        } else {
          addToast('Selecione pelo menos uma categoria!', 'error');
        }
      };
  
      const goBack = () => {
        router.push({ name: 'Home' });
      };
  
      onMounted(() => {
        fetchCategories();
      });
  
      return {
        categories,
        selectedCategoryIds,
        isLoading,
        isValidSelection,
        startGame,
        goBack,
      };
    },
  });
  </script>
  
  <style scoped>
  .category-selection-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 600px;
    min-height: 100vh;
    justify-content: center;
    background-color: #f0f2f5;
    padding: 20px;
    box-sizing: border-box;
  }
  
  .category-selection-title {
    color: #2c3e50;
    margin-bottom: 15px;
    font-size: 2.5em;
    font-weight: 700;
    text-align: center;
  }
  
  .category-selection-subtitle {
    color: #555;
    margin-bottom: 30px;
    font-size: 1.1em;
    text-align: center;
    max-width: 500px;
  }
  
  .loading-message,
  .no-categories-message {
    font-size: 1.2em;
    color: #7f8c8d;
    margin-bottom: 20px;
  }
  
  .categories-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
    width: 100%;
    max-height: 300px; 
    overflow-y: auto;
    padding-right: 10px; 
  }
  
  .category-checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 1.1em;
    color: #34495e;
    background-color: #ffffff;
    padding: 12px 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
  }
  
  .category-checkbox-label:hover {
    background-color: #f8f8f8;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }
  
  .category-checkbox {
    display: none; 
  }
  
  .checkbox-custom {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #3498db;
    border-radius: 4px;
    margin-right: 10px;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .category-checkbox:checked + .checkbox-custom {
    background-color: #3498db;
    border-color: #3498db;
  }
  
  .category-checkbox:checked + .checkbox-custom::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 2px;
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 3px 3px 0;
    transform: rotate(45deg);
  }
  
  .error-message {
    color: #e74c3c;
    margin-bottom: 20px;
    font-size: 1em;
    font-weight: bold;
  }
  
  .start-game-button {
    background-color: #2ecc71;
    color: white;
    padding: 15px 30px;
    border: none;
    border-radius: 8px;
    font-size: 1.3em;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 15px;
    width: 100%;
    max-width: 300px;
  }
  
  .start-game-button:hover:not(:disabled) {
    background-color: #27ae60;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  .start-game-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .back-button {
    background-color: #95a5a6;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
    width: 100%;
    max-width: 300px;
  }
  
  .back-button:hover {
    background-color: #7f8c8d;
    transform: translateY(-2px);
  }
  </style>