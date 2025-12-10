import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { ArrowUp, Sparkles, RefreshCw, X, Loader } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ChatInputProps {
  onSend: (text: string, emojis?: string[]) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [generatedEmojis, setGeneratedEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Clear preview if user types new text
  useEffect(() => {
    if (showPreview) {
        setShowPreview(false);
        setGeneratedEmojis([]);
    }
  }, [text]);

  const generateEmojis = async () => {
    if (!text.trim()) return;
    
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

  const handleAction = () => {
    if (loading) return;

    if (showPreview && generatedEmojis.length > 0) {
      // Send Vibe
      onSend(text, generatedEmojis);
      setText('');
      setGeneratedEmojis([]);
      setShowPreview(false);
    } else {
      // Generate Vibe
      if (text.trim()) {
          generateEmojis();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAction();
    }
  };

  const handleCancel = () => {
      setShowPreview(false);
      setGeneratedEmojis([]);
  };

  return (
    <div 
      className="w-full relative shrink-0"
      style={{ backgroundColor: COLORS.BLUE }}
    >
      {/* PREVIEW BAR (Small Temporary Bar) */}
      {showPreview && (
          <div className="absolute bottom-full left-0 w-full bg-[#FFD740] border-t-4 border-black p-2 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200 shadow-[0_-4px_0_rgba(0,0,0,0.1)] z-10">
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide px-2">
                  {generatedEmojis.map((emoji, i) => (
                      <span key={i} className="text-[24px] filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                          {emoji}
                      </span>
                  ))}
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={generateEmojis}
                    disabled={loading}
                    className="w-8 h-8 bg-white border-[3px] border-black flex items-center justify-center active:scale-90 transition-transform"
                  >
                      <RefreshCw size={16} color="black" className={loading ? "animate-spin" : ""} />
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="w-8 h-8 bg-[#FF5252] border-[3px] border-black flex items-center justify-center active:scale-90 transition-transform"
                  >
                      <X size={20} color="black" strokeWidth={4} />
                  </button>
              </div>
          </div>
      )}

      {/* INPUT BAR */}
      <div className="w-full h-[80px] border-t-4 border-black flex items-center justify-between px-4 gap-3">
        <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={showPreview ? "READY TO SEND!" : "TYPE VIBE..."}
            disabled={showPreview} // Lock input while previewing
            className={`flex-1 h-[48px] rounded-lg border-[3px] border-black px-4 font-['Press_Start_2P'] text-[12px] outline-none shadow-[2px_2px_0_rgba(0,0,0,0.1)] focus:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all bg-[#333333] text-white placeholder:text-gray-500 uppercase ${showPreview ? 'opacity-50' : ''}`}
        />
        
        <button 
            onClick={handleAction}
            disabled={loading || text.trim().length === 0}
            className={`w-[48px] h-[48px] rounded-lg border-[3px] border-black flex items-center justify-center active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${showPreview ? 'bg-[#00E676]' : 'bg-[#FFD740]'}`}
            style={{
                boxShadow: '4px 4px 0px 0px #000000'
            }}
        >
            {loading ? (
                <Loader size={24} color="black" className="animate-spin" />
            ) : showPreview ? (
                <ArrowUp size={24} color="black" strokeWidth={4} />
            ) : (
                <Sparkles size={24} color="black" strokeWidth={3} />
            )}
        </button>
      </div>
    </div>
  );
};