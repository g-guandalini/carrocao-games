<!-- views/GameView.vue -->
<template>
  <div class="game-container">
    <SplashScreen
      v-if="!currentGame || currentGame === 'idle'"
      @start-game="selectGame('imagemOculta')"
      @select-connection="selectGame('connection')"
      @select-bug="selectGame('bug')"
    />

    <ImagemOcultaView
      v-else-if="currentGame === 'imagemOculta'"
      @go-to-main-menu="goHome"
    />

    <ConnectionGameView
      v-else-if="currentGame === 'connection'"
      @go-to-main-menu="goHome"
    />
    <BugGameView
      v-else-if="currentGame === 'bug'"
      @go-to-main-menu="goHome"
    />
    
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
// ATUALIZADO: Removido import de gameStore e resetGameScores, pois são específicos de Imagem Oculta
// e agora tratados individualmente por cada View de jogo.

import SplashScreen from '../components/SplashScreen.vue';
import ImagemOcultaView from './ImagemOcultaView.vue';
import ConnectionGameView from './ConnectionGameView.vue';
import BugGameView from './BugGameView.vue';

export default defineComponent({
  name: 'GameView',
  components: {
    SplashScreen,
    ImagemOcultaView,
    ConnectionGameView,
    BugGameView,
  },
  setup() {
    const currentGame = ref<'idle' | 'imagemOculta' | 'connection' | 'bug'>('idle');

    const selectGame = (gameName: 'imagemOculta' | 'connection' | 'bug') => {
      // ATUALIZADO: Não há mais resetGameScores() global aqui.
      // Cada game view é responsável por resetar seu próprio estado quando "volta" ao menu.
      currentGame.value = gameName;
    };

    const goHome = () => {
      currentGame.value = 'idle';
    };

    return {
      currentGame,
      selectGame,
      goHome,
    };
  },
});
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  font-family: 'Poppins', sans-serif;
  background-color: #f0f2f5;
  min-height: 100vh;
  color: #333;
  width: 100%;
}
</style>