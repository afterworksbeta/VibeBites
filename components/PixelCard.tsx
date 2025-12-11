import React from 'react';
import { Friend } from '../types';
import { PixelAvatar } from './PixelAvatar';
import { Trash2 } from 'lucide-react';

interface PixelCardProps {
  friend: Friend;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const PixelCard: React.FC<PixelCardProps> = ({ friend, onClick, onDelete }) => {
  return (
    <div 
      onClick={onClick}
      className="relative w-full h-[100px] rounded-xl border-4 border-black flex items-center px-4 mb-4 cursor-pointer active:translate-y-1 transition-transform group"
      style={{
        backgroundColor: friend.color,
        boxShadow: '6px 6px 0px 0px #000000', // Hard pixel shadow
      }}
    >
      {/* Inner White Border Highlight for "Double Border" effect */}
      <div className="absolute inset-0 rounded-[8px] border-2 border-white/30 pointer-events-none"></div>

      {/* Left: Avatar */}
      <div className="mr-4 z-10 relative">
        <PixelAvatar 
            seed={friend.avatarSeed} 
            size={64} 
            borderWidth={3} 
            backgroundColor={friend.color} 
        />
        {/* Unread Notification Badge */}
        {friend.unreadCount && friend.unreadCount > 0 ? (
            <div className="absolute -top-2 -right-2 bg-[#FF5252] border-[3px] border-black w-7 h-7 flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] z-20 animate-bounce">
                <span className="text-white text-[10px] font-bold leading-none mt-[1px]">
                    {friend.unreadCount > 9 ? '9+' : friend.unreadCount}
                </span>
            </div>
        ) : null}
      </div>

      {/* Center: Info */}
      <div className="flex flex-col justify-center flex-1 z-10">
        <h2 className="text-black text-[14px] leading-tight mb-2 tracking-wide uppercase">
          {friend.name}
        </h2>
        <div className="text-black text-[10px] flex items-center gap-2 uppercase">
          <span>{friend.status}</span>
          <span className="text-[12px]">{friend.statusIcon}</span>
        </div>
      </div>

      {/* Top Right: Delete Button (Takes priority over time when interacting) */}
      <div className="absolute top-2 right-2 z-30 flex flex-col items-end gap-1">
        {onDelete && (
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(e);
                }}
                className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform"
                title="Delete"
             >
                <Trash2 size={20} color="black" strokeWidth={3} />
             </button>
        )}
        <span className="text-black/70 text-[8px] font-bold mr-1 pointer-events-none">{friend.time}</span>
      </div>
    </div>
  );
};