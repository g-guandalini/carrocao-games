// src/store/imagemOcultaStore.ts
import { reactive } from 'vue';
import { GameState, TeamColor, Character, GameStatus } from '../types';
import { addToast } from './toastStore';
import { scoreStore, fetchScores, updateScore, resetScores } from './scoreStore';

const API_BASE_URL = 'http://localhost:3001'; // A URL do seu backend

const initialRoundState = () => ({
  currentRoundCharacter: null as Character | null,
  revealProgress: 0,
  gameStatus: 'idle' as GameStatus,
  activeTeam: null as TeamColor | null,
});

const initialState: GameState = {
  ...initialRoundState(),
  characters: [],
  isLoadingCharacters: false,
};

export const imagemOcultaStore = reactive<GameState>({ ...initialState });

let revealInterval: number | null = null;
const REVEAL_DURATION_MS = 30000;
const REVEAL_STEP_MS = 100;

// Variável para armazenar a Promise da requisição de personagens em andamento.
// Isso evita múltiplos fetches simultâneos e permite que outros aguardem.
let charactersFetchPromise: Promise<void> | null = null;

export async function fetchCharacters(): Promise<void> {
  // Se já houver uma requisição em andamento, retorna a Promise existente para ser aguardada.
  if (charactersFetchPromise) {
    return charactersFetchPromise;
  }

  // Cria uma nova Promise para a requisição e a armazena.
  charactersFetchPromise = (async () => {
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
    } catch (error) {
      console.error('Falha ao buscar personagens:', error);
      addToast('Erro ao carregar personagens do servidor!', 'error');
      // Se a busca falhar, garante que o array de characters esteja vazio para futuras tentativas
      imagemOcultaStore.characters = []; // Limpa para forçar nova tentativa ou indicar falha
    } finally {
      imagemOcultaStore.isLoadingCharacters = false;
      charactersFetchPromise = null; // Limpa a Promise assim que a requisição é concluída (sucesso ou falha)
    }
  })(); // Invoca a função assíncrona imediatamente

  return charactersFetchPromise; // Retorna a Promise da requisição
}

function pickRandomCharacter(): Character {
  if (imagemOcultaStore.characters.length === 0) {
    // Este caso não deve mais ser atingido se fetchCharacters() funcionar e for aguardado.
    // Mas é bom manter como fallback para robustez em caso de falha completa.
    addToast('Nenhum personagem disponível para o jogo.', 'error');
    return { id: 'error', name: 'Erro de Carregamento', imageUrl: '', hint: 'Tente recarregar a página.' };
  }

  const availableCharacters = imagemOcultaStore.characters.filter(
    (char) => char.id !== imagemOcultaStore.currentRoundCharacter?.id
  );

  // Se todos os personagens já foram usados em rodadas anteriores, reinicia a lista
  if (availableCharacters.length === 0) {
    addToast('Todos os personagens foram jogados! Reiniciando a lista de seleção.', 'info');
    // Você pode querer uma lógica mais sofisticada aqui, como uma lista de personagens já jogados.
    // Por enquanto, apenas seleciona um aleatório de toda a lista de novo.
    return imagemOcultaStore.characters[Math.floor(Math.random() * imagemOcultaStore.characters.length)];
  }
  return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
}

export async function startNewRound() {
  stopReveal();
  Object.assign(imagemOcultaStore, initialRoundState());

  // Garante que os personagens sejam carregados antes de prosseguir.
  // Isso irá aguardar uma requisição em andamento ou iniciar uma nova e aguardá-la.
  await fetchCharacters();
  
  // Chama o fetchScores da scoreStore global
  if (!scoreStore.isLoadingScores) {
    await fetchScores(); 
  }
  
  // Agora, verifica se os personagens foram realmente carregados APÓS o await de fetchCharacters().
  if (imagemOcultaStore.characters.length > 0) {
    imagemOcultaStore.currentRoundCharacter = pickRandomCharacter();
    imagemOcultaStore.gameStatus = 'hint';
  } else {
    // Se ainda estiver vazio, significa que fetchCharacters() falhou (e já mostrou um toast de erro).
    addToast('Não foi possível iniciar a rodada: nenhum personagem carregado. Verifique o servidor!', 'error');
    imagemOcultaStore.gameStatus = 'idle'; // Mantém o jogo em estado ocioso
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

export async function handleOperatorFeedback(isCorrect: boolean, scoreAwarded: number) {
  if (!imagemOcultaStore.activeTeam || !imagemOcultaStore.currentRoundCharacter) {
    console.warn("Feedback do operador recebido em um estado inválido ou sem time ativo.");
    return;
  }

  if (isCorrect) {
    // Chama a função de atualização de pontos da scoreStore global
    await updateScore(imagemOcultaStore.activeTeam, scoreAwarded);
    addToast(`🎉 Equipe <strong>${imagemOcultaStore.activeTeam}</strong> acertou! Ganhou <strong>${scoreAwarded}</strong> pontos!`, 'success');
  } else {
    addToast(`❌ Equipe <strong>${imagemOcultaStore.activeTeam}</strong> errou! A resposta correta era: <strong>${imagemOcultaStore.currentRoundCharacter.name}</strong>.`, 'error');
  }
  
  imagemOcultaStore.revealProgress = 1; // Garante que a imagem esteja totalmente revelada
  imagemOcultaStore.gameStatus = 'finished';
  imagemOcultaStore.activeTeam = null;
}

export function viewScoreboard() {
  imagemOcultaStore.gameStatus = 'scoreboard';
}

// A função resetGameScores da ImagemOcultaStore agora chama a função resetScores da scoreStore
export async function resetGameScores() {
    stopReveal();
    await resetScores(); // Chama a função de reset global
    // Reseta o estado específico da ImagemOcultaStore
    Object.assign(imagemOcultaStore, initialRoundState()); 
    imagemOcultaStore.gameStatus = 'idle'; // Garante que o estado seja idle após o reset
}

// REMOVIDO: A chamada inicial a fetchCharacters(); foi removida daqui.
// O `startNewRound` no ImagemOcultaView.vue (chamado via onMounted) agora cuida de iniciar
// o carregamento de personagens quando a página é acessada.