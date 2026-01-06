// src/store/bugStore.ts
import { reactive, watch, computed } from 'vue';
import { BugState, TeamColor, GameStatus, BugWord, BugBoard, BoardValue } from '../types';
import { updateScore, setScore, fetchScores } from './scoreStore'; // fetchScores ainda é importado para chamadas iniciais

const LOCAL_STORAGE_KEY = 'bugCurrentRoundState';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initialBugState: BugState = {
  gameStatus: 'idle', // 'idle', 'bug_draw_phase', 'bug_word_phase', 'bug_board_phase', 'scoreboard'
  teamsOrder: [TeamColor.RED, TeamColor.BLUE, TeamColor.GREEN, TeamColor.YELLOW],
  currentTurnIndex: 0, // Inicia com o time vermelho (TeamColor.RED)
  currentTurnTeam: null, // Será definido na inicialização
  availableWords: [], // Palavras disponíveis para sorteio
  availableBoards: [], // Tabuleiros disponíveis para sorteio
  currentRoundWord: null, // Palavra da rodada atual
  currentBugBoard: null, // Tabuleiro da rodada atual
  disabledTeamsForRound: new Set<TeamColor>(), // Times desabilitados para a rodada atual (ex: 'Tire uma', 'Fora')
  disabledTeamsForGuessing: new Set<TeamColor>(), // NOVO: Times desabilitados por erro de palpite na fase da palavra
  revealedBoardTiles: new Set<string>(), // Tiles já revelados no tabuleiro atual ('row-col')
  guessingTeam: null, // Time que está tentando adivinhar a palavra
  wordPhaseAttempts: 0, // Contador de tentativas na fase da palavra (para o mesmo time ou para a rodada)
  selectedLotteryOption: null, // Opção selecionada na fase de sorteio
  wordScoreValue: null, // Valor de pontos para a palavra (se a opção for '10 a 50')
  roundOptions: ['Ganhe 20', 'Perca 20', '10 a 50', 'Tire uma', 'Tire duas', 'Fora'],
  awaitingTileConfirmation: false, // Flag para aguardar confirmação após revelar tile
  isInitializing: true, // Estado para controlar o carregamento inicial do jogo
  isLoadingBugWords: false, // Estado de carregamento para palavras
  isLoadingBugBoards: false, // Estado de carregamento para tabuleiros
  isUpdatingScore: false, // NOVO: Flag para prevenir atualizações de pontuação duplicadas
};

export const bugStore = reactive<BugState>({ ...initialBugState });

// Helper para centralizar e logar todas as mudanças de gameStatus
function setGameStatus(newStatus: GameStatus) {
  if (bugStore.gameStatus !== newStatus) {
    bugStore.gameStatus = newStatus;
  }
}

// Salva o estado no localStorage sempre que houver uma mudança relevante
watch(bugStore, (newState) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
    ...newState,
    // Converte Sets para Arrays para poderem ser serializados em JSON
    disabledTeamsForRound: Array.from(newState.disabledTeamsForRound),
    disabledTeamsForGuessing: Array.from(newState.disabledTeamsForGuessing), // NOVO: Serializa o novo Set
    revealedBoardTiles: Array.from(newState.revealedBoardTiles),
  }));
}, { deep: true });

// Carrega o estado do localStorage
function loadBugState() {
  const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedState) {
    const parsedState = JSON.parse(savedState);
    Object.assign(bugStore, parsedState);
    // Reconstrói Sets a partir dos Arrays
    bugStore.disabledTeamsForRound = new Set(parsedState.disabledTeamsForRound || []);
    bugStore.disabledTeamsForGuessing = new Set(parsedState.disabledTeamsForGuessing || []); // NOVO: Reconstrói o novo Set
    bugStore.revealedBoardTiles = new Set(parsedState.revealedBoardTiles || []);
  }
}

// Determina o valor da palavra na fase de sorteio
export const currentWordPotentialScore = computed(() => {
  if (bugStore.selectedLotteryOption === '10 a 50' && bugStore.wordScoreValue !== null) {
    return bugStore.wordScoreValue;
  }
  // Por padrão, a rodada vale 30 pontos.
  return 30;
});

