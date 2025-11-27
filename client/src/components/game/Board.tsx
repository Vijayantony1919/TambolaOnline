import { cn } from '@/lib/utils';

interface BoardProps {
  calledNumbers: number[];
  currentNumber: number | null;
}

export function Board({ calledNumbers, currentNumber }: BoardProps) {
  // Numbers 1-90
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Game Board</h3>
        <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">
          {calledNumbers.length} / 90 Called
        </span>
      </div>
      
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {numbers.map((num) => {
          const isCalled = calledNumbers.includes(num);
          const isRecent = currentNumber === num;

          return (
            <div
              key={num}
              className={cn(
                "aspect-square flex items-center justify-center text-[10px] sm:text-xs font-semibold rounded-full transition-all duration-500",
                isRecent 
                  ? "bg-primary text-primary-foreground scale-110 shadow-md z-10 ring-2 ring-white" 
                  : isCalled 
                    ? "bg-slate-200 text-slate-600" 
                    : "bg-slate-50 text-slate-300"
              )}
            >
              {num}
            </div>
          );
        })}
      </div>
    </div>
  );
}
