import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Pause, Square, History, Home, Settings, Volume2, VolumeX, CheckCircle, Activity, ChevronLeft } from 'lucide-react';

// --- Types ---
type View = 'splash' | 'home' | 'session' | 'history' | 'settings';

type SessionPhase = 'entry' | 'immersion' | 'return';

interface SessionRecord {
  id: string;
  date: string;
  duration: number; // in seconds
  completed: boolean;
}

// --- Audio Engine (Generative Brown Noise) ---
// Uses Web Audio API to generate calming noise without external assets
class AudioEngine {
  ctx: AudioContext | null = null;
  gainNode: GainNode | null = null;
  source: AudioBufferSourceNode | null = null;
  isPlaying: boolean = false;

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.gain.value = 0.5; // Default volume
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  start() {
    if (!this.ctx || !this.gainNode) this.init();
    if (this.isPlaying) return;

    // Create Brown Noise Buffer (5 seconds loop is enough for noise)
    const bufferSize = this.ctx!.sampleRate * 5;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    
    // Brown noise algorithm
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      data[i] = lastOut * 3.5; // Compensate gain
      data[i] *= 0.1; // Lower base volume to be subtle
    }

    this.source = this.ctx!.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;
    this.source.connect(this.gainNode!);
    this.source.start();
    this.isPlaying = true;
    
    // Fade in
    this.gainNode!.gain.cancelScheduledValues(this.ctx!.currentTime);
    this.gainNode!.gain.setValueAtTime(0, this.ctx!.currentTime);
    this.gainNode!.gain.linearRampToValueAtTime(0.5, this.ctx!.currentTime + 2);
  }

  stop() {
    if (!this.isPlaying || !this.source || !this.ctx) return;
    
    // Fade out
    const currentTime = this.ctx.currentTime;
    this.gainNode?.gain.cancelScheduledValues(currentTime);
    this.gainNode?.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
    this.gainNode?.gain.linearRampToValueAtTime(0, currentTime + 1);

    setTimeout(() => {
      this.source?.stop();
      this.source?.disconnect();
      this.isPlaying = false;
    }, 1000);
  }
}

const audioEngine = new AudioEngine();

// --- Components ---

const Splash = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50 animate-fade-out">
      <div className="text-center animate-pulse-slow">
        <div className="w-16 h-16 border-4 border-zinc-100 rounded-full mx-auto mb-4 opacity-80"></div>
        <h1 className="text-4xl font-light tracking-[0.2em] text-zinc-100">BHVD</h1>
      </div>
    </div>
  );
};

