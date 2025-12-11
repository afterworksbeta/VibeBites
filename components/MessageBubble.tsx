import React from 'react';
import { Message, MessageType, Friend } from '../types';
import { COLORS } from '../constants';
import { PixelAvatar } from './PixelAvatar';
import { Check } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  friend: Friend;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, friend }) => {
  const isIncomingUnsolved = message.type === MessageType.INCOMING_UNSOLVED;
  const isIncomingSolved = message.type === MessageType.INCOMING_SOLVED;
  const isOutgoing = message.type === MessageType.OUTGOING;

  // Render Incoming Unsolved (Red)
  if (isIncomingUnsolved) {
    return (
      <div className="relative mb-8 pl-4 w-[85%] self-start">
        {/* Floating Avatar */}
        <div className="absolute -top-4 -left-0 z-20">
           <PixelAvatar seed={friend.avatarSeed} size={32} borderWidth={3} />
        </div>
        
        <div 
          className="relative p-3 rounded-xl border-4 border-black"
          style={{ 
            backgroundColor: COLORS.RED,
            boxShadow: '4px 4px 0px 0px #000000'
          }}
        >
          {/* Emojis */}
          <div className="flex gap-2 mb-2 text-[32px] leading-none filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
            {message.emojis?.map((emoji, i) => <span key={i}>{emoji}</span>)}
          </div>
          
          <div className="flex justify-between items-end mt-2">
            <span className="text-[#FFD740] text-[10px] font-bold tracking-wider">TAP 2 SOLVE!</span>
            <span className="text-black/70 text-[8px] font-bold">{message.time}</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Incoming Solved (Green)
  if (isIncomingSolved) {
    return (
      <div className="relative mb-6 w-[85%] self-start">
        <div 
          className="relative p-3 rounded-xl border-4 border-black flex flex-col"
          style={{ 
            backgroundColor: COLORS.GREEN,
            boxShadow: '4px 4px 0px 0px #000000'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
             <div className="w-6 h-6 border-2 border-black bg-white flex items-center justify-center">
                <Check size={16} strokeWidth={4} color="black" />
             </div>
             <span className="text-black text-[11px] font-bold uppercase">{message.text}</span>
             <div className="flex text-[20px]">
                {message.emojis?.map((emoji, i) => <span key={i}>{emoji}</span>)}
             </div>
          </div>
          
          <div className="flex justify-end items-center gap-1 mt-1">
            <Check size={10} strokeWidth={4} color="black" />
            <span className="text-black text-[9px] font-bold">{message.score}</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Outgoing (Pink)
  if (isOutgoing) {
    return (
      <div className="relative mb-6 w-[70%] self-end">
        <div 
          className="relative p-4 rounded-xl border-4 border-black flex flex-col items-end"
          style={{ 
            backgroundColor: COLORS.PINK,
            boxShadow: '4px 4px 0px 0px #000000'
          }}
        >
            {/* Content Logic: Emoji or Text */}
            {message.emojis && message.emojis.length > 0 ? (
                <div className="relative mb-2">
                    <div className="text-[42px] leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                        {message.emojis[0]}
                    </div>
                    <div className="absolute top-0 -left-4 text-white text-[12px]">✨</div>
                    <div className="absolute bottom-0 -right-4 text-white text-[12px]">✨</div>
                </div>
            ) : (
                <div className="mb-2 text-white text-[12px] font-bold uppercase text-right break-words w-full leading-relaxed">
                    {message.text}
                </div>
            )}
          
          <div className="flex justify-between items-center w-full mt-1">
            <div className="flex items-center gap-1 text-white">
                <span className="text-[10px] tracking-tighter">✓✓</span>
                <span className="text-[8px] font-bold">{message.status}</span>
            </div>
            <span className="text-white/80 text-[8px] font-bold">{message.time}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};