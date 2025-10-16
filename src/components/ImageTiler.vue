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
import { defineComponent, ref, watch, computed, type StyleValue, type CSSProperties } from 'vue';

// Interface para representar cada ladrilho da imagem
interface TileConfig {
  id: number;
  originalGridPos: { row: number; col: number };
  bgPosition: { x: number; y: number };
  revealOrderIndex: number; // Índice na ordem aleatória de revelação
}

// Interface para representar o ladrilho como ele é renderizado no VUE
interface DisplayTile {
  id: number;
  originalGridPos: { row: number; col: number };
  bgPosition: { x: number; y: number };
  currentDisplayPos: { x: number; y: number }; // Posição visual atual (sempre a correta)
  isVisible: boolean; // NOVO: Indicador se o tile deve estar visível
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
      default: 0, // 0 = totalmente oculta, 1 = totalmente revelada
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
    const tiles = ref<DisplayTile[]>([]); // Estado reativo dos tiles
    const initialTileData = ref<TileConfig[]>([]); // Dados base dos tiles

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

      const tempInitialTileData: TileConfig[] = [];

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
          revealOrderIndex: 0, // Será preenchido com uma ordem aleatória de revelação
        });
      }

      // Gera uma ordem aleatória para quais tiles serão "revelados" primeiro
      const revealOrder = Array.from({ length: totalTiles.value }, (_, i) => i); // Array [0, 1, ..., N-1]
      for (let i = revealOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [revealOrder[i], revealOrder[j]] = [revealOrder[j], revealOrder[i]];
      }

      // Atribui o índice de ordem de revelação
      initialTileData.value = tempInitialTileData.map(data => ({
        ...data,
        revealOrderIndex: revealOrder.indexOf(data.id), // Onde este tile se encaixa na sequência de revelação
      }));

      // Aplica o progresso de revelação atual para definir o estado visual inicial
      updateTilesVisualState(props.revealProgress);
    };

    // Função para atualizar o estado visual dos tiles com base no progresso de revelação
    const updateTilesVisualState = (progress: number) => {
      const numTilesToReveal = Math.floor(progress * totalTiles.value);

      tiles.value = initialTileData.value.map(initialData => {
        const isVisible = initialData.revealOrderIndex < numTilesToReveal; // Tile é visível se seu índice de revelação for menor que a quantidade a ser revelada
        return {
          id: initialData.id,
          originalGridPos: initialData.originalGridPos,
          bgPosition: initialData.bgPosition,
          currentDisplayPos: {
              x: initialData.originalGridPos.col * tileWidth.value,
              y: initialData.originalGridPos.row * tileHeight.value
          }, // Tiles estão sempre em suas posições corretas
          isVisible: isVisible, // NOVO: Controla a visibilidade
        } satisfies DisplayTile;
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
    const getTileStyle = (tile: DisplayTile): CSSProperties => ({
      width: `${tileWidth.value}px`,
      height: `${tileHeight.value}px`,
      backgroundImage: `url(${props.imageUrl})`,
      backgroundPosition: `${tile.bgPosition.x}px ${tile.bgPosition.y}px`,
      backgroundSize: `${props.imageWidth}px ${props.imageHeight}px`,
      transform: `translate(${tile.currentDisplayPos.x}px, ${tile.currentDisplayPos.y}px)`,
      position: 'absolute',
      zIndex: 0, // Todos os tiles têm o mesmo zIndex
      opacity: tile.isVisible ? 1 : 0, // NOVO: Opacidade controlada pela visibilidade
      transition: 'opacity 0.5s ease-out', // Transição suave para a opacidade
      // Adicionar um background para os tiles não visíveis para esconder a imagem
      // Use uma cor que "cubra" completamente o tile quando ele não é visível.
      backgroundColor: '#34495e', // Uma cor escura para ocultar a imagem de fundo
    });

    // Estilo para o container principal que mantém os tiles
    const containerStyle = computed<StyleValue>(() => ({
      width: `${props.imageWidth}px`,
      height: `${props.imageHeight}px`,
      position: 'relative',
      // removemos overflow: hidden para que o background color do container atue como fundo dos tiles
      backgroundColor: '#ecf0f1', // Cor de fundo para o container
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
  display: block;
  /* Comentar ou remover o overflow: hidden para permitir que a cor de fundo do container seja visível por trás dos tiles "invisíveis" */
  /* overflow: hidden; */
}

.image-tile {
  background-repeat: no-repeat;
  will-change: opacity; /* Dica para o navegador para animações de opacidade mais fluidas */
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