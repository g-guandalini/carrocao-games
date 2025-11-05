<template>
  <div class="category-selection-wrapper">
    <p class="category-selection-title">Selecione as Categorias para jogar <b>{{ gameTypeDisplay }}</b></p>
    <p class="category-selection-subtitle">Escolha pelo menos uma categoria para iniciar o jogo.</p>

    <div v-if="isLoading" class="loading-message">
      Carregando categorias... ⏳
    </div>

    <div v-else-if="categories.length === 0" class="no-categories-message">
      Nenhuma categoria encontrada. Por favor, adicione categorias no painel de administração.
    </div>

    <div v-else class="categories-list-container">
      <!-- Novo botão para selecionar/remover todas -->
      <button
        @click="toggleSelectAll"
        :disabled="categories.length === 0"
        class="toggle-select-all-button"
      >
        {{ areAllCategoriesSelected ? 'Desmarcar Todas' : 'Marcar Todas' }}
      </button>

      <div class="categories-list">
        <label
          v-for="category in categories"
          :key="category.id"
          :class="['category-checkbox-label', { 'is-selected': selectedCategoryIds.includes(category.id) }]"
        >
          <input
            type="checkbox"
            :value="category.id"
            v-model="selectedCategoryIds"
            class="category-checkbox"
          />
          <span class="checkbox-custom"></span>
          <span class="category-name-text">{{ category.name }}</span>
        </label>
      </div>
    </div>

    <div v-if="!isValidSelection" class="error-message">
      Por favor, selecione pelo menos uma categoria para continuar.
    </div>

    <button
      @click="startGame"
      :disabled="!isValidSelection"
      class="start-game-button"
    >
      Jogar <b>{{ gameTypeDisplay }} </b>
    </button>

    <button @click="goBack" class="back-button">
      Voltar
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { addToast } from '../store/toastStore';
import { Category } from '../types';

