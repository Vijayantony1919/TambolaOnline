import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TicketData, Cell } from '@/lib/game-logic';
import { cn } from '@/lib/utils';

interface TicketProps {
  data: TicketData;
  onMark?: (rowIndex: number, colIndex: number) => void;
  color?: string; // e.g., 'yellow', 'blue'
  isUser?: boolean;
}

export function Ticket({ data, onMark, color = 'yellow', isUser = true }: TicketProps) {
  // Local selection state so the ticket behaves like a grid of checkboxes
  // We key by cell.id so we can handle re-renders correctly.
  const initialSelected = useMemo(() => {
    const ids = new Set<string>();
    data.forEach(row =>
      row.forEach(cell => {
        if (cell && cell.marked) ids.add(cell.id);
      })
    );
    return ids;
  }, [data]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelected);

  const handleCellClick = (rowIndex: number, colIndex: number, cell: Cell) => {
    if (!isUser || !cell) return;

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(cell.id)) {
        next.delete(cell.id);
      } else {
        next.add(cell.id);
      }
      return next;
    });

    // still notify the backend if provided
    if (onMark) {
      onMark(rowIndex, colIndex);
    }
  };

  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-border overflow-hidden select-none">
      {/* Header / Deco strip */}
      <div className={cn('h-2 w-full', isUser ? 'bg-primary' : 'bg-slate-200')} />

      <div className="p-2 grid grid-rows-3 gap-1">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-9 gap-1">
            {row.map((cell, colIndex) => {
              const isSelected =
                !!cell && (selectedIds.has(cell.id) || cell.marked);

              return (
                <TicketCell
                  key={colIndex}
                  cell={cell}
                  isSelected={isSelected}
                  isUser={isUser}
                  onClick={() => handleCellClick(rowIndex, colIndex, cell)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function TicketCell({
  cell,
  isSelected,
  onClick,
  isUser,
}: {
  cell: Cell;
  isSelected: boolean;
  onClick: () => void;
  isUser: boolean;
}) {
  if (!cell) {
    return <div className="aspect-[4/5] bg-slate-50/50 rounded-md" />;
  }

  return (
    <motion.button
      type="button"
      whileTap={isUser ? { scale: 0.9 } : {}}
      onClick={onClick}
      className={cn(
        'aspect-[4/5] flex items-center justify-center text-lg font-semibold rounded-md transition-colors duration-200 relative overflow-hidden',
        isSelected
          ? 'bg-primary text-primary-foreground shadow-inner'
          : 'bg-white hover:bg-accent text-slate-700 border border-slate-100 shadow-xs',
        !isUser && 'cursor-default'
      )}
      data-testid={`cell-${cell.number}`}
    >
      {isSelected && (
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
