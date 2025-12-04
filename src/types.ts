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

export type GameStatus = 'idle' | 'hint' | 'revealing' | 'guessing' | 'finished' | 'scoreboard';

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

// NOVA INTERFACE: Para a store de administração
export interface AdminState {
  categories: Category[];
  imagemOcultaItems: ImagemOcultaItem[];
  conexaoItems: ConexaoAdminItem[]; // NOVO: para gerenciamento de conexões no admin
  isLoadingCategories: boolean;
  isLoadingImagemOculta: boolean;
  isLoadingConexao: boolean; // NOVO: para conexões
  selectedImagemOcultaItem: ImagemOcultaItem | null; 
  selectedConexaoItem: ConexaoAdminItem | null; // NOVO: para edição de conexão
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
  // selectedCategoryIds: number[]; // Removida, pois a seleção é automática
  allCategories: Category[]; // Nova propriedade para armazenar todas as categorias
  activeConexaoCategoryIds: number[]; // Nova propriedade para as categorias ativas na Conexão
  disabledTeams: Set<TeamColor>; // Conjunto de times desabilitados
}
// =========================================================
//            FIM DA NOVA INTERFACES PARA CONEXAO
// =========================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

// NOVA INTERFACE: Para um item de Toast
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  timeoutId?: number; // O ID do timer para remover o toast (opcional, pois pode ser removido manualmente)
}