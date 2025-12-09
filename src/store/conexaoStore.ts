// src/store/conexaoStore.ts
import { reactive, watch, computed } from 'vue';
import { ConexaoGameState, TeamColor, Conexao, GameStatus, Category } from '../types';
import { scoreStore, fetchScores, updateScore } from './scoreStore'; // scoreStore é compartilhado

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LOCAL_STORAGE_PLAYED_CONEXOES_KEY = 'conexaoGamePlayedConexoes';
const LOCAL_STORAGE_CURRENT_CONEXAO_ROUND_STATE_KEY = 'conexaoCurrentRoundState';
// LOCAL_STORAGE_SELECTED_CONEXAO_CATEGORIES_KEY removido, pois a seleção é automática

interface SavedConexaoRoundState {
  currentRoundConexaoId: string | null;
  revealedLettersCount: number;
  revealedLettersIndices: number[];
  gameStatus: GameStatus;
  activeTeam: TeamColor | null;
  // selectedCategoryIds: number[]; // Removido
  activeConexaoCategoryIds: number[]; // Adicionado
  disabledTeams: TeamColor[];
}

// --- Funções auxiliares para localStorage ---
function savePlayedConexaoIds(ids: string[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PLAYED_CONEXOES_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Erro ao salvar IDs de conexões jogadas no localStorage:', e);
  }
}

function loadPlayedConexaoIds(): string[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_PLAYED_CONEXOES_KEY);
    const ids = stored ? JSON.parse(stored) : [];
    return ids;
  } catch (e) {
    console.error('Erro ao carregar IDs de conexões jogadas do localStorage:', e);
    return [];
  }
}

// saveSelectedConexaoCategoryIds e loadSelectedConexaoCategoryIds removidas/não mais usadas
// function saveSelectedConexaoCategoryIds(ids: number[]) {
//     try {
//         localStorage.setItem(LOCAL_STORAGE_SELECTED_CONEXAO_CATEGORIES_KEY, JSON.stringify(ids));
//     } catch (e) {
//         console.error('Erro ao salvar IDs de categorias selecionadas para Conexão no localStorage:', e);
//     }
// }

// function loadSelectedConexaoCategoryIds(): number[] {
//     try {
//         const stored = localStorage.getItem(LOCAL_STORAGE_SELECTED_CONEXAO_CATEGORIES_KEY);
//         const ids = stored ? JSON.parse(stored) : [];
//         return ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
//     } catch (e) {
//         console.error('Erro ao carregar IDs de categorias selecionadas para Conexão do localStorage:', e);
//         return [];
//     }
// }

function saveCurrentConexaoRoundStateToLocalStorage() {
  if (conexaoStore.currentRoundConexao &&
      conexaoStore.gameStatus !== 'finished' &&
      conexaoStore.gameStatus !== 'idle') { // Adicionado check para não salvar idle/finished
    const stateToSave: SavedConexaoRoundState = {
      currentRoundConexaoId: conexaoStore.currentRoundConexao.id,
      revealedLettersCount: conexaoStore.revealedLettersCount,
      revealedLettersIndices: Array.from(conexaoStore.currentRoundConexao.revealedLetters || new Set()),
      gameStatus: conexaoStore.gameStatus,
      activeTeam: conexaoStore.activeTeam,
      activeConexaoCategoryIds: conexaoStore.activeConexaoCategoryIds, // Usando a nova propriedade
      disabledTeams: Array.from(conexaoStore.disabledTeams),
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_CONEXAO_ROUND_STATE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Erro ao salvar estado da rodada atual de Conexão no localStorage:', e);
    }
  } else {
    clearCurrentConexaoRoundStateFromLocalStorage(); // Limpa se o jogo não está ativo
  }
}

function loadCurrentConexaoRoundStateFromLocalStorage(): SavedConexaoRoundState | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_CURRENT_CONEXAO_ROUND_STATE_KEY);
    const state = stored ? JSON.parse(stored) : null;
    // Adaptar para a nova propriedade 'activeConexaoCategoryIds'
    if (state && state.activeConexaoCategoryIds) {
        state.activeConexaoCategoryIds = state.activeConexaoCategoryIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
    }
    if (state && !state.disabledTeams) {
        state.disabledTeams = [];
    }
    return state;
  } catch (e) {
    console.error('Erro ao carregar estado da rodada atual de Conexão do localStorage:', e);
    return null;
  }
}

