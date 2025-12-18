// src/types.ts

export enum TeamColor {
  BLUE = 'Azul',
  RED = 'Vermelho',
  GREEN = 'Verde',
  YELLOW = 'Amarelo',
}

export type Score = {
  [key in TeamColor]: number;
};

export interface ScoreState {
  score: Score;
  isLoadingScores: boolean;
}

// Expandido para incluir os novos estados do jogo BUG
export type GameStatus = 'idle' | 'hint' | 'revealing' | 'guessing' | 'finished' | 'scoreboard' | 'bug_draw_phase' | 'bug_word_phase' | 'bug_board_phase';

// Interface para um item de Imagem Oculta (para o JOGO)
export interface Character {
  id: string; // O ID virá do banco de dados (number, mas trataremos como string no frontend por conveniência)
  name: string; // Corresponde a 'answer' no backend
  imageUrl: string;
  hint: string;
  order_idx?: number | null;
}

// NOVA INTERFACE: Para uma Categoria (JÁ ATUALIZADA NA ETAPA ANTERIOR)
export interface Category {
  id: number; // ID é number
  name: string;
  imagem_oculta_start: number; // 0 ou 1
  conexao_start: number;       // 0 ou 1
  bug_start: number;           // 0 ou 1
}

// NOVA INTERFACE: Para um item de Imagem Oculta (para ADMIN, com categorias)
export interface ImagemOcultaItem {
  id: number;
  hint: string;
  answer: string;
  imageUrl: string;
  order_idx?: number | null; // Adicionado aqui para o admin
  categories: Category[]; // Array de categorias associadas
}

// =========================================================
//                  NOVAS INTERFACES PARA CONEXÃO (AJUSTADO)
// =========================================================
// Interface para um item de Conexão (para o JOGO)
export interface Conexao {
  id: string; // O ID virá do banco de dados (number, mas trataremos como string no frontend por conveniência)
  palavra: string; // A palavra a ser adivinhada
  imageUrl: string;
  order_idx?: number | null; // Novo campo para ordem
  // Novo campo para rastrear letras reveladas (para a lógica do jogo)
  revealedLetters?: Set<number>; // Conjunto de índices das letras reveladas
}

// Interface para um item de Conexão (para ADMIN, com categorias)
export interface ConexaoAdminItem { // Corresponde à estrutura do backend para /api/admin/conexao
  id: number;
  palavra: string;
  imageUrl: string;
  order_idx?: number | null; // Novo campo para ordem
  categories: Category[]; // Array de categorias associadas
}
// =========================================================
//            FIM DAS NOVAS INTERFACES PARA CONEXÃO
// =========================================================

// =========================================================
//                  NOVAS INTERFACES PARA BUG
// =========================================================

// Interface para uma palavra do jogo BUG (para o JOGO)
export interface BugWord {
  id: string;
  word: string; // Palavra embaralhada (ou não)
  order_idx?: number | null;
}

// Tipo para os valores do tabuleiro
export type BoardValue = number | 'Carroção' | 'Bug';

// Interface para um tabuleiro do jogo BUG (para o JOGO)
export interface BugBoard {
  id: string;
  name: string;
  board_config: BoardValue[][]; // Matriz representando o tabuleiro 5x4
}

// Interface para uma palavra do jogo BUG (para ADMIN, com categorias)
export interface BugAdminWordItem {
  id: number;
  word: string;
  order_idx?: number | null;
  categories: Category[];
}

// Interface para um tabuleiro do jogo BUG (para ADMIN)
export interface BugAdminBoardItem {
  id: number;
  name: string;
  board_config: BoardValue[][];
}

// =========================================================
//            FIM DAS NOVAS INTERFACES PARA BUG
// =========================================================

// NOVA INTERFACE: Para a store de administração (atualizada)
export interface AdminState {
  categories: Category[];
  imagemOcultaItems: ImagemOcultaItem[];
  conexaoItems: ConexaoAdminItem[];
  bugWords: BugAdminWordItem[];     // NOVO: para gerenciamento de palavras BUG no admin
  bugBoards: BugAdminBoardItem[];   // NOVO: para gerenciamento de tabuleiros BUG no admin
  isLoadingCategories: boolean;
  isLoadingImagemOculta: boolean;
  isLoadingConexao: boolean;
  isLoadingBugWords: boolean;       // NOVO: para palavras BUG
  isLoadingBugBoards: boolean;      // NOVO: para tabuleiros BUG
  selectedImagemOcultaItem: ImagemOcultaItem | null; 
  selectedConexaoItem: ConexaoAdminItem | null;
  selectedBugWord: BugAdminWordItem | null; // NOVO: para edição de palavra BUG
  selectedBugBoard: BugAdminBoardItem | null; // NOVO: para edição de tabuleiro BUG
}

// Estado do jogo para Imagem Oculta (JÁ ATUALIZADA)
export interface ImagemOcultaGameState {
  currentRoundCharacter: Character | null;
  revealProgress: number;
  gameStatus: GameStatus;
  activeTeam: TeamColor | null;
  characters: Character[];
  isLoadingCharacters: boolean;
  playedCharacterIds: string[];
  allCategories: Category[];
  activeImagemOcultaCategoryIds: number[];
}

// =========================================================
//            NOVA INTERFACE: ConexaoGameState (ATUALIZADA)
// =========================================================
// Estado do jogo para Conexão
export interface ConexaoGameState { 
  currentRoundConexao: Conexao | null; // Item da rodada atual
  revealedLettersCount: number; // Quantas letras foram reveladas
  gameStatus: GameStatus;
  activeTeam: TeamColor | null;
  conexoes: Conexao[]; // Lista de itens de conexão disponíveis
  isLoadingConexoes: boolean; // Estado de carregamento
  playedConexaoIds: string[]; // IDs das conexões já jogadas
  allCategories: Category[]; // Nova propriedade para armazenar todas as categorias
  activeConexaoCategoryIds: number[]; // Nova propriedade para as categorias ativas na Conexão
  disabledTeams: Set<TeamColor>; // Conjunto de times desabilitados
}
// =========================================================
//            FIM DA NOVA INTERFACES PARA CONEXAO
// =========================================================

// =========================================================
//            NOVA INTERFACE: BugGameState
// =========================================================
export interface BugGameState {
  currentRoundWord: BugWord | null;
  currentBugBoard: BugBoard | null; // O tabuleiro selecionado para a rodada
  gameStatus: GameStatus;
  currentTurnTeam: TeamColor | null; // A equipe cuja vez é de sortear
  guessingTeam: TeamColor | null; // A equipe que apertou o botão e está adivinhando
  bugWords: BugWord[];
  bugBoards: BugBoard[];
  isLoadingBugWords: boolean;
  isLoadingBugBoards: boolean;
  playedBugWordIds: string[];
  allCategories: Category[];
  activeBugCategoryIds: number[]; // Categorias ativas para as palavras BUG
  disabledTeamsForRound: Set<TeamColor>; // Times desabilitados APENAS para a rodada atual
  roundOptions: string[]; // Opções sorteadas para a equipe da vez (Ganhe 20, Perca 20, etc.)
  selectedRoundOption: string | null; // Opção escolhida pela equipe
  revealedBoardTiles: Set<string>; // 'row-col' para os tiles já revelados no tabuleiro
  // Adicione outras propriedades de estado conforme a complexidade do jogo exigir
}
// =========================================================
//            FIM DA NOVA INTERFACES PARA BUG
// =========================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

// NOVA INTERFACE: Para um item de Toast
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  timeoutId?: number; // O ID do timer para remover o toast (opcional, pois pode ser removido manualmente)
}