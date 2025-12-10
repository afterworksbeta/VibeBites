import React from 'react';
import { COLORS } from '../constants';
import { PixelAvatar } from './PixelAvatar';
import { Friend } from '../types';
import { Lightbulb, ArrowRight, RotateCcw } from 'lucide-react';

interface WrongAnswerScreenProps {
  friend: Friend;
  onTryAgain: () => void;
  onNext: () => void;
}

export const WrongAnswerScreen: React.FC<WrongAnswerScreenProps> = ({ friend, onTryAgain, onNext }) => {
  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] overflow-hidden animate-in fade-in duration-300">
      
      {/* TOP ORANGE SECTION */}
      <div 
        className="h-[300px] flex flex-col items-center justify-center p-4 border-b-[6px] border-black relative shrink-0"
        style={{ backgroundColor: '#FF9800' }} // Orange
      >
         {/* Background pattern */}
         <div className="absolute inset-0 opacity-10" 
              style={{ backgroundImage: 'radial-gradient(black 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
         </div>

         {/* Banner */}
         <div className="bg-black border-[4px] border-black px-5 py-3 mb-6 relative z-10 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
            <div className="absolute inset-[3px] border-[2px] border-white pointer-events-none"></div>
            <span className="text-[#FFD740] text-[12px] md:text-[14px] tracking-widest block font-bold">
               ★ CLOSE CALL! ★
            </span>
         </div>

         {/* Confused Character */}
         <div className="relative mb-4 flex items-center justify-center">
            {/* Floating Question Marks */}
            <div className="absolute -top-6 -left-4 text-black text-[24px] font-bold animate-bounce">?</div>
            <div className="absolute -top-8 right-0 text-black text-[24px] font-bold animate-bounce" style={{ animationDelay: '0.1s' }}>?</div>
            <div className="absolute -top-4 -right-6 text-black text-[24px] font-bold animate-bounce" style={{ animationDelay: '0.2s' }}>?</div>
            
            <div className="bg-white border-[4px] border-black relative overflow-visible">
                 {/* Overlay a "confused" sprite effect on top of avatar for demo */}
                 <PixelAvatar seed={friend.avatarSeed} size={80} borderWidth={0} />
                 <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div> 
            </div>
         </div>

         {/* Score Box */}
         <div className="bg-black px-4 py-2 border-[4px] border-black relative z-10 shadow-[6px_6px_0_rgba(0,0,0,0.3)] mb-2">
            <div className="absolute inset-[3px] border-[2px] border-white pointer-events-none"></div>
            <span className="text-white text-[16px] md:text-[18px]">MATCH: 73%</span>
         </div>

         {/* Wiggling Text */}
         <div className="mt-4 bg-[#FFD740] px-3 py-1 border-2 border-black rotate-2 animate-[wiggle_1s_ease-in-out_infinite]">
             <span className="text-black text-[10px] uppercase">U ALMOST HAD IT!</span>
         </div>
      </div>

      {/* COMPARISON RED SECTION */}
      <div 
        className="flex-1 p-5 flex flex-col overflow-y-auto"
        style={{ backgroundColor: COLORS.RED }}
      >
         {/* Real Vibe */}
         <div className="w-full mb-6">
            <div className="bg-black text-[#FFD740] text-[10px] px-2 py-1 inline-block mb-[-4px] relative z-10 border-2 border-black border-b-0">
                THE REAL VIBE:
            </div>
            <div className="bg-[#FFD740] border-[5px] border-black p-4 text-center shadow-[4px_4px_0_black]">
                {/* Using sans-serif for Thai text support */}
                <h2 className="text-[16px] leading-relaxed text-black font-sans font-bold">
                  มาทันเวลาพอดีเช้านี้
                </h2>
            </div>
         </div>

         {/* User Guess */}
         <div className="w-full mb-4">
            <div className="bg-black text-white text-[10px] px-2 py-1 inline-block mb-[-4px] relative z-10 border-2 border-black border-b-0">
                UR GUESS:
            </div>
            <div className="bg-white/90 border-[4px] border-black border-dashed p-4 text-center relative">
                <h2 className="text-[14px] leading-relaxed text-gray-500 font-sans line-through decoration-red-500 decoration-4">
                  มาเช้านี้ทันเวลา
                </h2>
                {/* Big Red X */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 opacity-40 text-[64px] font-sans pointer-events-none">
                    X
                </div>
            </div>
         </div>

         {/* Hint Box */}
         <div className="mt-auto bg-black border-[4px] border-[#FFD740] p-3 flex items-center gap-3 shadow-[4px_4px_0_rgba(0,0,0,0.4)]">
             <Lightbulb size={24} color="#FFD740" strokeWidth={3} className="shrink-0" />
             <div className="text-[#FFD740] text-[10px] leading-relaxed">
                 U MISSED: <span className="font-sans text-[12px]">'พอดี'</span> (JUST RIGHT)
             </div>
         </div>
      </div>

      {/* FOOTER BLUE SECTION */}
      <div 
        className="h-[140px] border-t-[4px] border-black p-5 flex items-center gap-3 shrink-0"
        style={{ backgroundColor: COLORS.BLUE }}
      >
         <button 
           onClick={onTryAgain}
           className="flex-1 h-[56px] bg-[#FFD740] border-[5px] border-black shadow-[6px_6px_0_black] flex items-center justify-center gap-2 active:translate-y-[4px] active:shadow-[2px_2px_0_black] transition-all"
         >
             <RotateCcw size={16} color="black" strokeWidth={4} />
            <span className="text-black text-[12px] font-bold">TRY</span>
         </button>

         <button 
           onClick={onNext}
           className="flex-1 h-[56px] bg-[#00E676] border-[5px] border-black shadow-[6px_6px_0_black] flex items-center justify-center gap-2 active:translate-y-[4px] active:shadow-[2px_2px_0_black] transition-all"
         >
            <span className="text-black text-[12px] font-bold">NEXT!</span>
            <ArrowRight size={16} color="black" strokeWidth={4} />
         </button>
      </div>

    </div>
  );
};