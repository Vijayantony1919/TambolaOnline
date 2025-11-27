
export type Cell = {
  number: number;
  marked: boolean;
  id: string;
} | null;

export type TicketRow = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];
export type TicketData = [TicketRow, TicketRow, TicketRow];

export type Player = {
  id: string;
  name: string;
  isBot: boolean;
  tickets: TicketData[];
  avatar?: string;
};

export type GameStatus = 'lobby' | 'countdown' | 'running' | 'paused' | 'ended';

export type GameState = {
  status: GameStatus;
  currentNumber: number | null;
  calledNumbers: number[];
  players: Player[];
  hostId: string;
  callIntervalMs: number;
};

// Ranges for each column: 1-9, 10-19, ..., 80-90
const COL_RANGES = [
  { min: 1, max: 9 },
  { min: 10, max: 19 },
  { min: 20, max: 29 },
  { min: 30, max: 39 },
  { min: 40, max: 49 },
  { min: 50, max: 59 },
  { min: 60, max: 69 },
  { min: 70, max: 79 },
  { min: 80, max: 90 },
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// A simplified generator that creates a visual valid ticket
// It may not satisfy strict Housie rules (like non-empty columns) every time, 
// but is sufficient for UI prototyping.
export function generateTicket(): TicketData {
  const ticket: TicketData = [
    Array(9).fill(null) as TicketRow,
    Array(9).fill(null) as TicketRow,
    Array(9).fill(null) as TicketRow,
  ];

  // Track used numbers to ensure uniqueness across the ticket
  const usedNumbers = new Set<number>();

  // For each row, pick 5 unique column indices
  for (let r = 0; r < 3; r++) {
    const cols = new Set<number>();
    while (cols.size < 5) {
      cols.add(getRandomInt(0, 8));
    }
    
    const sortedCols = Array.from(cols).sort((a, b) => a - b);

    for (const c of sortedCols) {
      const range = COL_RANGES[c];
      let num = getRandomInt(range.min, range.max);
      
      // Simple retry for uniqueness
      let attempts = 0;
      while (usedNumbers.has(num) && attempts < 100) {
        num = getRandomInt(range.min, range.max);
        attempts++;
      }
      
      usedNumbers.add(num);
      ticket[r][c] = { 
        number: num, 
        marked: false, 
        id: `cell-${r}-${c}-${Math.random().toString(36).substr(2, 9)}` 
      };
    }
  }

  // Post-processing: Sort columns vertically
  for (let c = 0; c < 9; c++) {
    const colNums: number[] = [];
    const colIndices: number[] = [];

    // Collect numbers in this column
    for (let r = 0; r < 3; r++) {
      if (ticket[r][c] !== null) {
        colNums.push(ticket[r][c]!.number);
        colIndices.push(r);
      }
    }

    // Sort numbers
    colNums.sort((a, b) => a - b);

    // Place back in order
    colIndices.forEach((r, i) => {
      if (ticket[r][c]) {
        ticket[r][c]!.number = colNums[i];
      }
    });
  }

  return ticket;
}

export function generateBotPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    isBot: true,
    tickets: [generateTicket()],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
  };
}

export const INITIAL_GAME_STATE: GameState = {
  status: 'lobby',
  currentNumber: null,
  calledNumbers: [],
  players: [],
  hostId: 'user',
  callIntervalMs: 2500, // 2.5 seconds per call
};
