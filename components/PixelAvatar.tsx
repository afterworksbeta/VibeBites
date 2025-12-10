import React from 'react';

interface PixelAvatarProps {
  seed: string;
  size: number; // px
  borderWidth?: number; // px
  backgroundColor?: string;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({ seed, size, borderWidth = 3, backgroundColor = 'b6e3f4' }) => {
  // Using DiceBear Pixel Art API for authentic retro generated avatars
  // Ensure we strip # if passed, as API typically expects hex without hash or standard color names
  const safeColor = backgroundColor.replace('#', '');
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}&backgroundColor=${safeColor}`;

  return (
    <div 
      className="relative bg-white shrink-0 overflow-hidden"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `${borderWidth}px solid black`,
      }}
    >
      <img 
        src={avatarUrl} 
        alt="Avatar" 
        className="w-full h-full object-cover pixelated"
      />
      {/* Inner sheen for glass effect typically found in retro UI */}
      <div className="absolute inset-0 border-2 border-white/20 pointer-events-none mix-blend-overlay"></div>
    </div>
  );
};