import { motion, AnimatePresence } from 'framer-motion';
import { TicketData, Cell } from '@/lib/game-logic';
import { cn } from '@/lib/utils';

interface TicketProps {
  data: TicketData;
  onMark: (rowIndex: number, colIndex: number) => void;
  color?: string; // e.g., 'yellow', 'blue'
  isUser?: boolean;
}

export function Ticket({ data, onMark, color = 'yellow', isUser = true }: TicketProps) {
  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-border overflow-hidden select-none">
      {/* Header / Deco strip */}
      <div className={cn("h-2 w-full", isUser ? "bg-primary" : "bg-slate-200")} />
      
      <div className="p-2 grid grid-rows-3 gap-1">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-9 gap-1">
            {row.map((cell, colIndex) => (
              <TicketCell 
                key={colIndex} 
                cell={cell} 
                onClick={() => isUser && onMark(rowIndex, colIndex)}
                isUser={isUser}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TicketCell({ cell, onClick, isUser }: { cell: Cell, onClick: () => void, isUser: boolean }) {
  if (!cell) {
    return <div className="aspect-[4/5] bg-slate-50/50 rounded-md" />;
  }

  return (
    <motion.button
      whileTap={isUser ? { scale: 0.9 } : {}}
      onClick={onClick}
      className={cn(
        "aspect-[4/5] flex items-center justify-center text-lg font-bold rounded-md transition-colors duration-200 relative overflow-hidden",
        cell.marked 
          ? "bg-primary text-primary-foreground shadow-inner" 
          : "bg-white hover:bg-accent text-slate-700 border border-slate-100 shadow-xs",
        !isUser && "cursor-default"
      )}
      data-testid={`cell-${cell.number}`}
    >
      {/* Circle decoration for marked state */}
      {cell.marked && (
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          className="absolute inset-0 m-auto w-full h-full bg-white rounded-full"
        />
      )}
      <span className="relative z-10 font-heading">{cell.number}</span>
    </motion.button>
  );
}
