import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWebSocket } from './websocket';
import type { GameRoom, GamePlayer } from '@shared/schema';

type GameMode = 'solo' | 'friends';
type GameStatus = 'mode-selection' | 'create-room' | 'lobby' | 'countdown' | 'running' | 'ended';

interface LocalGameState {
  status: GameStatus;
  mode: GameMode;
  myPlayerId: string | null;
}

const GameContext = createContext<{
  localState: LocalGameState;
  room: GameRoom | null;
  players: GamePlayer[];
  myPlayer: GamePlayer | null;
  connected: boolean;
  selectMode: (mode: GameMode) => void;
  createRoom: (playerName: string) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  startGame: () => void;
  markCell: (playerId: string, ticketIndex: number, rowIndex: number, colIndex: number) => void;
  reset: () => void;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { send, gameState, connected } = useWebSocket();
  const [localState, setLocalState] = useState<LocalGameState>({
    status: 'mode-selection',
    mode: 'solo',
    myPlayerId: null,
  });

  // Sync room status with local state
  useEffect(() => {
    if (gameState.room) {
      const status = gameState.room.status as GameStatus;
      setLocalState(prev => ({ ...prev, status }));
      
      // Auto-set my player ID if not set
      if (!localState.myPlayerId && gameState.players.length > 0) {
        setLocalState(prev => ({ 
          ...prev, 
          myPlayerId: gameState.players[0].id 
        }));
      }
    }
  }, [gameState.room?.status, gameState.players.length]);

  // Voice synthesis for number calling
  useEffect(() => {
    if (gameState.room?.currentNumber && gameState.room?.status === 'running') {
      const text = gameState.room.currentNumber.toString();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        v => v.name.includes('Google US English') || 
             v.name.includes('Samantha') || 
             v.name.includes('Female')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      
      window.speechSynthesis.speak(utterance);
    }
  }, [gameState.room?.currentNumber]);

  const selectMode = (mode: GameMode) => {
    setLocalState({
      status: mode === 'solo' ? 'lobby' : 'create-room',
      mode,
      myPlayerId: null,
    });
  };

  const createRoom = (playerName: string) => {
    send({ type: 'create_room', playerName });
  };

  const joinRoom = (roomCode: string, playerName: string) => {
    send({ type: 'join_room', roomCode, playerName });
  };

  const startGame = () => {
    if (gameState.room) {
      send({ type: 'start_game', roomCode: gameState.room.roomCode });
    }
  };

  const markCell = (playerId: string, ticketIndex: number, rowIndex: number, colIndex: number) => {
    if (gameState.room) {
      send({
        type: 'mark_cell',
        roomCode: gameState.room.roomCode,
        playerId,
        ticketIndex,
        rowIndex,
        colIndex,
      });
    }
  };

  const reset = () => {
    setLocalState({
      status: 'mode-selection',
      mode: 'solo',
      myPlayerId: null,
    });
  };

  const myPlayer = gameState.players.find(p => p.id === localState.myPlayerId) || null;

  return (
    <GameContext.Provider value={{
      localState,
      room: gameState.room,
      players: gameState.players,
      myPlayer,
      connected,
      selectMode,
      createRoom,
      joinRoom,
      startGame,
      markCell,
      reset,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
