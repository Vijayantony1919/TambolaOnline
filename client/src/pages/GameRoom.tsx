import { useGame } from '@/lib/game-context';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Play, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { Ticket } from '@/components/game/Ticket';
import { Board } from '@/components/game/Board';
import { CurrentCall } from '@/components/game/CurrentCall';

export function GameRoom() {
  const { state, dispatch } = useGame();
  const user = state.players.find(p => p.id === 'user');

  if (!user) return null;

  if (state.status === 'lobby' || state.status === 'ended') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-brand-dark tracking-tight font-heading">Tambola<span className="text-primary">Lite</span></h1>
            <p className="text-muted-foreground text-lg">Fast, fun, online Housie.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-border space-y-6">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-brand-dark">{state.players.length} Players</p>
                    <p className="text-sm text-muted-foreground">Ready to join</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'ADD_BOT' })}>
                  + Add Bot
                </Button>
             </div>

             {state.status === 'ended' && (
               <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 font-medium">
                 Game Over!
                 <Button variant="link" className="text-green-700 p-0 h-auto ml-2 font-bold" onClick={() => dispatch({ type: 'RESET' })}>Play Again</Button>
               </div>
             )}

             <Button 
              size="lg" 
              className="w-full text-xl h-16 font-bold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 rounded-2xl"
              onClick={() => dispatch({ type: 'START_GAME' })}
            >
              <Play className="mr-2 w-6 h-6 fill-current" /> Play Now
             </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Bar */}
      <header className="bg-white border-b border-border sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-heading font-black text-xl tracking-tight text-brand-dark cursor-pointer" onClick={() => dispatch({type: 'RESET'})}>
            Tambola<span className="text-primary">Lite</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center px-3 py-1 bg-slate-100 rounded-full gap-2 text-sm font-medium text-slate-600 border border-slate-200">
               <Clock size={14} />
               <span>Running</span>
             </div>
             <Button size="sm" variant="secondary" className="font-bold text-brand-dark" onClick={() => dispatch({type: 'RESET'})}>
               Leave
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Col: Board & Game Info (Desktop: 4 cols) */}
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
           <div className="hidden lg:block">
             <Board />
           </div>
           
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-border">
             <h3 className="font-bold text-sm text-muted-foreground uppercase mb-4 tracking-wider">Prizes</h3>
             <div className="space-y-2">
               {['Early 5', 'Top Line', 'Middle Line', 'Bottom Line', 'Full House'].map((prize) => (
                 <div key={prize} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
                   <div className="flex items-center gap-3">
                     <div className="p-1.5 bg-white rounded-full shadow-sm">
                        <Trophy size={14} className="text-yellow-500" />
                     </div>
                     <span className="text-sm font-bold text-slate-700">{prize}</span>
                   </div>
                   <Button size="sm" variant="outline" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-primary hover:text-primary-foreground border-primary/20">
                     Claim
                   </Button>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Center/Right Col: Current Call & Tickets (Desktop: 8 cols) */}
        <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
           <div className="bg-white rounded-[2rem] shadow-sm border border-border overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary to-orange-400" />
             <CurrentCall />
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-brand-dark flex items-center gap-3">
                  Your Ticket
                  <span className="bg-primary/10 text-primary-dark border border-primary/20 text-xs px-2 py-0.5 rounded-full font-bold">Ticket #1</span>
                </h2>
              </div>
              
              <Ticket 
                data={user.tickets[0]} 
                onMark={(r, c) => dispatch({ type: 'MARK_CELL', playerId: user.id, ticketIndex: 0, rowIndex: r, colIndex: c })}
              />
           </div>

           {/* Mobile Board (Visible only on mobile) */}
           <div className="lg:hidden mt-8">
              <Board />
           </div>
        </div>
      </main>
    </div>
  );
}
