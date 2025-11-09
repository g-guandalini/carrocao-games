// src/store/imagemOcultaStore.ts
import { reactive, watch } from 'vue';
import { ImagemOcultaGameState, TeamColor, Character, GameStatus, Category } from '../types';

import { scoreStore, fetchScores, updateScore } from './scoreStore'; // scoreStore é compartilhado

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LOCAL_STORAGE_PLAYED_CHARS_KEY = 'imagemOcultaGamePlayedChars';
const LOCAL_STORAGE_CURRENT_ROUND_STATE_KEY = 'imagemOcultaCurrentRoundState';
const LOCAL_STORAGE_SELECTED_CATEGORIES_KEY = 'imagemOcultaSelectedCategories';

interface SavedRoundState {
  currentRoundCharacterId: string | null;
  revealProgress: number;
  gameStatus: GameStatus;
  activeTeam: TeamColor | null;
  selectedCategoryIds: number[];
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

function saveSelectedCategoryIds(ids: number[]) {
    try {
        localStorage.setItem(LOCAL_STORAGE_SELECTED_CATEGORIES_KEY, JSON.stringify(ids));
    } catch (e) {
        console.error('Erro ao salvar IDs de categorias selecionadas no localStorage:', e);
    }
}

function loadSelectedCategoryIds(): number[] {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SELECTED_CATEGORIES_KEY);
        const ids = stored ? JSON.parse(stored) : [];
        return ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
    } catch (e) {
        console.error('Erro ao carregar IDs de categorias selecionadas do localStorage:', e);
        return [];
    }
}

function saveCurrentRoundStateToLocalStorage() {
  if (imagemOcultaStore.currentRoundCharacter &&
      imagemOcultaStore.gameStatus !== 'finished' &&
      imagemOcultaStore.gameStatus !== 'idle') {
    const stateToSave: SavedRoundState = {
      currentRoundCharacterId: imagemOcultaStore.currentRoundCharacter.id,
      revealProgress: imagemOcultaStore.revealProgress,
      gameStatus: imagemOcultaStore.gameStatus,
      activeTeam: imagemOcultaStore.activeTeam,
      selectedCategoryIds: imagemOcultaStore.selectedCategoryIds,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_ROUND_STATE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Erro ao salvar estado da rodada atual no localStorage:', e);
    }
  } else {
    clearCurrentRoundStateFromLocalStorage();
  }
}

function loadCurrentRoundStateFromLocalStorage(): SavedRoundState | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_CURRENT_ROUND_STATE_KEY);
    const state = stored ? JSON.parse(stored) : null;
    if (state && state.selectedCategoryIds) {
        state.selectedCategoryIds = state.selectedCategoryIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
    }
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

const initialState: ImagemOcultaGameState = {
  ...initialRoundStateDefaults(),
  characters: [],
  isLoadingCharacters: false,
  playedCharacterIds: loadPlayedCharacterIds(),
  selectedCategoryIds: loadSelectedCategoryIds(),
};

export const imagemOcultaStore = reactive<ImagemOcultaGameState>({ ...initialState });

let revealInterval: number | null = null;
const REVEAL_DURATION_MS = 30000;
const REVEAL_STEP_MS = 100;

// Interface para a resposta da API de Imagem Oculta
interface ApiImagemOcultaResponse {
  id: number;
  hint: string;
  answer: string;
  imageUrl: string;
  order_idx: number | null;
  categories: Category[];
}

