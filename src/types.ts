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

// NOVA INTERFACE: Para uma Categoria
export interface Category {
  id: number;
  name: string;
}

// NOVA INTERFACE: Para um item de Imagem Oculta (para ADMIN, com categorias)
export interface ImagemOcultaItem {
  id: number;
  hint: string;
  answer: string;
  imageUrl: string;
  categories: Category[]; // Array de categorias associadas
}

// NOVA INTERFACE: Para a store de administração
export interface AdminState {
  categories: Category[];
  imagemOcultaItems: ImagemOcultaItem[];
  isLoadingCategories: boolean;
  isLoadingImagemOculta: boolean;
  selectedImagemOcultaItem: ImagemOcultaItem | null; // Para edição
}

export interface GameState {
  currentRoundCharacter: Character | null;
  revealProgress: number;
  gameStatus: GameStatus;
  activeTeam: TeamColor | null;
  characters: Character[];
  isLoadingCharacters: boolean;
  playedCharacterIds: string[]
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

// NOVA INTERFACE: Para um item de Toast
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  timeoutId?: number; // O ID do timer para remover o toast (opcional, pois pode ser removido manualmente)
}