// Importa as funções específicas para Imagem Oculta
import { imagemOcultaStore, setSelectedImagemOcultaCategories } from '../store/imagemOcultaStore';
// Importa as funções específicas para Conexão
import { conexaoStore, setSelectedConexaoCategories } from '../store/conexaoStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default defineComponent({
  name: 'CategorySelectionScreen',
  setup() {
    const router = useRouter();
    const route = useRoute(); // Para ler os query params
    const categories = ref<Category[]>([]);
    const selectedCategoryIds = ref<number[]>([]);
    const isLoading = ref(true);
    const gameType = ref<'imagem-oculta' | 'conexao'>('imagem-oculta'); // Padrão

    const gameTypeDisplay = computed(() => {
        return gameType.value === 'imagem-oculta' ? 'Imagem Oculta' : 'Conexão';
    });

    const isValidSelection = computed(() => selectedCategoryIds.value.length > 0);

    // Nova propriedade computada para verificar se todas as categorias estão selecionadas
    const areAllCategoriesSelected = computed(() => {
      if (categories.value.length === 0) return false;
      return selectedCategoryIds.value.length === categories.value.length;
    });

    const fetchCategories = async () => {
      isLoading.value = true;
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/categories`);
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data: Category[] = await response.json();
        categories.value = data; 
        
        // Carrega as categorias previamente selecionadas do store correto
        if (gameType.value === 'imagem-oculta') {
            selectedCategoryIds.value = [...imagemOcultaStore.selectedCategoryIds];
        } else if (gameType.value === 'conexao') {
            selectedCategoryIds.value = [...conexaoStore.selectedCategoryIds];
        }
        
        // Se nenhuma categoria estiver selecionada e houver categorias disponíveis, pré-selecione todas
        // Ou se o jogo for novo e não tiver seleção anterior, selecione todas
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

    // Novo método para alternar a seleção de todas as categorias
    const toggleSelectAll = () => {
      if (areAllCategoriesSelected.value) {
        selectedCategoryIds.value = []; // Desmarca todas
      } else {
        selectedCategoryIds.value = categories.value.map(cat => cat.id); // Marca todas
      }
    };

    const startGame = async () => {
      if (isValidSelection.value) {
        if (gameType.value === 'imagem-oculta') {
            setSelectedImagemOcultaCategories(selectedCategoryIds.value);
            router.push({ name: 'ImagemOcultaGame' });
        } else if (gameType.value === 'conexao') {
            setSelectedConexaoCategories(selectedCategoryIds.value);
            router.push({ name: 'ConexaoGame' }); // Nova rota para o jogo Conexão
        }
      } else {
        addToast('Selecione pelo menos uma categoria!', 'error');
      }
    };

    const goBack = () => {
      router.push({ name: 'Home' });
    };

    // Observa a mudança no query param 'game'
    watch(() => route.query.game, (newGameType) => {
        gameType.value = (newGameType === 'conexao') ? 'conexao' : 'imagem-oculta';
        // Recarrega as categorias e reseta a seleção quando o tipo de jogo muda
        fetchCategories();
    }, { immediate: true }); // Executa imediatamente na montagem

    onMounted(() => {
      // A lógica de `fetchCategories` é agora controlada pelo `watch` com `immediate: true`
    });

    return {
      categories,
      selectedCategoryIds,
      isLoading,
      isValidSelection,
      startGame,
      goBack,
      gameTypeDisplay,
      areAllCategoriesSelected, // Retorna a nova propriedade computada
      toggleSelectAll,          // Retorna o novo método
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
  max-width: 800px;
  min-height: 100vh;
  justify-content: center;
  background-color: #f0f2f5;
  padding: 30px;
  box-sizing: border-box;
}

.category-selection-title {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.5em; /* Ajustado para um tamanho mais comum para <p> */
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

.categories-list-container {
    display: flex;
    flex-direction: column;
    align-items: center; /* Centraliza o botão e a lista */
    width: 100%;
    max-width: 500px; /* Mantém a largura consistente com a lista */
    margin-bottom: 30px; /* Adiciona margem abaixo do container da lista */
}

.toggle-select-all-button {
  background-color: #3498db; /* Azul para combinar com o tema */
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
  margin-bottom: 15px; /* Espaço abaixo do botão */
  max-width: 400px; /* Alinha com a largura máxima dos itens da lista */
}

.toggle-select-all-button:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
}

.toggle-select-all-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  /* max-width: 500px;  Já definido no .categories-list-container */
  max-height: 300px; /* Reduzi a altura para não empurrar muito os botões de ação */
  overflow-y: auto;
  padding-right: 10px;
  padding-bottom: 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #3498db #f1f1f1;
}

/* Custom scrollbar para navegadores Webkit (Chrome, Safari) */
.categories-list::-webkit-scrollbar {
  width: 8px;
}

.categories-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.categories-list::-webkit-scrollbar-thumb {
  background: #3498db;
  border-radius: 10px;
}

.categories-list::-webkit-scrollbar-thumb:hover {
  background: #2980b9;
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
  transition: all 0.2s ease, transform 0.1s ease-out, border-color 0.2s ease;
  border: 2px solid transparent;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 400px;
}

.category-checkbox-label:hover {
  background-color: #f0f8ff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  border-color: #a0d4f1;
}

/* Estilo para a label inteira quando a categoria está selecionada */
.category-checkbox-label.is-selected {
  border-color: #3498db;
  background-color: #e0f2f7;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.2);
  font-weight: bold;
  color: #2c3e50;
  transform: scale(1.01);
}

.category-name-text {
    margin-left: 10px;
    flex-grow: 1;
}

.category-checkbox {
  display: none;
}

.checkbox-custom {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 2px solid #3498db;
  border-radius: 6px;
  margin-right: 12px;
  position: relative;
  transition: all 0.2s ease, transform 0.1s ease-out;
  flex-shrink: 0;
  background-color: #ffffff;
}

/* Estilo do checkbox customizado quando checado */
.category-checkbox:checked + .checkbox-custom {
  background-color: #3498db;
  border-color: #3498db;
  transform: scale(1.1);
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.4);
}

/* Estilo do "check" dentro do checkbox */
.category-checkbox:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  width: 7px;
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
  box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3);
  margin-bottom: 15px;
  width: 100%;
  max-width: 350px;
}

.start-game-button:hover:not(:disabled) {
  background-color: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(46, 204, 113, 0.4);
}

.start-game-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
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
  max-width: 350px;
  box-shadow: 0 5px 15px rgba(149, 165, 166, 0.3);
}

.back-button:hover {
  background-color: #7f8c8d;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(149, 165, 166, 0.4);
}
</style>