const PhaseIndicator = ({ currentPhase }: { currentPhase: SessionPhase }) => {
  const phases = [
    { id: 'entry', label: 'Entry' },
    { id: 'immersion', label: 'Immersion' },
    { id: 'return', label: 'Return' },
  ];

  return (
    <div className="flex justify-center space-x-2 mb-8">
      {phases.map((p) => (
        <div 
          key={p.id} 
          className={`flex flex-col items-center transition-all duration-500 ${currentPhase === p.id ? 'opacity-100 scale-105' : 'opacity-30 scale-95'}`}
        >
          <div className={`h-1 w-16 rounded-full mb-2 ${currentPhase === p.id ? 'bg-teal-400' : 'bg-zinc-600'}`} />
          <span className="text-xs uppercase tracking-widest text-zinc-400">{p.label}</span>
        </div>
      ))}
    </div>
  );
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const SessionView = ({ onComplete, onExit }: { onComplete: (duration: number) => void, onExit: () => void }) => {
  // Configuration
  const TOTAL_TIME = 20 * 60; // 20 minutes default
  const PHASE_1_END = 2 * 60; // Entry ends at 2m
  const PHASE_2_END = 18 * 60; // Immersion ends at 18m
  // Phase 3 ends at 20m

  const [timeLeft, setTimeLeft] = useState(0); // Count UP timer logic for simplicity in this demo
  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  
  // Calculate phase
  const phase: SessionPhase = useMemo(() => {
    if (elapsed < PHASE_1_END) return 'entry';
    if (elapsed < PHASE_2_END) return 'immersion';
    return 'return';
  }, [elapsed]);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isActive && elapsed < TOTAL_TIME) {
      interval = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    } else if (elapsed >= TOTAL_TIME) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, elapsed]);

  // Audio control
  useEffect(() => {
    if (isActive && isAudioOn) {
      audioEngine.start();
    } else {
      audioEngine.stop();
    }
    return () => audioEngine.stop();
  }, [isActive, isAudioOn]);

  const togglePlay = () => setIsActive(!isActive);
  
  const handleComplete = () => {
    audioEngine.stop();
    onComplete(elapsed);
  };

  const progress = (elapsed / TOTAL_TIME) * 100;

  return (
    <div className="flex flex-col items-center justify-between h-full py-12 px-6 animate-fade-in">
      <div className="w-full flex justify-between items-center">
        <button onClick={onExit} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Square size={20} fill="currentColor" />
        </button>
        <div className="text-zinc-500 text-xs tracking-widest">SESSION IN PROGRESS</div>
        <button onClick={() => setIsAudioOn(!isAudioOn)} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
           {isAudioOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <PhaseIndicator currentPhase={phase} />
        
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
           {/* Ring Background */}
           <svg className="absolute inset-0 w-full h-full transform -rotate-90">
             <circle
               cx="128" cy="128" r="120"
               stroke="currentColor"
               strokeWidth="2"
               fill="transparent"
               className="text-zinc-800"
             />
             <circle
               cx="128" cy="128" r="120"
               stroke="currentColor"
               strokeWidth="2"
               fill="transparent"
               strokeDasharray={2 * Math.PI * 120}
               strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
               className="text-teal-400 transition-all duration-1000 ease-linear"
             />
           </svg>
           
           <div className="text-6xl font-light text-zinc-100 font-mono tracking-tighter">
             {formatTime(TOTAL_TIME - elapsed)}
           </div>
        </div>
        
        <p className="text-zinc-500 italic">
            {phase === 'entry' && "Prepare your mind..."}
            {phase === 'immersion' && "Focus on the sound..."}
            {phase === 'return' && "Gently come back..."}
        </p>
      </div>

      <div className="mb-8">
        <button 
          onClick={togglePlay}
          className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-950 hover:scale-105 active:scale-95 transition-transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]"
        >
          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1"/>}
        </button>
      </div>
    </div>
  );
};

