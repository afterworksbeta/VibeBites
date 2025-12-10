import React, { useState } from 'react';
import { ArrowLeft, Gift, Copy, Check, Download, MessageCircle, Instagram, MoreHorizontal } from 'lucide-react';
import { PixelSprite } from './PixelSprite';

interface InviteScreenProps {
  onBack: () => void;
}

export const InviteScreen: React.FC<InviteScreenProps> = ({ onBack }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PixelQR = () => (
    <div className="w-[200px] h-[200px] bg-white border-[6px] border-black p-4 relative shadow-[8px_8px_0_0_#000]">
      {/* Corner Brackets - 8px thick as requested */}
      <div className="absolute top-[-4px] left-[-4px] w-6 h-6 border-t-[8px] border-l-[8px] border-black" />
      <div className="absolute top-[-4px] right-[-4px] w-6 h-6 border-t-[8px] border-r-[8px] border-black" />
      <div className="absolute bottom-[-4px] left-[-4px] w-6 h-6 border-b-[8px] border-l-[8px] border-black" />
      <div className="absolute bottom-[-4px] right-[-4px] w-6 h-6 border-b-[8px] border-r-[8px] border-black" />

      {/* QR Pattern */}
      <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-1">
         {[...Array(49)].map((_, i) => {
            const isBlack = [0,2,3,6,8,10,12,14,15,18,20,24,28,30,32,35,36,38,40,42,44,46,48].includes(i);
            const isCorner = [0,6,42,48].includes(i); 
            if (i === 24) return null; 
            return (
                <div key={i} className={`${isBlack || isCorner ? 'bg-black' : 'bg-transparent'} w-full h-full rounded-sm`} />
            )
         })}
      </div>

      {/* Center Logo - 16px */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#FFD740] border-[3px] border-black flex items-center justify-center z-10">
          <span className="text-[16px] font-bold text-black font-['Press_Start_2P']">VB</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] overflow-x-hidden animate-in slide-in-from-right duration-300 overflow-y-auto scrollbar-hide">
      
      {/* HEADER (100px) */}
      <div 
        className="w-full h-[100px] border-b-4 border-black flex items-center justify-between px-4 relative z-50 shrink-0"
        style={{ backgroundColor: '#00E676' }}
      >
         <button onClick={onBack} className="active:scale-90 transition-transform">
            <ArrowLeft size={24} color="black" strokeWidth={4} />
         </button>
         <h1 className="text-black text-[16px] font-bold uppercase tracking-wide">=== INVITE ===</h1>
         <Gift size={24} color="black" strokeWidth={4} />
      </div>

      {/* HERO SECTION (200px) */}
      <div 
        className="min-h-[200px] p-6 border-b-4 border-black flex flex-col items-center justify-center"
        style={{ backgroundColor: '#FFD740' }}
      >
         {/* Title Box */}
         <div className="bg-black border-[4px] border-black p-4 mb-4 relative shadow-[4px_4px_0_rgba(255,255,255,0.5)] text-center w-full max-w-xs">
             <div className="absolute inset-[2px] border-[2px] border-[#FFD740] pointer-events-none"></div>
             <h2 className="text-white text-[14px] leading-relaxed uppercase">
                INVITE FRIENDS<br/>& GET REWARDS!
             </h2>
         </div>

         {/* Pixel Characters - Holding Hands */}
         <div className="relative mt-2">
             <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-[bounce_2s_infinite]">
                 <PixelSprite emoji="❤️" size={24} />
             </div>
             <div className="flex items-end animate-bounce">
                {/* Overlap slightly to look like holding hands */}
                <div className="scale-x-[-1] translate-x-2"><PixelSprite emoji="🏃" size={48} /></div>
                <div className="-translate-x-2"><PixelSprite emoji="🏃‍♀️" size={48} /></div>
             </div>
         </div>
      </div>

      {/* INVITE CODE SECTION (180px) */}
      <div 
        className="min-h-[180px] p-5 border-b-4 border-black flex flex-col items-center justify-center"
        style={{ backgroundColor: '#9C27B0' }}
      >
         <label className="text-white text-[10px] uppercase mb-3">UR CODE:</label>
         
         {/* Code Box */}
         <div className="bg-black border-[5px] border-white p-4 rounded-xl shadow-[6px_6px_0_0_white] mb-4 w-full max-w-xs flex justify-center relative">
             <span className="text-[#FFD740] text-[24px] font-mono font-bold tracking-[4px]">
                VB-X7K9M<span className="animate-pulse text-white">|</span>
             </span>
         </div>

         {/* Copy Button */}
         <button 
            onClick={handleCopy}
            className={`h-[48px] w-[70%] border-[4px] border-black shadow-[4px_4px_0_0_black] flex items-center justify-center gap-2 active:translate-y-[2px] active:shadow-[2px_2px_0_0_black] transition-all ${copied ? 'bg-[#00E676]' : 'bg-[#FFD740]'}`}
         >
             {copied ? <Check size={20} color="black" strokeWidth={4} /> : <Copy size={20} color="black" strokeWidth={4} />}
             <span className="text-black text-[12px] font-bold uppercase">{copied ? "COPIED! ✓" : "COPY CODE"}</span>
         </button>
      </div>

      {/* QR CODE SECTION (280px) */}
      <div 
        className="min-h-[280px] p-6 border-b-4 border-black flex flex-col items-center justify-center"
        style={{ backgroundColor: '#FF4081' }}
      >
         <label className="text-black text-[10px] uppercase mb-3">OR SCAN QR:</label>
         
         <div className="mb-4">
             <PixelQR />
         </div>

         <button 
            className="h-[48px] w-[70%] bg-[#2196F3] border-[4px] border-black shadow-[4px_4px_0_0_black] flex items-center justify-center gap-2 active:translate-y-[2px] active:shadow-[2px_2px_0_0_black] transition-all"
         >
             <Download size={20} color="white" strokeWidth={4} />
             <span className="text-white text-[12px] font-bold uppercase">SAVE QR</span>
         </button>
      </div>

      {/* SHARE OPTIONS SECTION (200px) */}
      <div 
        className="min-h-[200px] p-5 border-b-4 border-black flex flex-col items-center justify-center"
        style={{ backgroundColor: '#2196F3' }}
      >
         <label className="text-white text-[10px] uppercase mb-6">SHARE VIA:</label>
         
         <div className="grid grid-cols-2 gap-x-12 gap-y-6">
             {/* WhatsApp */}
             <div className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform">
                 <div className="w-[64px] h-[64px] bg-[#25D366] border-[4px] border-black rounded-full shadow-[4px_4px_0_0_black] flex items-center justify-center">
                     <div className="text-white"><MessageCircle size={32} strokeWidth={3} fill="white" /></div>
                 </div>
                 <span className="text-white text-[8px] uppercase">WHATSAPP</span>
             </div>

             {/* Messenger */}
             <div className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform">
                 <div className="w-[64px] h-[64px] bg-[#0084FF] border-[4px] border-black rounded-full shadow-[4px_4px_0_0_black] flex items-center justify-center">
                      <div className="text-white"><MessageCircle size={32} strokeWidth={3} fill="white" /></div>
                 </div>
                 <span className="text-white text-[8px] uppercase">MESSENGER</span>
             </div>

             {/* Instagram */}
             <div className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform">
                 <div className="w-[64px] h-[64px] bg-[#E4405F] border-[4px] border-black rounded-full shadow-[4px_4px_0_0_black] flex items-center justify-center">
                      <div className="text-white"><Instagram size={32} strokeWidth={3} /></div>
                 </div>
                 <span className="text-white text-[8px] uppercase">INSTAGRAM</span>
             </div>

             {/* More */}
             <div className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform">
                 <div className="w-[64px] h-[64px] bg-[#FFD740] border-[4px] border-black rounded-full shadow-[4px_4px_0_0_black] flex items-center justify-center">
                      <div className="text-black"><MoreHorizontal size={32} strokeWidth={4} /></div>
                 </div>
                 <span className="text-white text-[8px] uppercase">MORE</span>
             </div>
         </div>
      </div>

      {/* REWARDS INFO SECTION (160px) */}
      <div 
        className="min-h-[160px] p-6 pb-12 flex flex-col items-center justify-center"
        style={{ backgroundColor: '#FF5252' }}
      >
          <div className="bg-black border-[3px] border-[#FFD740] p-4 w-[90%] flex flex-col items-center shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
             <div className="mb-2">
                 <PixelSprite emoji="🏆" size={32} />
             </div>
             <p className="text-white text-[10px] text-center uppercase leading-relaxed mb-3">
                 INVITE 5 FRIENDS<br/>= UNLOCK BADGE!
             </p>
             
             {/* Progress Bar */}
             <div className="w-[80%] h-[16px] bg-[#424242] border-[2px] border-white relative">
                 <div 
                    className="h-full bg-[#FFD740] absolute top-0 left-0"
                    style={{ width: '40%' }} // 2/5
                 >
                     {/* Pixel Texture Overlay */}
                     <div className="w-full h-full opacity-30" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 0)', backgroundSize: '2px 2px' }}></div>
                 </div>
                 <span className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold drop-shadow-[1px_1px_0_black]">2/5</span>
             </div>
          </div>
      </div>

    </div>
  );
};