import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { PixelAvatar } from './PixelAvatar';
import { PixelSprite } from './PixelSprite';
import { Friend } from '../types';
import { X, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';

interface GamePopupProps {
  friend: Friend;
  onClose: () => void;
  onWin: () => void;
  onLoss?: () => void;
}

export const GamePopup: React.FC<GamePopupProps> = ({ friend, onClose, onWin, onLoss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);

  // Sprite sequences separated into sets
  const spriteSets = [
    ['🏃', '🏁', '⏱️'],
    ['💿', '⭐', '🌅']
  ];

  // Dynamic hints matching the sprite sets
  const hintMessages = [
    "HINT: IT'S ABOUT RUSHING!",
    "HINT: MORNING VIBES!"
  ];

  // Retro scrolling loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      // Slower speed: 2px instead of 4px
      // 500px is roughly the loop point for the duplicated content to reset smoothly
      setScrollPos((prev) => (prev + 2) % 500); 
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrevSet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSet((prev) => (prev - 1 + spriteSets.length) % spriteSets.length);
    // Optional: Reset scroll position on change, or keep it flowing
    // setScrollPos(0); 
  };

  const handleNextSet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSet((prev) => (prev + 1) % spriteSets.length);
    // setScrollPos(0);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Dark Backdrop with Pixel Pattern */}
      <div 
        className="absolute inset-0 bg-[#0f0f23]"
        style={{
          backgroundImage: 'radial-gradient(#333 15%, transparent 16%), radial-gradient(#333 15%, transparent 16%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }}
        onClick={onClose}
      />

      {/* Main Card */}
      <div 
        className="relative w-full max-w-[350px] bg-[#9C27B0] border-[6px] border-black rounded-2xl overflow-hidden flex flex-col shadow-[12px_12px_0_0_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div 
          className="h-[80px] border-b-[4px] border-black flex items-center justify-between px-4"
          style={{ backgroundColor: COLORS.YELLOW }}
        >
          <div className="flex items-center gap-3">
             <div className="border-[3px] border-black bg-white">
                <PixelAvatar seed={friend.avatarSeed} size={48} borderWidth={0} />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-tight">FROM:</span>
                <span className="text-[14px] font-bold uppercase">{friend.name}</span>
             </div>
          </div>
          <button onClick={onClose} className="active:scale-90 transition-transform">
             <X size={32} strokeWidth={5} color="black" />
          </button>
        </div>

        {/* GAME AREA */}
        <div 
          className="relative h-[340px] p-6 flex flex-col items-center justify-between cursor-pointer select-none active:brightness-95"
          style={{ backgroundColor: COLORS.BLUE }}
          onClick={() => setIsPaused(!isPaused)}
        >
           {/* Double Border Effect */}
           <div className="absolute inset-0 border-[5px] border-black pointer-events-none z-10"></div>
           <div className="absolute inset-[5px] border-[2px] border-white pointer-events-none z-10"></div>

           {/* Blinking Instruction / Hint */}
           <div className={`z-20 bg-black px-3 py-1 border-2 border-yellow-400 mt-2 max-w-full text-center transition-all ${showHint ? 'animate-none' : 'animate-pulse'}`}>
              <span className="text-[#FFD740] text-[10px] uppercase tracking-widest leading-relaxed">
                 {showHint 
                    ? hintMessages[currentSet] 
                    : (isPaused ? ">>> RELEASE 2 GO <<<" : ">>> TAP 2 PAUSE <<<")
                 }
              </span>
           </div>

           {/* Scrolling Sprites Container - Single Row */}
           <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center my-4">
              <div 
                className="absolute flex gap-16 whitespace-nowrap transition-none will-change-transform"
                style={{ 
                    transform: `translateX(${-scrollPos}px)`,
                    left: '100%', // Start off-screen right
                }}
              >
                 {/* Repeat set multiple times for seamless feel */}
                 {[...spriteSets[currentSet], ...spriteSets[currentSet], ...spriteSets[currentSet]].map((s, i) => (
                    <PixelSprite key={`${currentSet}-${i}`} emoji={s} size={56} />
                 ))}
              </div>

              {/* Paused Overlay Effect */}
              {isPaused && (
                  <div className="absolute inset-0 bg-black/40 backdrop-grayscale z-0 pointer-events-none"></div>
              )}
           </div>

           {/* Set Pagination Controls */}
           <div className="absolute bottom-4 left-0 w-full px-6 flex justify-between items-center z-30">
              <button 
                onClick={handlePrevSet}
                className="w-10 h-10 bg-black border-2 border-white/50 rounded flex items-center justify-center text-white active:scale-90 transition-transform shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]"
              >
                 <ChevronLeft size={24} strokeWidth={3} />
              </button>
              
              <div className="bg-black px-4 py-2 rounded border-2 border-white/30 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                  <span className="text-[#FFD740] text-[10px] font-bold tracking-widest">
                    SET {currentSet + 1}/{spriteSets.length}
                  </span>
              </div>

              <button 
                onClick={handleNextSet}
                className="w-10 h-10 bg-black border-2 border-white/50 rounded flex items-center justify-center text-white active:scale-90 transition-transform shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]"
              >
                 <ChevronRight size={24} strokeWidth={3} />
              </button>
           </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-[60px] bg-black flex items-center px-4 gap-4 border-b-[4px] border-black">
           <span className="text-[#FFD740] text-[11px] shrink-0">LEVEL 1/2</span>
           <div className="flex-1 h-[24px] bg-[#333] border-[2px] border-white relative p-1">
              <div 
                className="h-full bg-[#FFD740]" 
                style={{ width: '60%' }}
              >
                 {/* Pixel texture on bar */}
                 <div className="w-full h-full opacity-20 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhZWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')]"></div>
              </div>
           </div>
        </div>

        {/* INPUT AREA */}
        <div 
          className="p-4 flex flex-col gap-3"
          style={{ backgroundColor: COLORS.RED }}
        >
           <input 
             type="text" 
             placeholder="TYPE ANSWER..." 
             className="w-full h-[60px] border-[4px] border-black px-4 text-[14px] font-['Press_Start_2P'] uppercase outline-none shadow-[4px_4px_0_rgba(0,0,0,0.2)] focus:shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all placeholder:text-gray-400"
           />
           
           <div className="flex gap-3 h-[56px]">
              <button 
                onClick={() => setShowHint(!showHint)}
                className={`flex-1 border-[4px] border-black shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 ${showHint ? 'bg-white' : 'bg-[#FFD740]'}`}
              >
                 <Lightbulb size={20} color="black" strokeWidth={3} />
                 <span className="text-[12px] font-bold text-black">HINT</span>
              </button>

              <button 
                onClick={onWin}
                className="flex-1 bg-[#00E676] border-[4px] border-black shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center"
              >
                 <span className="text-[12px] font-bold text-black">{">>>"} GO! {"<<<"}</span>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};