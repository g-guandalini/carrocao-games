// src/store/bugStore.ts
import { reactive, watch, computed } from 'vue';
import { BugState, TeamColor, GameStatus, BugWord, BugBoard, BoardValue } from '../types';
import { updateScore, setScore, fetchScores } from './scoreStore'; // Importa fetchScores também para obter scores atualizados

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
  disabledTeamsForRound: new Set<TeamColor>(), // Times desabilitados para a rodada atual (ex: 'Tire uma')
  revealedBoardTiles: new Set<string>(), // Tiles já revelados no tabuleiro atual ('row-col')
  guessingTeam: null, // Time que está tentando adivinhar a palavra
  wordPhaseAttempts: 0, // Contador de tentativas na fase da palavra (para o mesmo time ou para a rodada)
  selectedLotteryOption: null, // Opção selecionada na fase de sorteio
  wordScoreValue: null, // Valor de pontos para a palavra (se a opção for '10 a 50')
  roundOptions: ['Ganhe 20', 'Perca 20', '10 a 50', 'Tire uma', 'Tire duas', 'Fora'],
  awaitingTileConfirmation: false, // NOVO: Flag para aguardar confirmação após revelar tile
};

export const bugStore = reactive<BugState>({ ...initialBugState });

// Salva o estado no localStorage sempre que houver uma mudança relevante
watch(bugStore, (newState) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
    ...newState,
    // Converte Sets para Arrays para poderem ser serializados em JSON
    disabledTeamsForRound: Array.from(newState.disabledTeamsForRound),
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
    bugStore.revealedBoardTiles = new Set(parsedState.revealedBoardTiles || []);
  }
}

// Determina o valor da palavra na fase de sorteio
export const currentWordPotentialScore = computed(() => {
  if (bugStore.selectedLotteryOption === '10 a 50' && bugStore.wordScoreValue !== null) {
    return bugStore.wordScoreValue;
  }
  // Opções padrão da fase de palavra
  switch (bugStore.selectedLotteryOption) {
    case '20': return 20;
    case '30': return 30;
    case '40': return 40;
    case '50': return 50;
    default: return 20; // Valor padrão se não houver opção de pontos específica
  }
});

// Reseta o estado do jogo BUG completamente
export async function resetBugGameScores() {
  Object.assign(bugStore, { ...initialBugState }); // Reseta para o estado inicial
  // Após resetar, garantimos que o primeiro turno seja do Vermelho para uma nova partida completa
  bugStore.currentTurnIndex = 0;
  bugStore.currentTurnTeam = bugStore.teamsOrder[bugStore.currentTurnIndex];
  bugStore.gameStatus = 'idle'; // Volta para idle para forçar uma nova inicialização ao entrar no jogo
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

// --- Funções Auxiliares de API ---
async function fetchBugWordsFromApi(): Promise<BugWord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bug/words`);
    if (!response.ok) throw new Error('Erro ao buscar palavras BUG');
    return response.json();
  } catch (error) {
    console.error('Falha ao buscar palavras BUG:', error);
    return [];
  }
}

async function fetchBugBoardsFromApi(): Promise<BugBoard[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bug/boards`);
    if (!response.ok) throw new Error('Erro ao buscar tabuleiros BUG');
    return response.json();
  } catch (error) {
    console.error('Falha ao buscar tabuleiros BUG:', error);
    return [];
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
    console.warn("Nenhuma palavra disponível para o BUG.");
  }

  if (bugStore.availableBoards.length > 0) {
    const randomIndex = Math.floor(Math.random() * bugStore.availableBoards.length);
    bugStore.currentBugBoard = bugStore.availableBoards[randomIndex];
    // bugStore.availableBoards.splice(randomIndex, 1); // Descomente se quiser remover tabuleiros usados para não repetir na mesma sessão
  } else {
    bugStore.currentBugBoard = null;
    console.warn("Nenhum tabuleiro disponível para o BUG.");
  }
}

// Inicializa o jogo ao carregar ou ao pressionar 'B' na SplashScreen
export async function initializeBugGame() {
  loadBugState();

  // Verifica se o estado carregado é válido ou se precisa de uma nova inicialização
  if (bugStore.currentTurnTeam === null || bugStore.gameStatus === 'idle') {
    // Inicialização para uma nova partida ou quando o estado está 'idle'
    bugStore.currentTurnIndex = 0; // Começa com o Vermelho
    bugStore.currentTurnTeam = bugStore.teamsOrder[bugStore.currentTurnIndex];
    bugStore.gameStatus = 'bug_draw_phase'; // Inicia na fase de sorteio
    await selectRandomWordAndBoard();
  } else {
    // Se o jogo já estava em andamento (estado carregado), apenas garante que tudo está pronto
    if (!bugStore.currentRoundWord || !bugStore.currentBugBoard) {
       await selectRandomWordAndBoard(); // Garante que a palavra e o tabuleiro estão carregados
    }
  }
}

