import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { GameState, GameStatus, Player, generateTicket, generateBotPlayer, INITIAL_GAME_STATE } from './game-logic';

type Action =
  | { type: 'SELECT_MODE'; mode: 'solo' | 'friends' }
  | { type: 'CREATE_ROOM' }
  | { type: 'JOIN_ROOM'; code: string }
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
    case 'SELECT_MODE':
      return {
        ...state,
        mode: action.mode,
        status: action.mode === 'solo' ? 'lobby' : 'create-room', // Simplify: friends mode goes to create/join choice
      };
    
    case 'CREATE_ROOM':
      return {
        ...state,
        status: 'lobby',
        roomCode: Math.floor(1000 + Math.random() * 9000).toString(),
        hostId: 'user',
      };

    case 'JOIN_ROOM':
      return {
        ...state,
        status: 'lobby',
        roomCode: action.code,
        hostId: 'other', // In a real app this would be dynamic
      };

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

  // Multiplayer Simulation Effect
  useEffect(() => {
    // If we are in a lobby in 'friends' mode
    if (state.status === 'lobby' && state.mode === 'friends') {
      
      // SCENARIO 1: YOU ARE HOST (Created Room)
      // Simulate players joining you
      if (state.hostId === 'user') {
         const timeouts: NodeJS.Timeout[] = [];
         
         // Friend 1 joins after 2 seconds
         if (state.players.length === 1) {
           timeouts.push(setTimeout(() => {
             dispatch({ type: 'ADD_BOT' }); // Re-using add bot to sim friend
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Pop sound
             audio.volume = 0.5;
             audio.play().catch(() => {});
           }, 2500));
         }
         
         // Friend 2 joins after 5 seconds
         if (state.players.length <= 2) {
            timeouts.push(setTimeout(() => {
             dispatch({ type: 'ADD_BOT' });
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
             audio.volume = 0.5;
             audio.play().catch(() => {});
           }, 5000));
         }

         return () => timeouts.forEach(clearTimeout);
      }
      
      // SCENARIO 2: YOU JOINED SOMEONE (Joined Room)
      // Simulate that a Host is already there if we are alone
      if (state.hostId === 'other' && state.players.length === 1) {
         // Immediate effect to show host
         dispatch({ type: 'ADD_BOT' }); // Simulating the host
      }
    }
  }, [state.status, state.mode, state.players.length, state.hostId]);

  // Voice Synthesis Effect
  useEffect(() => {
    if (state.currentNumber && state.status === 'running') {
      const text = state.currentNumber.toString();
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to select a female voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        v => v.name.includes('Google US English') || 
             v.name.includes('Samantha') || 
             v.name.includes('Female')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 0.8; // Slower rate
      utterance.pitch = 1.1; // Slightly higher pitch often sounds friendlier
      
      window.speechSynthesis.speak(utterance);
    }
  }, [state.currentNumber, state.status]);

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
