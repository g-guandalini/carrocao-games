<template>
    <div class="image-tiler-container" :style="containerStyle">
      <div
        v-for="tile in tiles"
        :key="tile.id"
        class="image-tile"
        :style="getTileStyle(tile)"
      ></div>
      <div v-if="!imageUrl" class="placeholder-image">Carregando imagem...</div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, watch, computed } from 'vue';
  
  // Interface para representar cada ladrilho da imagem
  interface Tile {
    id: number;
    originalGridPos: { row: number; col: number }; // Posição na grade original (para background-position)
    bgPosition: { x: number; y: number }; // Posição em pixels para CSS background-position
    initialDisplayPos: { x: number; y: number }; // Posição visual inicial embaralhada
    currentDisplayPos: { x: number; y: number }; // Posição visual atual (onde o tile é desenhado)
    revealOrderIndex: number; // Índice na ordem aleatória de revelação
  }
  
  export default defineComponent({
    name: 'ImageTiler',
    props: {
      imageUrl: {
        type: String,
        required: true,
      },
      revealProgress: {
        type: Number,
        default: 0, // 0 = totalmente embaralhada, 1 = totalmente revelada
      },
      gridSize: {
        type: Number,
        default: 4, // e.g., uma grade de 4x4
      },
      imageWidth: {
        type: Number,
        default: 500, // Largura esperada da imagem para o tiling
      },
      imageHeight: {
        type: Number,
        default: 350, // Altura esperada da imagem para o tiling
      },
    },
    setup(props) {
      const tiles = ref<Tile[]>([]); // Estado reativo dos tiles
      const initialTileData = ref<Omit<Tile, 'currentDisplayPos'>[]>([]); // Dados base dos tiles para re-cálculo
  
      const totalTiles = computed(() => props.gridSize * props.gridSize);
      const tileWidth = computed(() => props.imageWidth / props.gridSize);
      const tileHeight = computed(() => props.imageHeight / props.gridSize);
  
      // Função para inicializar os tiles (chama quando a imagem ou gridSize muda)
      const initializeTiles = async () => {
        if (!props.imageUrl) {
          tiles.value = [];
          initialTileData.value = [];
          return;
        }
  
        // Opcional: Pré-carrega a imagem para garantir que as dimensões estejam disponíveis
        // e para evitar um "flash" de imagem quebrada.
        // Neste exemplo, vamos assumir que imageWidth/imageHeight são passados corretamente.
  
        const tempInitialTileData: typeof initialTileData.value = [];
        const correctDisplayPositions: { x: number; y: number }[] = [];
  
        for (let i = 0; i < totalTiles.value; i++) {
          const row = Math.floor(i / props.gridSize);
          const col = i % props.gridSize;
  
          // Calcula a posição do background para cada tile (mostrando a parte correta da imagem)
          const bgX = -col * tileWidth.value;
          const bgY = -row * tileHeight.value;
  
          tempInitialTileData.push({
            id: i,
            originalGridPos: { row, col },
            bgPosition: { x: bgX, y: bgY },
            initialDisplayPos: { x: 0, y: 0 }, // Será preenchido após o embaralhamento
            revealOrderIndex: 0, // Será preenchido com uma ordem aleatória de revelação
          });
  
          // Armazena as posições visuais corretas para embaralhar depois
          correctDisplayPositions.push({ x: col * tileWidth.value, y: row * tileHeight.value });
        }
  
        // Gera um mapeamento aleatório de ID de tile para uma posição de exibição embaralhada
        const shuffledDisplayPositions = [...correctDisplayPositions];
        // Algoritmo de Fisher-Yates para embaralhar
        for (let i = shuffledDisplayPositions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledDisplayPositions[i], shuffledDisplayPositions[j]] = [shuffledDisplayPositions[j], shuffledDisplayPositions[i]];
        }
  
        // Gera uma ordem aleatória para quais tiles serão "revelados" primeiro
        const revealOrder = Array.from({ length: totalTiles.value }, (_, i) => i); // Array [0, 1, ..., N-1]
        for (let i = revealOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [revealOrder[i], revealOrder[j]] = [revealOrder[j], revealOrder[i]];
        }
  
        // Atribui as posições visuais embaralhadas iniciais e o índice de ordem de revelação
        initialTileData.value = tempInitialTileData.map((data, index) => ({
          ...data,
          initialDisplayPos: shuffledDisplayPositions[index], // Cada tile começa em uma posição visual aleatória
          revealOrderIndex: revealOrder.indexOf(data.id), // Onde este tile se encaixa na sequência de revelação
        }));
  
        // Aplica o progresso de revelação atual para definir o estado visual inicial
        updateTilesVisualState(props.revealProgress);
      };
  
      // Função para atualizar o estado visual dos tiles com base no progresso de revelação
      const updateTilesVisualState = (progress: number) => {
        const numTilesCorrectlyPlaced = Math.floor(progress * totalTiles.value);
  
        tiles.value = initialTileData.value.map(initialData => {
          // Um tile é considerado "correto" se seu índice na ordem de revelação
          // for menor que o número de tiles que devem estar corretos no momento.
          const isCorrect = initialData.revealOrderIndex < numTilesCorrectlyPlaced;
          return {
            id: initialData.id,
            originalGridPos: initialData.originalGridPos,
            bgPosition: initialData.bgPosition,
            currentDisplayPos: isCorrect
              ? { x: initialData.originalGridPos.col * tileWidth.value, y: initialData.originalGridPos.row * tileHeight.value } // Posição correta
              : initialData.initialDisplayPos, // Posição embaralhada
            isCorrectlyPlaced: isCorrect, // Indicador, não usado diretamente no estilo mas útil para depuração
          };
        });
      };
  
      // Observa mudanças na URL da imagem para re-inicializar os tiles
      watch(() => props.imageUrl, initializeTiles, { immediate: true });
      // Observa mudanças no progresso de revelação para atualizar o estado visual dos tiles
      watch(() => props.revealProgress, (newProgress) => {
        updateTilesVisualState(newProgress);
      });
      // Observa mudanças no gridSize ou nas dimensões para re-inicializar
      watch(() => [props.gridSize, props.imageWidth, props.imageHeight], initializeTiles);
  
      // Gera o estilo CSS para cada tile
      const getTileStyle = (tile: Tile) => ({
        width: `${tileWidth.value}px`,
        height: `${tileHeight.value}px`,
        backgroundImage: `url(${props.imageUrl})`,
        backgroundPosition: `${tile.bgPosition.x}px ${tile.bgPosition.y}px`,
        // background-size deve ser o tamanho total da imagem, para que cada tile mostre apenas sua parte
        backgroundSize: `${props.imageWidth}px ${props.imageHeight}px`,
        transform: `translate(${tile.currentDisplayPos.x}px, ${tile.currentDisplayPos.y}px)`,
        transition: 'transform 0.5s ease-out', // Transição suave para o movimento dos tiles
        position: 'absolute', // Permite o posicionamento absoluto dentro do container
        zIndex: tile.isCorrectlyPlaced ? 1 : 0, // Tiles corretos podem ter z-index maior para visibilidade
      });
  
      // Estilo para o container principal que mantém os tiles
      const containerStyle = computed(() => ({
        width: `${props.imageWidth}px`,
        height: `${props.imageHeight}px`,
        position: 'relative', // Necessário para o posicionamento absoluto dos tiles
        overflow: 'hidden', // Esconde qualquer transbordamento se os tiles saírem um pouco
        backgroundColor: '#ecf0f1', // Cor de fundo caso a imagem não carregue ou esteja transparente
        borderRadius: '12px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
        border: '2px solid #bdc3c7',
      }));
  
      return {
        tiles,
        getTileStyle,
        containerStyle,
      };
    },
  });
  </script>
  
  <style scoped>
  .image-tiler-container {
    /* Estilos definidos via computed containerStyle para reutilizar props */
    display: block; /* Garante que o div seja um bloco para ter dimensões */
  }
  
  .image-tile {
    background-repeat: no-repeat;
    will-change: transform; /* Dica para o navegador para animações mais fluidas */
    /* Outros estilos definidos via getTileStyle para reutilizar props */
  }
  
  .placeholder-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.3em;
    color: #7f8c8d;
    background-color: #ecf0f1;
    border-radius: 12px;
  }
  </style>