function clearCurrentConexaoRoundStateFromLocalStorage() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_CURRENT_CONEXAO_ROUND_STATE_KEY);
  } catch (e) {
    console.error('Erro ao limpar estado da rodada atual de Conexão do localStorage:', e);
  }
}
// --- Fim das funções auxiliares ---

const initialConexaoRoundStateDefaults = () => ({
  currentRoundConexao: null as Conexao | null,
  revealedLettersCount: 0,
  gameStatus: 'idle' as GameStatus,
  activeTeam: null as TeamColor | null,
  disabledTeams: new Set<TeamColor>(),
});

const initialState: ConexaoGameState = {
  ...initialConexaoRoundStateDefaults(),
  conexoes: [],
  isLoadingConexoes: false,
  playedConexaoIds: loadPlayedConexaoIds(),
  // selectedCategoryIds removido
  allCategories: [], // Adicionado
  activeConexaoCategoryIds: [], // Adicionado
};

export const conexaoStore = reactive<ConexaoGameState>({ ...initialState });

export const currentRoundPotentialScore = computed(() => {
  if (!conexaoStore.currentRoundConexao || conexaoStore.gameStatus === 'finished' || conexaoStore.gameStatus === 'idle') {
    return 0;
  }
  const palavra = conexaoStore.currentRoundConexao.palavra.replace(/ /g, '');
  const totalLetters = palavra.length;
  const revealedLetters = conexaoStore.revealedLettersCount;
  return Math.max(0, (totalLetters * 10) - (revealedLetters * 10));
});


let revealImageTimer: number | null = null;
let revealLetterInterval: number | null = null;

const REVEAL_IMAGE_DURATION_MS = import.meta.env.VITE_TEMPO_RODADA_CONEXAO;
const REVEAL_LETTER_STEP_MS = import.meta.env.VITE_TEMPO_LETRA_CONEXAO;

interface ApiConexaoResponse {
  id: number;
  palavra: string;
  imageUrl: string;
  order_idx: number | null;
  categories: Category[];
}

// NOVA FUNÇÃO: fetchCategoriesAndDetermineActiveConexao
async function fetchCategoriesAndDetermineActiveConexao(): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/categories`); 
        if (!response.ok) {
            throw new Error(`Erro HTTP ao buscar categorias: ${response.status}`);
        }
        const allFetchedCategories: Category[] = await response.json();
        conexaoStore.allCategories = allFetchedCategories; // Armazena todas as categorias

        let activeIds: number[] = allFetchedCategories
            .filter(cat => cat.conexao_start === 1) // Filtra por conexao_start
            .map(cat => cat.id);

        if (activeIds.length === 0) {
            // Se nenhuma categoria estiver marcada, todas são consideradas ativas
            activeIds = allFetchedCategories.map(cat => cat.id);
            console.log("[ConexaoStore] Nenhuma categoria marcada para iniciar, usando TODAS as categorias.");
        } else {
            console.log("[ConexaoStore] Categorias ativas (conexao_start=1):", activeIds);
        }
        conexaoStore.activeConexaoCategoryIds = activeIds; // Atualiza a store com IDs ativos

    } catch (error) {
        console.error('[fetchCategoriesAndDetermineActiveConexao] Falha ao buscar e determinar categorias ativas:', error);
        conexaoStore.allCategories = [];
        conexaoStore.activeConexaoCategoryIds = [];
    }
}

// fetchConexoes agora usa activeConexaoCategoryIds
export async function fetchConexoes(): Promise<void> { // Removido 'categoryIds' do parâmetro
    conexaoStore.isLoadingConexoes = true;
    try {
      let url = `${API_BASE_URL}/api/conexao`;
      // Usa a nova propriedade da store
      const categoryIdsToUse = conexaoStore.activeConexaoCategoryIds;

      if (categoryIdsToUse.length > 0) {
        url += `?categoryIds=${categoryIdsToUse.join(',')}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data: ApiConexaoResponse[] = await response.json();

      conexaoStore.conexoes = data.map(item => ({
        id: String(item.id),
        palavra: item.palavra,
        imageUrl: item.imageUrl,
        order_idx: item.order_idx,
        revealedLetters: new Set<number>(),
      }));

    } catch (error) {
      console.error('[FetchConexoes] Falha ao buscar conexões:', error);
      
      conexaoStore.conexoes = [];
    } finally {
      conexaoStore.isLoadingConexoes = false;
    }
  }

