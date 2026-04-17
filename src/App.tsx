import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, RefreshCw, Volume2, VolumeX } from 'lucide-react';

const TRACKS = [
  { id: 1, title: 'Neon Cyber Drift (AI Gen)', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Synthetic Horizons (AI Gen)', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Digital Odyssey (AI Gen)', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const CANVAS_SIZE = 400;
const GRID_SIZE = 20;

export default function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Periodic variable for fake visualizer
  const [tick, setTick] = useState(0);

  // Music Player Logic
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    let int = setInterval(() => {
        if(isPlaying) setTick(t => t + 1);
    }, 150);
    return () => clearInterval(int);
  }, [isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Playback failed", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  const skipTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  // Snake Game Logic
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const dirRef = useRef({ x: 0, y: -1 });
  const nextDirRef = useRef({ x: 0, y: -1 });
  const foodRef = useRef({ x: 15, y: 15 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // Prevent scrolling
        if (!gameStarted && !gameOver) {
            setGameStarted(true);
            setIsPlaying(true); // Auto-start music when game starts
        }
      }
      
      if (e.key === 'ArrowUp' && dirRef.current.y === 0) nextDirRef.current = { x: 0, y: -1 };
      if (e.key === 'ArrowDown' && dirRef.current.y === 0) nextDirRef.current = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft' && dirRef.current.x === 0) nextDirRef.current = { x: -1, y: 0 };
      if (e.key === 'ArrowRight' && dirRef.current.x === 0) nextDirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);

  const resetGame = () => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = { x: 0, y: -1 };
    nextDirRef.current = { x: 0, y: -1 };
    foodRef.current = {
      x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setIsPlaying(true);
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Draw initial state if game not started
    if (!gameStarted && !gameOver) {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.font = '20px "Courier New", Courier, monospace';
        ctx.fillStyle = '#39FF14';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#39FF14';
        ctx.shadowBlur = 10;
        ctx.fillText('PRESS ANY ARROW KEY TO START', CANVAS_SIZE/2, CANVAS_SIZE/2);
        ctx.shadowBlur = 0;
        return;
    }

    if (gameOver) return;

    const maxCoord = CANVAS_SIZE / GRID_SIZE;

    const interval = setInterval(() => {
      // Update direction
      dirRef.current = nextDirRef.current;
      const dir = dirRef.current;
      const snake = [...snakeRef.current];
      const head = snake[0];
      
      const newHead = { x: head.x + dir.x, y: head.y + dir.y };

      // Check wall collisions
      if (
        newHead.x < 0 || newHead.x >= maxCoord ||
        newHead.y < 0 || newHead.y >= maxCoord ||
        snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameOver(true);
        return;
      }

      snake.unshift(newHead);

      // Check food collision
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        setScore(s => s + 10);
        // Find a free spot for food
        let newFood;
        while(true) {
            newFood = {
                x: Math.floor(Math.random() * maxCoord),
                y: Math.floor(Math.random() * maxCoord)
            };
            // Ensure food doesn't spawn on snake
            if(!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) break;
        }
        foodRef.current = newFood;
      } else {
        snake.pop();
      }

      snakeRef.current = snake;

      // Draw (clear everything to let CSS grid show through)
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw food
      ctx.fillStyle = '#FF00FF';
      ctx.shadowColor = '#FF00FF';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      // To match the HTML "border-radius: 50%" on the food element!
      ctx.arc(foodRef.current.x * GRID_SIZE + GRID_SIZE/2, foodRef.current.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw snake
      snake.forEach((segment, i) => {
        if (i === 0) {
            ctx.fillStyle = '#39FF14';
            ctx.shadowColor = '#39FF14';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = i % 2 === 0 ? 'rgba(57,255,20,0.6)' : 'rgba(57,255,20,0.4)';
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }
        ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      });
      ctx.shadowBlur = 0; // reset for next frame

    }, 85); // Game Speed

    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  return (
    <>
      <header className="h-[80px] shrink-0 border-b border-white/10 flex items-center justify-between px-5 md:px-[40px] bg-gradient-to-b from-[#0a0a0a] to-bg">
        <div className="text-[20px] md:text-[24px] font-[900] tracking-[4px] uppercase text-neon-cyan drop-shadow-[0_0_10px_var(--color-neon-cyan)]">NEON PULSE</div>
        <div className="flex gap-[40px]">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase text-text-dim tracking-[2px]">Current Score</span>
            <span className="font-mono text-[20px] md:text-[24px] text-neon-green leading-none">{score.toString().padStart(6, '0')}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col xl:grid xl:grid-cols-[280px_1fr_280px] gap-[20px] p-[20px] xl:p-[40px] items-center overflow-auto xl:overflow-hidden min-h-0 relative">
        <aside className="w-full xl:w-auto bg-surface border border-white/5 rounded-[12px] p-[20px] h-[300px] xl:h-[480px] flex flex-col shrink-0">
          <div className="text-[12px] uppercase tracking-[2px] text-text-dim mb-[20px] border-b border-white/10 pb-[10px]">Up Next</div>
          <ul className="list-none flex-1 overflow-y-auto">
            {TRACKS.map((track, i) => (
              <li 
                key={track.id} 
                onClick={() => setCurrentTrackIndex(i)} 
                className={`p-[12px] rounded-[8px] mb-[8px] cursor-pointer transition-all flex items-center gap-[12px] border ${currentTrackIndex === i ? 'bg-neon-cyan/10 border-neon-cyan/30' : 'border-transparent hover:bg-white/5'}`}
              >
                <span className="font-mono text-[12px] text-text-dim">{(i + 1).toString().padStart(2, '0')}</span>
                <div>
                  <h4 className="text-[14px] mb-[2px] leading-tight">{track.title.replace(' (AI Gen)', '')}</h4>
                  <p className="text-[11px] text-text-dim m-0">AI Synthesis • {(i + 2) * 2}:{15 + i * 10}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex justify-center items-center w-full relative z-10 p-2">
          <div className="canvas-mock w-[400px] max-w-full aspect-square relative border-2 border-neon-green shadow-[0_0_20px_rgba(57,255,20,0.2)]">
            <canvas 
              ref={canvasRef} 
              width={CANVAS_SIZE} 
              height={CANVAS_SIZE} 
              className="w-full h-full block relative z-10"
            />
            {gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                <h2 className="text-4xl font-bold text-neon-pink mb-2 drop-shadow-[0_0_15px_var(--color-neon-pink)] tracking-widest">CRASHED</h2>
                <p className="text-neon-cyan mb-8 tracking-wider font-mono text-lg">FINAL SCORE: {score}</p>
                <button 
                  onClick={resetGame}
                  className="flex items-center gap-2 px-8 py-3 border border-neon-green text-neon-green rounded hover:bg-neon-green/10 transition-all font-mono tracking-widest"
                >
                  <RefreshCw size={20} />
                  REBOOT
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="w-full xl:w-auto bg-surface border border-white/5 rounded-[12px] p-[20px] h-[300px] xl:h-[480px] flex flex-col shrink-0 relative">
          <div className="text-[12px] uppercase tracking-[2px] text-text-dim mb-[20px] border-b border-white/10 pb-[10px]">Game Stats</div>
          
          <div className="flex justify-between mb-[16px] text-[13px]">
            <span className="text-text-dim">Game Speed</span>
            <span className="text-neon-cyan font-mono">1.2x</span>
          </div>
          <div className="flex justify-between mb-[16px] text-[13px]">
            <span className="text-text-dim">Difficulty</span>
            <span className="text-neon-cyan font-mono">EXTREME</span>
          </div>
          <div className="flex justify-between mb-[16px] text-[13px]">
            <span className="text-text-dim">Multiplier</span>
             <span className="text-neon-cyan font-mono">x4</span>
          </div>
          <div className="flex justify-between mb-[16px] text-[13px]">
            <span className="text-text-dim">Status</span>
            <span className="text-neon-cyan font-mono flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${gameStarted && !gameOver ? 'bg-neon-green animate-pulse' : 'bg-neon-pink'}`} />
                {gameOver ? 'SYS_FAIL' : (gameStarted ? 'ONLINE' : 'STANDBY')}
            </span>
          </div>

          <div className="mt-auto flex items-end gap-[4px] h-[30px] justify-center opacity-60 mb-4">
            {[...Array(16)].map((_, i) => (
                <div 
                    key={i} 
                    className="w-2 rounded-t-[1px]"
                    style={{ 
                        backgroundColor: 'var(--color-neon-cyan)',
                        height: `${isPlaying ? Math.max(15, (Math.sin(tick + i) * 50 + 50)) : 10}%`,
                        transition: 'height 0.15s ease',
                    }}
                />
            ))}
          </div>

          <div className="mt-auto p-[15px] border border-dashed border-neon-pink rounded-[8px] text-[11px] text-neon-pink text-center">
            DASH TO COLLECT NEON ORBS
          </div>
        </aside>
      </main>

      <footer className="h-auto xl:h-[120px] py-[20px] xl:py-0 bg-surface border-t border-white/10 px-[20px] md:px-[40px] flex flex-col xl:grid xl:grid-cols-[1fr_2fr_1fr] items-center shrink-0">
        <div className="flex items-center gap-[15px] self-start xl:self-center mb-4 xl:mb-0 w-full xl:w-auto">
          <div className={`w-[50px] h-[50px] rounded-[4px] shrink-0 ${isPlaying ? 'animate-pulse' : ''}`} style={{background: 'linear-gradient(45deg, var(--color-neon-pink), var(--color-neon-cyan))'}}></div>
          <div className="flex flex-col truncate pr-2">
            <h4 className="text-[14px] font-bold m-0 leading-tight truncate w-[200px] xl:w-auto">{TRACKS[currentTrackIndex].title.replace(' (AI Gen)', '')}</h4>
            <p className="text-[11px] text-text-dim mt-1">AI Synthesis</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-[15px] w-full max-w-md xl:max-w-none">
          <div className="flex items-center gap-[30px]">
             <button onClick={prevTrack} className="bg-transparent border-none text-text-main cursor-pointer flex outline-none hover:text-neon-cyan transition-colors">
                 <SkipBack size={20} />
             </button>
             <button onClick={togglePlay} className="w-[45px] h-[45px] bg-text-main text-bg rounded-full flex items-center justify-center outline-none hover:bg-neon-cyan hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                 {isPlaying ? <Pause size={20} className="fill-current text-bg" /> : <Play size={20} className="fill-current text-bg ml-[2px]" />}
             </button>
             <button onClick={skipTrack} className="bg-transparent border-none text-text-main cursor-pointer flex outline-none hover:text-neon-cyan transition-colors">
                 <SkipForward size={20} />
             </button>
          </div>
          <div className="w-full flex items-center gap-[12px] font-mono text-[11px] text-text-dim">
             <span>00:00</span>
             <div className="flex-1 h-[4px] bg-white/10 rounded-[2px] relative overflow-hidden">
                 <div className="absolute h-full w-[35%] bg-neon-cyan shadow-[0_0_10px_var(--color-neon-cyan)] rounded-[2px]" />
             </div>
             {/* Stubbed times mapped over from template */}
             <span>03:42</span>
          </div>
        </div>

        <div className="flex justify-end items-center gap-[10px] text-text-dim text-[12px] font-mono w-full mt-4 xl:mt-0 px-2 xl:px-0">
          <button onClick={toggleMute} className="outline-none hover:text-white shrink-0 transition-colors">
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <span className="shrink-0">VOL</span>
          <div className="w-[80px] h-[4px] bg-white/10 rounded-[2px]">
             <div className="h-full bg-text-dim rounded-[2px] transition-all" style={{width: isMuted ? '0%' : '80%'}} />
          </div>
          <span className="shrink-0">{isMuted ? '0%' : '80%'}</span>
        </div>
      </footer>

      <audio 
        ref={audioRef} 
        src={TRACKS[currentTrackIndex].src} 
        onEnded={skipTrack}
        autoPlay={isPlaying}
        className="hidden"
      />
    </>
  );
}
