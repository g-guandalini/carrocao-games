<template>
    <div v-if="show" class="modal-overlay">
      <div class="modal-content">
        <h2>Qual é o personagem?</h2>
        <p v-if="activeTeam" :style="{ color: getTeamColorHex(activeTeam) }">Equipe {{ activeTeam }} é a vez de palpitar!</p>
        <input
          type="text"
          v-model="currentGuess"
          @keyup.enter="submit"
          placeholder="Digite seu palpite aqui..."
          autofocus
        />
        <div class="modal-actions">
          <button @click="submit" :disabled="!currentGuess.trim()">Confirmar Palpite</button>
          <button @click="close" class="cancel-button">Cancelar</button>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, watch } from 'vue';
  import { TeamColor } from '../types';
  
  export default defineComponent({
    name: 'GuessModal',
    props: {
      show: {
        type: Boolean,
        required: true,
      },
      activeTeam: {
          type: String as () => TeamColor | null,
          default: null,
      },
    },
    emits: ['submit-guess', 'close'],
    setup(props, { emit }) {
      const currentGuess = ref('');
  
      watch(() => props.show, (newVal) => {
          if (newVal) {
              currentGuess.value = ''; // Limpa o palpite quando o modal abre
          }
      });
  
      const submit = () => {
        if (currentGuess.value.trim()) {
          emit('submit-guess', currentGuess.value.trim());
          currentGuess.value = '';
        }
      };
  
      const close = () => {
        emit('close');
        currentGuess.value = ''; // Limpa o palpite ao fechar
      };
  
      const getTeamColorHex = (team: string) => {
        switch (team) {
          case TeamColor.BLUE: return '#3498db';
          case TeamColor.RED: return '#e74c3c';
          case TeamColor.GREEN: return '#2ecc71';
          case TeamColor.YELLOW: return '#f1c40f';
          default: return '#333';
        }
      };
  
      return {
        currentGuess,
        submit,
        close,
        getTeamColorHex,
      };
    },
  });
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: linear-gradient(145deg, #ffffff, #f0f0f0);
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    text-align: center;
    width: 90%;
    max-width: 450px;
    transform: scale(0.9);
    animation: modal-open 0.3s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  @keyframes modal-open {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  h2 {
      color: #2c3e50;
      margin-bottom: 20px;
      font-size: 2em;
  }
  
  p {
      margin-bottom: 25px;
      font-size: 1.2em;
      font-weight: 600;
  }
  
  input {
    width: calc(100% - 40px); /* Ajuste para padding */
    padding: 15px 20px;
    margin-bottom: 30px;
    border: 2px solid #ccc;
    border-radius: 8px;
    font-size: 1.1em;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: border-color 0.3s ease;
  }
  
  input:focus {
      border-color: #3498db;
      outline: none;
  }
  
  .modal-actions button {
    padding: 12px 25px;
    margin: 0 10px;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    font-size: 1.1em;
    font-weight: bold;
    transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }
  
  .modal-actions button:first-of-type {
    background-color: #2ecc71;
    color: white;
  }
  
  .modal-actions button.cancel-button {
    background-color: #e74c3c;
    color: white;
  }
  
  .modal-actions button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  }
  
  .modal-actions button:first-of-type:hover:not(:disabled) {
    background-color: #27ae60;
  }
  
  .modal-actions button.cancel-button:hover:not(:disabled) {
    background-color: #c0392b;
  }
  
  .modal-actions button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
      opacity: 0.7;
      transform: none;
      box-shadow: none;
  }
  
  </style>