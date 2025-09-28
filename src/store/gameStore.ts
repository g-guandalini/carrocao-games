import { reactive } from 'vue';
import { GameState, TeamColor, Character } from '../types';

// Lista de personagens para o jogo
const ALL_CHARACTERS: Character[] = [
  { id: '1', name: 'Mickey Mouse', imageUrl: '/characters/mickey.png' },
  { id: '2', name: 'Homem Aranha', imageUrl: '/characters/homem_aranha.png' },
  { id: '3', name: 'Pikachu', imageUrl: '/characters/pikachu.png' },
  { id: '4', name: 'Goku', imageUrl: '/characters/goku.png' },
  { id: '5', name: 'Homem de Ferro', imageUrl: '/characters/homem_ferro.png' },
  { id: '6', name: 'Batman', imageUrl: '/characters/batman.png' },
  { id: '7', name: 'Capitão America', imageUrl: '/characters/capitao_america.png' },
  { id: '8', name: 'Mulher Maravilha', imageUrl: '/characters/mulher_maravilha.png' },
];

// Estado inicial para uma rodada (sem resetar o placar)
const initialRoundState = () => ({
  currentRoundCharacter: null,
  revealProgress: 0, // 0 (completamente embaralhada) a 1 (nítida/reorganizada)
  gameStatus: 'idle' as 'idle' | 'revealing' | 'guessing' | 'finished',
  activeTeam: null as TeamColor | null,
  guess: '',
});

// Estado inicial completo do jogo, incluindo placar
const initialState: GameState = {
  ...initialRoundState(),
  score: {
    [TeamColor.BLUE]: 0,
    [TeamColor.RED]: 0,
    [TeamColor.GREEN]: 0,
    [TeamColor.YELLOW]: 0,
  },
  characters: ALL_CHARACTERS,
};

// O store reativo do jogo
export const gameStore = reactive<GameState>({ ...initialState });

let revealInterval: number | null = null;
const REVEAL_DURATION_MS = 30000; // 30 segundos para revelar completamente
const REVEAL_STEP_MS = 100; // Atualiza a cada 100ms

// Função auxiliar para selecionar um personagem aleatório
function pickRandomCharacter(): Character {
  const availableCharacters = gameStore.characters.filter(char => char.id !== gameStore.currentRoundCharacter?.id);
  if (availableCharacters.length === 0) {
      // Se todos os personagens foram usados, reinicia a lista
      return gameStore.characters[Math.floor(Math.random() * gameStore.characters.length)];
  }
  return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
}

// Inicia uma nova rodada do jogo
export function startNewRound() {
  stopReveal(); // Limpa qualquer intervalo anterior

  // Reseta o estado específico da rodada
  Object.assign(gameStore, initialRoundState());

  gameStore.currentRoundCharacter = pickRandomCharacter();
  gameStore.gameStatus = 'revealing';

  revealInterval = setInterval(() => {
    gameStore.revealProgress += REVEAL_STEP_MS / REVEAL_DURATION_MS;
    if (gameStore.revealProgress >= 1) {
      gameStore.revealProgress = 1; // Garante que atinge 1.0
      stopReveal();
      gameStore.gameStatus = 'finished'; // Ninguém adivinhou, imagem totalmente revelada
      alert(`Tempo esgotado! A imagem completa era ${gameStore.currentRoundCharacter?.name}.`);
    }
  }, REVEAL_STEP_MS) as unknown as number;
}

// Para a revelação da imagem
export function stopReveal() {
  if (revealInterval) {
    clearInterval(revealInterval);
    revealInterval = null;
  }
}

// Seleciona uma equipe quando um botão é pressionado
export function selectTeam(team: TeamColor) {
  if (gameStore.gameStatus === 'revealing') {
    stopReveal(); // Para a revelação
    gameStore.activeTeam = team;
    gameStore.gameStatus = 'guessing'; // Entra em modo de palpite
  }
}

// Processa o palpite da equipe ativa
export function submitGuess(guessText: string) {
  if (gameStore.activeTeam && gameStore.gameStatus === 'guessing' && gameStore.currentRoundCharacter) {
    gameStore.guess = guessText;
    const isCorrect = gameStore.currentRoundCharacter.name.toLowerCase() === guessText.toLowerCase().trim();

    if (isCorrect) {
      gameStore.score[gameStore.activeTeam]++;
      alert(`🎉 Equipe ${gameStore.activeTeam} acertou! Placar atual: ${gameStore.activeTeam} - ${gameStore.score[gameStore.activeTeam]} pontos.`);
    } else {
      alert(`❌ Equipe ${gameStore.activeTeam} errou! A resposta correta era: ${gameStore.currentRoundCharacter.name}.`);
    }
    gameStore.gameStatus = 'finished'; // A rodada termina após o palpite
  }
}

// Reseta apenas os placares e o estado da rodada, voltando ao estado inicial
export function resetGameScores() {
    stopReveal();
    Object.assign(gameStore.score, initialState.score); // Reseta apenas os placares
    Object.assign(gameStore, initialRoundState()); // Reseta o estado da rodada
    gameStore.gameStatus = 'idle'; // Volta ao estado ocioso para começar um novo jogo do zero
}