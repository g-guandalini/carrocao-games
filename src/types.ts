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
  hint: string; // NOVA propriedade
}

export type GameStatus = 'idle' | 'hint' | 'revealing' | 'guessing' | 'finished'; // NOVO status 'hint'

export interface GameState {
  currentRoundCharacter: Character | null;
  revealProgress: number;
  gameStatus: GameStatus;
  activeTeam: TeamColor | null;
  guess: string;
  score: Record<TeamColor, number>;
  characters: Character[];
}

export type ToastType = 'success' | 'error' | 'info'; // NOVO tipo para toasts

export interface Toast { // NOVA interface para toasts
  id: number;
  message: string;
  type: ToastType;
  timeoutId?: number;
}