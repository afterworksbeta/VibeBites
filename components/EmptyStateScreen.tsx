import React from 'react';
import { Settings, Gamepad2, UserPlus, Key, ScanLine, ArrowRight } from 'lucide-react';
import { COLORS } from '../constants';
import { PixelSprite } from './PixelSprite';
import { PixelAvatar } from './PixelAvatar';

interface EmptyStateScreenProps {
  onAddFriend: () => void;
  onInvite: () => void;
  onScanQR: () => void;
  onSettings: () => void;
}

export const EmptyStateScreen: React.FC<EmptyStateScreenProps> = ({ 
  onAddFriend, 
  onInvite, 
  onScanQR,
  onSettings
}) => {
  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] overflow-hidden animate-in fade-in duration-500">
      {/* HEADER */}
      <div 
        className="h-[100px] border-b-4 border-black flex items-center justify-between px-4 shrink-0 relative z-20"
        style={{ backgroundColor: COLORS.BLUE }}
      >
        <div className="w-10 h-10 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_black]">
           <Gamepad2 size={24} color="black" strokeWidth={2} />
        </div>
        <h1 className="text-white text-[18px] uppercase tracking-wide drop-shadow-[4px_4px_0_black]">ViBeBiTeS</h1>
        <button 
            onClick={onSettings} 
            className="w-10 h-10 flex items-center justify-center active:rotate-90 transition-transform"
        >
           <Settings size={28} color="white" strokeWidth={3} className="drop-shadow-[2px_2px_0_black]" />
        </button>
      </div>

      {/* ILLUSTRATION SECTION */}
      <div 
        className="flex-1 border-b-4 border-black flex flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: COLORS.YELLOW }}
      >
         {/* Decorative Elements - Scaled Down */}
         <div className="absolute top-10 left-10 opacity-50 animate-bounce" style={{ animationDuration: '3s' }}>
            <PixelSprite emoji="💨" size={24} />
         </div>
         <div className="absolute bottom-20 right-10 opacity-50 animate-bounce" style={{ animationDuration: '4s' }}>
            <PixelSprite emoji="💨" size={24} />
         </div>
         <div className="absolute top-20 right-20 animate-pulse">
            <span className="text-black text-[12px] font-bold">?</span>
         </div>
         <div className="absolute top-40 left-20 animate-pulse" style={{ animationDelay: '0.5s' }}>
             <span className="text-black text-[12px] font-bold">?</span>
         </div>

         {/* Character - Scaled Down */}
         <div className="relative mb-5 flex flex-col items-center z-10">
            {/* Speech Bubble */}
            <div className="bg-white border-[2px] border-black px-2 py-1 mb-2 relative shadow-[2px_2px_0_rgba(0,0,0,0.2)] animate-bounce">
                <span className="text-black text-[6px] uppercase font-bold text-center leading-tight block">
                    WHERE R MY<br/>FRIENDS?
                </span>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r-[2px] border-b-[2px] border-black transform rotate-45"></div>
            </div>
            
            {/* Avatar as Character - Using a darker/lonely aesthetic seed */}
            <div className="grayscale contrast-125 filter drop-shadow-[0_5px_0_rgba(0,0,0,0.2)]">
                 <PixelAvatar seed="lonely_pixel_void_99" size={60} borderWidth={2} />
            </div>
         </div>

         {/* Title Box - Scaled Down */}
         <div className="bg-black border-[2px] border-black ring-[2px] ring-[#FFD740] px-4 py-2 shadow-[4px_4px_0_rgba(0,0,0,0.3)] mb-2 z-10 relative">
            <div className="absolute inset-[1px] border-[1px] border-white pointer-events-none"></div>
            <h2 className="text-[#FF5252] text-[10px] uppercase text-center leading-tight tracking-wide font-bold">
                NO FRIENDS<br/>YET!
            </h2>
         </div>
         
         {/* Subtitle - Scaled Down */}
         <div className="bg-[#FFD740] px-2 py-0.5 border-t border-b border-black/10">
             <span className="text-black text-[7px] uppercase font-bold tracking-wider">START CONNECTING!</span>
         </div>
      </div>

      {/* ACTIONS SECTION */}
      <div 
        className="p-6 flex flex-col gap-3 shrink-0 pb-10"
        style={{ backgroundColor: COLORS.PURPLE }}
      >
         <div className="text-center mb-2">
             <span className="text-[#FFD740] text-[12px] uppercase tracking-widest font-bold">GET STARTED:</span>
         </div>

         {/* Card 1: Add Friend */}
         <button 
            onClick={onAddFriend}
            className="h-[72px] bg-[#00E676] border-[5px] border-black rounded-xl shadow-[6px_6px_0_0_black] flex items-center px-4 active:translate-y-[4px] active:shadow-[2px_2px_0_0_black] transition-all group overflow-hidden relative"
         >
            <div className="w-[48px] h-[48px] flex items-center justify-center bg-black/10 rounded-lg mr-4 border-2 border-black group-hover:bg-white transition-colors">
                <UserPlus size={24} color="black" strokeWidth={3} />
            </div>
            <div className="flex-1 flex flex-col items-start relative z-10">
                <span className="text-black text-[12px] font-bold uppercase mb-1">ADD FRIEND</span>
                <span className="text-black/70 text-[9px] uppercase font-bold">Search by name</span>
            </div>
            <ArrowRight size={24} color="black" strokeWidth={5} />
         </button>

         {/* Card 2: Invite By Code */}
         <button 
            onClick={onInvite}
            className="h-[72px] bg-[#2196F3] border-[5px] border-black rounded-xl shadow-[6px_6px_0_0_black] flex items-center px-4 active:translate-y-[4px] active:shadow-[2px_2px_0_0_black] transition-all group overflow-hidden relative"
         >
             <div className="w-[48px] h-[48px] flex items-center justify-center bg-black/10 rounded-lg mr-4 border-2 border-black group-hover:bg-white transition-colors">
                <Key size={24} color="black" strokeWidth={3} />
            </div>
            <div className="flex-1 flex flex-col items-start relative z-10">
                <span className="text-black text-[12px] font-bold uppercase mb-1">INVITE BY CODE</span>
                <span className="text-black/70 text-[9px] uppercase font-bold">Share your VibeCode</span>
            </div>
            <ArrowRight size={24} color="black" strokeWidth={5} />
         </button>

         {/* Card 3: Scan QR */}
         <button 
            onClick={onScanQR}
            className="h-[72px] bg-[#FF4081] border-[5px] border-black rounded-xl shadow-[6px_6px_0_0_black] flex items-center px-4 active:translate-y-[4px] active:shadow-[2px_2px_0_0_black] transition-all group overflow-hidden relative"
         >
             <div className="w-[48px] h-[48px] flex items-center justify-center bg-black/10 rounded-lg mr-4 border-2 border-black group-hover:bg-white transition-colors">
                <ScanLine size={24} color="black" strokeWidth={3} />
            </div>
            <div className="flex-1 flex flex-col items-start relative z-10">
                <span className="text-black text-[12px] font-bold uppercase mb-1">SCAN QR</span>
                <span className="text-black/70 text-[9px] uppercase font-bold">Scan a friend's code</span>
            </div>
            <ArrowRight size={24} color="black" strokeWidth={5} />
         </button>
      </div>
    </div>
  );
};