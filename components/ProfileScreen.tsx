
import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { PixelAvatar } from './PixelAvatar';
import { PixelSprite } from './PixelSprite';
import { ArrowLeft, Settings, ArrowRight, Lock, Camera, Loader, Edit2, Check, X } from 'lucide-react';

interface ProfileScreenProps {
  onBack: () => void;
  onSettingsClick: () => void;
  onInviteClick: () => void;
  onEditProfile?: () => void;
  onUpdateUsername?: (name: string) => void;
  currentSeed?: string;
  currentBgColor?: string;
  username?: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  onBack, 
  onSettingsClick, 
  onInviteClick, 
  onEditProfile,
  onUpdateUsername,
  currentSeed = "currentUser_player1",
  currentBgColor,
  username = ""
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(username);

  // Sync state if prop changes
  useEffect(() => {
    setTempName(username);
  }, [username]);

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

        {/* Username (Editable) */}
        <div className="relative mb-3 group">
             {isEditingName ? (
                 <div className="bg-white border-[4px] border-black p-2 shadow-[4px_4px_0_0_#000000] flex items-center gap-2 max-w-[280px]">
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
                <div 
                    onClick={() => setIsEditingName(true)}
                    className="relative bg-[#FFD740] border-[4px] border-black px-4 py-2 shadow-[4px_4px_0_0_#000000] cursor-pointer hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000000] transition-all flex items-center gap-2 pr-8"
                >
                    <div className="absolute inset-[2px] border-[2px] border-white pointer-events-none"></div>
                    <h1 className="text-[18px] text-black uppercase relative z-10 select-none">
                        {displayUsername}
                    </h1>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={14} color="black" strokeWidth={3} />
                    </div>
                </div>
             )}
        </div>

        {/* Level Tag */}
        <div className="bg-[#FFD740] border-[2px] border-black px-3 py-1 rounded-full shadow-[2px_2px_0_0_#000000]">
            <span className="text-[10px] text-black">LVL 12 ★</span>
        </div>
      </div>

      {/* STATS SECTION */}
      <div 
        className="w-full p-5 border-b-[4px] border-black"
        style={{ backgroundColor: COLORS.YELLOW }}
      >
        <div className="text-center mb-4">
            <span className="text-[12px] text-black">=== STATS ===</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
            {/* Card 1: Solved */}
            <div 
                className="rounded-xl border-[4px] border-black p-3 flex flex-col items-center justify-center shadow-[4px_4px_0_0_#000000]"
                style={{ backgroundColor: COLORS.RED }}
            >
                <div className="mb-2">
                    <PixelSprite emoji="🏆" size={32} />
                </div>
                <span className="text-white text-[20px] mb-1">156</span>
                <span className="text-white text-[10px]">SOLVED</span>
            </div>

            {/* Card 2: Sent */}
            <div 
                className="rounded-xl border-[4px] border-black p-3 flex flex-col items-center justify-center shadow-[4px_4px_0_0_#000000]"
                style={{ backgroundColor: COLORS.BLUE }}
            >
                <div className="mb-2">
                    <PixelSprite emoji="🚀" size={32} />
                </div>
                <span className="text-white text-[20px] mb-1">89</span>
                <span className="text-white text-[10px]">SENT</span>
            </div>

            {/* Card 3: Avg Match */}
            <div 
                className="col-span-2 rounded-xl border-[4px] border-black p-3 flex flex-row items-center justify-between px-8 shadow-[4px_4px_0_0_#000000]"
                style={{ backgroundColor: COLORS.GREEN }}
            >
                <div className="flex flex-col items-start">
                     <span className="text-black text-[24px] mb-1">94%</span>
                     <span className="text-black text-[10px]">AVG MATCH</span>
                </div>
                <PixelSprite emoji="⭐" size={48} />
            </div>
        </div>
      </div>

      {/* ACHIEVEMENTS SECTION */}
      <div 
        className="w-full p-5 flex-1 border-b-[4px] border-black"
        style={{ backgroundColor: COLORS.PINK }}
      >
         <div className="text-center mb-4">
            <span className="text-[12px] text-black">=== BADGES ===</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {/* Badge 1 */}
            <div className="shrink-0 w-[64px] h-[64px] bg-[#FFD740] border-[3px] border-black shadow-[3px_3px_0_0_#000000] flex items-center justify-center">
                 <PixelSprite emoji="⭐" size={32} />
            </div>
            {/* Badge 2 */}
            <div className="shrink-0 w-[64px] h-[64px] bg-[#E0E0E0] border-[3px] border-black shadow-[3px_3px_0_0_#000000] flex items-center justify-center">
                 <PixelSprite emoji="🥈" size={32} />
            </div>
            {/* Badge 3 */}
            <div className="shrink-0 w-[64px] h-[64px] bg-[#FF5252] border-[3px] border-black shadow-[3px_3px_0_0_#000000] flex items-center justify-center">
                 <PixelSprite emoji="🔥" size={32} />
            </div>
            {/* Badge 4 (Locked) */}
            <div className="shrink-0 w-[64px] h-[64px] bg-[#9E9E9E] border-[3px] border-black shadow-[3px_3px_0_0_#000000] flex items-center justify-center relative">
                 <div className="opacity-50 grayscale filter">
                    <PixelSprite emoji="👑" size={32} />
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={20} color="black" strokeWidth={3} />
                 </div>
            </div>
            {/* Badge 5 (Locked) */}
            <div className="shrink-0 w-[64px] h-[64px] bg-[#9E9E9E] border-[3px] border-black shadow-[3px_3px_0_0_#000000] flex items-center justify-center relative">
                 <div className="opacity-50 grayscale filter">
                    <PixelSprite emoji="💎" size={32} />
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={20} color="black" strokeWidth={3} />
                 </div>
            </div>
             {/* Spacer */}
             <div className="w-2"></div>
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
            <span className="text-[12px] text-black">INVITE FRIENDS</span>
            <ArrowRight size={16} color="black" strokeWidth={4} />
         </button>
      </div>

    </div>
  );
};
