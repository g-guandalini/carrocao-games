<template>
    <GameView />
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import GameView from './views/GameView.vue';
  
  export default defineComponent({
    name: 'App',
    components: {
      GameView,
    },
  });
  </script>
  
  <style>
  /* Estilos globais */
  body {
    margin: 0;
    font-family: 'Poppins', sans-serif; /* Fonte mais moderna para o projeto */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  </style>