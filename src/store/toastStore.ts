// stores/toastStore.ts
import { reactive } from 'vue';
import { Toast, ToastType } from '../types'; // Certifique-se de que o caminho está correto

interface ToastStoreState {
  toasts: Toast[];
}

let nextToastId = 0;

export const toastStore = reactive<ToastStoreState>({
  toasts: [],
});

/**
 * Adiciona um novo toast à fila.
 * @param message A mensagem a ser exibida no toast.
 * @param type O tipo de toast ('success', 'error', 'info').
 * @param duration A duração em milissegundos antes do toast desaparecer (padrão: 3000ms).
 */
export function addToast(message: string, type: ToastType = 'info', duration: number = 3000) {
  const id = nextToastId++;
  const newToast: Toast = { id, message, type };
  toastStore.toasts.push(newToast);

  // Define um timeout para remover o toast automaticamente
  newToast.timeoutId = window.setTimeout(() => {
    removeToast(id);
  }, duration);
}

/**
 * Remove um toast específico da fila.
 * @param id O ID do toast a ser removido.
 */
export function removeToast(id: number) {
  const index = toastStore.toasts.findIndex(toast => toast.id === id);
  if (index !== -1) {
    const toast = toastStore.toasts[index];
    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId); // Limpa o timeout para evitar erro se removido manualmente
    }
    toastStore.toasts.splice(index, 1);
  }
}