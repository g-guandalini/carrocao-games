<template>
    <button
      :style="{ backgroundColor: teamColorHex }"
      :disabled="disabled"
      @click="onClick"
    >
      {{ teamName }}
    </button>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed } from 'vue';
  import { TeamColor } from '../types';
  
  export default defineComponent({
    name: 'TeamButton',
    props: {
      teamColor: {
        type: String as () => TeamColor,
        required: true,
      },
      teamName: {
        type: String,
        required: true,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['select-team'],
    setup(props, { emit }) {
      const teamColorHex = computed(() => {
        switch (props.teamColor) {
          case TeamColor.BLUE: return '#3498db';
          case TeamColor.RED: return '#e74c3c';
          case TeamColor.GREEN: return '#2ecc71';
          case TeamColor.YELLOW: return '#f1c40f';
          default: return '#cccccc';
        }
      });
  
      const onClick = () => {
        emit('select-team', props.teamColor);
      };
  
      return {
        teamColorHex,
        onClick,
      };
    },
  });
  </script>
  
  <style scoped>
  button {
    padding: 15px 30px;
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 1.2em;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
    flex: 1; /* Faz os botões ocuparem espaço igual */
    margin: 5px;
    min-width: 120px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  button:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
  }
  
  button:disabled {
    background-color: #cccccc !important;
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
    box-shadow: none;
  }
  </style>