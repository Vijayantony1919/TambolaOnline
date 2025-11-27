import { useEffect, useRef, useState } from 'react';
import type { GameRoom, GamePlayer } from '@shared/schema';

interface GameState {
  room: GameRoom | null;
  players: GamePlayer[];
}

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState>({ room: null, players: [] });
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'game_state') {
        setGameState({
          room: data.room,
          players: data.players,
        });
      } else if (data.type === 'room_created' || data.type === 'room_joined') {
        console.log('Room action:', data);
      } else if (data.type === 'error') {
        console.error('WebSocket error:', data.message);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const send = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { send, gameState, connected };
}
