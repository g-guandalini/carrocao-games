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
import { toastStore, removeToast } from '../store/toastStore';

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
  top: 20px; /* Posicionado a 20px do topo */
  left: 50%; /* Inicia no centro horizontal */
  transform: translateX(-50%); /* Move o container de volta pela metade de sua largura para centralizar */
  z-index: 9999;
  display: flex;
  flex-direction: column; /* Para empilhar os toasts verticalmente */
  gap: 10px;
  max-width: 400px; /* Aumentado a largura máxima para melhor visualização central */
  width: 100%; /* Garante que ocupe a largura disponível, respeitando o max-width */
  align-items: center; /* Centraliza os toasts individualmente dentro do container */
  box-sizing: border-box; /* Garante que padding seja incluído na largura */
  padding: 0 15px; /* Adiciona padding lateral para evitar colar nas bordas em telas pequenas */
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
  width: 100%; /* Garante que o toast item ocupe a largura total do container */
  max-width: 380px; /* Limita a largura individual do toast item */
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
  from { opacity: 0; transform: translateY(-20px); } /* Agora vem de cima para baixo */
  to { opacity: 1; transform: translateY(0); }
}
</style>