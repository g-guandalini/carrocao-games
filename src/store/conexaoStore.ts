// src/store/conexaoStore.ts
import { reactive, watch } from 'vue';
import { ConexaoGameState, TeamColor, Conexao, GameStatus, Category } from '../types'; 
import { addToast } from './toastStore';
import { scoreStore, fetchScores, updateScore } from './scoreStore'; // scoreStore é compartilhado

const API_BASE_URL = 'http://localhost:3001';
const LOCAL_STORAGE_PLAYED_CONEXOES_KEY = 'conexaoGamePlayedConexoes';
const LOCAL_STORAGE_CURRENT_CONEXAO_ROUND_STATE_KEY = 'conexaoCurrentRoundState';
const LOCAL_STORAGE_SELECTED_CONEXAO_CATEGORIES_KEY = 'conexaoSelectedCategories';

interface SavedConexaoRoundState {
  currentRoundConexaoId: string | null;
  revealedLettersCount: number; // Agora salva a contagem de letras reveladas
  revealedLettersIndices: number[]; // Indices das letras reveladas
  gameStatus: GameStatus;
  activeTeam: TeamColor | null;
  selectedCategoryIds: number[]; 
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

function saveSelectedConexaoCategoryIds(ids: number[]) { 
    try {
        localStorage.setItem(LOCAL_STORAGE_SELECTED_CONEXAO_CATEGORIES_KEY, JSON.stringify(ids));
    } catch (e) {
        console.error('Erro ao salvar IDs de categorias selecionadas para Conexão no localStorage:', e);
    }
}

function loadSelectedConexaoCategoryIds(): number[] { 
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SELECTED_CONEXAO_CATEGORIES_KEY);
        const ids = stored ? JSON.parse(stored) : [];
        return ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
    } catch (e) {
        console.error('Erro ao carregar IDs de categorias selecionadas para Conexão do localStorage:', e);
        return [];
    }
}

function saveCurrentConexaoRoundStateToLocalStorage() {
  if (conexaoStore.currentRoundConexao && 
      conexaoStore.gameStatus !== 'finished' && 
      conexaoStore.gameStatus !== 'idle') { 
    const stateToSave: SavedConexaoRoundState = {
      currentRoundConexaoId: conexaoStore.currentRoundConexao.id,
      revealedLettersCount: conexaoStore.revealedLettersCount,
      revealedLettersIndices: Array.from(conexaoStore.currentRoundConexao.revealedLetters || new Set()), // Salva os índices
      gameStatus: conexaoStore.gameStatus,
      activeTeam: conexaoStore.activeTeam,
      selectedCategoryIds: conexaoStore.selectedCategoryIds,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_CONEXAO_ROUND_STATE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Erro ao salvar estado da rodada atual de Conexão no localStorage:', e);
    }
  } else {
    clearCurrentConexaoRoundStateFromLocalStorage();
  }
}

function loadCurrentConexaoRoundStateFromLocalStorage(): SavedConexaoRoundState | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_CURRENT_CONEXAO_ROUND_STATE_KEY);
    const state = stored ? JSON.parse(stored) : null;
    if (state && state.selectedCategoryIds) {
        state.selectedCategoryIds = state.selectedCategoryIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
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
});

const initialState: ConexaoGameState = { // Usa ConexaoGameState
  ...initialConexaoRoundStateDefaults(),
  conexoes: [],
  isLoadingConexoes: false,
  playedConexaoIds: loadPlayedConexaoIds(),
  selectedCategoryIds: loadSelectedConexaoCategoryIds(), 
};

export const conexaoStore = reactive<ConexaoGameState>({ ...initialState });

let revealImageTimer: number | null = null; // Timer para a imagem (1 minuto)
let revealLetterInterval: number | null = null; // Intervalo para revelar letras (a cada 6s)

const REVEAL_IMAGE_DURATION_MS = 60000; // 1 minuto
const REVEAL_LETTER_STEP_MS = 6000; // 6 segundos

// Interface para a resposta da API de Conexão
interface ApiConexaoResponse { 
  id: number;
  palavra: string;
  imageUrl: string;
  order_idx: number | null;
  categories: Category[]; 
}

export async function fetchConexoes(categoryIds: number[] = conexaoStore.selectedCategoryIds): Promise<void> { 
    conexaoStore.isLoadingConexoes = true;
    try {
      let url = `${API_BASE_URL}/api/conexao`; // Ajustado para a rota de jogo
      // Garante que categoryIds é um array e filtra valores nulos/undefined se houver
      const actualCategoryIds = categoryIds?.filter(id => id != null) || []; 
  
      if (actualCategoryIds.length > 0) {
        url += `?categoryIds=${actualCategoryIds.join(',')}`;
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
        revealedLetters: new Set<number>(), // Inicializa um Set vazio para cada conexão
      }));
      
    } catch (error) {
      console.error('[FetchConexoes] Falha ao buscar conexões:', error);
      addToast('Erro ao carregar conexões do servidor!', 'error');
      conexaoStore.conexoes = [];
    } finally {
      conexaoStore.isLoadingConexoes = false;
    }
  }

