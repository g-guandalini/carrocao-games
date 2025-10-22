// types.ts
export enum TeamColor {
  BLUE = 'Azul',
  RED = 'Vermelho',
  GREEN = 'Verde',
  YELLOW = 'Amarelo',
}

export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  hint: string;
}

// NOVO: Adicionado 'scoreboard' ao GameStatus
export type GameStatus = 'idle' | 'hint' | 'revealing' | 'guessing' | 'finished' | 'scoreboard';

export interface GameState {
  currentRoundCharacter: Character | null;
  revealProgress: number;
  gameStatus: GameStatus;
  activeTeam: TeamColor | null;
  score: Record<TeamColor, number>;
  characters: Character[];
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  timeoutId?: number;
}