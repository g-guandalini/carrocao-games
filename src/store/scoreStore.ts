// src/store/scoreStore.ts
import { reactive } from 'vue';
import { TeamColor, ScoreState, Score } from '../types'; // Precisaremos ajustar types.ts


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Estado inicial das pontuações (pode ser preenchido pela API)
const initialScoreState: ScoreState = {
  score: {
    [TeamColor.BLUE]: 0,
    [TeamColor.RED]: 0,
    [TeamColor.GREEN]: 0,
    [TeamColor.YELLOW]: 0,
  },
  isLoadingScores: false,
};

// A store reativa para as pontuações
export const scoreStore = reactive<ScoreState>({ ...initialScoreState });

/**
 * Busca as pontuações do backend e atualiza a store.
 */
export async function fetchScores() {
  scoreStore.isLoadingScores = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/scores`);
    if (!response.ok) {
      throw new Error(`Erro HTTP ao buscar pontuações: ${response.status}`);
    }
    const scores = await response.json();
    // Atualiza o objeto score na store com os dados do backend
    scoreStore.score = scores;
    console.log('Scores carregados do banco de dados:', scores);
  } catch (error) {
    console.error('Falha ao buscar scores:', error);
    
  } finally {
    scoreStore.isLoadingScores = false;
  }
}

/**
 * Atualiza a pontuação de um time no backend e localmente.
 * @param team A cor do time.
 * @param pointsToAdd Os pontos a serem adicionados.
 */
export async function updateScore(team: TeamColor, pointsToAdd: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scores/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team: team, pointsToAdd: pointsToAdd }),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ao atualizar pontuação: ${response.status}`);
    }
    // const result = await response.json(); // Se precisar do feedback do servidor

    // Atualiza o frontend após sucesso da API
    scoreStore.score[team] += pointsToAdd;
  } catch (error) {
    console.error('Falha ao atualizar pontuação no backend:', error);
  }
}

/**
 * Reseta todas as pontuações para zero no backend e localmente.
 */
export async function resetScores() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scores/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ao resetar pontuações: ${response.status}`);
    }
    // const result = await response.json(); // Se precisar do feedback do servidor

    // Reset frontend state only after successful backend reset
    scoreStore.score = { ...initialScoreState.score }; // Zera os scores locais
  } catch (error) {
    console.error('Falha ao resetar pontuações no backend:', error);
    
  }
}

// Chamada inicial para carregar as pontuações quando a store é criada
fetchScores();