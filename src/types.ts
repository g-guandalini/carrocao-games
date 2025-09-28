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
  }
  
  export interface GameState {
    currentRoundCharacter: Character | null;
    revealProgress: number; // 0 (completamente borrada) a 1 (nítida)
    gameStatus: 'idle' | 'revealing' | 'guessing' | 'finished';
    activeTeam: TeamColor | null;
    guess: string;
    score: Record<TeamColor, number>;
    characters: Character[];
  }