// Reseta o estado do jogo BUG completamente
export async function resetBugGameScores() {
  Object.assign(bugStore, { ...initialBugState }); // Reseta para o estado inicial
  // Após resetar, garantimos que o primeiro turno seja do Vermelho para uma nova partida completa
  bugStore.currentTurnIndex = 0; // Isso define o Vermelho como o primeiro time a jogar.
  bugStore.currentTurnTeam = bugStore.teamsOrder[bugStore.currentTurnIndex];
  setGameStatus('idle'); // Usa helper
  bugStore.isInitializing = true; // Reseta isInitializing para que o próximo initializeBugGame rode completo
  localStorage.removeItem(LOCAL_STORAGE_KEY);

  // NOVO: Define a pontuação inicial de 100 para todas as equipes
  for (const team of bugStore.teamsOrder) {
    await setScore(team, 100); // scoreStore.setScore já chama fetchScores()
  }
}

// --- Funções Auxiliares de API ---
async function fetchBugWordsFromApi(): Promise<BugWord[]> {
  bugStore.isLoadingBugWords = true; // Define o estado de carregamento para palavras
  try {
    const response = await fetch(`${API_BASE_URL}/api/bug/words`);
    if (!response.ok) throw new Error('Erro ao buscar palavras BUG');
    return response.json();
  } catch (error) {
    console.error('Falha ao buscar palavras BUG:', error);
    return [];
  } finally {
    bugStore.isLoadingBugWords = false; // Finaliza o estado de carregamento para palavras
  }
}

async function fetchBugBoardsFromApi(): Promise<BugBoard[]> {
  bugStore.isLoadingBugBoards = true; // Define o estado de carregamento para tabuleiros
  try {
    const response = await fetch(`${API_BASE_URL}/api/bug/boards`);
    if (!response.ok) throw new Error('Erro ao buscar tabuleiros BUG');
    return response.json();
  } catch (error) {
    console.error('Falha ao buscar tabuleiros BUG:', error);
    return [];
  } finally {
    bugStore.isLoadingBugBoards = false; // Finaliza o estado de carregamento para tabuleiros
  }
}

async function selectRandomWordAndBoard() {
  // Recarrega as palavras se não houver nenhuma disponível ou se todas já foram usadas
  if (bugStore.availableWords.length === 0) {
    bugStore.availableWords = await fetchBugWordsFromApi();
    // Adiciona aqui a lógica para reembaralhar ou resetar as palavras se for o caso
  }
  if (bugStore.availableBoards.length === 0) {
    bugStore.availableBoards = await fetchBugBoardsFromApi();
    // Adiciona aqui a lógica para reembaralhar ou resetar os tabuleiros se for o caso
  }

  if (bugStore.availableWords.length > 0) {
    const randomIndex = Math.floor(Math.random() * bugStore.availableWords.length);
    bugStore.currentRoundWord = bugStore.availableWords[randomIndex];
    // bugStore.availableWords.splice(randomIndex, 1); // Descomente se quiser remover palavras usadas para não repetir na mesma sessão
  } else {
    bugStore.currentRoundWord = null;
  }

  if (bugStore.availableBoards.length > 0) {
    const randomIndex = Math.floor(Math.random() * bugStore.availableBoards.length);
    bugStore.currentBugBoard = bugStore.availableBoards[randomIndex];
    // bugStore.availableBoards.splice(randomIndex, 1); // Descomente se quiser remover tabuleiros usados para não repetir na mesma sessão
  } else {
    bugStore.currentBugBoard = null;
  }
}

