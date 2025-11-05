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

    <!-- <--- REMOVIDO: Exibição de pontos da rodada. --->

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
            <p class="timer-info">
              Pressione <strong style="color: blue;">1 (Azul)</strong>, <strong style="color: red;">2 (Vermelho)</strong>, <strong style="color: green;">3 (Verde)</strong> ou <strong style="color: yellow;">4 (Amarelo)</strong> para palpitar!
            </p>
        </div>

        <!-- <--- ALTERADO: Novo texto para o estado 'guessing' --->
        <div v-if="gameStatus === 'guessing' && activeTeam" class="guessing-state">
            <p class="guessing-message">
                Aguardando resposta da equipe <strong :style="{ color: teamColorToHex(activeTeam) }">{{ activeTeam }}</strong>! ⏳
            <br>
                Pontos em jogo: <strong>{{ currentPotentialScore }}</strong>
            </p>

            <AnswerFeedback
                @correct-answer="evaluateGuess(true, 0)"
                @wrong-answer="evaluateGuess(false, 0)"
            />
        </div>
        <!-- <--- FIM DA ALTERAÇÃO --->

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
    viewConexaoScoreboard,
} from '../store/conexaoStore';
import AnswerFeedback from './AnswerFeedback.vue';

export default defineComponent({
  name: 'GameConexao',
  components: {
    AnswerFeedback,
  },
  props: {
    currentRoundConexao: {
      type: Object as PropType<Conexao | null>,
      required: true,
    },
    revealedLettersCount: {
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
    disabledTeams: {
      type: Object as PropType<Set<TeamColor>>,
      required: true,
    },
    currentPotentialScore: {
      type: Number,
      required: true,
    },
  },
  emits: ['evaluate-guess', 'view-scoreboard'],
  setup(props, { emit }) {
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    const activeTeamClass = computed(() => {
      return props.activeTeam?.toLowerCase();
    });

    const evaluateGuess = (isCorrect: boolean, scoreAwarded: number) => {
      emit('evaluate-guess', isCorrect, scoreAwarded);
    };

    const viewConexaoScoreboard = () => {
      emit('view-scoreboard');
    };

    const formattedPalavra = computed(() => {
        if (!props.currentRoundConexao || !props.currentRoundConexao.palavra) return '';
        const palavra = props.currentRoundConexao.palavra.toUpperCase();
        const revealed = props.currentRoundConexao.revealedLetters || new Set<number>();

        return palavra.split('').map((char, index) => {
            if (char === ' ') return ' ';
            return revealed.has(index) ? char : '_';
        }).join('');
    });

    const teamColorToHex = (team: TeamColor | null) => {
      switch (team) {
        case TeamColor.BLUE: return '#3498db';
        case TeamColor.RED: return '#e74c3c';
        case TeamColor.GREEN: return '#2ecc71';
        case TeamColor.YELLOW: return '#f1c40f';
        default: return '#555';
      }
    };

    return {
      baseURL,
      activeTeamClass,
      formattedPalavra,
      TeamColor,
      evaluateGuess,
      viewConexaoScoreboard,
      teamColorToHex
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
  background-color: #e0e0e0;
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
  object-fit: contain;
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

/* <--- REMOVIDO: Estilo para a exibição da pontuação atual (current-score-display) ---> */

.word-display {
    font-family: 'Monospace', monospace;
    font-size: 3em;
    font-weight: bold;
    letter-spacing: 5px;
    color: #34495e;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
    margin-top: 20px; /* Adicionar um pouco de margem superior se a pontuação for removida daqui */
}

.letter {
    display: inline-block;
    width: 0.8em;
    text-align: center;
    border-bottom: 3px solid #ccc;
    line-height: 1.2;
    transition: color 0.3s ease, border-color 0.3s ease;
}

.letter.revealed {
    border-color: transparent;
    color: #2ecc71;
}

.game-controls {
  width: 100%;
  text-align: center;
}

.revealing-state, .guessing-state, .finished-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
}

.timer-info {
  font-size: 1.2em;
  color: #555;
  margin-bottom: 15px;
  line-height: 1.5;
  text-align: center;
  max-width: 500px;
}
.timer-info strong {
  font-weight: bold;
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

.btn-action.info {
  background-color: #007bff;
  color: white;
}
.btn-action.info:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

/* <--- NOVO: Estilos para o estado 'guessing' ---> */
.guessing-text-status {
  font-size: 1.4em;
  font-weight: bold;
  margin-bottom: 5px; /* Espaçamento entre as duas linhas de texto */
}
.guessing-text-score {
  font-size: 1.2em;
  color: #555;
  margin-bottom: 15px;
}
.guessing-text-score strong {
  font-weight: bold;
  color: #388E3C;
}

.guessing-text-status .blue { color: #007bff; }
.guessing-text-status .red { color: #dc3545; }
.guessing-text-status .green { color: #28a745; }
.guessing-text-status .yellow { color: #ffc107; }
/* <--- FIM DOS NOVOS ESTILOS ---> */

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
  .word-display {
      font-size: 2em;
      letter-spacing: 3px;
      gap: 3px;
  }
}

.guessing-message {
  font-size: 1.5em;
  font-weight: bold;
  color: #34495e;
}
</style>