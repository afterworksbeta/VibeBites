import React from 'react';
import { PixelAvatar } from './PixelAvatar';
import { COLORS } from '../constants';
import { ArrowLeft } from 'lucide-react';
import { Friend } from '../types';

interface ChatHeaderProps {
  friend: Friend;
  onBack: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ friend, onBack }) => {
  return (
    <div 
      className="w-full h-[100px] border-b-4 border-black flex items-center justify-between px-4 sticky top-0 z-50 shrink-0"
      style={{ backgroundColor: COLORS.PURPLE }}
    >
      {/* Left: Back Button */}
      <button 
        onClick={onBack}
        className="active:scale-90 transition-transform"
      >
        <ArrowLeft size={32} color="white" strokeWidth={4} />
      </button>

      {/* Center: User Info */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
            <div className="mb-1">
                 <PixelAvatar seed={friend.avatarSeed} size={56} borderWidth={3} />
            </div>
        </div>
        <div className="flex flex-col items-center">
             <h2 className="text-white text-[12px] uppercase mb-1">{friend.name}</h2>
             <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#00E676] rounded-none"></div>
                <span className="text-[#00E676] text-[8px] uppercase">ONLINE</span>
             </div>
        </div>
      </div>

      {/* Right: Spacer to balance layout since delete button is removed */}
      <div className="w-8"></div>
    </div>
  );
};