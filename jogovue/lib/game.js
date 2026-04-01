// jogovue/lib/game.js
function checkWinner(gameState) {
  const b = gameState.board;
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // linhas
    [0,3,6],[1,4,7],[2,5,8], // colunas
    [0,4,8],[2,4,6],         // diagonais
  ];

  for (const [a,b1,c] of lines) {
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
      gameState.winner = b[a];
      return;
    }
  }

  if (gameState.board.every(cell => cell !== null)) {
    gameState.winner = 'draw';
  }
}

module.exports = { checkWinner };