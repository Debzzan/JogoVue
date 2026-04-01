"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type GameState = {
  board: ("X" | "O" | null)[];
  currentPlayer: "X" | "O";
  players: Record<string, "X" | "O">;
  winner: "X" | "O" | "draw" | null;
};

export default function Home() {
  const [board, setBoard] = useState<("X" | "O" | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<"X" | "O" | "draw" | null>(null);
  const [mySymbol, setMySymbol] = useState<"X" | "O" | null>(null);
  const [status, setStatus] = useState("Conectando...");

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Conectado. Aguardando o outro jogador...");
    });

    socket.on("gameStateUpdate", (state: GameState) => {
      setBoard(state.board);
      setCurrentPlayer(state.currentPlayer);
      setWinner(state.winner);

      if (!Object.keys(state.players).length) {
        setMySymbol(null);
        setStatus("Sala vazia. Atualize para recarregar.");
        return;
      }

      const symbol = socket.id ? state.players[socket.id] : undefined;
      setMySymbol(symbol || null);

      if (!symbol) {
        setStatus("Você é espectador (máximo 2 jogadores).");
      } else {
        setStatus(
          state.winner
            ? state.winner === "draw"
              ? "Empate!"
              : `Vencedor: ${state.winner}`
            : state.currentPlayer === symbol
            ? "É seu turno"
            : "Aguarde o oponente"
        );
      }
    });

    socket.on("error", (msg: string) => {
      setStatus(`Erro: ${msg}`);
    });

    return () => {
      socket.off("connect");
      socket.off("gameStateUpdate");
      socket.off("error");
      socket.disconnect();
    };
  }, []);

  const handleCellClick = (index: number) => {
    if (!socketRef.current || winner) return;
    if (board[index] !== null) return;
    if (!mySymbol) return;
    if (currentPlayer !== mySymbol) return;

    socketRef.current.emit("makeMove", index);
  };

  const getCellClassName = (value: string | null) =>
    `h-16 w-16 cursor-pointer select-none rounded border border-zinc-400 text-center text-4xl font-bold ${
      value ? (value === "X" ? "text-blue-600" : "text-red-600") : "text-zinc-600"
    }`;

  return (
    <div className="min-h-screen bg-zinc-100 p-4 text-zinc-800">
      <div className="mx-auto max-w-md rounded-xl bg-white p-4 shadow-md">
        <h1 className="mb-3 text-center text-2xl font-bold">Jogo da Velha</h1>
        <p className="mb-2 text-center text-sm text-zinc-600">{status}</p>
        <p className="mb-4 text-center text-sm text-zinc-600">Sua peça: {mySymbol || "-"}</p>
        <div className="grid grid-cols-3 gap-2">
          {board.map((value, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={getCellClassName(value)}
              disabled={Boolean(value) || Boolean(winner) || !mySymbol || currentPlayer !== mySymbol}
              aria-label={`célula ${idx + 1}`}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="mt-4 text-center text-sm text-zinc-500">
          {winner
            ? winner === "draw"
              ? "Empate! Reinicie a página para jogar de novo."
              : `Vitória de ${winner}! Reinicie a página para jogar de novo.`
            : ""}
        </div>
      </div>
    </div>
  );
}
