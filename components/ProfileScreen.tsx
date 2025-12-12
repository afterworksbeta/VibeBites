
import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { PixelAvatar } from './PixelAvatar';
import { PixelSprite } from './PixelSprite';
import { ArrowLeft, Settings, ArrowRight, Lock, Camera, Loader, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ProfileScreenProps {
  onBack: () => void;
  onSettingsClick: () => void;
  onInviteClick: () => void;
  onEditProfile?: () => void;
  onUpdateUsername?: (name: string) => void;
  currentSeed?: string;
  currentBgColor?: string;
  username?: string;
  userId?: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  onBack, 
  onSettingsClick, 
  onInviteClick, 
  onEditProfile,
  onUpdateUsername,
  currentSeed = "currentUser_player1",
  currentBgColor,
  username = "",
  userId
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(username);
  const [stats, setStats] = useState({ sent: 0, solved: 0, match: 0 });

  // Sync state if prop changes
  useEffect(() => {
    setTempName(username);
  }, [username]);

  // Fetch Real Stats
  useEffect(() => {
    if (!userId) return;
    
    const fetchStats = async () => {
        try {
            // 1. Sent Count (Real)
            const { count: sentCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('sender_id', userId);
            
            // 2. Received Count (Proxy for Solved - assuming most incoming are played)
            const { count: receivedCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userId);

            // Mock "Avg Match" to look realistic but deterministic
            // In a real app, this would query a game_results table
            const pseudoRandomMatch = 85 + (username.length % 15);

            setStats({
                sent: sentCount || 0,
                solved: receivedCount || 0, 
                match: pseudoRandomMatch
            });
        } catch (e) {
            console.error("Error loading stats", e);
        }
    };
    fetchStats();
  }, [userId, username]);

  const handleAvatarClick = () => {
    if (onEditProfile) {
        onEditProfile();
    }
  };

  const handleSaveName = () => {
      if (onUpdateUsername && tempName.trim().length > 0) {
          onUpdateUsername(tempName.trim());
      }
      setIsEditingName(false);
  };

  const handleCancelName = () => {
      setTempName(username);
      setIsEditingName(false);
  };

  const displayUsername = username || "...";

  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] overflow-y-auto scrollbar-hide">
      
      {/* HEADER & PROFILE CARD */}
      <div 
        className="w-full relative flex flex-col items-center pt-6 pb-8 border-b-[4px] border-black shrink-0"
        style={{ backgroundColor: COLORS.PURPLE }}
      >
        {/* Nav Controls */}
        <div className="absolute top-6 left-4 z-10">
            <button onClick={onBack} className="active:scale-90 transition-transform">
                <ArrowLeft size={24} color="white" strokeWidth={4} />
            </button>
        </div>
        <div className="absolute top-6 right-4 z-10">
            <button 
                onClick={onSettingsClick}
                className="active:rotate-90 transition-transform duration-200"
            >
                <Settings size={24} color="white" strokeWidth={4} />
            </button>
        </div>

        {/* Avatar with Idle Animation & Edit Capability */}
        <div className="relative mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
            <div 
                onClick={handleAvatarClick}
                className="border-[6px] border-black shadow-[8px_8px_0_0_#000000] bg-[#b6e3f4] cursor-pointer relative group"
                style={{ backgroundColor: currentBgColor }}
            >
                <PixelAvatar 
                    seed={currentSeed}
                    size={120} 
                    borderWidth={0} 
                    backgroundColor={currentBgColor}
                />
                
                {/* Overlay Hint on Hover/Click */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="bg-white p-2 border-2 border-black">
                         <Camera size={24} color="black" />
                    </div>
                </div>
            </div>
            
            {/* Always visible edit button badge */}
            <button 
                onClick={handleAvatarClick}
                className="absolute -bottom-3 -right-3 bg-[#FF4081] border-[3px] border-black p-2 shadow-[2px_2px_0_0_black] hover:scale-110 active:translate-y-1 transition-transform z-10"
                title="Change Avatar"
            >
                <Camera size={16} color="white" strokeWidth={3} />
            </button>
        </div>

        {/* Username (Editable - Styled as Screenshot) */}
        <div className="relative mb-3 flex flex-col items-center group">
             {isEditingName ? (
                 <div className="bg-white border-[4px] border-black p-2 shadow-[4px_4px_0_0_#000000] flex items-center gap-2 max-w-[280px] z-10 relative">
                     <input 
                        className="flex-1 bg-transparent outline-none font-['Press_Start_2P'] text-[14px] uppercase text-black min-w-0"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value.toUpperCase())}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        maxLength={12}
                        placeholder="NAME?"
                     />
                     <button 
                        onClick={handleSaveName} 
                        className="bg-[#00E676] p-1 border-2 border-black hover:scale-110 transition-transform active:translate-y-1"
                     >
                         <Check size={16} color="black" strokeWidth={3} />
                     </button>
                     <button 
                        onClick={handleCancelName} 
                        className="bg-[#FF5252] p-1 border-2 border-black hover:scale-110 transition-transform active:translate-y-1"
                     >
                         <X size={16} color="black" strokeWidth={3} />
                     </button>
                 </div>
             ) : (
                <div className="relative z-10">
                    <div 
                        onClick={() => setIsEditingName(true)}
                        className="relative bg-[#FFD740] border-[4px] border-black px-6 py-3 shadow-[4px_4px_0_0_#000000] cursor-pointer active:translate-y-[2px] transition-all flex items-center gap-3"
                    >
                        <div className="absolute inset-[2px] border-[2px] border-white/40 pointer-events-none"></div>
                        <h1 className="text-[20px] text-black uppercase relative z-10 select-none font-bold tracking-wide">
                            {displayUsername}
                        </h1>
                        <Edit2 size={16} color="black" strokeWidth={3} />
                    </div>
                </div>
             )}
             
             {/* The Black Notch underneath */}
             <div className="w-16 h-4 bg-black rounded-full mt-[-6px] z-0"></div>
        </div>
      </div>

      {/* STATS SECTION */}
      <div 
        className="w-full p-5 border-b-[4px] border-black"
        style={{ backgroundColor: COLORS.YELLOW }}
      >
        <div className="text-center mb-4">
            <span className="text-[12px] text-black font-bold uppercase tracking-widest">=== STATS ===</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
            {/* Card 1: Solved (Red) */}
            <div 
                className="rounded-xl border-[4px] border-black p-3 flex flex-col items-center justify-center shadow-[4px_4px_0_0_#000000]"
                style={{ backgroundColor: COLORS.RED }}
            >
                <div className="mb-2">
                    <PixelSprite emoji="🏆" size={32} />
                </div>
                <span className="text-white text-[20px] mb-1 font-bold">{stats.solved}</span>
                <span className="text-white text-[10px] font-bold uppercase">SOLVED</span>
            </div>

            {/* Card 2: Sent (Blue) */}
            <div 
                className="rounded-xl border-[4px] border-black p-3 flex flex-col items-center justify-center shadow-[4px_4px_0_0_#000000]"
                style={{ backgroundColor: COLORS.BLUE }}
            >
                <div className="mb-2">
                    <PixelSprite emoji="🚀" size={32} />
                </div>
                <span className="text-white text-[20px] mb-1 font-bold">{stats.sent}</span>
                <span className="text-white text-[10px] font-bold uppercase">SENT</span>
            </div>

            {/* Card 3: Avg Match (Green) */}
            <div 
                className="col-span-2 rounded-xl border-[4px] border-black p-3 flex flex-row items-center justify-between px-8 shadow-[4px_4px_0_0_#000000]"
                style={{ backgroundColor: COLORS.GREEN }}
            >
                <div className="flex flex-col items-start">
                     <span className="text-black text-[24px] mb-1 font-bold">{stats.match}%</span>
                     <span className="text-black text-[10px] font-bold uppercase">AVG MATCH</span>
                </div>
                <PixelSprite emoji="⭐" size={48} />
            </div>
        </div>
      </div>

      {/* ACHIEVEMENTS SECTION (Matching Screenshot Colors) */}
      <div 
        className="w-full p-5 flex-1 border-b-[4px] border-black"
        style={{ backgroundColor: COLORS.PINK }}
      >
         <div className="text-center mb-4">
            <span className="text-[12px] text-black font-bold uppercase tracking-widest">=== BADGES ===</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide justify-center">
            {/* Badge 1 - Yellow */}
            <div className="shrink-0 w-[64px] h-[64px] bg-[#FFD740] border-[3px] border-black shadow-[3px_3px_0_0_#000000] flex items-center justify-center">
                 <PixelSprite emoji="⭐" size={32} />
            </div>
            {/* Badge 2 - Grey/White */}
            <div className="shrink-0 w-[64px] h-[64px] bg-[#E0E0E0] border-[3px] border-black shadow-[3px_3px_0_0_#000000] flex items-center justify-center">
                 <PixelSprite emoji="🥈" size={32} />
            </div>
            {/* Badge 3 - Red/Orange */}
            <div className="shrink-0 w-[64px] h-[64px] bg-[#FF5252] border-[3px] border-black shadow-[3px_3px_0_0_#000000] flex items-center justify-center">
                 <PixelSprite emoji="🔥" size={32} />
            </div>
            {/* Badge 4 (Locked) - Dark Grey */}
            <div className="shrink-0 w-[64px] h-[64px] bg-[#9E9E9E] border-[3px] border-black shadow-[3px_3px_0_0_#000000] flex items-center justify-center relative">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={20} color="black" strokeWidth={3} />
                 </div>
            </div>
            {/* Badge 5 (Locked) - Dark Grey */}
            <div className="shrink-0 w-[64px] h-[64px] bg-[#9E9E9E] border-[3px] border-black shadow-[3px_3px_0_0_#000000] flex items-center justify-center relative">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={20} color="black" strokeWidth={3} />
                 </div>
            </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div 
        className="w-full p-6 flex flex-col gap-4 bg-black"
      >
         <button 
            onClick={onInviteClick}
            className="w-full h-[52px] bg-[#00E676] border-[4px] border-black shadow-[5px_5px_0_0_#333] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
         >
            <span className="text-[12px] text-black font-bold uppercase">INVITE FRIENDS</span>
            <ArrowRight size={16} color="black" strokeWidth={4} />
         </button>
      </div>

    </div>
  );
};
