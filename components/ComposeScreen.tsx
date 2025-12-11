import React, { useState } from 'react';
import { ArrowLeft, Rocket, Loader, RefreshCw, Star, Tag, Trophy } from 'lucide-react';
import { COLORS } from '../constants';
import { PixelAvatar } from './PixelAvatar';
import { Friend } from '../types';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabaseClient';

interface ComposeScreenProps {
  onBack: () => void;
  friend: Friend;
}

interface VibeAnalysis {
  emojis: string[];
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
}

export const ComposeScreen: React.FC<ComposeScreenProps> = ({ onBack, friend }) => {
  const [text, setText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [analysis, setAnalysis] = useState<VibeAnalysis | null>(null);
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
        const prompt = `
          Analyze this message for a word-guessing game: "${text}"
          
          Return a JSON object with:
          1. "emojis": Array of 3-6 emojis that represent the message concepts sequentially.
          2. "topic": A short 1-3 word category (e.g. ACTION, FOOD, TRAVEL, FEELING).
          3. "difficulty": "EASY", "MEDIUM", or "HARD".
          4. "points": Integer estimate between 50-200 based on difficulty.
          
          Return ONLY valid JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const output = response.text || "{}";
        const result = JSON.parse(output) as VibeAnalysis;
        
        if (result && result.emojis) {
            setAnalysis(result);
            setShowPreview(true);
        } else {
            throw new Error("Invalid format");
        }
    } catch (e) {
        console.error("Failed to generate vibe analysis", e);
        // Fallback
        setAnalysis({
            emojis: ["👾", "⚡", "❓"],
            topic: "MYSTERY",
            difficulty: "MEDIUM",
            points: 100
        });
        setShowPreview(true);
    } finally {
        setLoading(false);
    }
  };

  const handleRegenerate = () => {
      handlePreview();
  };

  const handleSend = async () => {
    if (!text || !analysis) return;
    setSending(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // WORKAROUND: Pack metadata into 'text' column as JSON
        // This avoids "column does not exist" errors if 'emojis', 'topic', etc. are missing in DB schema.
        const packedPayload = JSON.stringify({
            text: text,
            emojis: analysis.emojis,
            topic: analysis.topic,
            difficulty: analysis.difficulty,
            points: analysis.points
        });

        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: friend.id,
            text: packedPayload, // Store JSON string here
            // emojis: analysis.emojis, // REMOVED to prevent schema error
            type: 'INCOMING_UNSOLVED', 
            status: 'SENT'
        });

        if (error) {
            // Improved error logging
            console.error("Send failed", error.message || JSON.stringify(error));
            alert("SEND FAILED: " + (error.message || "Unknown Error")); 
            // Don't go back if failed, so user can retry
        } else {
            onBack();
        }
    } else {
        // Fallback demo mode
        setTimeout(() => onBack(), 1000);
    }
    setSending(false);
  };

  const renderStars = (diff: string) => {
      const count = diff === 'HARD' ? 3 : diff === 'MEDIUM' ? 2 : 1;
      return (
          <div className="flex">
              {[...Array(3)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={12} 
                    fill={i < count ? "#FFD740" : "none"} 
                    color={i < count ? "#FFD740" : "#666"} 
                    className="mr-0.5"
                  />
              ))}
          </div>
      );
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
             className="w-full h-[120px] bg-white text-black rounded-xl border-4 border-black p-4 text-[14px] outline-none placeholder:text-gray-400 uppercase resize-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-['Press_Start_2P'] leading-relaxed"
           />
        </div>

        {/* CONTROLS ROW */}
        <div className="flex justify-between items-center mb-6">
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
             className="h-[48px] px-4 bg-[#2196F3] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {loading && !showPreview ? (
                <div className="animate-spin">
                    <Loader size={16} color="white" />
                </div>
             ) : (
                <span className="text-[10px] font-bold">ANALYZE VIBE</span>
             )}
          </button>
        </div>

        {/* INLINE PREVIEW CARD (Improved Sender Flow) */}
        {showPreview && analysis && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="bg-[#333] border-[4px] border-black p-0 relative shadow-[6px_6px_0_0_black]">
                     
                     {/* Preview Header */}
                     <div className="bg-black p-2 flex justify-between items-center border-b-[4px] border-black">
                         <span className="text-white text-[10px] uppercase">EMOJI PREVIEW:</span>
                         <button onClick={handleRegenerate} className="text-[#FFD740] hover:text-white">
                             <RefreshCw size={14} />
                         </button>
                     </div>

                     <div className="p-4">
                        {/* Emojis */}
                        <div className="flex flex-wrap justify-center gap-4 mb-6">
                             {analysis.emojis.map((emoji, i) => (
                                 <span key={i} className="text-[32px] md:text-[40px] filter drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:scale-110 transition-transform cursor-default animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>{emoji}</span>
                             ))}
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {/* Topic */}
                            <div className="bg-[#444] p-2 border-[2px] border-black rounded flex flex-col items-center">
                                <div className="flex items-center gap-1 mb-1">
                                    <Tag size={10} color="#FFD740" />
                                    <span className="text-[#aaa] text-[8px] uppercase">TOPIC</span>
                                </div>
                                <span className="text-white text-[10px] uppercase font-bold text-center">{analysis.topic}</span>
                            </div>

                            {/* Difficulty */}
                            <div className="bg-[#444] p-2 border-[2px] border-black rounded flex flex-col items-center">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-[#aaa] text-[8px] uppercase">DIFF</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {renderStars(analysis.difficulty)}
                                    <span className="text-white text-[8px] uppercase">{analysis.difficulty}</span>
                                </div>
                            </div>
                        </div>

                        {/* Points Estimate */}
                        <div className="bg-black/50 p-2 border-[2px] border-white/20 rounded flex justify-between items-center">
                            <span className="text-white text-[8px] uppercase">EST. POINTS:</span>
                            <div className="flex items-center gap-2">
                                <Trophy size={12} color="#00E676" />
                                <span className="text-[#00E676] text-[12px] font-bold">{analysis.points}</span>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        )}

        {/* SEND BUTTON */}
        <button 
          onClick={handleSend}
          disabled={sending || !showPreview}
          className="w-full h-[64px] bg-[#FFD740] rounded-xl border-[5px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 mt-auto active:translate-y-[4px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
             <Loader size={24} color="black" className="animate-spin" />
          ) : (
             <>
                <span className="text-black text-[14px] font-bold tracking-wide">
                    {">>>"} SEND VIBE! {"<<<"}
                </span>
                <Rocket size={24} color="black" strokeWidth={3} className={showPreview ? "animate-pulse" : ""} />
             </>
          )}
        </button>

      </main>

    </div>
  );
};