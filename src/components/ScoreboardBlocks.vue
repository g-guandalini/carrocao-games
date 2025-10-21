<template>
    <div class="scoreboard-blocks-container">
      <div class="team-scores-wrapper">
        <div
          v-for="(scoreValue, teamName) in score"
          :key="teamName"
          class="team-score-block"
          :style="{ backgroundColor: getTeamColorHex(teamName as TeamColor) }"
        >
          <span class="team-name">{{ teamName }}</span>
          <span class="team-points">{{ scoreValue }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, PropType } from 'vue';
  import { TeamColor } from '../types';
  
  export default defineComponent({
    name: 'ScoreboardBlocks',
    props: {
      score: {
        type: Object as PropType<Record<TeamColor, number>>,
        required: true,
      },
    },
    setup() {
      const getTeamColorHex = (team: TeamColor) => {
        switch (team) {
          case TeamColor.BLUE: return '#3498db';
          case TeamColor.RED: return '#e74c3c';
          case TeamColor.GREEN: return '#2ecc71';
          case TeamColor.YELLOW: return '#f1c40f';
          default: return '#333';
        }
      };
  
      return {
        TeamColor,
        getTeamColorHex,
      };
    },
  });
  </script>
  
  <style scoped>
  .scoreboard-blocks-container {
    background-color: #ffffff;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    margin-top: 30px;
    width: 100%;
    max-width: 450px; /* Mantém a largura máxima do placar original */
    text-align: center;
    border: 1px solid #eee;
    box-sizing: border-box;
    /* Definimos a variável CSS para o gap aqui, facilitando a responsividade */
    --scoreboard-gap: 20px; 
  }
  
  .scoreboard-blocks-container h2 {
    color: #34495e;
    margin-bottom: 25px;
    font-size: 1.8em;
  }
  
  .team-scores-wrapper {
    display: flex;
    flex-wrap: wrap;
    justify-content: center; /* Continua centralizando os blocos */
    gap: var(--scoreboard-gap); /* Usa a variável para o espaçamento */
    padding: 0; /* Remove padding lateral daqui para evitar conflitos de cálculo */
  }
  
  .team-score-block {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    /* Chave da correção: Usamos flex-basis com calc().
       Para 2 colunas e um gap de X, cada item deve ter 50% - (X/2) */
    flex-basis: calc(50% - (var(--scoreboard-gap) / 2));
    flex-grow: 0;   /* Não permite que os itens cresçam */
    flex-shrink: 0;  /* Não permite que os itens encolham */
  
    height: 150px; /* Altura ligeiramente menor para um visual retangular */
    border-radius: 15px;
    color: white;
    font-weight: bold;
    font-size: 1.4em; /* Aumenta o tamanho da fonte geral do bloco */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    text-align: center; /* Garante que o texto seja centralizado dentro do bloco */
  }
  
  .team-score-block:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  .team-name {
    font-size: 0.8em; /* Ajusta o tamanho da fonte para o nome da equipe */
    margin-bottom: 8px; /* Mais espaço entre nome e pontos */
    text-transform: uppercase;
  }
  
  .team-points {
    font-size: 2.8em; /* Aumenta significativamente o tamanho da fonte para os pontos */
    line-height: 1;
  }
  
  /* Responsividade para telas menores */
  @media (max-width: 480px) {
    .scoreboard-blocks-container {
      padding: 15px;
      max-width: 100%; /* Permite que o container ocupe a largura total em mobile */
      --scoreboard-gap: 15px; /* Ajusta o gap para telas menores */
    }
    .team-score-block {
      /* Recalcula flex-basis com o novo gap para telas menores */
      flex-basis: calc(50% - (var(--scoreboard-gap) / 2));
      height: 100px;
      font-size: 1.1em;
    }
    .team-name {
      font-size: 0.7em;
      margin-bottom: 5px;
    }
    .team-points {
      font-size: 2em;
    }
  }
  
  /* Para telas muito pequenas, pode ser necessário voltar para uma única coluna */
  @media (max-width: 340px) {
    .team-scores-wrapper {
      flex-direction: column; /* Em telas muito estreitas, exibe em uma única coluna */
      align-items: center;
    }
    .team-score-block {
      /* Define uma largura máxima para o bloco em modo de coluna única */
      flex-basis: 80%; /* Ocupa 80% da largura disponível */
      max-width: 200px; /* Limita o tamanho para não ficar muito largo */
    }
  }
  </style>