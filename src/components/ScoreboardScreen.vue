<template>
    <div class="scoreboard-screen-container">
      <h2>Placar Atual</h2>
      <ScoreboardBlocks :score="score" />
      <GameActionButtons
        :game-status="gameStatus"
        @next-round="$emit('next-round')"
        @reset-game="$emit('reset-game')"
      />
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, PropType } from 'vue';
  import ScoreboardBlocks from './ScoreboardBlocks.vue';
  import GameActionButtons from './GameActionButtons.vue';
  import { TeamColor, GameStatus } from '../types';
  
  export default defineComponent({
    name: 'ScoreboardScreen',
    components: {
      ScoreboardBlocks,
      GameActionButtons,
    },
    props: {
      score: {
        type: Object as PropType<Record<TeamColor, number>>,
        required: true,
      },
      gameStatus: { // gameStatus é necessário para GameActionButtons
        type: String as PropType<GameStatus>,
        required: true,
      }
    },
    emits: ['next-round', 'reset-game'],
  });
  </script>
  
  <style scoped>
  .scoreboard-screen-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
    background-color: #ffffff;
    border-radius: 15px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    margin-top: 50px;
    max-width: 600px;
    width: 90%;
    text-align: center;
  }
  
  h2 {
    font-size: 2.2em;
    color: #2c3e50;
    margin-bottom: 30px;
  }
  </style>