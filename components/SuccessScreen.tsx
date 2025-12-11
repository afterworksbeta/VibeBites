import React from 'react';
import { COLORS } from '../constants';
import { PixelAvatar } from './PixelAvatar';
import { Friend, Message } from '../types';
import { MessageCircle } from 'lucide-react';

interface SuccessScreenProps {
  friend: Friend;
  message?: Message;
  onSendBack: () => void;
  onBackToChat: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ friend, message, onSendBack, onBackToChat }) => {
  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] overflow-hidden animate-in fade-in duration-300">
      
      {/* TOP GREEN SECTION (VICTORY) */}
      <div 
        className="relative h-[380px] flex flex-col items-center justify-center p-4 border-b-[6px] border-black overflow-hidden shrink-0"
        style={{ backgroundColor: COLORS.GREEN }}
      >
        {/* Pixel Confetti Decorations */}
        <div className="absolute top-10 left-4 w-3 h-3 bg-red-500 rotate-45"></div>
        <div className="absolute top-20 right-8 w-4 h-4 bg-yellow-300 rotate-12"></div>
        <div className="absolute top-40 left-10 w-2 h-2 bg-blue-500 rotate-90"></div>
        <div className="absolute bottom-20 right-10 w-3 h-3 bg-pink-500 rotate-[30deg]"></div>
        <div className="absolute top-8 left-1/2 w-2 h-2 bg-white -translate-x-10"></div>

        {/* Victory Banner */}
        <div className="bg-black border-[4px] border-white px-4 py-3 mb-6 animate-pulse shadow-[0_4px_0_rgba(0,0,0,0.2)]">
          <span className="text-[#FFD740] text-[12px] md:text-[14px] tracking-widest text-center block">
             ★★★ LEVEL CLEAR! ★★★
          </span>
        </div>

        {/* Celebrating Character */}
        <div className="relative mb-6 animate-bounce">
            <div className="absolute -left-12 top-2 text-[48px] filter drop-shadow-[4px_4px_0_black]">🙌</div>
            <div className="absolute -right-12 top-2 text-[48px] filter drop-shadow-[4px_4px_0_black] scale-x-[-1]">🙌</div>
            <div className="bg-white border-[4px] border-black">
                <PixelAvatar seed={friend.avatarSeed} size={100} borderWidth={0} />
            </div>
        </div>

        {/* Score Box */}
        <div className="bg-black px-6 py-3 border-[4px] border-black ring-[3px] ring-white mb-4 shadow-[8px_8px_0_rgba(0,0,0,0.3)] z-10">
           <span className="text-[#FFD740] text-[18px] md:text-[20px] font-bold">MATCH: 100%</span>
        </div>

        {/* Diagonal Stripe Text */}
        <div className="absolute bottom-6 w-[120%] bg-[#FFD740] border-y-[4px] border-black py-2 text-center rotate-[-3deg] shadow-[0_4px_0_rgba(0,0,0,0.2)]">
           <span className="text-black text-[14px] font-bold tracking-widest">{">>>"} U GOT IT! {"<<<"}</span>
        </div>
      </div>

      {/* MIDDLE REVEAL SECTION */}
      <div 
        className="flex-1 p-5 flex flex-col items-center overflow-y-auto"
        style={{ backgroundColor: COLORS.YELLOW }}
      >
         {/* Original Vibe Card */}
         <div className="w-full mb-6">
            <div className="bg-black text-white text-[10px] px-2 py-1 inline-block mb-[-4px] relative z-10 border-2 border-black border-b-0">
                ORIGINAL VIBE:
            </div>
            <div className="bg-white border-[5px] border-black p-6 text-center shadow-[6px_6px_0_black] relative">
                {/* Double Border Look */}
                <div className="absolute inset-[4px] border-[2px] border-black opacity-10 pointer-events-none"></div>
                <h2 className="text-[16px] leading-relaxed text-black font-sans font-bold break-words">
                    {message?.text || "..."}
                </h2>
            </div>
         </div>

         {/* Hint Breakdown */}
         <div className="w-full">
            <div className="bg-black text-[#FFD740] text-[10px] px-2 py-1 inline-block mb-2 border-2 border-black">
                KEY HINT:
            </div>
            
            <div className="bg-[#2196F3] border-[3px] border-black p-3 mb-3 flex items-center gap-3 shadow-[4px_4px_0_black]">
               <span className="text-[20px] bg-black/20 p-1 rounded">💡</span>
               <span className="text-white font-bold">=</span>
               <span className="text-white text-[10px] md:text-[12px] font-sans">
                   {message?.hint || "N/A"}
               </span>
            </div>
         </div>
      </div>

      {/* BOTTOM ACTION SECTION */}
      <div 
        className="h-[140px] border-t-[4px] border-black p-5 flex flex-col items-center justify-center shrink-0"
        style={{ backgroundColor: COLORS.PURPLE }}
      >
         <button 
           onClick={onSendBack}
           className="w-full h-[64px] bg-[#FFD740] border-[5px] border-black shadow-[8px_8px_0_black] flex items-center justify-center gap-3 active:translate-y-[4px] active:shadow-[4px_4px_0_black] transition-all mb-3"
         >
            <span className="text-black text-[14px] font-bold tracking-tight">{">>>"} BACK TO CHAT {"<<<"}</span>
            <MessageCircle size={24} color="black" strokeWidth={3} />
         </button>
      </div>

    </div>
  );
};