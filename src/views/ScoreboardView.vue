<template>
  <div class="scoreboard-page">
    <GameHeader class="scoreboard-header" />
    <ScoreboardScreen
      class="scoreboard-area-layout"
      game-status="scoreboard"
      @next-round="goHome"
      @reset-game="goHome"
      @exit-scoreboard="goHome"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ScoreboardScreen from '../components/ScoreboardScreen.vue';
import GameHeader from '../components/GameHeader.vue';
import { fetchScores } from '../store/scoreStore';

const router = useRouter();
const goHome = () => router.push({ name: 'Home' });
onMounted(() => fetchScores());
</script>

<style scoped>
.scoreboard-page {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.scoreboard-header {
  flex: 0 0 auto;
  width: 100%;
}

.scoreboard-area-layout {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
