<template>
  <div class="splash-screen-wrapper">
    <!-- Canvas para os fogos de artifício -->
    <canvas id="fireworksCanvas" class="fireworks-canvas"></canvas>

    <!-- O logo agora ocupa o centro e é o principal elemento visual -->
    <img src="/logo_sitio.png" alt="Carroção Games Logo" class="splash-logo-img-fullscreen">
    
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, onUnmounted } from 'vue';
// CORRIGIDO: Adicionando fetchScores ao import da scoreStore
import { scoreStore, resetScores, fetchScores } from '../store/scoreStore'; 
import { resetImagemOcultaGameScores } from '../store/imagemOcultaStore'; 
import { resetConexaoGameScores } from '../store/conexaoStore'; 
import { resetBugGameScores } from '../store/bugStore'; 
import { useRouter } from 'vue-router'; 

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
  name: 'SplashScreen',
  emits: [], 
  setup(_props) { 
    const router = useRouter();

    const hasScoresToClear = computed(() => {
      if (scoreStore.isLoadingScores) {
        return false;
      }
      return Object.values(scoreStore.score).some(score => score > 0);
    });

    const clearAllScores = async () => {
      if (confirm('Tem certeza que deseja limpar todas as pontuações? Esta ação não pode ser desfeita.')) {
        await resetScores(); 
        await resetImagemOcultaGameScores(); 
        await resetConexaoGameScores(); 
        await resetBugGameScores(); 
      }
    };

    const navigateToGame = async (gameType: 'imagem-oculta' | 'conexao' | 'bug') => {
      console.log(`[SplashScreen] Clicou em ${gameType === 'imagem-oculta' ? 'Imagem Oculta' : gameType === 'conexao' ? 'Conexão' : 'BUG'}. Iniciando jogo.`);
      
      if (gameType === 'imagem-oculta') {
        await resetImagemOcultaGameScores(); 
        router.push({ name: 'ImagemOcultaGame' }); 
      } else if (gameType === 'conexao') {
        await resetConexaoGameScores(); 
        router.push({ name: 'ConexaoGame' }); 
      } else if (gameType === 'bug') { 
        await resetBugGameScores(); 
        router.push({ name: 'BugGame' });
      }
    };

    const navigateToAdmin = () => {
      router.push({ name: 'AdminDefaultRedirect' }); 
    };

    // --- Lógica dos Fogos de Artifício ---
    let fireworksCanvasElement: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let activeParticles: Particle[] = [];
    let animationFrameId: number | null = null;

    // Mapeamento de teclas para cores dos fogos
    const FIREWORK_COLORS: { [key: string]: string } = {
      '1': '#3498db', // Azul
      '2': '#e74c3c', // Vermelho
      '3': '#2ecc71', // Verde
      '4': '#f1c40f', // Amarelo
    };

    // Mapeamento de teclas para ações (incluindo 'A' para Admin)
    const ACTION_KEYS: { [key: string]: () => void } = {
      'A': () => navigateToAdmin(), 
      'C': () => navigateToGame('conexao'), 
      'I': () => navigateToGame('imagem-oculta'), 
      'B': () => { 
        console.log("Bug action triggered via key 'B'. Navigating to BugGame.");
        navigateToGame('bug');
      },
      'L': () => { 
        if (hasScoresToClear.value) {
            clearAllScores(); 
            console.log("Scores cleared via key 'L'.");
        } else {
            console.log("No scores to clear (key 'L' pressed).");
        }
      },
    };

    // Função auxiliar para converter HEX para RGB
    const hexToRgb = (hex: string): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      b: parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    };

    // Configura o canvas para ocupar a tela toda
    const setupCanvas = () => {
      if (fireworksCanvasElement) {
        ctx = fireworksCanvasElement.getContext('2d');
        fireworksCanvasElement.width = window.innerWidth;
        fireworksCanvasElement.height = window.innerHeight;
      }
    };

    // Cria uma única partícula de fogo de artifício
    const createParticle = (x: number, y: number, color: string): Particle => {
      const angle = Math.random() * Math.PI * 2; 
      const speed = Math.random() * 8 + 3; 
      const life = Math.random() * 100 + 50; 
      const radius = Math.random() * 2 + 3; 
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        life,
        initialLife: life, 
        gravity: 0.1, 
        radius,
      };
    };

    // Dispara uma explosão de fogos de artifício
    const triggerFireworks = (color: string) => {
      if (!ctx || !fireworksCanvasElement) return;

      // Primeira explosão
      let centerX1 = Math.random() * fireworksCanvasElement.width;
      let centerY1 = Math.random() * fireworksCanvasElement.height * 0.8; 

      for (let i = 0; i < 150; i++) { 
        activeParticles.push(createParticle(centerX1, centerY1, color));
      }

      // Segunda explosão em outro local aleatório
      let centerX2 = Math.random() * fireworksCanvasElement.width;
      let centerY2 = Math.random() * fireworksCanvasElement.height * 0.8; 

      for (let i = 0; i < 150; i++) { 
        activeParticles.push(createParticle(centerX2, centerY2, color));
      }

      if (animationFrameId === null) {
        animate();
      }
    };

    // Atualiza a posição e estado de todas as partículas
    const updateParticles = () => {
      activeParticles = activeParticles.filter(p => p.life > 0); 

      activeParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity; 
        p.life--;
        p.alpha = p.life / p.initialLife; 
      });
    };

    // Desenha todas as partículas no canvas
    const drawParticles = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); 

      ctx.globalCompositeOperation = 'lighter'; 
      activeParticles.forEach(p => {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2); 
        ctx!.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.alpha})`; 
        ctx!.fill();
      });
      ctx.globalCompositeOperation = 'source-over'; 
    };

    // Loop principal da animação
    const animate = () => {
      updateParticles();
      drawParticles();

      if (activeParticles.length > 0) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        animationFrameId = null;
        if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); 
      }
    };

    // Lida com o evento de pressionar uma tecla
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase(); 

      // Verifica se é uma tecla de fogos de artifício
      const fireworkColor = FIREWORK_COLORS[key];
      if (fireworkColor) {
        triggerFireworks(fireworkColor);
        event.preventDefault(); 
        return; 
      }

      // Verifica se é uma tecla de ação
      const action = ACTION_KEYS[key];
      if (action) {
        action();
        event.preventDefault(); 
        return;
      }
    };

    // Lifecycle Hooks para adicionar e remover listeners
    onMounted(() => {
      fireworksCanvasElement = document.getElementById('fireworksCanvas') as HTMLCanvasElement;
      setupCanvas(); 
      window.addEventListener('keydown', handleKeyPress); 
      window.addEventListener('resize', setupCanvas); 
      fetchScores(); // Garante que as pontuações estejam carregadas
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyPress); 
      window.removeEventListener('resize', setupCanvas); 
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId); 
      }
    });

    return {
      hasScoresToClear,
      clearAllScores,
      navigateToGame,
      navigateToAdmin,
    };
  },
});
</script>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden; 
}

.fireworks-canvas {
  position: fixed; 
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; 
  z-index: 999; 
}

.splash-screen-wrapper {
  display: flex;
  justify-content: center; 
  align-items: center; 
  width: 100vw; 
  height: 100vh; 
  background-color: #f0f2f5;
  position: relative; 
  overflow: hidden; 
  z-index: 1; 
}

.splash-logo-img-fullscreen {
  max-width: 100%; 
  max-height: 100%; 
  object-fit: contain; 
  display: block; 
  margin: auto; 
  position: absolute; 
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2; 
}
</style>