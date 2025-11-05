<template>
  <div class="splash-screen-wrapper">
    <!-- Botão de Administração no canto superior direito -->
    <button class="admin-button" @click="navigateToAdmin" title="Acessar Painel Admin">
      <!-- Ícone de engrenagem SVG -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="gear-icon">
        <path d="M12 21c-1.104 0-2-.896-2-2v-3.076a8.03 8.03 0 01-2.924-2.115L3.385 15.615l-1.414-1.414 2.828-2.828a8.03 8.03 0 01-2.115-2.924L2 10c0-1.104.896-2 2-2h3.076a8.03 8.03 0 012.115-2.924L8.385 3.385l1.414-1.414 2.828 2.828a8.03 8.03 0 012.924-2.115L14 2c1.104 0 2 .896 2 2v3.076a8.03 8.03 0 012.924 2.115L20.615 8.385l1.414 1.414-2.828 2.828a8.03 8.03 0 012.115 2.924L22 16c0 1.104-.896 2-2 2h-3.076a8.03 8.03 0 01-2.115 2.924L15.615 20.615l-1.414 1.414-2.828-2.828A8.03 8.03 0 0112 21zM12 18a6 6 0 100-12 6 6 0 000 12zM12 16a4 4 0 110-8 4 4 0 010 8z" />
      </svg>
    </button>

    <div class="splash-header-content">
      <div class="splash-logo-area">
        <img src="/logo_sitio.png" alt="Carroção Games Logo" class="splash-logo-img">
      </div>
    </div>

    <div class="menu-options">
      <!-- Botão para Imagem Oculta -->
      <button class="menu-button primary" @click="navigateToCategorySelection('imagem-oculta')">
        Imagem Oculta
      </button>
      <!-- NOVO: Botão para Conexão -->
      <button class="menu-button primary" @click="navigateToCategorySelection('conexao')">
        Conexão
      </button>
      <button class="menu-button" @click="$emit('select-bug')">
        Bug
      </button>

      <button v-if="hasScoresToClear" class="menu-button clear-scores-button" @click="clearAllScores">
        Limpar Pontos
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { scoreStore, resetScores } from '../store/scoreStore';
import { resetImagemOcultaGameScores } from '../store/imagemOcultaStore'; 
import { resetConexaoGameScores } from '../store/conexaoStore'; // Importe a função de reset para Conexão
import { useRouter } from 'vue-router'; 

export default defineComponent({
  name: 'SplashScreen',
  emits: ['select-bug'],
  setup() {
    const router = useRouter();

    const hasScoresToClear = computed(() => {
      if (scoreStore.isLoadingScores) {
        return false;
      }
      return Object.values(scoreStore.score).some(score => score > 0);
    });

    const clearAllScores = async () => {
      if (confirm('Tem certeza que deseja limpar todas as pontuações? Esta ação não pode ser desfeita.')) {
        await resetScores();
      }
    };

    const navigateToCategorySelection = async (gameType: 'imagem-oculta' | 'conexao') => {
      console.log(`[SplashScreen] Clicou em ${gameType === 'imagem-oculta' ? 'Imagem Oculta' : 'Conexão'}. Navegando para seleção de categorias.`);
      
      // Reseta o estado do jogo específico antes de navegar
      if (gameType === 'imagem-oculta') {
        await resetImagemOcultaGameScores(); 
      } else if (gameType === 'conexao') {
        await resetConexaoGameScores(); 
      }

      // Navega para a tela de seleção de categoria, passando o tipo de jogo como parâmetro de query
      router.push({ name: 'CategorySelection', query: { game: gameType } }); 
    };

    const navigateToAdmin = () => {
      router.push({ name: 'AdminDefaultRedirect' }); 
    };

    return {
      hasScoresToClear,
      clearAllScores,
      navigateToCategorySelection, 
      navigateToAdmin,
    };
  },
});
</script>

<style scoped>
/* Seu CSS existente do SplashScreen */
/* ... (mantenha o CSS original) ... */
.splash-screen-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  min-height: 100vh;
  background-color: #f0f2f5;
  position: relative; 
}

.admin-button {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.3s ease;
  color: #555; 
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #3498db; 
}

.admin-button .gear-icon {
  width: 30px; 
  height: 30px;
  fill: currentColor; 
}


.splash-header-content {
  text-align: center;
  margin-bottom: 0px;
}

.splash-logo-area {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 350px;
  height: 350px;
  border-radius: 12px;
  margin: 0 auto;
  background-color: transparent;
}

.splash-logo-area .splash-logo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.splash-logo-placeholder {
  font-size: 10em;
  color: #3498db;
}

.instruction-text {
  margin-bottom: 25px;
  font-size: 1.1em;
  text-align: center;
  color: #555;
  max-width: 600px;
}

.menu-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 300px;
  margin-top: 40px;
}

.menu-button {
  background-color: #3498db;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 1.3em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.menu-button.primary {
  background-color: #2ecc71;
}

.menu-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

.menu-button.primary:hover {
  background-color: #27ae60;
}

.menu-button.clear-scores-button {
  background-color: #e74c3c;
}

.menu-button.clear-scores-button:hover {
  background-color: #c0392b;
}
</style>