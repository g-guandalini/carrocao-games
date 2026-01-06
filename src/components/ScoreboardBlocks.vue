<template>
    <div class="scoreboard-blocks-container">
      <ol class="ranking-list">
        <li
          v-for="(item, index) in score"
          :key="item.name"
          class="ranking-item"
          :class="{
            'first-place': index === 0,
            'second-place': index === 1,
            'third-place': index === 2
          }"
          :style="{ 'background-color': getTeamColorHex(item.name) }"
        >
          <span class="rank-position">{{ index + 1 }}º</span>
          <span v-if="index === 0" class="trophy-icon">🏆</span>
          <span class="team-name">{{ item.name }}</span>
          <span class="team-points">{{ item.score }}</span>
        </li>
      </ol>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, PropType } from 'vue';
  
  interface ScoreItem {
    name: string;
    score: number;
  }
  
  export default defineComponent({
    name: 'ScoreboardBlocks',
    props: {
      score: {
        type: Array as PropType<ScoreItem[]>,
        required: true,
      },
    },
    setup() {
      const getTeamColorHex = (teamName: string) => {
        switch (teamName) {
          case 'Azul': return '#3498db';
          case 'Vermelho': return '#e74c3c';
          case 'Verde': return '#2ecc71';
          case 'Amarelo': return '#f1c40f';
          default: return '#6c757d'; // Cor padrão para equipes não mapeadas
        }
      };
  
      return {
        getTeamColorHex,
      };
    },
  });
  </script>
  
  <style scoped>
  .scoreboard-blocks-container {
    background-color: #ffffff;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
    margin-top: 25px;
    width: 100%;
    max-width: 900px; /* AUMENTADO PARA 900px */
    text-align: left;
    border: 1px solid #e9ecef;
    box-sizing: border-box;
  }
  
  .ranking-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .ranking-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 30px;
    margin-bottom: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
    transition: all 0.3s ease;
    font-size: 1.3em;
    font-weight: 500;
    color: white;
    border-left: 10px solid rgba(0, 0, 0, 0.2);
  }
  
  .ranking-item:last-child {
    margin-bottom: 0;
  }
  
  .ranking-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
  
  .rank-position {
    font-size: 1.8em;
    font-weight: 900;
    margin-right: 20px;
    min-width: 50px;
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .trophy-icon {
    font-size: 2.5em;
    margin-right: 15px;
    animation: bounce 0.8s infinite alternate;
    color: #ffd700;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  }
  
  @keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-7px); }
  }
  
  .team-name {
    flex-grow: 1;
    text-align: left;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: white;
    white-space: nowrap; /* Impede quebra de linha */
    overflow: hidden; /* Esconde o excesso se o nome for muito longo */
    text-overflow: ellipsis; /* Adiciona "..." se o nome for muito longo */
  }
  
  .team-points {
    font-size: 2.2em;
    font-weight: 900;
    color: white;
    margin-left: 25px;
    min-width: 90px; /* Garante espaço para pontuações de 3 dígitos */
    text-align: right;
    white-space: nowrap; /* Impede quebra de linha */
  }
  
  /* Estilos para o 1º lugar */
  .ranking-item.first-place {
    transform: scale(1.06);
    box-shadow: 0 0 0 6px #ffd700,
                0 10px 25px rgba(0, 0, 0, 0.4);
    border-left-color: #ffd700;
    position: relative;
    z-index: 1;
  }
  
  .ranking-item.first-place .rank-position,
  .ranking-item.first-place .team-name,
  .ranking-item.first-place .team-points {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  }
  
  /* Estilos para o 2º lugar */
  .ranking-item.second-place {
    box-shadow: 0 0 0 4px #c0c0c0,
                0 6px 18px rgba(0, 0, 0, 0.3);
    border-left-color: #c0c0c0;
  }
  
  /* Estilos para o 3º lugar */
  .ranking-item.third-place {
    box-shadow: 0 0 0 4px #cd7f32,
                0 6px 18px rgba(0, 0, 0, 0.3);
    border-left-color: #cd7f32;
  }
  
  /* Responsividade */
  @media (max-width: 768px) { /* Ajustado para telas menores que 768px */
    .scoreboard-blocks-container {
      padding: 25px;
      max-width: 100%;
    }
    .ranking-item {
      padding: 18px 25px;
      font-size: 1.2em;
      margin-bottom: 12px;
    }
    .rank-position {
      font-size: 1.6em;
      margin-right: 15px;
      min-width: 45px;
    }
    .trophy-icon {
      font-size: 2.2em;
      margin-right: 12px;
    }
    .team-name {
      font-size: 1.1em;
    }
    .team-points {
      font-size: 2em;
      margin-left: 20px;
      min-width: 80px;
    }
    .ranking-item.first-place {
      transform: scale(1.04);
      box-shadow: 0 0 0 5px #ffd700, 0 8px 20px rgba(0, 0, 0, 0.3);
    }
  }
  
  @media (max-width: 480px) { /* Para telas de celular */
    .scoreboard-blocks-container {
      padding: 15px;
    }
    .ranking-item {
      padding: 15px 18px;
      font-size: 1em;
      margin-bottom: 10px;
    }
    .rank-position {
      font-size: 1.4em;
      margin-right: 10px;
      min-width: 35px;
    }
    .trophy-icon {
      font-size: 1.8em;
      margin-right: 8px;
    }
    .team-name {
      font-size: 0.9em;
      letter-spacing: 0.5px;
    }
    .team-points {
      font-size: 1.6em;
      margin-left: 15px;
      min-width: 60px;
    }
    .ranking-item.first-place {
      transform: scale(1.02);
      box-shadow: 0 0 0 4px #ffd700, 0 6px 15px rgba(0, 0, 0, 0.25);
    }
  }
  </style>