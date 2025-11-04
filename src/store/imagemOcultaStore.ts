// src/store/imagemOcultaStore.ts
import { reactive, watch } from 'vue';
import { GameState, TeamColor, Character, GameStatus } from '../types';
import { addToast } from './toastStore';
import { scoreStore, fetchScores, updateScore, resetScores } from './scoreStore';

const API_BASE_URL = 'http://localhost:3001'; // A URL do seu backend
const LOCAL_STORAGE_PLAYED_CHARS_KEY = 'imagemOcultaGamePlayedChars';
const LOCAL_STORAGE_CURRENT_ROUND_STATE_KEY = 'imagemOcultaCurrentRoundState';

interface SavedRoundState {
  currentRoundCharacterId: string | null;
  revealProgress: number;
  gameStatus: GameStatus;
  activeTeam: TeamColor | null;
}

// --- Funções auxiliares para localStorage ---
function savePlayedCharacterIds(ids: string[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PLAYED_CHARS_KEY, JSON.stringify(ids));
    
  } catch (e) {
    console.error('Erro ao salvar IDs de personagens jogados no localStorage:', e);
  }
}

function loadPlayedCharacterIds(): string[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_PLAYED_CHARS_KEY);
    const ids = stored ? JSON.parse(stored) : [];
    
    return ids;
  } catch (e) {
    console.error('Erro ao carregar IDs de personagens jogados do localStorage:', e);
    return [];
  }
}

function saveCurrentRoundStateToLocalStorage() {
  // Só salva se houver um currentRoundCharacter e o gameStatus NÃO for 'finished' ou 'idle'
  // Pois 'finished' e 'idle' indicam que a rodada não está mais "ativa" ou "em andamento" para ser restaurada.
  if (imagemOcultaStore.currentRoundCharacter && 
      imagemOcultaStore.gameStatus !== 'finished' && 
      imagemOcultaStore.gameStatus !== 'idle') { 
    const stateToSave: SavedRoundState = {
      currentRoundCharacterId: imagemOcultaStore.currentRoundCharacter.id,
      revealProgress: imagemOcultaStore.revealProgress,
      gameStatus: imagemOcultaStore.gameStatus,
      activeTeam: imagemOcultaStore.activeTeam,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_ROUND_STATE_KEY, JSON.stringify(stateToSave));
      
    } catch (e) {
      console.error('Erro ao salvar estado da rodada atual no localStorage:', e);
    }
  } else {
    // Se não deve ser salvo, garante que seja limpo para evitar estados inconsistentes.
    clearCurrentRoundStateFromLocalStorage();
  }
}

function loadCurrentRoundStateFromLocalStorage(): SavedRoundState | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_CURRENT_ROUND_STATE_KEY);
    const state = stored ? JSON.parse(stored) : null;
    
    return state;
  } catch (e) {
    console.error('Erro ao carregar estado da rodada atual do localStorage:', e);
    return null;
  }
}

function clearCurrentRoundStateFromLocalStorage() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_CURRENT_ROUND_STATE_KEY);
    
  } catch (e) {
    console.error('Erro ao limpar estado da rodada atual do localStorage:', e);
  }
}
// --- Fim das funções auxiliares ---

const initialRoundStateDefaults = () => ({
  currentRoundCharacter: null as Character | null,
  revealProgress: 0,
  gameStatus: 'idle' as GameStatus,
  activeTeam: null as TeamColor | null,
});

const initialState: GameState = {
  ...initialRoundStateDefaults(),
  characters: [],
  isLoadingCharacters: false,
  playedCharacterIds: loadPlayedCharacterIds(),
};

export const imagemOcultaStore = reactive<GameState>({ ...initialState });

let revealInterval: number | null = null;
const REVEAL_DURATION_MS = 30000;
const REVEAL_STEP_MS = 100;

let charactersFetchPromise: Promise<void> | null = null;

interface ApiCharacterResponse {
  id: number;
  answer: string;
  imageUrl: string;
  hint: string;
  order_idx: number | null;
}