// --- Funções de Controle do Jogo ---

// Inicia uma nova rodada (limpa o estado da rodada anterior e avança o turno para o próximo time)
export async function startNewCleanBugRound() {
  // Limpa o estado da rodada anterior
  bugStore.disabledTeamsForRound.clear();
  bugStore.revealedBoardTiles.clear();
  bugStore.guessingTeam = null;
  bugStore.wordPhaseAttempts = 0;
  bugStore.selectedLotteryOption = null;
  bugStore.wordScoreValue = null;
  bugStore.currentBugBoard = null;
  bugStore.currentRoundWord = null; // Garante que a palavra anterior seja limpa
  bugStore.awaitingTileConfirmation = false; // Garante que esta flag esteja resetada

  // Seleciona nova palavra e tabuleiro para a nova rodada
  await selectRandomWordAndBoard();

  // AVANÇA O TURNO PARA O PRÓXIMO TIME INICIAR A NOVA RODADA
  // O time que começa a nova rodada é o próximo na sequência do time que jogou por último na rodada anterior
  bugStore.currentTurnIndex = (bugStore.currentTurnIndex + 1) % bugStore.teamsOrder.length;
  // Garante que o próximo time não seja um desabilitado (embora disabledTeamsForRound deva estar vazio aqui)
  let nextTeamToStartRound = bugStore.teamsOrder[bugStore.currentTurnIndex];
  let attempts = 0;
  while(bugStore.disabledTeamsForRound.has(nextTeamToStartRound) && attempts < bugStore.teamsOrder.length) {
    bugStore.currentTurnIndex = (bugStore.currentTurnIndex + 1) % bugStore.teamsOrder.length;
    nextTeamToStartRound = bugStore.teamsOrder[bugStore.currentTurnIndex];
    attempts++;
  }
  bugStore.currentTurnTeam = nextTeamToStartRound;

  bugStore.gameStatus = 'bug_draw_phase'; // Inicia a nova rodada na fase de sorteio
}

