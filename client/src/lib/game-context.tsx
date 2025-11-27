import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { GameState, GameStatus, Player, generateTicket, generateBotPlayer, INITIAL_GAME_STATE } from './game-logic';

type Action =
  | { type: 'START_GAME' }
  | { type: 'TICK' } // Timer tick for drawing numbers
  | { type: 'MARK_CELL'; playerId: string; ticketIndex: number; rowIndex: number; colIndex: number }
  | { type: 'ADD_BOT' }
  | { type: 'RESET' };

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        status: 'countdown',
        calledNumbers: [],
        currentNumber: null,
      };

    case 'TICK':
      if (state.status === 'countdown') {
        // Transition to running after brief countdown (mocked here by just switching)
        return { ...state, status: 'running' };
      }
      
      if (state.status !== 'running') return state;

      // Draw a new number
      const available = Array.from({ length: 90 }, (_, i) => i + 1).filter(
        n => !state.calledNumbers.includes(n)
      );

      if (available.length === 0) {
        return { ...state, status: 'ended' };
      }

      const nextNum = available[Math.floor(Math.random() * available.length)];
      return {
        ...state,
        currentNumber: nextNum,
        calledNumbers: [nextNum, ...state.calledNumbers], // Prepend for recent list
      };

    case 'MARK_CELL': {
      // Deep clone to update nested ticket state
      const players = [...state.players];
      const playerIdx = players.findIndex(p => p.id === action.playerId);
      if (playerIdx === -1) return state;

      const player = { ...players[playerIdx] };
      player.tickets = [...player.tickets];
      const ticket = [...player.tickets[action.ticketIndex]];
      
      // Toggle mark
      const cell = ticket[action.rowIndex][action.colIndex];
      if (cell) {
        ticket[action.rowIndex][action.colIndex] = { ...cell, marked: !cell.marked };
      }
      
      player.tickets[action.ticketIndex] = ticket as any;
      players[playerIdx] = player;
      
      return { ...state, players };
    }

    case 'ADD_BOT':
      return {
        ...state,
        players: [...state.players, generateBotPlayer(`bot-${Date.now()}`, `Player ${state.players.length + 1}`)],
      };

    case 'RESET':
      return {
        ...INITIAL_GAME_STATE,
        players: state.players.map(p => ({ ...p, tickets: [generateTicket()] })), // Regen tickets
      };

    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  // Initialize with one human player
  const [state, dispatch] = useReducer(gameReducer, {
    ...INITIAL_GAME_STATE,
    players: [{ 
      id: 'user', 
      name: 'You', 
      isBot: false, 
      tickets: [generateTicket()],
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You' 
    }],
  });

  // Game Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.status === 'running') {
      interval = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, state.callIntervalMs);
    } else if (state.status === 'countdown') {
       // Quick countdown transition
       setTimeout(() => dispatch({ type: 'TICK' }), 3000);
    }

    return () => clearInterval(interval);
  }, [state.status, state.callIntervalMs]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