// setSelectedConexaoCategories removido/não mais usado
// export function setSelectedConexaoCategories(ids: number[]) {
//     conexaoStore.selectedCategoryIds = ids;
//     saveSelectedConexaoCategoryIds(ids);
//     conexaoStore.playedConexaoIds = [];
//     savePlayedConexaoIds([]);
// }

function pickNextConexaoId(): string | null {
  let availableConexoes = conexaoStore.conexoes.filter(
    (con) => !conexaoStore.playedConexaoIds.includes(con.id)
  );

  if (availableConexoes.length === 0) {
    conexaoStore.playedConexaoIds = [];
    savePlayedConexaoIds([]);
    availableConexoes = conexaoStore.conexoes;
    
  }

  const orderedAvailable = availableConexoes
    .filter(con => con.order_idx !== null && con.order_idx !== undefined)
    .sort((a, b) => (a.order_idx || Infinity) - (b.order_idx || Infinity));

  if (orderedAvailable.length > 0) {
    return orderedAvailable[0].id;
  }

  const unorderedAvailable = availableConexoes
    .filter(con => con.order_idx === null || con.order_idx === undefined);

  if (unorderedAvailable.length > 0) {
    const randomIndex = Math.floor(Math.random() * unorderedAvailable.length);
    return unorderedAvailable[randomIndex].id;
  }

  
  return null;
}

async function startNewCleanConexaoRound() {
  stopConexaoTimers();
  Object.assign(conexaoStore, initialConexaoRoundStateDefaults());
  clearCurrentConexaoRoundStateFromLocalStorage();

  await fetchCategoriesAndDetermineActiveConexao(); // NOVO: Busca e determina categorias ativas
  await fetchConexoes(); // Chama fetchConexoes sem parâmetros, pois agora usa a store

  if (conexaoStore.conexoes.length === 0) {
    
    conexaoStore.gameStatus = 'idle';
    console.warn('[ConexaoStore] Não há conexões disponíveis para iniciar o jogo.'); // Adicionado log
    return;
  }

  const nextConexaoId = pickNextConexaoId();
  if (nextConexaoId) {
    const nextConexao = conexaoStore.conexoes.find(con => con.id === nextConexaoId);
    if (nextConexao) {
      conexaoStore.currentRoundConexao = nextConexao;
      conexaoStore.gameStatus = 'revealing';
      startImageAndLetterRevelation(false);
      saveCurrentConexaoRoundStateToLocalStorage();
    } else {
      
      conexaoStore.gameStatus = 'idle';
      clearCurrentConexaoRoundStateFromLocalStorage();
    }
  } else {
    
    conexaoStore.gameStatus = 'idle';
    clearCurrentConexaoRoundStateFromLocalStorage();
  }
}

export async function initializeConexaoGame() {
  await fetchCategoriesAndDetermineActiveConexao(); // NOVO: Busca e determina categorias ativas

  if (!scoreStore.isLoadingScores) {
    await fetchScores();
  }

  const savedRoundState = loadCurrentConexaoRoundStateFromLocalStorage();

  // NOVO: A lógica de verificação de categorias agora usa activeConexaoCategoryIds
  const areCategoriesTheSame = savedRoundState &&
                               savedRoundState.activeConexaoCategoryIds.length === conexaoStore.activeConexaoCategoryIds.length &&
                               savedRoundState.activeConexaoCategoryIds.every((id, index) => id === conexaoStore.activeConexaoCategoryIds[index]);

  if (savedRoundState && savedRoundState.currentRoundConexaoId &&
      savedRoundState.gameStatus !== 'finished' && savedRoundState.gameStatus !== 'idle' && // Adicionado check para não carregar idle/finished
      areCategoriesTheSame
      ) {
    await fetchConexoes(); // Chama fetchConexoes sem parâmetros
    const prevConexao = conexaoStore.conexoes.find(con => con.id === savedRoundState.currentRoundConexaoId);
    if (prevConexao) {
      conexaoStore.currentRoundConexao = { ...prevConexao, revealedLetters: new Set(savedRoundState.revealedLettersIndices || []) };
      conexaoStore.revealedLettersCount = savedRoundState.revealedLettersCount;
      conexaoStore.gameStatus = savedRoundState.gameStatus;
      conexaoStore.activeTeam = savedRoundState.activeTeam;
      conexaoStore.disabledTeams = new Set(savedRoundState.disabledTeams || []);
      conexaoStore.activeConexaoCategoryIds = savedRoundState.activeConexaoCategoryIds; // Restaura as categorias ativas salvas


      if (conexaoStore.gameStatus === 'revealing') {
        startImageAndLetterRevelation(false);
      }
    } else {
      console.warn('[ConexaoStore] Conexão salva não encontrada ou categorias mudaram, iniciando nova rodada.'); // Adicionado log
      clearCurrentConexaoRoundStateFromLocalStorage();
      await startNewCleanConexaoRound();
    }
  } else {
    console.log('[ConexaoStore] Nenhuma rodada salva válida ou categorias diferentes, iniciando nova rodada.'); // Adicionado log
    await startNewCleanConexaoRound();
  }
}

