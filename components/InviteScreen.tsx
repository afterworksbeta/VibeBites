import React, { useState } from 'react';
import { ArrowLeft, Gift, Copy, Check, Download, Loader } from 'lucide-react';
import { PixelSprite } from './PixelSprite';

interface InviteScreenProps {
  onBack: () => void;
  currentUserId?: string;
  currentUsername?: string;
}

export const InviteScreen: React.FC<InviteScreenProps> = ({ onBack, currentUserId, currentUsername }) => {
  const [copied, setCopied] = useState(false);

  // If username is empty string, we are loading. Don't fallback to GUEST blindly.
  const isLoading = !currentUsername;
  
  const uniqueCode = isLoading 
    ? 'LOADING...'
    : `VB-${currentUsername!.toUpperCase()}`;

  const handleCopy = () => {
    if (isLoading) return;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(uniqueCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const RealPixelQR = () => {
    // Generate a QR code API URL based on the unique code
    const qrData = uniqueCode;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&bgcolor=FFFFFF&color=000000&margin=1`;

    return (
      <div className="w-[200px] h-[200px] bg-white border-[6px] border-black p-2 relative shadow-[8px_8px_0_0_#000]">
        {/* Corner Brackets - 8px thick */}
        <div className="absolute top-[-6px] left-[-6px] w-6 h-6 border-t-[8px] border-l-[8px] border-black" />
        <div className="absolute top-[-6px] right-[-6px] w-6 h-6 border-t-[8px] border-r-[8px] border-black" />
        <div className="absolute bottom-[-6px] left-[-6px] w-6 h-6 border-b-[8px] border-l-[8px] border-black" />
        <div className="absolute bottom-[-6px] right-[-6px] w-6 h-6 border-b-[8px] border-r-[8px] border-black" />

        {/* QR Content */}
        {isLoading ? (
             <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Loader className="animate-spin text-black" size={32} />
             </div>
        ) : (
             <div className="w-full h-full relative">
                <img 
                    src={qrUrl} 
                    alt="QR Code" 
                    className="w-full h-full object-contain pixelated" 
                    style={{ imageRendering: 'pixelated' }}
                />
                
                {/* Center Logo Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#FFD740] border-[3px] border-black flex items-center justify-center z-10 shadow-sm">
                    <span className="text-[14px] font-bold text-black font-['Press_Start_2P'] tracking-tighter">VB</span>
                </div>
            </div>
        )}
      </div>
    );
  };

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
             <span className={`text-[#FFD740] text-[20px] md:text-[24px] font-mono font-bold tracking-[2px] break-all text-center ${isLoading ? 'animate-pulse' : ''}`}>
                {uniqueCode}<span className="animate-pulse text-white">|</span>
             </span>
         </div>

         {/* Copy Button */}
         <button 
            onClick={handleCopy}
            disabled={isLoading}
            className={`h-[48px] w-[70%] border-[4px] border-black shadow-[4px_4px_0_0_black] flex items-center justify-center gap-2 active:translate-y-[2px] active:shadow-[2px_2px_0_0_black] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${copied ? 'bg-[#00E676]' : 'bg-[#FFD740]'}`}
         >
             {copied ? <Check size={20} color="black" strokeWidth={4} /> : <Copy size={20} color="black" strokeWidth={4} />}
             <span className="text-black text-[12px] font-bold uppercase">{copied ? "COPIED! ✓" : "COPY CODE"}</span>
         </button>
      </div>

      {/* QR CODE SECTION (Remaining height or minimum) */}
      <div 
        className="flex-1 min-h-[300px] p-6 border-b-4 border-black flex flex-col items-center justify-center pb-12"
        style={{ backgroundColor: '#FF4081' }}
      >
         <label className="text-black text-[10px] uppercase mb-3">OR SCAN QR:</label>
         
         <div className="mb-4">
             <RealPixelQR />
         </div>

         <button 
            disabled={isLoading}
            className="h-[48px] w-[70%] bg-[#2196F3] border-[4px] border-black shadow-[4px_4px_0_0_black] flex items-center justify-center gap-2 active:translate-y-[2px] active:shadow-[2px_2px_0_0_black] transition-all disabled:opacity-50"
         >
             <Download size={20} color="white" strokeWidth={4} />
             <span className="text-white text-[12px] font-bold uppercase">SAVE QR</span>
         </button>
      </div>

    </div>
  );
};