export async function fetchCharacters(): Promise<void> {
  
  if (charactersFetchPromise) {
    
    return charactersFetchPromise;
  }

  charactersFetchPromise = (async () => {
    imagemOcultaStore.isLoadingCharacters = true;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/imagem-oculta`);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data: ApiCharacterResponse[] = await response.json();
      
      imagemOcultaStore.characters = data.map(char => ({
        id: String(char.id),
        name: char.answer,
        imageUrl: char.imageUrl,
        hint: char.hint,
        order_idx: char.order_idx,
      }));
      
      
    } catch (error) {
      console.error('[FetchCharacters] Falha ao buscar personagens:', error);
      addToast('Erro ao carregar personagens do servidor!', 'error');
      imagemOcultaStore.characters = [];
    } finally {
      imagemOcultaStore.isLoadingCharacters = false;
      charactersFetchPromise = null;
      
    }
  })();

  return charactersFetchPromise;
}

function pickNextCharacterId(): string | null {

  let availableCharacters = imagemOcultaStore.characters.filter(
    (char) => !imagemOcultaStore.playedCharacterIds.includes(char.id)
  );
  

  if (availableCharacters.length === 0) {
    imagemOcultaStore.playedCharacterIds = [];
    savePlayedCharacterIds([]);
    availableCharacters = imagemOcultaStore.characters;
    
  }

  const orderedAvailable = availableCharacters
    .filter(char => char.order_idx !== null && char.order_idx !== undefined)
    .sort((a, b) => a.order_idx! - b.order_idx!);
  

  if (orderedAvailable.length > 0) {
    
    return orderedAvailable[0].id;
  }

  const unorderedAvailable = availableCharacters
    .filter(char => char.order_idx === null || char.order_idx === undefined);
  

  if (unorderedAvailable.length > 0) {
    const randomIndex = Math.floor(Math.random() * unorderedAvailable.length);
    
    return unorderedAvailable[randomIndex].id;
  }

  addToast('Nenhum personagem disponível para o jogo, mesmo após tentar reiniciar.', 'error');
  
  return null;
}

/** Inicia uma rodada completamente nova, limpando qualquer estado anterior. */
async function startNewCleanRound() {
  
  stopReveal();
  Object.assign(imagemOcultaStore, initialRoundStateDefaults()); // Reseta o estado da rodada na store
  clearCurrentRoundStateFromLocalStorage(); // Garante que o localStorage esteja limpo

  await fetchCharacters();

  if (imagemOcultaStore.characters.length === 0) {
    addToast('Não foi possível iniciar a rodada: nenhum personagem carregado. Verifique o servidor!', 'error');
    imagemOcultaStore.gameStatus = 'idle';
    
    return;
  }

  const nextCharacterId = pickNextCharacterId();
  if (nextCharacterId) {
    const nextCharacter = imagemOcultaStore.characters.find(char => char.id === nextCharacterId);
    if (nextCharacter) {
      imagemOcultaStore.currentRoundCharacter = nextCharacter;
      imagemOcultaStore.gameStatus = 'hint';
      saveCurrentRoundStateToLocalStorage(); // Salva o estado inicial da nova rodada
      
    } else {
      addToast('Erro interno: Personagem escolhido não encontrado na lista (após seleção de ID).', 'error');
      imagemOcultaStore.gameStatus = 'idle';
      clearCurrentRoundStateFromLocalStorage();
      
    }
  } else {
    addToast('Não foi possível selecionar um personagem para a rodada.', 'error');
    imagemOcultaStore.gameStatus = 'idle';
    clearCurrentRoundStateFromLocalStorage();
    
  }
  
}

/**
 * Funçao chamada no onMounted do GameView.vue para inicializar o jogo
 * ou restaurar uma rodada em andamento.
 */
export async function initializeGame() {
  
  await fetchCharacters(); // Garanta que a lista de personagens está carregada

  // Sempre busca as pontuações atualizadas
  if (!scoreStore.isLoadingScores) {
    await fetchScores(); 
  }

  const savedRoundState = loadCurrentRoundStateFromLocalStorage();
  

  // Tenta restaurar a rodada anterior APENAS se houver um estado salvo e a rodada não estava 'finished'
  // Nota: o 'scoreboard' também é um estado de finalização para fins de restauração aqui.
  if (savedRoundState && savedRoundState.currentRoundCharacterId && 
      savedRoundState.gameStatus !== 'finished' && savedRoundState.gameStatus !== 'idle') { // Adicionado 'idle' aqui
    const prevChar = imagemOcultaStore.characters.find(char => char.id === savedRoundState.currentRoundCharacterId);
    if (prevChar) {
      imagemOcultaStore.currentRoundCharacter = prevChar;
      imagemOcultaStore.revealProgress = savedRoundState.revealProgress;
      imagemOcultaStore.gameStatus = savedRoundState.gameStatus;
      imagemOcultaStore.activeTeam = savedRoundState.activeTeam;
      

      if (imagemOcultaStore.gameStatus === 'revealing') {
        
        proceedToReveal();
      }
    } else {
      clearCurrentRoundStateFromLocalStorage(); 
      
      await startNewCleanRound();
    }
  } else {
    
    await startNewCleanRound(); // Inicia uma rodada limpa se não há o que restaurar
  }
  
}


/**
 * Função para iniciar a PRÓXIMA rodada (clique do usuário).
 * SEMPRE inicia uma rodada nova e limpa.
 */
export async function startNextGameRound() {
  
  await startNewCleanRound(); // Sempre chama a lógica de rodada limpa
  
}


export function proceedToReveal() {
  
  if (!imagemOcultaStore.currentRoundCharacter) {
    addToast('Erro: Nenhum personagem selecionado para iniciar a revelação.', 'error');
    console.error('--- [ProceedToReveal] ERRO: currentRoundCharacter é null. ---');
    return;
  }
  stopReveal(); 

  imagemOcultaStore.gameStatus = 'revealing';
  const startTime = Date.now() - (imagemOcultaStore.revealProgress * REVEAL_DURATION_MS); 

  revealInterval = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    imagemOcultaStore.revealProgress = Math.min(elapsedTime / REVEAL_DURATION_MS, 1);
    saveCurrentRoundStateToLocalStorage(); // Salva o progresso a cada passo

    if (imagemOcultaStore.revealProgress >= 1) {
      
      imagemOcultaStore.revealProgress = 1;
      stopReveal(); 
      imagemOcultaStore.gameStatus = 'finished'; 
      if (imagemOcultaStore.currentRoundCharacter) {
        imagemOcultaStore.playedCharacterIds.push(imagemOcultaStore.currentRoundCharacter.id);
        savePlayedCharacterIds(imagemOcultaStore.playedCharacterIds);
        
      }
      clearCurrentRoundStateFromLocalStorage(); 
      addToast(`Tempo esgotado! Resposta: <strong>${imagemOcultaStore.currentRoundCharacter?.name}</strong>`, 'info');
    }
  }, REVEAL_STEP_MS) as unknown as number;
}

export function stopReveal() {
  
  if (revealInterval) {
    clearInterval(revealInterval);
    revealInterval = null;
  }
  // Removido saveCurrentRoundStateToLocalStorage() aqui, pois os watchers ou chamadas explícitas cuidam disso.
}

export function selectTeam(team: TeamColor) {
  
  if (imagemOcultaStore.gameStatus === 'revealing') {
    stopReveal(); 
    imagemOcultaStore.activeTeam = team;
    imagemOcultaStore.gameStatus = 'guessing';
    saveCurrentRoundStateToLocalStorage(); 
    addToast(`Equipe <strong>${team}</strong> irá palpitar!`, 'info');
  } else {
    console.warn('--- [SelectTeam] Tentativa de selecionar equipe em gameStatus inválido:', imagemOcultaStore.gameStatus);
  }
}

export async function handleOperatorFeedback(isCorrect: boolean, scoreAwarded: number) {
  
  if (!imagemOcultaStore.activeTeam || !imagemOcultaStore.currentRoundCharacter) {
    console.warn("Feedback do operador recebido em um estado inválido ou sem time ativo.");
    return;
  }

  if (isCorrect) {
    await updateScore(imagemOcultaStore.activeTeam, scoreAwarded);
    addToast(`🎉 Equipe <strong>${imagemOcultaStore.activeTeam}</strong> acertou! Ganhou <strong>${scoreAwarded}</strong> pontos!`, 'success');
  } else {
    addToast(`❌ Equipe <strong>${imagemOcultaStore.activeTeam}</strong> errou! A resposta correta era: <strong>${imagemOcultaStore.currentRoundCharacter.name}</strong>.`, 'error');
  }
  
  imagemOcultaStore.revealProgress = 1;
  imagemOcultaStore.gameStatus = 'finished';
  imagemOcultaStore.activeTeam = null;

  if (imagemOcultaStore.currentRoundCharacter) {
    imagemOcultaStore.playedCharacterIds.push(imagemOcultaStore.currentRoundCharacter.id);
    savePlayedCharacterIds(imagemOcultaStore.playedCharacterIds);
    
  }
  clearCurrentRoundStateFromLocalStorage(); 
  
}

export function viewScoreboard() {
  
  imagemOcultaStore.gameStatus = 'scoreboard';
  // A chamada para saveCurrentRoundStateToLocalStorage() será feita pelo watcher de gameStatus.
}

export async function resetGameScores() {
    
    stopReveal();
    await resetScores();
    Object.assign(imagemOcultaStore, initialRoundStateDefaults());
    imagemOcultaStore.playedCharacterIds = [];
    savePlayedCharacterIds([]);
    clearCurrentRoundStateFromLocalStorage(); 
    imagemOcultaStore.gameStatus = 'idle';
    
}

// === Watchers para persistência (revisados) ===
// Watchers agora são mais seletivos sobre quando salvar.

// Monitora o gameStatus
watch(() => imagemOcultaStore.gameStatus, (newVal, oldVal) => {
  if (newVal !== oldVal) { 
    
    // A decisão de salvar ou limpar está encapsulada em saveCurrentRoundStateToLocalStorage()
    saveCurrentRoundStateToLocalStorage(); 
  }
});

// Monitora o activeTeam
watch(() => imagemOcultaStore.activeTeam, (newVal, oldVal) => {
  if (newVal !== oldVal) { 
    
    saveCurrentRoundStateToLocalStorage();
  }
});

// Monitora o currentRoundCharacter
watch(() => imagemOcultaStore.currentRoundCharacter, (newVal, oldVal) => {
    if (newVal !== oldVal) { 
        
        // A decisão de salvar ou limpar está encapsulada em saveCurrentRoundStateToLocalStorage()
        saveCurrentRoundStateToLocalStorage();
    }
});