export async function startNextConexaoGameRound() {
  await startNewCleanConexaoRound();
}

function stopConexaoTimers() {
  if (revealImageTimer) {
    clearTimeout(revealImageTimer);
    revealImageTimer = null;
  }
  if (revealLetterInterval) {
    clearInterval(revealLetterInterval);
    revealLetterInterval = null;
  }
}

function revealRandomLetter() {
  if (!conexaoStore.currentRoundConexao || !conexaoStore.currentRoundConexao.palavra) {
    stopConexaoTimers();
    return;
  }

  const palavra = conexaoStore.currentRoundConexao.palavra.toUpperCase();
  const currentRevealed = conexaoStore.currentRoundConexao.revealedLetters || new Set<number>();

  const unrevealedIndices: number[] = [];
  for (let i = 0; i < palavra.length; i++) {
    if (palavra[i] !== ' ' && !currentRevealed.has(i)) {
      unrevealedIndices.push(i);
    }
  }

  if (unrevealedIndices.length > 0) {
    const randomIndex = Math.floor(Math.random() * unrevealedIndices.length);
    const indexToReveal = unrevealedIndices[randomIndex];
    currentRevealed.add(indexToReveal);
    conexaoStore.revealedLettersCount = currentRevealed.size;
    conexaoStore.currentRoundConexao.revealedLetters = currentRevealed;

    saveCurrentConexaoRoundStateToLocalStorage();

    const totalLetters = palavra.replace(/ /g, '').length;
    if (currentRevealed.size >= totalLetters) {
        stopConexaoTimers();
        conexaoStore.gameStatus = 'finished';
        
    }
  } else {
    stopConexaoTimers();
    conexaoStore.gameStatus = 'finished';
    
  }
}


export function startImageAndLetterRevelation(shouldRevealFirstLetterImmediately: boolean = true) {
  if (!conexaoStore.currentRoundConexao) {
    
    return;
  }
  stopConexaoTimers();

  if (conexaoStore.gameStatus !== 'guessing') {
      conexaoStore.gameStatus = 'revealing';
  }

  revealImageTimer = setTimeout(() => {
    stopConexaoTimers();
    conexaoStore.gameStatus = 'finished';
    
  }, REVEAL_IMAGE_DURATION_MS) as unknown as number;

  if (shouldRevealFirstLetterImmediately) {
    revealRandomLetter();
  }
  revealLetterInterval = setInterval(revealRandomLetter, REVEAL_LETTER_STEP_MS) as unknown as number;
}


export function selectConexaoTeam(team: TeamColor) {
  if (conexaoStore.disabledTeams.has(team)) {
      return;
  }

  if (conexaoStore.gameStatus === 'revealing') {
    stopConexaoTimers();
    conexaoStore.activeTeam = team;
    conexaoStore.gameStatus = 'guessing';
    saveCurrentConexaoRoundStateToLocalStorage();
  } else {
    console.warn('--- [selectConexaoTeam] Tentativa de selecionar equipe em gameStatus inválido:', conexaoStore.gameStatus);
  }
}

