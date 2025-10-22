<!-- src/components/AnswerFeedback.vue -->
<template>
    <div
      class="answer-feedback-container"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <button
        ref="correctButton"
        @click="handleCorrectClick"
        class="feedback-button correct-button"
        :class="{ 'active-glow': activeEffect === 'correct' }"
      >
        Correto
      </button>
      <button
        ref="wrongButton"
        @click="handleWrongClick"
        class="feedback-button wrong-button"
        :class="{ 'active-glow': activeEffect === 'wrong' }"
      >
        Errado
      </button>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
  
  export default defineComponent({
    name: 'AnswerFeedback',
    emits: ['correct-answer', 'wrong-answer'], // Eventos que este componente irá emitir
    setup(_props, { emit }) {
      // 'activeEffect' controla qual botão está com o efeito de brilho/suspense
      const activeEffect = ref<'correct' | 'wrong' | null>(null);
  
      // Métodos para emitir os eventos quando os botões são clicados
      const handleCorrectClick = () => {
        emit('correct-answer');
        activeEffect.value = null; // Reseta o efeito após o clique
      };
  
      const handleWrongClick = () => {
        emit('wrong-answer');
        activeEffect.value = null; // Reseta o efeito após o clique
      };
  
      // Listener para as teclas 'O' e 'X'
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'o' || event.key === 'O') {
          event.preventDefault(); // Previne o comportamento padrão do navegador (ex: busca)
          handleCorrectClick();
        } else if (event.key === 'x' || event.key === 'X') {
          event.preventDefault(); // Previne o comportamento padrão do navegador
          handleWrongClick();
        }
      };
  
      // Efeito de suspense: determina qual botão está mais próximo do mouse
      const handleMouseMove = (event: MouseEvent) => {
        const containerRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        // Calcula a posição X do mouse relativa ao container
        const mouseX = event.clientX - containerRect.left; 
        
        const containerMidpointX = containerRect.width / 2;
  
        // Se o mouse estiver na metade esquerda, ativa o efeito no botão 'Correto'
        if (mouseX < containerMidpointX) {
          activeEffect.value = 'correct';
        } else { // Caso contrário, ativa no botão 'Errado'
          activeEffect.value = 'wrong';
        }
      };
  
      // Reseta o efeito quando o mouse sai do container
      const handleMouseLeave = () => {
        activeEffect.value = null;
      };
  
      // Adiciona e remove os event listeners globais para as teclas
      onMounted(() => {
        document.addEventListener('keydown', handleKeyDown);
        // Adiciona o listener de mouseleave ao container para resetar o efeito
        const container = document.querySelector('.answer-feedback-container');
        if (container) {
          container.addEventListener('mouseleave', handleMouseLeave);
        }
      });
  
      onUnmounted(() => {
        document.removeEventListener('keydown', handleKeyDown);
        const container = document.querySelector('.answer-feedback-container');
        if (container) {
          container.removeEventListener('mouseleave', handleMouseLeave);
        }
      });
  
      return {
        activeEffect,
        handleCorrectClick,
        handleWrongClick,
        handleMouseMove,
        handleMouseLeave, // Exponha para o template
      };
    },
  });
  </script>
  
  <style scoped>
  .answer-feedback-container {
    display: flex;
    gap: 30px; /* Espaço entre os botões */
    margin-top: 40px;
    justify-content: center;
    width: 100%;
    max-width: 600px; /* Limita a largura do container */
    padding: 20px;
    background-color: #f0f0f0; /* Fundo sutil */
    border-radius: 15px;
    cursor: crosshair; /* Um cursor mais proeminente para o suspense */
    /* Se você quiser um cursor personalizado maior, precisará de uma imagem: */
    /* cursor: url('/path/to/seu-cursor-maior.png') 16 16, auto; */
    /* O '16 16' são as coordenadas do hotspot do cursor. */
  }
  
  .feedback-button {
    padding: 20px 40px;
    font-size: 1.8em;
    font-weight: bold;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer; /* Mantém o cursor de ponteiro sobre os botões */
    transition: all 0.3s ease;
    flex-grow: 1; /* Permite que os botões cresçam e preencham o espaço */
    max-width: 250px; /* Limita a largura máxima de cada botão */
    position: relative;
    overflow: hidden;
  }
  
  .correct-button {
    background-color: #2ecc71; /* Verde para 'Correto' */
  }
  
  .wrong-button {
    background-color: #e74c3c; /* Vermelho para 'Errado' */
  }
  
  .feedback-button:hover {
    transform: translateY(-5px); /* Efeito de elevação ao passar o mouse */
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
  
  /* Efeito de brilho/suspense quando o mouse está próximo */
  .active-glow {
    transform: scale(1.05); /* Ligeiramente maior */
    border: 3px solid; /* Adiciona uma borda para o efeito */
  }
  
  .correct-button.active-glow {
      border-color: #76ff03; /* Borda verde brilhante */
      box-shadow: 0 0 20px 8px rgba(118, 255, 3, 0.6), inset 0 0 10px 4px rgba(178, 255, 89, 0.4);
  }
  
  .wrong-button.active-glow {
      border-color: #ff1744; /* Borda vermelha brilhante */
      box-shadow: 0 0 20px 8px rgba(255, 23, 68, 0.6), inset 0 0 10px 4px rgba(255, 82, 82, 0.4);
  }
  
  
  /* Responsividade para telas menores */
  @media (max-width: 600px) {
    .answer-feedback-container {
      flex-direction: column; /* Empilha os botões verticalmente em telas pequenas */
      gap: 20px;
      padding: 15px;
    }
    .feedback-button {
      width: 100%; /* Largura total */
      max-width: none; /* Remove a largura máxima */
      font-size: 1.5em;
      padding: 15px 30px;
    }
  }
  </style>