import React, { useState } from 'react';
import { ArrowLeft, Rocket, Loader, RefreshCw } from 'lucide-react';
import { COLORS } from '../constants';
import { PixelAvatar } from './PixelAvatar';
import { Friend } from '../types';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabaseClient';

interface ComposeScreenProps {
  onBack: () => void;
  friend: Friend;
}

export const ComposeScreen: React.FC<ComposeScreenProps> = ({ onBack, friend }) => {
  const [text, setText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatedEmojis, setGeneratedEmojis] = useState<string[]>([]);
  const MAX_CHARS = 50;
  
  const getCounterColor = (length: number) => {
    if (length > MAX_CHARS) return COLORS.RED;
    if (length > 40) return '#FF9100'; // Orange-ish
    return '#00E676'; // Green
  };

  const handlePreview = async () => {
    if (text.trim().length === 0) return;
    
    setLoading(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Convert the following message into a sequence of emojis that represents the text word-for-word or concept-for-concept. Do not limit the number of emojis. Return ONLY the emojis separated by spaces. No other text. Message: "${text}"`,
        });

        const output = response.text || "";
        const emojis = output.trim().split(/\s+/).filter(e => e.trim().length > 0);
        
        if (emojis.length > 0) {
            setGeneratedEmojis(emojis);
            setShowPreview(true);
        }
    } catch (e) {
        console.error("Failed to generate emojis", e);
        setGeneratedEmojis(["👾", "⚡", "❓"]);
        setShowPreview(true);
    } finally {
        setLoading(false);
    }
  };

  const handleRegenerate = () => {
      handlePreview();
  };

  const handleSend = async () => {
    if (!text) return;
    setSending(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: friend.id,
            text: text,
            emojis: generatedEmojis,
            status: 'SENT'
        });

        if (error) {
            console.error("Send failed", error);
            alert("Send failed!");
        } else {
            onBack();
        }
    } else {
        // Fallback demo mode
        setTimeout(() => onBack(), 1000);
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] relative">
      
      {/* HEADER */}
      <div 
        className="w-full h-[80px] border-b-4 border-black flex items-center justify-between px-4 relative z-50 shrink-0"
        style={{ backgroundColor: COLORS.GREEN }}
      >
        <button onClick={onBack} className="active:scale-90 transition-transform">
          <ArrowLeft size={32} color="black" strokeWidth={4} />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-black text-[12px] uppercase">TO: {friend.name}</span>
          <PixelAvatar seed={friend.avatarSeed} size={40} borderWidth={3} />
        </div>
        
        {/* Placeholder to balance layout */}
        <div className="w-8" />
      </div>

      {/* MAIN BODY */}
      <main 
        className="flex-1 flex flex-col p-6 overflow-y-auto"
        style={{ backgroundColor: COLORS.PINK }}
      >
        
        {/* TITLE BANNER */}
        <div 
          className="w-full py-3 mb-6 relative border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          style={{ backgroundColor: COLORS.YELLOW }}
        >
          {/* Inner white border effect */}
          <div className="absolute inset-1 border-2 border-white pointer-events-none"></div>
          <h2 className="text-black text-[14px] uppercase relative z-10">WHAT'S UR VIBE?</h2>
        </div>

        {/* INPUT AREA */}
        <div className="relative mb-4">
           <textarea
             value={text}
             onChange={(e) => setText(e.target.value)}
             placeholder="TYPE SECRET MSG..."
             className="w-full h-[200px] bg-white text-black rounded-xl border-4 border-black p-4 text-[14px] outline-none placeholder:text-gray-400 uppercase resize-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-['Press_Start_2P'] leading-relaxed"
           />
        </div>

        {/* CONTROLS ROW */}
        <div className="flex justify-between items-center mb-4">
          {/* COUNTER */}
          <div 
            className="px-3 py-2 border-[3px] border-black flex items-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-[#FFD740]"
          >
            <span style={{ color: getCounterColor(text.length) }} className="text-[12px] mr-1">
                {text.length}
            </span>
            <span className="text-black text-[12px]">/{MAX_CHARS}</span>
          </div>

          {/* PREVIEW BUTTON */}
          <button 
             onClick={handlePreview}
             disabled={loading || text.length === 0}
             className="h-[48px] px-4 bg-[#FFD740] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {loading && !showPreview ? (
                <div className="animate-spin">
                    <Loader size={16} color="black" />
                </div>
             ) : (
                <span className="text-black text-[10px]">+ PREVIEW +</span>
             )}
          </button>
        </div>

        {/* INLINE PREVIEW SECTION */}
        {showPreview && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="bg-[#2196F3] border-4 border-black p-4 relative shadow-[4px_4px_0_0_black]">
                     {/* Label */}
                     <div className="absolute -top-3 left-4 bg-black text-white text-[10px] px-2 py-1 border-2 border-white transform -rotate-2">
                        VIBE PREVIEW:
                     </div>

                     <div className="flex flex-col items-center justify-center pt-2">
                        {/* The Emojis - Added flex-wrap and gap adjustment for multiple emojis */}
                        <div className="flex flex-wrap justify-center gap-3 mb-4 mt-2 px-2">
                             {loading ? (
                                <div className="animate-spin p-4">
                                    <Loader size={32} color="white" />
                                </div>
                             ) : (
                                generatedEmojis.map((emoji, i) => (
                                     <span key={i} className="text-[32px] md:text-[40px] filter drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:scale-110 transition-transform cursor-default">{emoji}</span>
                                 ))
                             )}
                        </div>
                        
                        {/* Regenerate Button */}
                         <button 
                            onClick={handleRegenerate}
                            disabled={loading}
                            className="flex items-center gap-2 bg-white px-3 py-2 border-[3px] border-black shadow-[3px_3px_0_0_black] active:translate-y-1 active:shadow-none transition-all hover:bg-gray-50"
                         >
                            <RefreshCw size={14} color="black" className={loading ? "animate-spin" : ""} />
                            <span className="text-[10px] text-black font-bold">NEW EMOJIS</span>
                         </button>
                     </div>
                </div>
            </div>
        )}

        {/* SEND BUTTON */}
        <button 
          onClick={handleSend}
          disabled={sending || text.length === 0}
          className="w-full h-[64px] bg-[#FFD740] rounded-xl border-[5px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 mt-auto active:translate-y-[4px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
        >
          {sending ? (
             <Loader size={24} color="black" className="animate-spin" />
          ) : (
             <>
                <span className="text-black text-[14px] font-bold tracking-wide">
                    {">>>"} SEND VIBE! {"<<<"}
                </span>
                <Rocket size={24} color="black" strokeWidth={3} className="animate-pulse" />
             </>
          )}
        </button>

      </main>

    </div>
  );
};