export async function handleOperatorConexaoFeedback(isCorrect: boolean) {
  if (!conexaoStore.activeTeam || !conexaoStore.currentRoundConexao) {
    console.warn("Feedback do operador de Conexão recebido em um estado inválido ou sem time ativo.");
    return;
  }

  const currentActiveTeam = conexaoStore.activeTeam;

  stopConexaoTimers();

  if (isCorrect) {
    const finalScore = currentRoundPotentialScore.value;

    await updateScore(currentActiveTeam, finalScore);
    

    conexaoStore.gameStatus = 'finished';
    // REMOVIDO: conexaoStore.activeTeam = null; // Esta linha foi removida daqui.

    if (conexaoStore.currentRoundConexao) {
      conexaoStore.playedConexaoIds.push(conexaoStore.currentRoundConexao.id);
      savePlayedConexaoIds(conexaoStore.playedConexaoIds);
    }

  } else { // Equipe errou
    

    conexaoStore.disabledTeams.add(currentActiveTeam);
    conexaoStore.activeTeam = null; // Aqui faz sentido limpar, pois esta equipe não é mais ativa para adivinhar.

    const allTeamColors = Object.values(TeamColor);
    const remainingTeams = allTeamColors.filter(team => !conexaoStore.disabledTeams.has(team));

    if (remainingTeams.length === 0) {
        conexaoStore.disabledTeams.clear(); // Reabilita todas as equipes
        conexaoStore.activeTeam = null;     // Não há equipe ativa
        conexaoStore.gameStatus = 'revealing'; // Retorna ao estado de revelação
        startImageAndLetterRevelation(false); // Reinicia/continua a revelação de letras
    } else {
        // Ainda há equipes aptas, continua a rodada com as equipes desabilitadas atuais.
        conexaoStore.gameStatus = 'revealing';
        startImageAndLetterRevelation(false);
    }
  }
  // Salva o estado após TODAS as modificações na função.
  saveCurrentConexaoRoundStateToLocalStorage();
}

export function viewConexaoScoreboard() {
  conexaoStore.gameStatus = 'scoreboard';
  // ADICIONADO: Limpa o time ativo aqui, depois que o GameConexao já teve a chance de usar.
  conexaoStore.activeTeam = null;
}

export async function resetConexaoGameScores() {
    stopConexaoTimers();
    Object.assign(conexaoStore, initialConexaoRoundStateDefaults());
    conexaoStore.playedConexaoIds = [];
    savePlayedConexaoIds([]);
    conexaoStore.allCategories = []; // Reseta
    conexaoStore.activeConexaoCategoryIds = []; // Reseta
    clearCurrentConexaoRoundStateFromLocalStorage();
    conexaoStore.gameStatus = 'idle';
}

// === Watchers para persistência ===
watch(() => conexaoStore.gameStatus, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    saveCurrentConexaoRoundStateToLocalStorage();
  }
});

watch(() => conexaoStore.activeTeam, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    saveCurrentConexaoRoundStateToLocalStorage();
  }
});

watch(() => conexaoStore.currentRoundConexao, (newVal, oldVal) => {
    // Apenas salva se o ID da conexão mudou ou se o conjunto de letras reveladas mudou
    if (newVal?.id !== oldVal?.id || (newVal?.revealedLetters && oldVal?.revealedLetters && newVal.revealedLetters.size !== oldVal.revealedLetters.size)) {
        saveCurrentConexaoRoundStateToLocalStorage();
    }
}, { deep: true });

watch(() => conexaoStore.disabledTeams, (newVal, oldVal) => {
  const areEqual = newVal.size === oldVal.size &&
                   Array.from(newVal).every(item => oldVal.has(item));
  if (!areEqual) {
    saveCurrentConexaoRoundStateToLocalStorage();
  }
}, { deep: true });

// NOVO WATCHER: Para activeConexaoCategoryIds
watch(() => conexaoStore.activeConexaoCategoryIds, (newVal, oldVal) => {
    // Compara se os arrays são diferentes (IDs ou ordem)
    const arraysAreDifferent = newVal.length !== oldVal.length || !newVal.every((value, index) => value === oldVal[index]);
    if (arraysAreDifferent) {
        saveCurrentConexaoRoundStateToLocalStorage();
    }
}, { deep: true });