// Seleciona a opção de sorteio
export async function selectLotteryOption(option: string, chosenPoints?: number) {
  bugStore.selectedLotteryOption = option;
  if (option === '10 a 50' && chosenPoints) {
    bugStore.wordScoreValue = chosenPoints;
  }

  if (!bugStore.currentTurnTeam) {
      console.error("Nenhum time na vez para selecionar opção de sorteio.");
      return;
  }

  // Aplica efeitos imediatos das opções
  switch (option) {
    case 'Ganhe 20':
      await updateScore(bugStore.currentTurnTeam, 20);
      bugStore.gameStatus = 'scoreboard'; // Vai direto para o placar após ganhar pontos
      return;
    case 'Perca 20':
      await updateScore(bugStore.currentTurnTeam, -20);
      bugStore.gameStatus = 'scoreboard'; // Vai direto para o placar após perder pontos
      return;
    case 'Fora':
      bugStore.disabledTeamsForRound.add(bugStore.currentTurnTeam);
      // Se o próprio time da vez é desabilitado, avança para o próximo time para tentar a palavra
      // O próximo time ativo na sequência assume o turno de adivinhar
      bugStore.gameStatus = 'bug_word_phase'; // Transiciona para a fase da palavra
      // Não avançamos o currentTurnTeam aqui, pois ele é o time *que sorteou*.
      // O `guessingTeam` será definido quando o próximo time ativo "buzinar".
      return;
    case 'Tire uma':
    case 'Tire duas':
      // A lógica de remoção de times é tratada no componente BugDrawPhase via @teams-removed.
      // A transição para 'bug_word_phase' ocorre após a seleção e confirmação dos times a serem removidos.
      // Se não houver times suficientes para remover, a transição pode ocorrer imediatamente.
      const activeTeamsCount = bugStore.teamsOrder.filter(t => !bugStore.disabledTeamsForRound.has(t)).length;
      const teamsToRemain = activeTeamsCount - (option === 'Tire uma' ? 1 : 2);
      
      if (teamsToRemain <= 0) { // Se não sobrarem times para jogar
        console.warn("Não há times suficientes para remover. Indo para o placar.");
        bugStore.gameStatus = 'scoreboard';
        return;
      }
      // Se precisa de seleção de time, não transiciona aqui.
      break; // Permite que a função continue para a fase da palavra se nenhuma ação imediata foi tomada.
  }
  
  // Transiciona para a fase da palavra se não houve uma ação que já levou ao placar
  if (bugStore.gameStatus !== 'scoreboard') {
    bugStore.gameStatus = 'bug_word_phase';
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
  if (isCorrect) {
    if (bugStore.currentRoundWord) {
      // Aplica a pontuação do time que acertou
      await updateScore(team, currentWordPotentialScore.value);
      // O time que acertou a palavra ganha o direito de jogar no tabuleiro
      bugStore.currentTurnTeam = team; // Este é o time que vai jogar no tabuleiro
      bugStore.currentTurnIndex = bugStore.teamsOrder.indexOf(team); // Atualiza o index para o time vencedor
      bugStore.gameStatus = 'bug_board_phase';
      bugStore.guessingTeam = null; // Limpa o time que estava tentando
      // bugStore.awaitingTileConfirmation permanece false até o tile ser clicado
    }
  } else {
    // Time errou, é desabilitado para o resto da rodada
    bugStore.disabledTeamsForRound.add(team);
    bugStore.guessingTeam = null; // Limpa o time que estava tentando

    // Verifica quantos times ainda estão ativos para tentar a palavra
    const activeTeamsCount = bugStore.teamsOrder.filter(t => !bugStore.disabledTeamsForRound.has(t)).length;
    
    if (activeTeamsCount === 0) {
      // Se todos os times ativos foram desabilitados, a rodada acaba
      viewBugScoreboard(); // Vai para o placar se todos erraram ou não podem mais tentar
    } else {
      // Permanece na fase da palavra, esperando que outro time "buzine"
      console.log(`Time ${team} errou. Permanece na fase da palavra, esperando que outro time "buzine".`);
    }
  }
}

// Seleciona um tile do tabuleiro
export async function selectBoardTile(row: number, col: number) {
  // Impede cliques se já estiver aguardando confirmação
  if (bugStore.awaitingTileConfirmation) {
    console.log("Já aguardando confirmação de tile.");
    return;
  }
  if (!bugStore.currentBugBoard || !bugStore.currentTurnTeam || bugStore.revealedBoardTiles.has(`${row}-${col}`)) {
    return;
  }

  const tileValue = bugStore.currentBugBoard.board_config[row][col];
  bugStore.revealedBoardTiles.add(`${row}-${col}`);

  if (typeof tileValue === 'number') {
    await updateScore(bugStore.currentTurnTeam, tileValue);
  } else if (tileValue === 'Bug') {
    // BUG: Perde metade dos pontos. Valor mínimo 0.
    const currentScores = await fetchScores(); // Busca scores atualizados
    const currentScore = currentScores[bugStore.currentTurnTeam] || 0; 
    const pointsToLose = Math.floor(currentScore / 2);
    await updateScore(bugStore.currentTurnTeam, -pointsToLose);
  } else if (tileValue === 'Carroção') {
    // CARROÇÃO: Zera os pontos de um time e adiciona ao time da vez
    const teamToZero = prompt(`O time ${bugStore.currentTurnTeam} tirou Carroção! Qual time deve ter os pontos zerados? (RED, BLUE, GREEN, YELLOW)`);
    if (teamToZero && Object.values(TeamColor).includes(teamToZero.toUpperCase() as TeamColor)) {
      const targetTeam = teamToZero.toUpperCase() as TeamColor;
      const currentScores = await fetchScores(); // Busca scores atualizados
      const targetTeamScore = currentScores[targetTeam] || 0;
      await setScore(targetTeam, 0); // Zera o placar do time alvo
      await updateScore(bugStore.currentTurnTeam, targetTeamScore); // Adiciona ao time da vez
    } else {
      console.warn("Time para zerar inválido ou não fornecido.");
    }
  }
  
  // NOVO: Define a flag para aguardar a confirmação do usuário
  bugStore.awaitingTileConfirmation = true;
  // REMOVIDO: Não chama viewBugScoreboard() diretamente aqui
}

// NOVO: Função para confirmar a ação do tile e prosseguir para o placar
export function confirmTileAction() {
  bugStore.awaitingTileConfirmation = false; // Reseta a flag
  viewBugScoreboard(); // Agora sim, vai para o placar
}

// Transiciona para a tela de placar
export function viewBugScoreboard() {
  bugStore.gameStatus = 'scoreboard';
  bugStore.guessingTeam = null; // Limpa o time que estava adivinhando
  // bugStore.awaitingTileConfirmation deve ter sido resetado antes de chegar aqui
}