// Inicializa o jogo ao carregar ou ao pressionar 'B' na SplashScreen
export async function initializeBugGame() {
  bugStore.isInitializing = true; // Inicia o estado de inicialização

  try {
    loadBugState(); // Carrega qualquer estado existente do localStorage primeiro
    // Se o jogo está começando do zero (sem estado salvo ou gameStatus 'idle'),
    // garanta que as pontuações iniciais sejam definidas.
    if (bugStore.gameStatus === 'idle' && bugStore.currentTurnTeam === null) {
      for (const team of bugStore.teamsOrder) {
        await setScore(team, 100); // scoreStore.setScore já chama fetchScores()
      }
    }

    // Busca palavras e tabuleiros concorrentemente. As funções de fetch gerenciam seus próprios isLoading flags.
    const [words, boards] = await Promise.all([
      fetchBugWordsFromApi(),
      fetchBugBoardsFromApi()
    ]);

    bugStore.availableWords = words;
    bugStore.availableBoards = boards;

    // Determina o estado inicial do jogo após o carregamento
    // Se estiver começando do zero ou explicitamente ocioso, configura o turno inicial e inicia a rodada
    if (bugStore.gameStatus === 'idle' || bugStore.currentTurnTeam === null) {
      // Para uma nova partida, definimos o currentTurnIndex para o time *antes* do Vermelho (Amarelo),
      // para que startNewCleanBugRound o avance para Vermelho (index 0).
      bugStore.currentTurnIndex = bugStore.teamsOrder.length - 1; // Define para o último time (Amarelo)
      bugStore.currentTurnTeam = bugStore.teamsOrder[bugStore.currentTurnIndex]; // Será Amarelo temporariamente

      if (bugStore.availableWords.length > 0 && bugStore.availableBoards.length > 0) {
          await startNewCleanBugRound(); // Isso fará com que o Vermelho seja o primeiro a jogar.
      } else {
          setGameStatus('idle'); // Usa helper
      }
    }
    // Se o gameStatus não for 'idle' (ex: 'bug_draw_phase' do localStorage),
    // garante que currentRoundWord e currentBugBoard estejam definidos se forem nulos.
    else if (!bugStore.currentRoundWord || !bugStore.currentBugBoard) {
        await selectRandomWordAndBoard(); // Garante que palavra/tabuleiro sejam carregados se o jogo estava em andamento
    }

  } catch (error) {
    bugStore.availableWords = []; // Limpa se houver erro
    bugStore.availableBoards = []; // Limpa se houver erro
    setGameStatus('idle'); // Usa helper
  } finally {
    bugStore.isInitializing = false; // Inicialização completa (ou falhou)
  }
}

// --- Funções de Controle do Jogo ---

// Inicia uma nova rodada (limpa o estado da rodada anterior e avança o turno para o próximo time)
export async function startNewCleanBugRound() {
  // Verificação para garantir que há dados antes de tentar iniciar
  if (bugStore.availableWords.length === 0 || bugStore.availableBoards.length === 0) {
      setGameStatus('idle'); // Usa helper
      return;
  }

  // 1. Determina o próximo time para a nova rodada, SEMPRE avançando na sequência fixa.
  // A ordem das equipes é Vermelho -> Azul -> Verde -> Amarelo -> Vermelho...
  bugStore.currentTurnIndex = (bugStore.currentTurnIndex + 1) % bugStore.teamsOrder.length;
  bugStore.currentTurnTeam = bugStore.teamsOrder[bugStore.currentTurnIndex];

  // 2. Agora, limpa todo o estado específico da rodada *anterior*.
  // A lista disabledTeamsForRound é limpa para que o efeito de "Fora" não se estenda para a próxima rodada.
  bugStore.disabledTeamsForRound.clear();
  bugStore.disabledTeamsForGuessing.clear(); // NOVO: Limpa também os times desabilitados por erro de palpite
  // bugStore.revealedBoardTiles.clear(); // REMOVIDO: Tiles agora persistem entre as rodadas
  bugStore.guessingTeam = null; // Garante que guessingTeam seja nulo no início de uma nova rodada
  bugStore.wordPhaseAttempts = 0;
  bugStore.selectedLotteryOption = null;
  bugStore.wordScoreValue = null;
  bugStore.currentBugBoard = null;
  bugStore.currentRoundWord = null;
  bugStore.awaitingTileConfirmation = false;

  // 3. Seleciona nova palavra e tabuleiro para a nova rodada
  await selectRandomWordAndBoard();

  // 4. Transiciona para a fase de sorteio da nova rodada.
  setGameStatus('bug_draw_phase'); // Usa helper
}

