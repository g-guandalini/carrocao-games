<template>
    <div class="game-conexao-container">
      <!-- Imagem da Conexão -->
      <div class="image-display-area">
          <img 
              v-if="currentRoundConexao?.imageUrl"
              :src="baseURL + currentRoundConexao.imageUrl" 
              alt="Conexão" 
              class="game-image" 
          />
          <div v-if="gameStatus === 'finished'" class="game-finished-overlay">
              <p>A palavra era:</p>
              <h2>{{ currentRoundConexao?.palavra }}</h2>
          </div>
      </div>
  
      <!-- Palavra sendo revelada -->
      <div class="word-display">
          <span v-for="(char, index) in formattedPalavra" :key="index" class="letter"
                :class="{ 'revealed': char !== '_' && char !== ' ' }">
              {{ char }}
          </span>
      </div>
  
      <!-- Controles do Jogo -->
      <div class="game-controls">
          <div v-if="gameStatus === 'revealing'" class="revealing-state">
              <p class="revealing-text">Revelando letras... Equipe pode palpitar!</p>
              <div class="team-buttons">
                  <button class="team-btn blue" @click="selectConexaoTeam(TeamColor.BLUE)">1 - Azul</button>
                  <button class="team-btn red" @click="selectConexaoTeam(TeamColor.RED)">2 - Vermelho</button>
                  <button class="team-btn green" @click="selectConexaoTeam(TeamColor.GREEN)">3 - Verde</button>
                  <button class="team-btn yellow" @click="selectConexaoTeam(TeamColor.YELLOW)">4 - Amarelo</button>
              </div>
          </div>
  
          <div v-if="gameStatus === 'guessing' && activeTeam" class="guessing-state">
              <p class="guessing-text">Equipe <span :class="activeTeamClass">{{ activeTeam }}</span> vai palpitar!</p>
              <AnswerFeedback 
                  @correct-answer="evaluateGuess(true, 0)" 
                  @wrong-answer="evaluateGuess(false, 0)" 
              />
          </div>
  
          <div v-if="gameStatus === 'finished'" class="finished-state">
              <button @click="viewConexaoScoreboard" class="btn-action info">Ver Placar</button>
          </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, PropType, computed } from 'vue';
  import { Conexao, GameStatus, TeamColor } from '../types';
  import { 
      selectConexaoTeam, 
      viewConexaoScoreboard,
  } from '../store/conexaoStore';
  import AnswerFeedback from './AnswerFeedback.vue'; // Importa o componente AnswerFeedback
  
  export default defineComponent({
    name: 'GameConexao',
    components: {
      AnswerFeedback, // Registra o componente
    },
    props: {
      currentRoundConexao: {
        type: Object as PropType<Conexao | null>,
        required: true,
      },
      revealedLettersCount: { // Agora passamos a contagem para o calculo do score
        type: Number,
        required: true,
      },
      gameStatus: {
        type: String as PropType<GameStatus>,
        required: true,
      },
      activeTeam: {
        type: String as PropType<TeamColor | null>,
        required: true,
      },
    },
    emits: ['evaluate-guess', 'view-scoreboard'],
    setup(props, { emit }) {
      const baseURL = 'http://localhost:3001';
  
      const activeTeamClass = computed(() => {
        return props.activeTeam?.toLowerCase();
      });
  
      const evaluateGuess = (isCorrect: boolean, scoreAwarded: number) => {
        // scoreAwarded é 0 aqui porque o cálculo será feito no store com base nas letras reveladas
        emit('evaluate-guess', isCorrect, scoreAwarded);
      };
  
      const viewConexaoScoreboard = () => {
        emit('view-scoreboard');
      };
  
      // Computa a palavra formatada com underscores e letras reveladas
      const formattedPalavra = computed(() => {
          if (!props.currentRoundConexao || !props.currentRoundConexao.palavra) return '';
          const palavra = props.currentRoundConexao.palavra.toUpperCase();
          const revealed = props.currentRoundConexao.revealedLetters || new Set<number>();
          
          return palavra.split('').map((char, index) => {
              if (char === ' ') return ' ';
              return revealed.has(index) ? char : '_';
          }).join('');
      });
  
      return {
        baseURL,
        activeTeamClass,
        formattedPalavra,
        TeamColor, // Expor TeamColor para uso no template (botões)
        // Funções do store para serem chamadas diretamente
        selectConexaoTeam,
        evaluateGuess, 
        viewConexaoScoreboard, 
      };
    },
  });
  </script>
  
  <style scoped>
  .game-conexao-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 25px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    padding: 30px;
    margin-top: 30px;
    width: 90%;
    max-width: 960px;
    font-family: 'Poppins', sans-serif;
  }
  
  .image-display-area {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio (height / width * 100%) */
    background-color: #e0e0e0; /* Placeholder background */
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  }
  
  .game-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain; /* Ensures the whole image is visible */
    display: block;
    z-index: 1;
  }
  
  .game-finished-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    text-align: center;
    font-size: 2em;
    font-weight: bold;
    z-index: 3;
  }
  .game-finished-overlay p {
      font-size: 0.6em;
      margin-bottom: 10px;
      opacity: 0.8;
  }
  
  .word-display {
      margin: 20px 0;
      font-family: 'Monospace', monospace;
      font-size: 3em;
      font-weight: bold;
      letter-spacing: 5px;
      color: #34495e;
      display: flex; /* Para alinhar as letras individualmente */
      flex-wrap: wrap; /* Quebra linha se a palavra for muito longa */
      justify-content: center;
      gap: 5px; /* Espaçamento entre as letras */
  }
  
  .letter {
      display: inline-block;
      width: 0.8em; /* Largura fixa para cada letra/underscore */
      text-align: center;
      border-bottom: 3px solid #ccc;
      line-height: 1.2;
      transition: color 0.3s ease, border-color 0.3s ease;
  }
  
  .letter.revealed {
      border-color: transparent; /* Remove a linha de baixo quando revelada */
      color: #2ecc71; /* Cor da letra revelada */
  }
  
  .game-controls {
    width: 100%;
    text-align: center;
  }
  
  .game-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
  }
  
  .btn-action {
    padding: 12px 25px;
    border: none;
    border-radius: 6px;
    font-size: 1.1em;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
    min-width: 200px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  }
  
  .btn-action.primary {
    background-color: #2ecc71;
    color: white;
  }
  .btn-action.primary:hover {
    background-color: #27ae60;
    transform: translateY(-2px);
  }
  
  .btn-action.success {
    background-color: #28a745;
    color: white;
  }
  .btn-action.success:hover {
    background-color: #218838;
    transform: translateY(-2px);
  }
  
  .btn-action.danger {
    background-color: #dc3545;
    color: white;
  }
  .btn-action.danger:hover {
    background-color: #c82333;
    transform: translateY(-2px);
  }
  
  .btn-action.info {
    background-color: #007bff;
    color: white;
  }
  .btn-action.info:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
  }
  
  .revealing-state, .guessing-state, .finished-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    width: 100%;
  }
  
  .revealing-text {
    font-size: 1.3em;
    color: #555;
    font-weight: 600;
    margin-bottom: 10px;
  }
  .revealing-text .countdown {
      color: #e74c3c;
      font-weight: bold;
  }
  
  .team-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    width: 100%;
  }
  
  .team-btn {
    padding: 10px 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f8f9fa;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.2s, border-color 0.2s, color 0.2s;
    flex: 1 1 calc(50% - 10px); /* Two columns on larger screens */
    max-width: 180px;
  }
  
  .team-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  
  .team-btn.blue { border-color: #007bff; color: #007bff; }
  .team-btn.red { border-color: #dc3545; color: #dc3545; }
  .team-btn.green { border-color: #28a745; color: #28a745; }
  .team-btn.yellow { border-color: #ffc107; color: #ffc107; }
  
  .team-btn.blue:hover { background-color: #e7f4ff; }
  .team-btn.red:hover { background-color: #fde6e8; }
  .team-btn.green:hover { background-color: #e6fae7; }
  .team-btn.yellow:hover { background-color: #fff9e6; }
  
  .guessing-text {
    font-size: 1.4em;
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .guessing-text .blue { color: #007bff; }
  .guessing-text .red { color: #dc3545; }
  .guessing-text .green { color: #28a745; }
  .guessing-text .yellow { color: #ffc107; }
  
  .operator-feedback {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 10px;
  }
  
  .revealed-palavra { 
    font-size: 2.5em;
    color: #34495e;
    margin-bottom: 15px;
  }
  
  @media (max-width: 768px) {
    .game-conexao-container {
      padding: 20px;
    }
    .image-display-area {
      width: 95%;
    }
    .btn-action {
      width: 100%;
      max-width: 250px;
    }
    .team-buttons {
      flex-direction: column;
      align-items: center;
    }
    .team-btn {
      flex: none;
      width: 100%;
      max-width: 250px;
    }
    .word-display {
        font-size: 2em;
        letter-spacing: 3px;
        gap: 3px;
    }
  }
  </style>