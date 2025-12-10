import React from 'react';
import { COLORS } from '../constants';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick?: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 flex flex-col items-center justify-center rounded-2xl border-4 border-black active:translate-y-[4px] active:shadow-none transition-all"
      style={{
        width: '80px',
        height: '80px',
        backgroundColor: COLORS.YELLOW,
        boxShadow: '6px 6px 0px 0px #000000',
        zIndex: 100
      }}
    >
      <div className="border-2 border-black p-1 bg-white mb-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
        <Plus size={24} color="black" strokeWidth={4} />
      </div>
      <span className="text-[8px] text-black font-bold mt-1 tracking-widest">SEND</span>
    </button>
  );
};