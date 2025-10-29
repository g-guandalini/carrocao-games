// src/store/imagemOcultaStore.ts
import { reactive } from 'vue';
import { GameState, TeamColor, Character, GameStatus } from '../types';
import { addToast } from './toastStore';

const API_BASE_URL = 'http://localhost:3001'; // Ajuste se seu backend rodar em outra porta ou domínio

const initialRoundState = () => ({
  currentRoundCharacter: null as Character | null,
  revealProgress: 0,
  gameStatus: 'idle' as GameStatus,
  activeTeam: null as TeamColor | null,
});

const initialState: GameState = {
  ...initialRoundState(),
  score: { // Será preenchido pela API
    [TeamColor.BLUE]: 0,
    [TeamColor.RED]: 0,
    [TeamColor.GREEN]: 0,
    [TeamColor.YELLOW]: 0,
  },
  characters: [],
  isLoadingCharacters: false,
  isLoadingScores: false, // NOVO: Estado de carregamento para as pontuações
};

export const imagemOcultaStore = reactive<GameState>({ ...initialState });

let revealInterval: number | null = null;
const REVEAL_DURATION_MS = 30000;
const REVEAL_STEP_MS = 100;

export async function fetchCharacters() {
  imagemOcultaStore.isLoadingCharacters = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/imagem-oculta/characters`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data = await response.json();
    imagemOcultaStore.characters = data.characters.map((char: any) => ({
      id: String(char.id),
      name: char.answer,
      imageUrl: char.imageUrl,
      hint: char.hint,
    }));
    // addToast('Personagens carregados do banco de dados!', 'success'); // Comentado para evitar toast excessivo
  } catch (error) {
    console.error('Falha ao buscar personagens:', error);
    addToast('Erro ao carregar personagens do servidor!', 'error');
  } finally {
    imagemOcultaStore.isLoadingCharacters = false;
  }
}

// NOVO: Função para buscar as pontuações da API
export async function fetchScores() {
  imagemOcultaStore.isLoadingScores = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/scores`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const scores = await response.json();
    // Atualiza o objeto score na store com os dados do backend
    imagemOcultaStore.score = scores;
    console.log('Scores carregados do banco de dados:', scores);
  } catch (error) {
    console.error('Falha ao buscar scores:', error);
    addToast('Erro ao carregar pontuações do servidor!', 'error');
  } finally {
    imagemOcultaStore.isLoadingScores = false;
  }
}


function pickRandomCharacter(): Character {
  if (imagemOcultaStore.characters.length === 0) {
    addToast('Nenhum personagem disponível para o jogo.', 'error');
    return { id: 'error', name: 'Erro de Carregamento', imageUrl: '', hint: 'Tente recarregar a página.' };
  }

  const availableCharacters = imagemOcultaStore.characters.filter(
    (char) => char.id !== imagemOcultaStore.currentRoundCharacter?.id
  );

  if (availableCharacters.length === 0) {
    addToast('Todos os personagens foram jogados! Reiniciando a lista de seleção.', 'info');
    // Para um jogo real, você pode recarregar de forma mais inteligente ou ter um pool maior.
    return imagemOcultaStore.characters[Math.floor(Math.random() * imagemOcultaStore.characters.length)];
  }
  return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
}

export async function startNewRound() {
  stopReveal();
  Object.assign(imagemOcultaStore, initialRoundState());

  // Garante que os personagens e scores sejam carregados antes de iniciar a rodada
  if (imagemOcultaStore.characters.length === 0 && !imagemOcultaStore.isLoadingCharacters) {
    await fetchCharacters();
  }
  if (!imagemOcultaStore.isLoadingScores) {
    await fetchScores();
  }
  
  if (imagemOcultaStore.characters.length > 0) {
    imagemOcultaStore.currentRoundCharacter = pickRandomCharacter();
    imagemOcultaStore.gameStatus = 'hint';
  } else {
    addToast('Não foi possível iniciar a rodada: nenhum personagem carregado.', 'error');
    imagemOcultaStore.gameStatus = 'idle';
  }
}