const HistoryView = ({ history, onBack }: { history: SessionRecord[], onBack: () => void }) => {
  return (
    <div className="h-full flex flex-col bg-zinc-950 animate-fade-in">
      <div className="p-6 border-b border-zinc-900 flex items-center">
        <button onClick={onBack} className="mr-4 text-zinc-400 hover:text-zinc-100 transition-colors p-1 hover:bg-zinc-900 rounded-full">
            <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-light text-zinc-100 tracking-wide">History</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                <History size={48} strokeWidth={1} />
                <p>No sessions yet.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {history.slice().reverse().map((session) => (
                    <div key={session.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <div className="text-zinc-100 text-sm mb-1">{new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                            <div className="text-zinc-500 text-xs">{new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-zinc-300 font-mono text-sm">{Math.floor(session.duration / 60)}m {session.duration % 60}s</span>
                            {session.completed && <CheckCircle size={16} className="text-teal-500" />}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

const SettingsView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="h-full flex flex-col bg-zinc-950 animate-fade-in">
      <div className="p-6 border-b border-zinc-900 flex items-center">
        <button onClick={onBack} className="mr-4 text-zinc-400 hover:text-zinc-100 transition-colors p-1 hover:bg-zinc-900 rounded-full">
            <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-light text-zinc-100 tracking-wide">Settings</h2>
      </div>
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm uppercase tracking-wider text-zinc-500">Preferences</h3>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
            <span className="text-zinc-300">NFC Auto-Start</span>
            <div className="w-10 h-6 bg-teal-500/20 rounded-full flex items-center p-1 justify-end cursor-pointer">
              <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
             <span className="text-zinc-300">Haptics</span>
             <div className="w-10 h-6 bg-zinc-800 rounded-full flex items-center p-1 justify-start cursor-pointer">
               <div className="w-4 h-4 bg-zinc-600 rounded-full"></div>
             </div>
          </div>
        </div>

        <div className="space-y-2">
            <h3 className="text-sm uppercase tracking-wider text-zinc-500">About</h3>
            <div className="text-zinc-600 text-sm">
                <p>Version 1.0.0</p>
                <p>Build 240512.1</p>
            </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ onStart, history, onHistory, onSettings }: { onStart: () => void, history: SessionRecord[], onHistory: () => void, onSettings: () => void }) => {
  const totalMinutes = useMemo(() => Math.floor(history.reduce((acc, curr) => acc + curr.duration, 0) / 60), [history]);
  const streak = useMemo(() => {
    if (history.length === 0) return 0;
    return history.length; 
  }, [history]);

  const handleStart = () => {
    audioEngine.init();
    onStart();
  };

  return (
    <div className="h-full flex flex-col p-6 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-12 pt-4">
            <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-zinc-100 rounded-full opacity-80"></div>
                <span className="font-bold tracking-widest text-zinc-100">BHVD</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-xs text-zinc-400">JD</span>
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-12">
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center space-x-2 text-zinc-500 mb-2">
                    <Activity size={16} />
                    <span className="text-xs uppercase tracking-wider">Streak</span>
                </div>
                <div className="text-3xl text-zinc-100 font-light">{streak} <span className="text-sm text-zinc-600">sessions</span></div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center space-x-2 text-zinc-500 mb-2">
                    <History size={16} />
                    <span className="text-xs uppercase tracking-wider">Total</span>
                </div>
                <div className="text-3xl text-zinc-100 font-light">{totalMinutes} <span className="text-sm text-zinc-600">min</span></div>
            </div>
        </div>

        {/* Main Action */}
        <div className="flex-1 flex items-center justify-center relative">
            {/* Glow Effect */}
            <div className="absolute w-64 h-64 bg-teal-900/20 blur-3xl rounded-full"></div>
            
            <button 
                onClick={handleStart}
                className="relative z-10 w-48 h-48 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex flex-col items-center justify-center hover:scale-105 transition-all duration-300 group shadow-2xl"
            >
                <Play size={32} className="text-zinc-100 mb-2 group-hover:text-teal-400 transition-colors" fill="currentColor" />
                <span className="text-zinc-400 text-sm tracking-widest group-hover:text-zinc-100">START</span>
            </button>
        </div>

        {/* Footer Nav */}
        <div className="mt-auto pt-8 flex justify-between items-center px-8 border-t border-zinc-900/50">
            <button className="flex flex-col items-center space-y-1 text-zinc-100">
                <Home size={20} />
                <span className="text-[10px] uppercase tracking-wider">Home</span>
            </button>
            <button onClick={onHistory} className="flex flex-col items-center space-y-1 text-zinc-600 hover:text-zinc-300 transition-colors">
                <History size={20} />
                <span className="text-[10px] uppercase tracking-wider">History</span>
            </button>
            <button onClick={onSettings} className="flex flex-col items-center space-y-1 text-zinc-600 hover:text-zinc-300 transition-colors">
                <Settings size={20} />
                <span className="text-[10px] uppercase tracking-wider">Settings</span>
            </button>
        </div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<View>('splash');
  const [history, setHistory] = useState<SessionRecord[]>(() => {
    const saved = localStorage.getItem('bhvd_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist history
  useEffect(() => {
    localStorage.setItem('bhvd_history', JSON.stringify(history));
  }, [history]);

  const handleSessionComplete = (duration: number) => {
    const newRecord: SessionRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration,
        completed: true
    };
    setHistory([...history, newRecord]);
    setView('home');
  };

  const handleSessionExit = () => {
    if (window.confirm("End session early?")) {
        setView('home');
    }
  }

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen font-sans antialiased selection:bg-teal-500/30">
      <div className="max-w-md mx-auto h-[100dvh] bg-zinc-950 shadow-2xl relative overflow-hidden border-x border-zinc-900">
        {view === 'splash' && <Splash onComplete={() => setView('home')} />}
        
        {view === 'home' && (
            <Dashboard 
                onStart={() => setView('session')} 
                history={history}
                onHistory={() => setView('history')}
                onSettings={() => setView('settings')}
            />
        )}
        
        {view === 'session' && (
            <SessionView 
                onComplete={handleSessionComplete} 
                onExit={handleSessionExit}
            />
        )}

        {view === 'history' && (
            <HistoryView 
                history={history}
                onBack={() => setView('home')}
            />
        )}

        {view === 'settings' && (
            <SettingsView
                onBack={() => setView('home')}
            />
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);