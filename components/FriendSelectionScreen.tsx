import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { COLORS } from '../constants';
import { Friend } from '../types';
import { PixelCard } from './PixelCard';

interface FriendSelectionScreenProps {
  friends: Friend[];
  onSelect: (friend: Friend) => void;
  onBack: () => void;
}

export const FriendSelectionScreen: React.FC<FriendSelectionScreenProps> = ({ friends, onSelect, onBack }) => {
  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] overflow-hidden animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div 
        className="w-full h-[80px] border-b-4 border-black flex items-center justify-between px-4 relative z-50 shrink-0"
        style={{ backgroundColor: COLORS.PINK }}
      >
         <button onClick={onBack} className="active:scale-90 transition-transform">
            <ArrowLeft size={24} color="black" strokeWidth={4} />
         </button>
         <div className="flex flex-col items-center">
             <h1 className="text-black text-[12px] font-bold uppercase tracking-wide">PICK A FRIEND</h1>
             <span className="text-[8px] text-black/70 mt-1">TO SEND VIBE</span>
         </div>
         <Users size={24} color="black" strokeWidth={4} />
      </div>

      {/* LIST */}
      <div className="flex-1 p-5 pb-20 flex flex-col gap-4 overflow-y-auto scrollbar-hide bg-gray-50">
        {friends.length > 0 ? (
            friends.map((friend) => (
                <div key={friend.id} className="active:scale-[0.98] transition-transform">
                    <PixelCard 
                        friend={friend} 
                        onClick={() => onSelect(friend)}
                    />
                </div>
            ))
        ) : (
            <div className="flex flex-col items-center justify-center mt-10 opacity-50">
                <span className="text-[10px] text-black">NO FRIENDS FOUND...</span>
            </div>
        )}
        
        {/* Helper Text */}
        <div className="mt-2 text-center">
             <div className="inline-block bg-[#FFD740] px-3 py-1 border-2 border-black rotate-[-2deg]">
                <span className="text-black text-[8px] font-bold uppercase">WHO GETS THE VIBE?</span>
             </div>
        </div>
      </div>
    </div>
  );
};