// Seleciona a opção de sorteio
export async function selectLotteryOption(option: string, chosenPoints?: number) {
  if (bugStore.isUpdatingScore) { // NOVO: Previne re-entrada
    console.warn('DEBUG: Atualização de pontuação já em andamento, ignorando opção de sorteio.');
    return;
  }

  bugStore.selectedLotteryOption = option; // Define a opção selecionada no store
  if (option === '10 a 50' && chosenPoints) {
    bugStore.wordScoreValue = chosenPoints;
  }

  if (!bugStore.currentTurnTeam) {
      console.warn('DEBUG: currentTurnTeam não definido ao selecionar opção de sorteio.');
      return;
  }

  bugStore.isUpdatingScore = true; // NOVO: Ativa a flag no início da operação assíncrona
  try {
    // Aplica efeitos imediatos das opções
    switch (option) {
      case 'Ganhe 20':
        await updateScore(bugStore.currentTurnTeam, 20); // scoreStore.updateScore já chama fetchScores()
        setGameStatus('scoreboard'); // Usa helper
        break; // Usa break para que o finally seja executado
      case 'Perca 20':
        await updateScore(bugStore.currentTurnTeam, -20); // scoreStore.updateScore já chama fetchScores()
        setGameStatus('scoreboard'); // Usa helper
        break; // Usa break
      case 'Fora':
        // O time que tirou "Fora" é desabilitado para *esta rodada*.
        bugStore.disabledTeamsForRound.add(bugStore.currentTurnTeam);
        setGameStatus('bug_word_phase'); // Usa helper
        break;
      case 'Tire uma':
      case 'Tire duas':
        // Calcula os times que *ainda não estão desabilitados por sorteio*
        const currentlyEligibleForLottery = bugStore.teamsOrder.filter(t => !bugStore.disabledTeamsForRound.has(t));
        const teamsToRemain = currentlyEligibleForLottery.length - (option === 'Tire uma' ? 1 : 2);

        if (teamsToRemain <= 0) { // Se não sobrarem times para jogar
          setGameStatus('scoreboard'); // Usa helper
        }
        // Se precisa de seleção de time, não transiciona aqui.
        // A limpeza de selectedLotteryOption para '10 a 50' e 'Tire uma'/'Tire duas'
        // que precisam de interação adicional (seleção de pontos/times)
        // será feita após a confirmação dessas interações.
        break;
    }

    // Transiciona para a fase da palavra se não houve uma ação que já levou ao placar
    // e se o status não foi definido para 'bug_word_phase' por 'Fora'
    if (bugStore.gameStatus !== 'scoreboard' && bugStore.gameStatus !== 'bug_word_phase') {
      setGameStatus('bug_word_phase'); // Usa helper
    }
  } finally {
    bugStore.isUpdatingScore = false; // NOVO: Garante que a flag seja limpa
  }
}

// Seleciona um time para ser desabilitado para a rodada
export function selectTeamToRemove(team: TeamColor) {
  bugStore.disabledTeamsForRound.add(team);
}

// Define qual time está tentando adivinhar a palavra
export function setGuessingTeam(team: TeamColor) {
  bugStore.guessingTeam = team;
  bugStore.wordPhaseAttempts++; // Incrementa tentativa na fase da palavra
}

