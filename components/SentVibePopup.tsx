import React from 'react';
import { X, Clock, CheckCheck } from 'lucide-react';
import { COLORS } from '../constants';
import { Message } from '../types';

interface SentVibePopupProps {
  message: Message;
  onClose: () => void;
}

export const SentVibePopup: React.FC<SentVibePopupProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Card */}
      <div 
        className="relative w-full max-w-[320px] bg-white border-[6px] border-black shadow-[12px_12px_0_0_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div 
          className="h-[60px] border-b-[4px] border-black flex items-center justify-between px-4"
          style={{ backgroundColor: COLORS.PINK }}
        >
           <span className="text-white text-[12px] font-bold uppercase tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
             SENT VIBE
           </span>
           <button onClick={onClose} className="active:scale-90 transition-transform">
             <X size={24} color="white" strokeWidth={5} />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6 items-center bg-[#f8f8f8]">
            
            {/* Emojis Display */}
            <div className="w-full bg-[#333] border-[4px] border-black p-4 flex justify-center items-center min-h-[100px] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)] relative">
                {/* Decoration */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-[#555] rounded-full"></div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#555] rounded-full"></div>

                <div className="flex flex-wrap justify-center gap-3">
                    {message.emojis && message.emojis.length > 0 ? (
                        message.emojis.map((e, i) => (
                            <span key={i} className="text-[40px] leading-none filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                                {e}
                            </span>
                        ))
                    ) : (
                        <span className="text-white/50 text-[10px]">NO EMOJIS</span>
                    )}
                </div>
            </div>

            {/* Arrow Down */}
            <div className="text-black font-bold animate-bounce">▼</div>

            {/* Original Text Box */}
            <div className="w-full">
                <div className="bg-black text-white text-[10px] px-2 py-1 inline-block mb-[-4px] relative z-10 border-2 border-black border-b-0">
                    SECRET MESSAGE:
                </div>
                <div className="bg-white border-[4px] border-black p-4 text-center shadow-[6px_6px_0_#ddd] relative">
                    <p className="text-[14px] leading-relaxed text-black font-bold uppercase break-words font-['Press_Start_2P']">
                        {message.text || "..."}
                    </p>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="w-full flex justify-between items-center mt-2 px-1">
               <div className="flex items-center gap-1">
                   <Clock size={12} color="#888" />
                   <span className="text-[10px] text-gray-500 font-bold">{message.time}</span>
               </div>
               <div className="flex items-center gap-1">
                   <CheckCheck size={14} color="#2196F3" strokeWidth={3} />
                   <span className="text-[10px] text-[#2196F3] font-bold">READ</span>
               </div>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="h-[12px] bg-black w-full"></div>
      </div>
    </div>
  );
};