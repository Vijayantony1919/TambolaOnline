import { useGame } from '@/lib/game-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Users, Play, Clock, ArrowLeft, Copy, Wifi, WifiOff, Bot } from 'lucide-react';
import { Ticket } from '@/components/game/Ticket';
import { Board } from '@/components/game/Board';
import { CurrentCall } from '@/components/game/CurrentCall';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export function GameRoom() {
  const { localState, room, players, myPlayer, connected, selectMode, createRoom, createSoloRoom, joinRoom, startGame, markCell, reset } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('Player');

  // Mode Selection Screen
  if (localState.status === 'mode-selection') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-brand-dark tracking-tight font-heading">Tambola<span className="text-primary">Lite</span></h1>
            <p className="text-muted-foreground text-lg">Choose your game mode</p>
            <div className="flex items-center justify-center gap-2 text-sm">
              {connected ? (
                <><Wifi className="w-4 h-4 text-green-500" /> <span className="text-green-600">Connected</span></>
              ) : (
                <><WifiOff className="w-4 h-4 text-red-500" /> <span className="text-red-600">Connecting...</span></>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl border border-border space-y-4">
            <Input 
              placeholder="Enter Your Name" 
              className="h-14 text-center text-lg font-medium"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />

            <div className="grid gap-3">
              <Button 
                size="lg" 
                className="h-20 text-lg font-bold rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={() => createSoloRoom(playerName)}
                disabled={!connected || !playerName.trim()}
              >
                <div className="flex flex-col items-center gap-1">
                  <Bot className="w-6 h-6" />
                  <span>Play Solo (vs 2 Bots)</span>
                </div>
              </Button>

              <Button 
                size="lg" 
                variant="secondary"
                className="h-20 text-lg font-bold rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 bg-brand-dark text-white hover:bg-brand-dark/90"
                onClick={() => selectMode('friends')}
                disabled={!connected}
              >
                 <div className="flex flex-col items-center gap-1">
                  <Users className="w-6 h-6" />
                  <span>Play with Friends</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create/Join Selection (Friends Mode)
  if (localState.status === 'create-room') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
           <Button variant="ghost" onClick={reset} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
           </Button>

           <div className="text-center space-y-2">
             <h2 className="text-3xl font-bold text-brand-dark font-heading">Play with Friends</h2>
             <p className="text-muted-foreground">Create a room or join an existing one</p>
           </div>

           <div className="bg-white p-6 rounded-3xl shadow-xl border border-border space-y-6">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold"
                onClick={() => createRoom(playerName)}
                disabled={!playerName.trim()}
              >
                Create New Game
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or join existing</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Input 
                  placeholder="Enter 4-digit Code" 
                  className="h-12 text-center text-lg tracking-widest font-mono uppercase"
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <Button 
                  size="lg" 
                  className="h-12 px-6"
                  disabled={joinCode.length !== 4 || !playerName.trim()}
                  onClick={() => joinRoom(joinCode, playerName)}
                >
                  Join
                </Button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Lobby
  if (localState.status === 'lobby' || localState.status === 'ended') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-brand-dark tracking-tight font-heading">Private Room</h1>
            {room && (
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-primary/20 shadow-sm cursor-pointer active:scale-95 transition-transform"
                onClick={() => {
                  navigator.clipboard.writeText(room.roomCode);
                  toast({ title: "Copied!", description: "Room code copied to clipboard" });
                }}
              >
                <span className="text-sm text-muted-foreground font-medium">Room Code:</span>
                <span className="text-xl font-mono font-bold text-primary tracking-wider">{room.roomCode}</span>
                <Copy className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-border space-y-6">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-brand-dark">{players.length} Players</p>
                    <p className="text-sm text-muted-foreground">Waiting for players...</p>
                  </div>
                </div>
             </div>
             
             {/* Player List */}
             <div className="flex flex-wrap gap-2 justify-center py-2">
               {players.map((p) => (
                 <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-full border border-slate-200">
                   <img src={p.avatar || ''} alt={p.name} className="w-6 h-6 rounded-full" />
                   <span className="text-sm font-medium">{p.name}</span>
                   {p.isHost && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Host</span>}
                 </div>
               ))}
             </div>

             {localState.status === 'ended' && (
               <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 font-medium">
                 Game Over!
                 <Button variant="link" className="text-green-700 p-0 h-auto ml-2 font-bold" onClick={reset}>New Game</Button>
               </div>
             )}

             <Button 
              size="lg" 
              className="w-full text-xl h-16 font-bold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 rounded-2xl"
              onClick={startGame}
              disabled={players.length < 2}
            >
              <Play className="mr-2 w-6 h-6 fill-current" /> Start Game
             </Button>
             
             {players.length < 2 && (
               <p className="text-xs text-muted-foreground">Waiting for at least one more player...</p>
             )}
          </div>
          
          <Button variant="ghost" onClick={reset}>
            Exit Room
          </Button>
        </div>
      </div>
    );
  }

  // Active Game
  if (!myPlayer || !room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  const ticketData = myPlayer.ticketData as any;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-border sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-heading font-black text-xl tracking-tight text-brand-dark cursor-pointer" onClick={reset}>
            Tambola<span className="text-primary">Lite</span>
          </div>
          <div className="flex items-center gap-3">
             {room.roomCode && (
               <div className="hidden sm:flex flex-col items-end mr-2">
                 <span className="text-[10px] text-muted-foreground font-bold uppercase">Room</span>
                 <span className="text-sm font-mono font-bold leading-none">{room.roomCode}</span>
               </div>
             )}
             <div className="hidden sm:flex items-center px-3 py-1 bg-slate-100 rounded-full gap-2 text-sm font-medium text-slate-600 border border-slate-200">
               <Clock size={14} />
               <span>{room.status === 'running' ? 'Running' : 'Countdown'}</span>
             </div>
             <Button size="sm" variant="secondary" className="font-bold text-brand-dark" onClick={reset}>
               Leave
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
           <div className="hidden lg:block">
             <Board calledNumbers={(room.calledNumbers as number[]) || []} currentNumber={room.currentNumber} />
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

        <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
           <div className="bg-white rounded-[2rem] shadow-sm border border-border overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary to-orange-400" />
             <CurrentCall currentNumber={room.currentNumber} calledNumbers={(room.calledNumbers as number[]) || []} />
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-brand-dark flex items-center gap-3">
                  Your Ticket
                  <span className="bg-primary/10 text-primary-dark border border-primary/20 text-xs px-2 py-0.5 rounded-full font-bold">Ticket #1</span>
                </h2>
              </div>
              
              <Ticket 
                data={ticketData[0]} 
                onMark={(r, c) => markCell(myPlayer.id, 0, r, c)}
              />
           </div>

           <div className="lg:hidden mt-8">
              <Board calledNumbers={(room.calledNumbers as number[]) || []} currentNumber={room.currentNumber} />
           </div>
        </div>
      </main>
    </div>
  );
}