export function setSelectedConexaoCategories(ids: number[]) { 
    conexaoStore.selectedCategoryIds = ids;
    saveSelectedConexaoCategoryIds(ids);
    conexaoStore.playedConexaoIds = [];
    savePlayedConexaoIds([]);
}

function pickNextConexaoId(): string | null {
  let availableConexoes = conexaoStore.conexoes.filter(
    (con) => !conexaoStore.playedConexaoIds.includes(con.id)
  );
  
  if (availableConexoes.length === 0) {
    conexaoStore.playedConexaoIds = [];
    savePlayedConexaoIds([]);
    availableConexoes = conexaoStore.conexoes; 
    addToast('Todas as conexões das categorias selecionadas foram jogadas. Reiniciando a lista para novas rodadas.', 'info');
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

  addToast('Nenhuma conexão disponível para o jogo nas categorias selecionadas.', 'error');
  return null;
}

async function startNewCleanConexaoRound() {
  stopConexaoTimers();
  Object.assign(conexaoStore, initialConexaoRoundStateDefaults());
  clearCurrentConexaoRoundStateFromLocalStorage();

  await fetchConexoes(); 

  if (conexaoStore.conexoes.length === 0) {
    addToast('Não foi possível iniciar a rodada: nenhuma conexão carregada com as categorias selecionadas. Verifique as categorias ou o servidor!', 'error');
    conexaoStore.gameStatus = 'idle';
    return;
  }

  const nextConexaoId = pickNextConexaoId();
  if (nextConexaoId) {
    const nextConexao = conexaoStore.conexoes.find(con => con.id === nextConexaoId);
    if (nextConexao) {
      conexaoStore.currentRoundConexao = nextConexao;
      conexaoStore.gameStatus = 'revealing'; // Começa diretamente revelando letras
      startImageAndLetterRevelation(); // Inicia os timers
      saveCurrentConexaoRoundStateToLocalStorage();
    } else {
      addToast('Erro interno: Conexão escolhida não encontrada na lista (após seleção de ID).', 'error');
      conexaoStore.gameStatus = 'idle';
      clearCurrentConexaoRoundStateFromLocalStorage();
    }
  } else {
    addToast('Não foi possível selecionar uma conexão para a rodada com as categorias atuais.', 'error');
    conexaoStore.gameStatus = 'idle';
    clearCurrentConexaoRoundStateFromLocalStorage();
  }
}

export async function initializeConexaoGame() { 
  await fetchConexoes();

  if (!scoreStore.isLoadingScores) {
    await fetchScores(); 
  }

  const savedRoundState = loadCurrentConexaoRoundStateFromLocalStorage();
  
  const areCategoriesTheSame = savedRoundState && 
                               savedRoundState.selectedCategoryIds.length === conexaoStore.selectedCategoryIds.length &&
                               savedRoundState.selectedCategoryIds.every((id, index) => id === conexaoStore.selectedCategoryIds[index]);

  if (savedRoundState && savedRoundState.currentRoundConexaoId && 
      savedRoundState.gameStatus !== 'finished' && savedRoundState.gameStatus !== 'idle' &&
      areCategoriesTheSame
      ) {
    const prevConexao = conexaoStore.conexoes.find(con => con.id === savedRoundState.currentRoundConexaoId);
    if (prevConexao) {
      // Reconstitui o Set de letras reveladas a partir dos índices salvos
      prevConexao.revealedLetters = new Set(savedRoundState.revealedLettersIndices || []);

      conexaoStore.currentRoundConexao = prevConexao;
      conexaoStore.revealedLettersCount = savedRoundState.revealedLettersCount;
      conexaoStore.gameStatus = savedRoundState.gameStatus;
      conexaoStore.activeTeam = savedRoundState.activeTeam;

      // Se o jogo estava em revelação, retoma os timers
      if (conexaoStore.gameStatus === 'revealing') {
        startImageAndLetterRevelation(true); // 'true' para retomar o estado salvo
      }
    } else {
      clearCurrentConexaoRoundStateFromLocalStorage(); 
      await startNewCleanConexaoRound();
    }
  } else {
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
    if (palavra[i] !== ' ' && !currentRevealed.has(i)) { // Ignora espaços e já reveladas
      unrevealedIndices.push(i);
    }
  }

  if (unrevealedIndices.length > 0) {
    const randomIndex = Math.floor(Math.random() * unrevealedIndices.length);
    const indexToReveal = unrevealedIndices[randomIndex];
    currentRevealed.add(indexToReveal);
    conexaoStore.revealedLettersCount = currentRevealed.size; // Atualiza a contagem
    conexaoStore.currentRoundConexao.revealedLetters = currentRevealed; // Atualiza o Set reativamente

    saveCurrentConexaoRoundStateToLocalStorage();

    // Verifica se todas as letras foram reveladas
    const totalLetters = palavra.replace(/ /g, '').length;
    if (currentRevealed.size >= totalLetters) {
        stopConexaoTimers();
        conexaoStore.gameStatus = 'finished';
        addToast(`Todas as letras foram reveladas! Resposta: <strong>${palavra}</strong>`, 'info');
        clearCurrentConexaoRoundStateFromLocalStorage();
    }
  } else {
    // Todas as letras já foram reveladas ou não há letras para revelar
    stopConexaoTimers();
    conexaoStore.gameStatus = 'finished';
    addToast(`Todas as letras foram reveladas! Resposta: <strong>${palavra}</strong>`, 'info');
    clearCurrentConexaoRoundStateFromLocalStorage();
  }
}


export function startImageAndLetterRevelation(resuming: boolean = false) { 
  if (!conexaoStore.currentRoundConexao) {
    addToast('Erro: Nenhuma conexão selecionada para iniciar a revelação.', 'error');
    return;
  }
  stopConexaoTimers(); // Limpa timers existentes

  conexaoStore.gameStatus = 'revealing';

  // --- Timer principal para a imagem (1 minuto) ---
  revealImageTimer = setTimeout(() => {
    stopConexaoTimers();
    conexaoStore.gameStatus = 'finished';
    addToast(`Tempo esgotado para a imagem! Resposta: <strong>${conexaoStore.currentRoundConexao?.palavra}</strong>`, 'info');
    clearCurrentConexaoRoundStateFromLocalStorage();
  }, REVEAL_IMAGE_DURATION_MS) as unknown as number;

  // --- Intervalo para revelar letras (a cada 6 segundos) ---
  // Revela uma letra imediatamente se não estiver retomando o jogo
  if (!resuming) {
    revealRandomLetter();
  }
  revealLetterInterval = setInterval(revealRandomLetter, REVEAL_LETTER_STEP_MS) as unknown as number;
}


export function selectConexaoTeam(team: TeamColor) {
  if (conexaoStore.gameStatus === 'revealing') {
    stopConexaoTimers(); // Para os timers quando um time palpitar
    conexaoStore.activeTeam = team;
    conexaoStore.gameStatus = 'guessing';
    saveCurrentConexaoRoundStateToLocalStorage(); 
    addToast(`Equipe <strong>${team}</strong> irá palpitar!`, 'info');
  } else {
    console.warn('--- [selectConexaoTeam] Tentativa de selecionar equipe em gameStatus inválido:', conexaoStore.gameStatus);
  }
}

export async function handleOperatorConexaoFeedback(isCorrect: boolean, scoreAwarded: number) {
  if (!conexaoStore.activeTeam || !conexaoStore.currentRoundConexao) {
    console.warn("Feedback do operador de Conexão recebido em um estado inválido ou sem time ativo.");
    return;
  }

  let finalScore = 0;
  if (isCorrect) {
    // Calcula a pontuação: 10 pontos por letra, menos 10 por cada letra revelada
    const palavra = conexaoStore.currentRoundConexao.palavra.replace(/ /g, ''); // Ignora espaços
    const totalLetters = palavra.length;
    const revealedLetters = conexaoStore.revealedLettersCount; // Contagem já considera apenas letras não-espaço

    finalScore = Math.max(0, (totalLetters * 10) - (revealedLetters * 10)); // Garante pontuação mínima de 0

    await updateScore(conexaoStore.activeTeam, finalScore);
    addToast(`🎉 Equipe <strong>${conexaoStore.activeTeam}</strong> acertou! Ganhou <strong>${finalScore}</strong> pontos!`, 'success');
  } else {
    addToast(`❌ Equipe <strong>${conexaoStore.activeTeam}</strong> errou! A resposta correta era: <strong>${conexaoStore.currentRoundConexao.palavra}</strong>.`, 'error');
  }
  
  stopConexaoTimers(); // Garante que os timers param
  conexaoStore.gameStatus = 'finished';
  conexaoStore.activeTeam = null;

  if (conexaoStore.currentRoundConexao) {
    conexaoStore.playedConexaoIds.push(conexaoStore.currentRoundConexao.id);
    savePlayedConexaoIds(conexaoStore.playedConexaoIds);
  }
  clearCurrentConexaoRoundStateFromLocalStorage(); 
}

export function viewConexaoScoreboard() {
  conexaoStore.gameStatus = 'scoreboard';
}

export async function resetConexaoGameScores() { 
    stopConexaoTimers();
    Object.assign(conexaoStore, initialConexaoRoundStateDefaults());
    conexaoStore.playedConexaoIds = [];
    savePlayedConexaoIds([]);
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
    if (newVal !== oldVal) { 
        saveCurrentConexaoRoundStateToLocalStorage();
    }
}, { deep: true }); // Watch profundo para alterações em revealedLetters