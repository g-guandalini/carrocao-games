// src/store/imagemOcultaStore.ts
import { reactive } from 'vue';
import { GameState, TeamColor, Character, GameStatus } from '../types';
import { addToast } from './toastStore';

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

const initialRoundState = () => ({
  currentRoundCharacter: null as Character | null,
  revealProgress: 0,
  gameStatus: 'idle' as GameStatus,
  activeTeam: null as TeamColor | null,
});

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

// Renomeado para imagemOcultaStore
export const imagemOcultaStore = reactive<GameState>({ ...initialState });

let revealInterval: number | null = null;
const REVEAL_DURATION_MS = 30000;
const REVEAL_STEP_MS = 100;

function pickRandomCharacter(): Character {
  const availableCharacters = imagemOcultaStore.characters.filter(char => char.id !== imagemOcultaStore.currentRoundCharacter?.id);
  if (availableCharacters.length === 0) {
      addToast('Todos os personagens foram jogados! Reiniciando a lista.', 'info');
      imagemOcultaStore.characters = ALL_CHARACTERS;
      return imagemOcultaStore.characters[Math.floor(Math.random() * imagemOcultaStore.characters.length)];
  }
  return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
}

export function startNewRound() {
  stopReveal();
  Object.assign(imagemOcultaStore, initialRoundState());
  imagemOcultaStore.currentRoundCharacter = pickRandomCharacter();
  imagemOcultaStore.gameStatus = 'hint';
}

export function proceedToReveal() {
  if (!imagemOcultaStore.currentRoundCharacter) {
    addToast('Erro: Nenhum personagem selecionado para iniciar a revelação.', 'error');
    return;
  }
  imagemOcultaStore.gameStatus = 'revealing';
  revealInterval = setInterval(() => {
    imagemOcultaStore.revealProgress += REVEAL_STEP_MS / REVEAL_DURATION_MS;
    if (imagemOcultaStore.revealProgress >= 1) {
      imagemOcultaStore.revealProgress = 1;
      stopReveal();
      imagemOcultaStore.gameStatus = 'finished';
      addToast(`Tempo esgotado! A imagem completa era: <strong>${imagemOcultaStore.currentRoundCharacter?.name}</strong>`, 'info');
    }
  }, REVEAL_STEP_MS) as unknown as number;
}

export function stopReveal() {
  if (revealInterval) {
    clearInterval(revealInterval);
    revealInterval = null;
  }
}

export function selectTeam(team: TeamColor) {
  if (imagemOcultaStore.gameStatus === 'revealing') {
    stopReveal();
    imagemOcultaStore.activeTeam = team;
    imagemOcultaStore.gameStatus = 'guessing';
    addToast(`Equipe <strong>${team}</strong> irá palpitar!`, 'info');
  }
}

export function handleOperatorFeedback(isCorrect: boolean, scoreAwarded: number) {
  if (!imagemOcultaStore.activeTeam || !imagemOcultaStore.currentRoundCharacter) {
    console.warn("Feedback do operador recebido em um estado inválido ou sem time ativo.");
    return;
  }

  if (isCorrect) {
    imagemOcultaStore.score[imagemOcultaStore.activeTeam] += scoreAwarded;
    addToast(`🎉 Equipe <strong>${imagemOcultaStore.activeTeam}</strong> acertou! Ganhou <strong>${scoreAwarded}</strong> pontos!`, 'success');
  } else {
    addToast(`❌ Equipe <strong>${imagemOcultaStore.activeTeam}</strong> errou! A resposta correta era: <strong>${imagemOcultaStore.currentRoundCharacter.name}</strong>.`, 'error');
  }
  
  imagemOcultaStore.revealProgress = 1;
  imagemOcultaStore.gameStatus = 'finished';
  imagemOcultaStore.activeTeam = null;
}

export function viewScoreboard() {
  imagemOcultaStore.gameStatus = 'scoreboard';
}

export function resetGameScores() {
    stopReveal();
    Object.assign(imagemOcultaStore.score, initialState.score);
    Object.assign(imagemOcultaStore, initialRoundState());
    imagemOcultaStore.gameStatus = 'idle';
}