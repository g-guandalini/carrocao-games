<!-- components/ToastNotification.vue -->
<template>
    <div class="toast-container">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :class="['toast-item', `toast-${toast.type}`]"
        @click="removeToast(toast.id)"
      >
        <div class="toast-message" v-html="toast.message"></div>
        <button class="toast-close" @click.stop="removeToast(toast.id)">
          &times;
        </button>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { toastStore, removeToast } from '../store/toastStore'; // Ajuste o caminho conforme a estrutura do seu projeto
  
  export default defineComponent({
    name: 'ToastNotification',
    setup() {
      return {
        toastStore,
        removeToast,
      };
    },
  });
  </script>
  
  <style scoped>
  .toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 300px;
  }
  
  .toast-item {
    background-color: #fff;
    color: #333;
    padding: 12px 15px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    word-break: break-word;
    opacity: 0;
    animation: fadeIn 0.3s forwards;
    cursor: pointer;
    border-left: 5px solid; /* Borda colorida para tipo de toast */
  }
  
  .toast-success {
    border-left-color: #2ecc71; /* Verde */
  }
  
  .toast-error {
    border-left-color: #e74c3c; /* Vermelho */
  }
  
  .toast-info {
    border-left-color: #3498db; /* Azul */
  }
  
  .toast-message {
    flex-grow: 1;
    margin-right: 10px;
  }
  
  .toast-close {
    background: none;
    border: none;
    color: #888;
    font-size: 1.5em;
    cursor: pointer;
    padding: 0 5px;
    line-height: 1;
  }
  
  .toast-close:hover {
    color: #333;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  </style>