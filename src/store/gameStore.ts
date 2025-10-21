// stores/gameStore.ts
import { reactive } from 'vue';
import { GameState, TeamColor, Character, GameStatus } from '../types';
import { toastStore, addToast } from './toastStore'; // <-- Importação CORRETA

// Lista de personagens para o jogo (com as novas dicas)
const ALL_CHARACTERS: Character[] = [
  { id: '1', name: 'Mickey Mouse', imageUrl: '/characters/mickey.png', hint: 'Um famoso rato falante de desenhos animados.' },
  { id: '2', name: 'Homem Aranha', imageUrl: '/characters/homem_aranha.png', hint: 'Um herói que escala paredes e solta teias.' },
  { id: '3', name: 'Pikachu', imageUrl: '/characters/pikachu.png', hint: 'Um monstrinho amarelo que libera choques elétricos.' },
  { id: '4', name: 'Goku', imageUrl: '/characters/goku.png', hint: 'Um guerreiro alienígena com cabelo espetado que adora lutar.' },
  { id: '5', name: 'Homem de Ferro', imageUrl: '/characters/homem_ferro.png', hint: 'Um bilionário que usa uma armadura de alta tecnologia.' },
  { id: '6', name: 'Batman', imageUrl: '/characters/batman.png', hint: 'O Cavaleiro das Trevas que protege Gotham City.' },
  { id: '7', name: 'Capitão America', imageUrl: '/characters/capitao_america.png', hint: 'Um super-soldado com um escudo patriótico.' },
  { id: '8', name: 'Mulher Maravilha', imageUrl: '/characters/mulher_maravilha.png', hint: 'Uma princesa amazona com um laço mágico.' },
];

// Estado inicial para uma rodada (sem resetar o placar)
const initialRoundState = () => ({
  currentRoundCharacter: null as Character | null,
  revealProgress: 0,
  gameStatus: 'idle' as GameStatus, // <-- Especificado o tipo para GameStatus
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
const REVEAL_DURATION_MS = 30000;
const REVEAL_STEP_MS = 100;

// Função auxiliar para selecionar um personagem aleatório
function pickRandomCharacter(): Character {
  const availableCharacters = gameStore.characters.filter(char => char.id !== gameStore.currentRoundCharacter?.id);
  if (availableCharacters.length === 0) {
      addToast('Todos os personagens foram jogados! Reiniciando a lista.', 'info'); // <-- USO CORRETO
      return gameStore.characters[Math.floor(Math.random() * gameStore.characters.length)];
  }
  return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
}

// Inicia uma nova rodada, começando pela fase de dica
export function startNewRound() {
  stopReveal();

  Object.assign(gameStore, initialRoundState());

  gameStore.currentRoundCharacter = pickRandomCharacter();
  gameStore.gameStatus = 'hint';
}

// Prossegue da fase de dica para a fase de revelação da imagem
export function proceedToReveal() {
  if (!gameStore.currentRoundCharacter) {
    addToast('Erro: Nenhum personagem selecionado para iniciar a revelação.', 'error'); // <-- USO CORRETO
    return;
  }
  gameStore.gameStatus = 'revealing';
  revealInterval = setInterval(() => {
    gameStore.revealProgress += REVEAL_STEP_MS / REVEAL_DURATION_MS;
    if (gameStore.revealProgress >= 1) {
      gameStore.revealProgress = 1;
      stopReveal();
      gameStore.gameStatus = 'finished';
      addToast(`Tempo esgotado! A imagem completa era: <strong>${gameStore.currentRoundCharacter?.name}</strong>`, 'info'); // <-- USO CORRETO
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
    stopReveal();
    gameStore.activeTeam = team;
    gameStore.gameStatus = 'guessing';
  }
}

// Processa o palpite da equipe ativa
export function submitGuess(guessText: string) {
  if (gameStore.activeTeam && gameStore.gameStatus === 'guessing' && gameStore.currentRoundCharacter) {
    gameStore.guess = guessText;
    const isCorrect = gameStore.currentRoundCharacter.name.toLowerCase() === guessText.toLowerCase().trim();

    if (isCorrect) {
      gameStore.score[gameStore.activeTeam]++;
      addToast(`🎉 Equipe <strong>${gameStore.activeTeam}</strong> acertou! Placar: <strong>${gameStore.activeTeam}</strong> - <strong>${gameStore.score[gameStore.activeTeam]}</strong> pontos.`, 'success'); // <-- USO CORRETO
    } else {
      addToast(`❌ Equipe <strong>${gameStore.activeTeam}</strong> errou! A resposta correta era: <strong>${gameStore.currentRoundCharacter.name}</strong>.`, 'error'); // <-- USO CORRETO
    }
    gameStore.gameStatus = 'finished';
  }
}

// Reseta apenas os placares e o estado da rodada, voltando ao estado inicial
export function resetGameScores() {
    stopReveal();
    Object.assign(gameStore.score, initialState.score);
    Object.assign(gameStore, initialRoundState());
    gameStore.gameStatus = 'idle';
}