// Lida com o feedback do operador (time acertou/errou a palavra)
export async function handleOperatorBugFeedback(isCorrect: boolean, team: TeamColor) {
  if (bugStore.isUpdatingScore) {
    console.warn('DEBUG: Atualização de pontuação já em andamento, ignorando feedback do operador.');
    return;
  }

  if (isCorrect) {
    if (bugStore.currentRoundWord) {
      bugStore.isUpdatingScore = true;
      try {
        await updateScore(team, currentWordPotentialScore.value);
        setGameStatus('bug_board_phase');
      } finally {
        bugStore.isUpdatingScore = false;
      }
    }
  } else {
    // O time errou o palpite
    bugStore.disabledTeamsForGuessing.add(team); // Adiciona o time à lista de desabilitados por erro de palpite
    bugStore.guessingTeam = null; // Limpa o time que estava tentando adivinhar

    // 1. Identifica os times que são elegíveis para adivinhar nesta rodada (não desabilitados por sorteio)
    const teamsEligibleAtStartOfWordPhase = bugStore.teamsOrder.filter(
      t => !bugStore.disabledTeamsForRound.has(t)
    );

    // 2. Verifica se todos esses times elegíveis já erraram (estão em disabledTeamsForGuessing)
    const allEligibleTeamsHaveGuessedAndFailed = teamsEligibleAtStartOfWordPhase.every(
      t => bugStore.disabledTeamsForGuessing.has(t)
    );

    if (allEligibleTeamsHaveGuessedAndFailed && teamsEligibleAtStartOfWordPhase.length > 0) {
      // Se todos os times que eram elegíveis para adivinhar erraram, dá uma nova chance a eles.
      console.log('DEBUG: Todos os times elegíveis para a fase da palavra erraram. Dando uma nova chance a eles.');
      bugStore.disabledTeamsForGuessing.clear(); // Limpa APENAS os times que erraram o palpite
      bugStore.wordPhaseAttempts = 0; // Reseta o contador de tentativas
      // O gameStatus permanece 'bug_word_phase', permitindo que os times tentem novamente.
      // A UI deve reagir ao disabledTeamsForGuessing estar vazio novamente, reativando os botões.
    } else {
      // Se ainda há times elegíveis que não erraram, o jogo continua na fase da palavra.
      // Apenas para garantir, verifica se ainda há *qualquer* time que possa adivinhar.
      const anyTeamCanStillGuess = teamsEligibleAtStartOfWordPhase.some(
        t => !bugStore.disabledTeamsForGuessing.has(t)
      );

      if (!anyTeamCanStillGuess) {
        // Este caso só deve ser atingido se teamsEligibleAtStartOfWordPhase.length === 0
        // ou se a lógica acima falhou por algum motivo (ex: todos foram desabilitados por sorteio).
        // Se não há absolutamente mais ninguém que possa adivinhar, a rodada deve ir para o placar.
        viewBugScoreboard();
      }
    }
  }
}

// Seleciona um tile do tabuleiro
export async function selectBoardTile(row: number, col: number) {
  if (bugStore.awaitingTileConfirmation || bugStore.isUpdatingScore) {
    console.warn('DEBUG: Confirmação de tile pendente ou atualização de pontuação em andamento, ignorando seleção de tile.');
    return;
  }
  // O time que joga o tabuleiro é o guessingTeam, não o currentTurnTeam
  if (!bugStore.currentBugBoard || !bugStore.guessingTeam || bugStore.revealedBoardTiles.has(`${row}-${col}`)) {
    console.warn('DEBUG: Condições para selecionar tile não atendidas (tabuleiro, guessingTeam ou tile já revelado).');
    return;
  }

  const tileValue = bugStore.currentBugBoard.board_config[row][col];
  bugStore.revealedBoardTiles.add(`${row}-${col}`);

  bugStore.isUpdatingScore = true;
  try {
    if (typeof tileValue === 'number') {

      await updateScore(bugStore.guessingTeam, tileValue); // Pontua o guessingTeam com o valor do tile
    } else if (tileValue === 'Bug') {

      await updateScore(bugStore.guessingTeam, -20);
    } else if (tileValue === 'Carroção') {

      await updateScore(bugStore.guessingTeam, 40);
    }
  } finally {
    bugStore.isUpdatingScore = false;
  }

  bugStore.awaitingTileConfirmation = true;
}

// Função para confirmar a ação do tile e prosseguir para o placar
export function confirmTileAction() {
  bugStore.awaitingTileConfirmation = false;
  bugStore.guessingTeam = null; // Limpa guessingTeam após a ação do tabuleiro ser confirmada
  viewBugScoreboard();
}

// Transiciona para a tela de placar
export function viewBugScoreboard() {
  setGameStatus('scoreboard');
  bugStore.guessingTeam = null; // Garante que guessingTeam seja nulo ao ir para o placar
}