export async function fetchImagemOcultaCharacters(categoryIds: number[] = imagemOcultaStore.selectedCategoryIds): Promise<void> {
  imagemOcultaStore.isLoadingCharacters = true;
  try {
    let url = `${API_BASE_URL}/api/imagem-oculta`;
    const actualCategoryIds = categoryIds?.filter(id => id != null) || [];

    if (actualCategoryIds.length > 0) {
      url += `?categoryIds=${actualCategoryIds.join(',')}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data: ApiImagemOcultaResponse[] = await response.json();

    imagemOcultaStore.characters = data.map(item => ({
      id: String(item.id),
      name: item.answer,
      imageUrl: item.imageUrl,
      hint: item.hint,
      order_idx: item.order_idx,
    }));

  } catch (error) {
    console.error('[fetchImagemOcultaCharacters] Falha ao buscar personagens:', error);

    imagemOcultaStore.characters = [];
  } finally {
    imagemOcultaStore.isLoadingCharacters = false;
  }
}

export function setSelectedImagemOcultaCategories(ids: number[]) {
    imagemOcultaStore.selectedCategoryIds = ids;
    saveSelectedCategoryIds(ids);
    imagemOcultaStore.playedCharacterIds = [];
    savePlayedCharacterIds([]);
}

function pickNextImagemOcultaCharacterId(): string | null {
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
    .sort((a, b) => (a.order_idx || Infinity) - (b.order_idx || Infinity));

  if (orderedAvailable.length > 0) {
    return orderedAvailable[0].id;
  }

  const unorderedAvailable = availableCharacters
    .filter(char => char.order_idx === null || char.order_idx === undefined);

  if (unorderedAvailable.length > 0) {
    const randomIndex = Math.floor(Math.random() * unorderedAvailable.length);
    return unorderedAvailable[randomIndex].id;
  }
  return null;
}

async function startNewCleanImagemOcultaRound() {
  stopImagemOcultaReveal();
  Object.assign(imagemOcultaStore, initialRoundStateDefaults());
  clearCurrentRoundStateFromLocalStorage();

  await fetchImagemOcultaCharacters();

  if (imagemOcultaStore.characters.length === 0) {
    imagemOcultaStore.gameStatus = 'idle';
    return;
  }

  const nextCharacterId = pickNextImagemOcultaCharacterId();
  if (nextCharacterId) {
    const nextCharacter = imagemOcultaStore.characters.find(char => char.id === nextCharacterId);
    if (nextCharacter) {
      imagemOcultaStore.currentRoundCharacter = nextCharacter;
      imagemOcultaStore.gameStatus = 'hint';
      saveCurrentRoundStateToLocalStorage();
    } else {
      imagemOcultaStore.gameStatus = 'idle';
      clearCurrentRoundStateFromLocalStorage();
    }
  } else {
    imagemOcultaStore.gameStatus = 'idle';
    clearCurrentRoundStateFromLocalStorage();
  }
}

export async function initializeImagemOcultaGame() {
  await fetchImagemOcultaCharacters();

  if (!scoreStore.isLoadingScores) {
    await fetchScores();
  }

  const savedRoundState = loadCurrentRoundStateFromLocalStorage();

  const areCategoriesTheSame = savedRoundState &&
                               savedRoundState.selectedCategoryIds.length === imagemOcultaStore.selectedCategoryIds.length &&
                               savedRoundState.selectedCategoryIds.every((id, index) => id === imagemOcultaStore.selectedCategoryIds[index]);

  if (savedRoundState && savedRoundState.currentRoundCharacterId &&
      savedRoundState.gameStatus !== 'finished' && savedRoundState.gameStatus !== 'idle' &&
      areCategoriesTheSame
      ) {
    const prevChar = imagemOcultaStore.characters.find(char => char.id === savedRoundState.currentRoundCharacterId);
    if (prevChar) {
      imagemOcultaStore.currentRoundCharacter = prevChar;
      imagemOcultaStore.revealProgress = savedRoundState.revealProgress;
      imagemOcultaStore.gameStatus = savedRoundState.gameStatus;
      imagemOcultaStore.activeTeam = savedRoundState.activeTeam;

      if (imagemOcultaStore.gameStatus === 'revealing') {
        proceedToRevealImagemOculta();
      }
    } else {
      clearCurrentRoundStateFromLocalStorage();
      await startNewCleanImagemOcultaRound();
    }
  } else {
    await startNewCleanImagemOcultaRound();
  }
}

export async function startNextImagemOcultaGameRound() {
  await startNewCleanImagemOcultaRound();
}

export function proceedToRevealImagemOculta() {
  if (!imagemOcultaStore.currentRoundCharacter) {
    return;
  }
  stopImagemOcultaReveal();

  imagemOcultaStore.gameStatus = 'revealing';
  const startTime = Date.now() - (imagemOcultaStore.revealProgress * REVEAL_DURATION_MS);

  revealInterval = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    imagemOcultaStore.revealProgress = Math.min(elapsedTime / REVEAL_DURATION_MS, 1);
    saveCurrentRoundStateToLocalStorage();

    if (imagemOcultaStore.revealProgress >= 1) {
      imagemOcultaStore.revealProgress = 1;
      stopImagemOcultaReveal();
      imagemOcultaStore.gameStatus = 'finished';
      if (imagemOcultaStore.currentRoundCharacter) {
        imagemOcultaStore.playedCharacterIds.push(imagemOcultaStore.currentRoundCharacter.id);
        savePlayedCharacterIds(imagemOcultaStore.playedCharacterIds);
      }
      clearCurrentRoundStateFromLocalStorage();
    }
  }, REVEAL_STEP_MS) as unknown as number;
}

export function stopImagemOcultaReveal() {
  if (revealInterval) {
    clearInterval(revealInterval);
    revealInterval = null;
  }
}

export function selectImagemOcultaTeam(team: TeamColor) {
  if (imagemOcultaStore.gameStatus === 'revealing') {
    stopImagemOcultaReveal();
    imagemOcultaStore.activeTeam = team;
    imagemOcultaStore.gameStatus = 'guessing';
    saveCurrentRoundStateToLocalStorage();
  } else {
    console.warn('--- [selectImagemOcultaTeam] Tentativa de selecionar equipe em gameStatus inválido:', imagemOcultaStore.gameStatus);
  }
}

export async function handleOperatorImagemOcultaFeedback(isCorrect: boolean, scoreAwarded: number) {
  if (!imagemOcultaStore.activeTeam || !imagemOcultaStore.currentRoundCharacter) {
    console.warn("Feedback do operador recebido em um estado inválido ou sem time ativo.");
    return;
  }

  if (isCorrect) {
    await updateScore(imagemOcultaStore.activeTeam, scoreAwarded);
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

export function viewImagemOcultaScoreboard() {
  imagemOcultaStore.gameStatus = 'scoreboard';
}

export async function resetImagemOcultaGameScores() {
    stopImagemOcultaReveal();
    // NÃO CHAME resetScores() AQUI. Ele deve ser chamado globalmente pelo SplashScreen se necessário.
    Object.assign(imagemOcultaStore, initialRoundStateDefaults());
    imagemOcultaStore.playedCharacterIds = [];
    savePlayedCharacterIds([]);
    clearCurrentRoundStateFromLocalStorage();
    imagemOcultaStore.gameStatus = 'idle';
}

// === Watchers para persistência ===
watch(() => imagemOcultaStore.gameStatus, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    saveCurrentRoundStateToLocalStorage();
  }
});

watch(() => imagemOcultaStore.activeTeam, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    saveCurrentRoundStateToLocalStorage();
  }
});

watch(() => imagemOcultaStore.currentRoundCharacter, (newVal, oldVal) => {
    if (newVal?.id !== oldVal?.id) {
        saveCurrentRoundStateToLocalStorage();
    }
});