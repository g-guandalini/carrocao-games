<template>
  <canvas ref="fireworksCanvasElement" class="fireworks-canvas"></canvas>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';

// Interface para as partículas dos fogos de artifício
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
  initialLife: number;
  gravity: number;
  radius: number;
}

export default defineComponent({
  name: 'FireworksCanvas',
  props: {
    // A cor base dos fogos (em formato HEX, ex: '#FF0000')
    color: {
      type: String,
      required: true,
      default: '#FFFFFF'
    },
    // Uma prop booleana para 'disparar' os fogos.
    // Quando mudar de false para true, os fogos serão ativados.
    trigger: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    const fireworksCanvasElement = ref<HTMLCanvasElement | null>(null);
    let ctx: CanvasRenderingContext2D | null = null;
    let activeParticles: Particle[] = [];
    let animationFrameId: number | null = null;

    // Função auxiliar para converter HEX para RGB (necessário para a opacidade)
    const hexToRgb = (hex: string): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    };

    // Configura o canvas para ocupar a tela toda
    const setupCanvas = () => {
      if (fireworksCanvasElement.value) {
        ctx = fireworksCanvasElement.value.getContext('2d');
        fireworksCanvasElement.value.width = window.innerWidth;
        fireworksCanvasElement.value.height = window.innerHeight;
      }
    };

    // Cria uma única partícula de fogo de artifício
    const createParticle = (x: number, y: number, color: string): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      const life = Math.random() * 100 + 50; // Duração da partícula
      const radius = Math.random() * 2 + 3; // Tamanho da partícula
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        life,
        initialLife: life,
        gravity: 0.1, // Adiciona um pouco de gravidade
        radius,
      };
    };

    // Dispara uma explosão de fogos de artifício
    const triggerFireworks = (fireworkColor: string) => {
      if (!ctx || !fireworksCanvasElement.value) return;

      activeParticles = []; // Limpa partículas antigas para evitar sobrecarga ou mistura de cores se re-acionado rapidamente

      const numExplosionPoints = 10; // GERA 6 PONTOS DE EXPLOSÃO DIFERENTES
      const particlesPerExplosion = 150; // Mantém a mesma densidade por explosão

      for (let exp = 0; exp < numExplosionPoints; exp++) {
        let centerX = Math.random() * fireworksCanvasElement.value.width;
        // As explosões acontecerão mais para cima na tela (ex: 80% superior)
        let centerY = Math.random() * fireworksCanvasElement.value.height * 0.8; 

        for (let i = 0; i < particlesPerExplosion; i++) {
          activeParticles.push(createParticle(centerX, centerY, fireworkColor));
        }
      }

      // Inicia o loop de animação se ainda não estiver rodando
      if (animationFrameId === null) {
        animate();
      }
    };

    // Atualiza a posição e estado de todas as partículas
    const updateParticles = () => {
      // Remove partículas que já 'morreram'
      activeParticles = activeParticles.filter(p => p.life > 0);

      activeParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity; // Aplica gravidade
        p.life--; // Decrementa a vida da partícula
        p.alpha = p.life / p.initialLife; // Atualiza a opacidade baseada na vida restante
      });
    };

    // Desenha todas as partículas no canvas
    const drawParticles = () => {
      if (!ctx) return;
      // Limpa o canvas a cada frame
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.globalCompositeOperation = 'lighter'; // Modo de mesclagem para um efeito de brilho
      activeParticles.forEach(p => {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2); // Desenha um círculo para cada partícula
        ctx!.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.alpha})`; // Cor com opacidade variável
        ctx!.fill();
      });
      ctx.globalCompositeOperation = 'source-over'; // Retorna ao modo de mesclagem padrão
    };

    // Loop principal da animação
    const animate = () => {
      updateParticles();
      drawParticles();

      if (activeParticles.length > 0) {
        animationFrameId = requestAnimationFrame(animate); // Continua a animar se houver partículas ativas
      } else {
        animationFrameId = null; // Para a animação quando não há mais partículas
        if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Garante que o canvas está limpo
      }
    };

    // Observa a prop 'trigger' para iniciar os fogos
    watch(() => props.trigger, (newVal, oldVal) => {
      if (newVal && !oldVal) { // Se trigger mudou de false para true
        triggerFireworks(props.color);
      }
    });

    // Configuração inicial e limpeza ao montar/desmontar
    onMounted(() => {
      setupCanvas();
      window.addEventListener('resize', setupCanvas); // Responde a mudanças de tamanho da janela
    });

    onUnmounted(() => {
      window.removeEventListener('resize', setupCanvas);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId); // Cancela o loop de animação para evitar vazamentos de memória
      }
    });

    return {
      fireworksCanvasElement,
    };
  },
});
</script>

<style scoped>
.fireworks-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* Permite interagir com os elementos abaixo */
  z-index: 9999; /* Garante que os fogos fiquem acima de tudo */
}
</style>