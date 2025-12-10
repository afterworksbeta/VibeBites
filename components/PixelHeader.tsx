import React from 'react';
import { PixelAvatar } from './PixelAvatar';
import { COLORS } from '../constants';
import { UserPlus } from 'lucide-react';

interface PixelHeaderProps {
    onProfileClick?: () => void;
    onAddFriendClick?: () => void;
}

export const PixelHeader: React.FC<PixelHeaderProps> = ({ onProfileClick, onAddFriendClick }) => {
  return (
    <div 
      className="w-full h-[100px] border-b-4 border-black flex items-center justify-between px-4 relative z-50 shrink-0"
      style={{ backgroundColor: COLORS.YELLOW }}
    >
      {/* Left Add Friend Button - Frame Removed */}
      <button 
        onClick={onAddFriendClick}
        className="w-[48px] h-[48px] flex items-center justify-center active:scale-90 transition-transform hover:opacity-70"
      >
        <UserPlus size={32} color="black" strokeWidth={3} />
      </button>

      {/* Center Logo Box */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div 
          className="bg-black text-[#FFD740] flex items-center justify-center border-4 border-black"
          style={{
            width: '180px', // Slightly wider to fit text comfortably
            height: '60px',
            boxShadow: '4px 4px 0px 0px rgba(255,255,255,0.4)' // Subtle highlight shadow
          }}
        >
          <h1 className="text-[20px] tracking-widest uppercase">
            ViBeBiTeS
          </h1>
        </div>
      </div>

      {/* Right User Avatar */}
      <div className="relative cursor-pointer hover:scale-105 transition-transform" onClick={onProfileClick}>
        <PixelAvatar seed="currentUser_player1" size={48} borderWidth={3} />
        {/* Online Indicator */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00E676] border-2 border-black"></div>
      </div>
    </div>
  );
};