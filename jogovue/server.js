const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { checkWinner } = require('./lib/game');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

// Inicializa a engine do Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Cria um servidor HTTP puro do Node
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    // Deixa o Next.js cuidar de todas as requisições HTTP normais (o Frontend)
    handle(req, res, parsedUrl);
  });

  // Acopla o Socket.IO no nosso servidor HTTP
  const io = new Server(httpServer);

  // --- ESTADO GLOBAL DO JOGO ---
  // Como é só localhost para duas pessoas, guardamos na memória do servidor
  let gameState = {
    board: Array(9).fill(null), // Tabuleiro vazio
    currentPlayer: 'X',         // X sempre começa
    players: {},                // Mapeia { socketId: 'X' ou 'O' }
    winner: null
  };

  // --- LÓGICA DE CONEXÃO E EVENTOS ---
  io.on('connection', (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);

    // Atribui X ou O baseado em quem já está na sala
    const connectedPlayers = Object.keys(gameState.players).length;
    if (connectedPlayers === 0) {
      gameState.players[socket.id] = 'X';
    } else if (connectedPlayers === 1) {
      gameState.players[socket.id] = 'O';
    } else {
      // Se já tiver 2 pessoas, o terceiro vira espectador (opcional)
      socket.emit('error', 'A sala já está cheia!');
    }

    // Envia o estado atualizado para quem acabou de entrar
    socket.emit('gameStateUpdate', gameState);

    // Escuta a jogada vinda do frontend
    socket.on('makeMove', (index) => {
      const playerSymbol = gameState.players[socket.id];

      // Validações de segurança (O Backend não confia no Frontend)
      if (!playerSymbol) return; // Não é um jogador válido
      if (gameState.winner) return; // O jogo já acabou
      if (gameState.currentPlayer !== playerSymbol) return; // Não é o turno do cara
      if (gameState.board[index] !== null) return; // A casa já está ocupada

      // Aplica a jogada
      gameState.board[index] = playerSymbol;

      // TODO para você: Implementar a função checkWinner(gameState.board)
      // Se houver vencedor, atualize gameState.winner = playerSymbol

    const { checkWinner } = require('./lib/game');

    

    checkWinner(gameState);
  

      gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';

      // Faz o Broadcast: avisa TODOS os clientes conectados sobre o novo tabuleiro
      io.emit('gameStateUpdate', gameState);
    });

    // Trata a desconexão (se o cara fechar a aba, reseta o jogo)
    socket.on('disconnect', () => {
      console.log(`Jogador desconectado: ${socket.id}`);
      delete gameState.players[socket.id];
      
      // Reseta o tabuleiro se alguém sair
      gameState.board = Array(9).fill(null);
      gameState.currentPlayer = 'X';
      gameState.winner = null;
      
      io.emit('gameStateUpdate', gameState);
    });
  });

  // Sobe o servidor na porta 3000
  httpServer.listen(port, () => {
    console.log(`> Servidor pronto em http://${hostname}:${port}`);
  });
});