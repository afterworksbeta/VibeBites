
import React, { useState, useRef } from 'react';
import { Friend } from '../types';
import { PixelAvatar } from './PixelAvatar';
import { Trash2 } from 'lucide-react';
import { COLORS } from '../constants';

interface PixelCardProps {
  friend: Friend;
  onClick?: () => void;
  onDelete?: () => void;
}

export const PixelCard: React.FC<PixelCardProps> = ({ friend, onClick, onDelete }) => {
  const [offsetX, setOffsetX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const originalOffsetX = useRef(0);
  const isSwiping = useRef(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
        onDelete();
        setOffsetX(0);
        originalOffsetX.current = 0;
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    originalOffsetX.current = offsetX;
    isSwiping.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Detect if horizontal swipe
    if (!isSwiping.current) {
        // If moved more horizontally than vertically
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 5) {
            isSwiping.current = true;
        }
    }

    if (isSwiping.current) {
        let newX = originalOffsetX.current + diffX;
        
        // Limit: can only swipe left (negative) up to -80px
        if (newX > 0) newX = 0;
        if (newX < -80) newX = -80;
        
        setOffsetX(newX);
    }
  };

  const onTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;

    // Snap logic
    if (offsetX < -40) {
        setOffsetX(-80); // Open
        originalOffsetX.current = -80;
    } else {
        setOffsetX(0); // Close
        originalOffsetX.current = 0;
    }
  };

  return (
    <div className="relative w-full h-[100px] mb-4">
      {/* Background / Underlay (Delete Button) */}
      <div className="absolute inset-0 bg-[#FF5252] flex items-center justify-end rounded-xl pr-5 z-0">
         <button 
            onClick={handleDelete} 
            className="flex flex-col items-center justify-center text-white h-full w-[80px]"
         >
            <Trash2 size={24} strokeWidth={3} />
            <span className="text-[8px] font-bold mt-1">DEL</span>
         </button>
      </div>

      {/* Foreground Card */}
      <div 
        className="relative w-full h-full bg-white rounded-xl border-4 border-black flex items-center px-4 cursor-pointer z-10"
        style={{
            backgroundColor: friend.color,
            boxShadow: '6px 6px 0px 0px #000000',
            transform: `translateX(${offsetX}px)`,
            transition: isSwiping.current ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
            touchAction: 'pan-y' // Allow vertical scroll by browser, we handle horizontal
        }}
        onClick={() => {
            if (Math.abs(offsetX) < 5 && onClick) {
                onClick();
            } else {
                setOffsetX(0); // Close if open
                originalOffsetX.current = 0;
            }
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Inner Border */}
        <div className="absolute inset-0 rounded-[8px] border-2 border-white/30 pointer-events-none"></div>

        {/* Content */}
        <div className="mr-4 z-10 pointer-events-none select-none">
            <PixelAvatar 
                seed={friend.avatarSeed} 
                size={64} 
                borderWidth={3} 
                backgroundColor={friend.color} 
            />
        </div>

        <div className="flex flex-col justify-center flex-1 z-10 pointer-events-none select-none">
            <h2 className="text-black text-[14px] leading-tight mb-2 tracking-wide uppercase">
            {friend.name}
            </h2>
            <div className="text-black text-[10px] flex items-center gap-2 uppercase">
            <span>{friend.status}</span>
            <span className="text-[12px]">{friend.statusIcon}</span>
            </div>
        </div>

        <div className="absolute top-2 right-2 z-10 pointer-events-none select-none">
            <span className={`text-[8px] font-bold mr-1 ${friend.time === 'CLEARED' ? 'text-black' : 'text-black/70'}`}>
                {friend.time}
            </span>
        </div>

        {/* Unread Notification Badge */}
        {friend.unreadCount !== undefined && friend.unreadCount > 0 && (
            <div className="absolute bottom-3 right-3 z-20 pointer-events-none select-none">
                <div 
                    className="w-7 h-7 rounded-full border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_0_black]"
                    style={{ backgroundColor: '#2962FF' }} // Vibrant Blue
                >
                    <span className="text-white text-[10px] font-bold">{friend.unreadCount > 9 ? '9+' : friend.unreadCount}</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
