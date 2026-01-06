// src/store/scoreStore.ts
import { reactive } from 'vue';
import { TeamColor, ScoreState } from '../types';

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
    // Após a atualização bem-sucedida, busca as pontuações novamente para garantir a sincronia
    await fetchScores(); // MANTIDO AQUI
  } catch (error) {
    console.error('Falha ao atualizar pontuação no backend:', error);
  }
}

/**
 * Define a pontuação de um time para um valor específico no backend e localmente.
 * @param team A cor do time.
 * @param points O valor da pontuação a ser definida.
 */
export async function setScore(team: TeamColor, points: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scores/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team: team, points: points }),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ao definir pontuação: ${response.status}`);
    }
    // Após a definição bem-sucedida, busca as pontuações novamente para garantir a sincronia
    await fetchScores(); // MANTIDO AQUI
  } catch (error) {
    console.error(`Falha ao definir pontuação para o time ${team}:`, error);
  }
}

/**
 * Reseta todas as pontuações para zero no backend e localmente.
 */
export async function resetScores() {
  // Mantendo a caixa de diálogo de confirmação aqui, conforme o comportamento existente.
  if (confirm('Tem certeza que deseja limpar todas as pontuações? Esta ação não pode ser desfeita.')) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scores/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Adicionado para consistência
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ao resetar pontuações: ${response.status}`);
      }
      // Após o reset bem-sucedido no backend, busca as pontuações para refletir o estado atual
      await fetchScores();
    } catch (error) {
      console.error('Falha ao resetar pontuações no backend:', error);
    }
  }
}

// Chamada inicial para carregar as pontuações quando a store é criada
fetchScores();