export function proceedToReveal() {
  if (!imagemOcultaStore.currentRoundCharacter) {
    addToast('Erro: Nenhum personagem selecionado para iniciar a revelação.', 'error');
    return;
  }
  imagemOcultaStore.gameStatus = 'revealing';
  revealInterval = setInterval(() => {
    imagemOcultaStore.revealProgress += REVEAL_STEP_MS / REVEAL_DURATION_MS;
    if (imagemOcultaStore.revealProgress >= 1) {
      imagemOcultaStore.revealProgress = 1;
      stopReveal();
      imagemOcultaStore.gameStatus = 'finished';
      addToast(`Tempo esgotado! A imagem completa era: <strong>${imagemOcultaStore.currentRoundCharacter?.name}</strong>`, 'info');
    }
  }, REVEAL_STEP_MS) as unknown as number;
}

export function stopReveal() {
  if (revealInterval) {
    clearInterval(revealInterval);
    revealInterval = null;
  }
}

export function selectTeam(team: TeamColor) {
  if (imagemOcultaStore.gameStatus === 'revealing') {
    stopReveal();
    imagemOcultaStore.activeTeam = team;
    imagemOcultaStore.gameStatus = 'guessing';
    addToast(`Equipe <strong>${team}</strong> irá palpitar!`, 'info');
  }
}

// ATUALIZADO: handleOperatorFeedback agora é assíncrono e interage com a API
export async function handleOperatorFeedback(isCorrect: boolean, scoreAwarded: number) {
  if (!imagemOcultaStore.activeTeam || !imagemOcultaStore.currentRoundCharacter) {
    console.warn("Feedback do operador recebido em um estado inválido ou sem time ativo.");
    return;
  }

  if (isCorrect) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scores/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: imagemOcultaStore.activeTeam, pointsToAdd: scoreAwarded }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ao atualizar pontuação: ${response.status}`);
      }
      // Não precisamos do retorno do JSON aqui, apenas confirmamos o sucesso
      // const result = await response.json(); 
      
      // Atualiza o frontend após sucesso da API
      imagemOcultaStore.score[imagemOcultaStore.activeTeam] += scoreAwarded;
      addToast(`�� Equipe <strong>${imagemOcultaStore.activeTeam}</strong> acertou! Ganhou <strong>${scoreAwarded}</strong> pontos!`, 'success');
    } catch (error) {
      console.error('Falha ao atualizar pontuação no backend:', error);
      addToast('Erro ao salvar pontuação no servidor! Tente novamente.', 'error');
    }
  } else {
    addToast(`❌ Equipe <strong>${imagemOcultaStore.activeTeam}</strong> errou! A resposta correta era: <strong>${imagemOcultaStore.currentRoundCharacter.name}</strong>.`, 'error');
  }
  
  imagemOcultaStore.revealProgress = 1;
  imagemOcultaStore.gameStatus = 'finished';
  imagemOcultaStore.activeTeam = null;
}

export function viewScoreboard() {
  imagemOcultaStore.gameStatus = 'scoreboard';
}

// ATUALIZADO: resetGameScores agora é assíncrono e interage com a API
export async function resetGameScores() {
    stopReveal();
    try {
      const response = await fetch(`${API_BASE_URL}/api/scores/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ao resetar pontuações: ${response.status}`);
      }
      // const result = await response.json(); // Se precisar do feedback do servidor
      addToast('Pontuações resetadas no servidor!', 'info');

      // Reset frontend state only after successful backend reset
      Object.assign(imagemOcultaStore.score, initialState.score); // Zera os scores locais
      Object.assign(imagemOcultaStore, initialRoundState()); // Reseta o estado da rodada
      imagemOcultaStore.gameStatus = 'idle';
    } catch (error) {
      console.error('Falha ao resetar pontuações no backend:', error);
      addToast('Erro ao resetar pontuações no servidor! Tente novamente.', 'error');
    }
}

// Chamadas iniciais para carregar personagens e scores quando o store é criado
fetchCharacters();
fetchScores();