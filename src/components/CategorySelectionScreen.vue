<template>
  <div class="category-selection-wrapper">
    <p class="category-selection-title">Selecione as Categorias para jogar <b>{{ gameTypeDisplay }}</b></p>
    <p class="category-selection-subtitle">Escolha pelo menos uma categoria para iniciar o jogo.</p>

    <!-- Exibe a mensagem de carregamento se estiver carregando ou se AINDA não tiver feito a primeira requisição -->
    <div v-if="isLoading || !hasFetched" class="loading-message">
      Carregando categorias... ⏳
    </div>

    <!-- Exibe a mensagem de "nenhuma categoria" APENAS SE JÁ CARREGOU, NÃO ESTÁ CARREGANDO E NÃO HÁ CATEGORIAS -->
    <div v-else-if="hasFetched && !isLoading && categories.length === 0" class="no-categories-message">
      Nenhuma categoria encontrada. Por favor, adicione categorias no painel de administração.
    </div>

    <!-- Exibe a lista de categorias APENAS SE JÁ CARREGOU, NÃO ESTÁ CARREGANDO E HÁ CATEGORIAS -->
    <div v-else-if="hasFetched && !isLoading && categories.length > 0" class="categories-list-container">
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
    
    <!-- Condições para botões e mensagem de erro, que podem aparecer depois do carregamento -->
    <div v-if="!isValidSelection && hasFetched && categories.length > 0" class="error-message">
      Por favor, selecione pelo menos uma categoria para continuar.
    </div>

    <button
      @click="startGame"
      :disabled="!isValidSelection || isLoading || categories.length === 0"
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
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'; // Adicionado onMounted e onBeforeUnmount
import { useRouter, useRoute } from 'vue-router';
import { addToast } from '../store/toastStore';
import { Category } from '../types';

import { imagemOcultaStore, setSelectedImagemOcultaCategories } from '../store/imagemOcultaStore';
import { conexaoStore, setSelectedConexaoCategories } from '../store/conexaoStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default defineComponent({
  name: 'CategorySelectionScreen',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const categories = ref<Category[]>([]); // Inicia como array vazio
    const selectedCategoryIds = ref<number[]>([]);
    const isLoading = ref(false); // Inicia como false, será true quando fetchCategories for chamada
    const hasFetched = ref(false); // NOVO: Indica se já foi feita pelo menos uma tentativa de buscar dados
    const gameType = ref<'imagem-oculta' | 'conexao'>('imagem-oculta');

    const gameTypeDisplay = computed(() => {
        return gameType.value === 'imagem-oculta' ? 'Imagem Oculta' : 'Conexão';
    });

    const isValidSelection = computed(() => selectedCategoryIds.value.length > 0);

    const areAllCategoriesSelected = computed(() => {
      if (categories.value.length === 0) return false;
      return selectedCategoryIds.value.length === categories.value.length;
    });

    const fetchCategories = async () => {
      isLoading.value = true; // Inicia o estado de carregamento
      categories.value = []; // Limpa categorias ao iniciar uma nova busca para evitar dados antigos
      selectedCategoryIds.value = []; // Limpa seleção ao iniciar nova busca
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/categories`);
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data: Category[] = await response.json();
        categories.value = data; 
        
        // Carrega as categorias previamente selecionadas do store correto
        const storedSelection = gameType.value === 'imagem-oculta' 
            ? imagemOcultaStore.selectedCategoryIds 
            : conexaoStore.selectedCategoryIds;
        
        // Filtra as IDs armazenadas para garantir que correspondem a categorias existentes
        selectedCategoryIds.value = storedSelection.filter(id => 
            categories.value.some(cat => cat.id === id)
        );
        
        // Se nenhuma categoria estiver selecionada e houver categorias disponíveis, pré-selecione todas
        if (selectedCategoryIds.value.length === 0 && categories.value.length > 0) {
            selectedCategoryIds.value = categories.value.map(cat => cat.id);
        }

      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        addToast('Erro ao carregar categorias. Tente novamente mais tarde.', 'error'); // Adiciona toast de erro
        categories.value = []; // Garante que categories seja um array vazio em caso de erro
      } finally {
        isLoading.value = false; // Finaliza o estado de carregamento
        hasFetched.value = true; // Marca que a busca inicial foi concluída
      }
    };

    const toggleSelectAll = () => {
      if (categories.value.length === 0) return; // Não faz nada se não há categorias

      if (areAllCategoriesSelected.value) {
        selectedCategoryIds.value = []; // Desmarca todas
      } else {
        selectedCategoryIds.value = categories.value.map(cat => cat.id); // Marca todas
      }
    };

    const startGame = async () => {
      if (!isLoading.value && categories.value.length > 0) { // Apenas tenta iniciar se não estiver carregando e houver categorias
        if (isValidSelection.value) {
          if (gameType.value === 'imagem-oculta') {
              setSelectedImagemOcultaCategories(selectedCategoryIds.value);
              router.push({ name: 'ImagemOcultaGame' });
          } else if (gameType.value === 'conexao') {
              setSelectedConexaoCategories(selectedCategoryIds.value);
              router.push({ name: 'ConexaoGame' });
          }
        } else {
          addToast('Por favor, selecione pelo menos uma categoria para continuar.', 'warning');
        }
      }
    };

    const goBack = () => {
      router.push({ name: 'Home' });
    };

    // Handler de evento de teclado
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault(); // Impede rolagem da página
        // Só tenta iniciar o jogo se o botão não estiver desabilitado pelas condições
        if (isValidSelection.value && !isLoading.value && categories.value.length > 0) {
          startGame();
        }
      } else if (event.code === 'Escape') {
        event.preventDefault(); // Impede comportamento padrão do Esc (ex: fechar modal)
        goBack();
      }
    };

    // Adiciona o listener de teclado quando o componente é montado
    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
    });

    // Remove o listener de teclado antes do componente ser desmontado
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });

    // Observa a mudança no query param 'game'
    // Chama fetchCategories imediatamente na montagem do componente
    watch(() => route.query.game, (newGameType) => {
        gameType.value = (newGameType === 'conexao') ? 'conexao' : 'imagem-oculta';
        hasFetched.value = false; // Resetar para que o "Carregando..." apareça em nova troca de jogo
        fetchCategories();
    }, { immediate: true }); // 'immediate: true' executa o watcher na montagem do componente

    return {
      categories,
      selectedCategoryIds,
      isLoading,
      hasFetched, // Retorna a nova variável
      isValidSelection,
      startGame,
      goBack,
      gameTypeDisplay,
      areAllCategoriesSelected,
      toggleSelectAll,
    };
  },
});
</script>

<style scoped>
/* SEU CSS ABAIXO PERMANECE EXATAMENTE O MESMO, SEM ALTERAÇÕES */
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
  font-size: 1.5em;
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
    align-items: center;
    width: 100%;
    max-width: 500px;
    margin-bottom: 30px;
}

.toggle-select-all-button {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
  margin-bottom: 15px;
  max-width: 400px;
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
  max-height: 300px;
  overflow-y: auto;
  padding-right: 10px;
  padding-bottom: 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #3498db #f1f1f1;
}

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

.category-checkbox:checked + .checkbox-custom {
  background-color: #3498db;
  border-color: #3498db;
  transform: scale(1.1);
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.4);
}

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