<!-- views/BugGameView.vue -->
<template>

  </template>
  
  <style scoped>
  .bug-game-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 80vh; /* Apenas para centralizar na tela */
    font-family: 'Poppins', sans-serif;
    color: #333;
  }
  .bug-game-view h1 {
    font-size: 2.5em;
    color: #e74c3c;
  }
  .bug-game-view p {
    font-size: 1.2em;
    margin-top: 15px;
  }
  .bug-game-view button {
    margin-top: 30px;
    padding: 10px 20px;
    font-size: 1em;
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  .bug-game-view button:hover {
    background-color: #27ae60;
  }
  </style>