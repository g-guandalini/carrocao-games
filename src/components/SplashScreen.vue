<template>
  <div class="splash-screen-wrapper">
    <div class="splash-header-content">
      <div class="splash-logo-area">
        <!-- Se você tiver uma imagem de logo, substitua o span: -->
        <img src="/logo_sitio.png" alt="Carroção Games Logo" class="splash-logo-img">
      </div>
    </div>

    <div class="menu-options">
      <button class="menu-button primary" @click="$emit('start-game')">
        Imagem Oculta
      </button>
      <button class="menu-button" @click="$emit('select-connection')">
        Conexão
      </button>
      <button class="menu-button" @click="$emit('select-bug')">
        Bug
      </button>

      <!-- NOVO: Botão "Limpar Pontos" -->
      <button v-if="hasScoresToClear" class="menu-button clear-scores-button" @click="clearAllScores">
        Limpar Pontos
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
// Importar a store e a função de reset de pontos
import { imagemOcultaStore, resetGameScores } from '../store/imagemOcultaStore';

export default defineComponent({
  name: 'SplashScreen',
  emits: ['start-game', 'select-connection', 'select-bug'],
  setup() {
    // Computa se alguma equipe tem pontuação maior que zero
    const hasScoresToClear = computed(() => {
      // Verifica se a store já carregou os scores.
      // Se ainda estiver carregando, consideramos que não há scores para limpar
      // para evitar um botão piscando ou decisões com dados antigos.
      if (imagemOcultaStore.isLoadingScores) {
        return false;
      }
      // Itera sobre as pontuações e verifica se alguma é maior que 0
      return Object.values(imagemOcultaStore.score).some(score => score > 0);
    });

    // Função para limpar todas as pontuações
    const clearAllScores = async () => {
      if (confirm('Tem certeza que deseja limpar todas as pontuações? Esta ação não pode ser desfeita.')) {
        await resetGameScores(); // Chama a função de reset do store
      }
    };

    return {
      hasScoresToClear,
      clearAllScores,
    };
  },
});
</script>

<style scoped>
.splash-screen-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
}

.splash-header-content {
  text-align: center;
  margin-bottom: 0px;
}

.splash-main-title {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 3.5em;
  font-weight: 700;
  letter-spacing: 1px;
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

/* NOVO CSS PARA A IMAGEM DENTRO DA ÁREA DO LOGO */
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

/* --- Estilos do Menu Principal --- */
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
  /* Garante que o botão de limpar pontos siga o espaçamento */
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

/* NOVO: Estilos para o botão Limpar Pontos, reusando a classe .menu-button */
.menu-button.clear-scores-button {
  background-color: #e74c3c; /* Um vermelho para indicar ação de limpar/resetar */
}

.menu-button.clear-scores-button:hover {
  background-color: #c0392b;
}
</style>