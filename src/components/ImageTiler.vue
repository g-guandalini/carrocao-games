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

interface TileConfig {
  id: number;
  originalGridPos: { row: number; col: number };
  bgPosition: { x: number; y: number };
  revealOrderIndex: number;
}

interface DisplayTile {
  id: number;
  originalGridPos: { row: number; col: number };
  bgPosition: { x: number; y: number };
  currentDisplayPos: { x: number; y: number };
  isVisible: boolean;
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
      default: 0,
    },
    gridSize: {
      type: Number,
      default: 10,
    },
    imageWidth: {
      type: Number,
      default: 500,
    },
    imageHeight: {
      type: Number,
      default: 350,
    },
  },
  setup(props) {
    const tiles = ref<DisplayTile[]>([]);
    const initialTileData = ref<TileConfig[]>([]);
    const randomizedRevealOrder = ref<number[]>([]);
    let lastTrackedKey = '';

    const totalTiles = computed(() => props.gridSize * props.gridSize);
    const tileWidth = computed(() => props.imageWidth / props.gridSize);
    const tileHeight = computed(() => props.imageHeight / props.gridSize);

    const generateRevealOrder = (count: number) => {
      const newRevealOrder = Array.from({ length: count }, (_, i) => i);
      for (let i = newRevealOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newRevealOrder[i], newRevealOrder[j]] = [newRevealOrder[j], newRevealOrder[i]];
      }
      randomizedRevealOrder.value = newRevealOrder;
    };

    const initializeTiles = async () => {
      if (!props.imageUrl) {
        tiles.value = [];
        initialTileData.value = [];
        randomizedRevealOrder.value = [];
        lastTrackedKey = '';
        return;
      }

      const currentKey = `${props.imageUrl}-${props.gridSize}`;
      if (currentKey !== lastTrackedKey) {
        generateRevealOrder(totalTiles.value);
        lastTrackedKey = currentKey;
      }
      if (randomizedRevealOrder.value.length !== totalTiles.value && totalTiles.value > 0) {
          generateRevealOrder(totalTiles.value);
      }
      if (randomizedRevealOrder.value.length === 0 && totalTiles.value > 0) {
        generateRevealOrder(totalTiles.value);
      }

      const tempInitialTileData: TileConfig[] = [];
      for (let i = 0; i < totalTiles.value; i++) {
        const row = Math.floor(i / props.gridSize);
        const col = i % props.gridSize;

        const bgX = -col * tileWidth.value;
        const bgY = -row * tileHeight.value;

        tempInitialTileData.push({
          id: i,
          originalGridPos: { row, col },
          bgPosition: { x: bgX, y: bgY },
          revealOrderIndex: randomizedRevealOrder.value.indexOf(i),
        });
      }

      initialTileData.value = tempInitialTileData;
      updateTilesVisualState(props.revealProgress);
    };

    const updateTilesVisualState = (progress: number) => {
      if (initialTileData.value.length === 0) return;

      const numTilesToReveal = Math.floor(progress * totalTiles.value);

      tiles.value = initialTileData.value.map(initialData => {
        const isVisible = initialData.revealOrderIndex < numTilesToReveal;
        return {
          id: initialData.id,
          originalGridPos: initialData.originalGridPos,
          bgPosition: initialData.bgPosition,
          currentDisplayPos: {
              x: initialData.originalGridPos.col * tileWidth.value,
              y: initialData.originalGridPos.row * tileHeight.value
          },
          isVisible: isVisible,
        } satisfies DisplayTile;
      });
    };

    watch(() => [props.imageUrl, props.gridSize], initializeTiles, { immediate: true });

    watch(
      () => [props.imageWidth, props.imageHeight],
      ([newImageWidth, newImageHeight], oldValues) => {
        if (oldValues && (newImageWidth !== oldValues[0] || newImageHeight !== oldValues[1]) && props.imageUrl) {
          initializeTiles();
        }
      }
    );

    watch(() => props.revealProgress, (newProgress) => {
      updateTilesVisualState(newProgress);
    });

    const getTileStyle = (tile: DisplayTile): CSSProperties => ({
      width: `${tileWidth.value}px`,
      height: `${tileHeight.value}px`,
      backgroundImage: `url(${props.imageUrl})`,
      backgroundPosition: `${tile.bgPosition.x}px ${tile.bgPosition.y}px`,
      backgroundSize: `${props.imageWidth}px ${props.imageHeight}px`,
      transform: `translate(${tile.currentDisplayPos.x}px, ${tile.currentDisplayPos.y}px)`,
      position: 'absolute',
      zIndex: 0,
      opacity: tile.isVisible ? 1 : 0,
      transition: 'opacity 0.5s ease-out',
      backgroundColor: '#34495e',
    });

    const containerStyle = computed<StyleValue>(() => ({
      width: `${props.imageWidth}px`,
      height: `${props.imageHeight}px`,
      position: 'relative',
      backgroundColor: '#ecf0f1',
      borderRadius: '12px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
      border: '2px solid #bdc3c7',
      overflow: 'hidden',
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
  overflow: hidden;
  box-sizing: border-box; /* Adicionado: Para incluir a borda de 2px nas dimensões */
}

.image-tile {
  background-repeat: no-repeat;
  will-change: opacity;
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