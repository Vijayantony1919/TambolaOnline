import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/lib/game-context';

export function CurrentCall() {
  const { state } = useGame();
  const current = state.currentNumber;
  const recent = state.calledNumbers.slice(1, 6); // Previous 5 numbers

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-10">
      <div className="relative">
        {/* Main Number Display */}
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-primary to-orange-400 shadow-xl flex items-center justify-center border-4 border-white ring-4 ring-primary/20">
           <AnimatePresence mode="popLayout">
            {current ? (
              <motion.span
                key={current}
                initial={{ y: 20, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 1.5 }}
                className="text-6xl sm:text-7xl font-black text-primary-foreground font-heading"
              >
                {current}
              </motion.span>
            ) : (
              <span className="text-xl font-bold text-primary-foreground/50 uppercase tracking-widest">Ready</span>
            )}
          </AnimatePresence>
        </div>
        
        {/* Pulse Effect */}
        {current && (
          <motion.div
            key={`pulse-${current}`}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-primary -z-10"
          />
        )}
      </div>

      {/* Recent Numbers Strip */}
      <div className="mt-6 flex items-center gap-2 h-10">
        <span className="text-xs font-semibold text-muted-foreground mr-2">PREV:</span>
        <AnimatePresence>
          {recent.map((num, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, x: -20, scale: 0 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold border border-slate-200"
            >
              {num}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
