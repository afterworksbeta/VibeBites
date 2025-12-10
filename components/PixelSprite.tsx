import React from 'react';

interface PixelSpriteProps {
  emoji: string;
  size?: number;
}

export const PixelSprite: React.FC<PixelSpriteProps> = ({ emoji, size = 64 }) => {
  // Using a specific font stack or filter to make standard emojis look more "retro"
  // Alternatively, we could use an image service, but for flexibility we use CSS filters here
  // to crunch the emoji into a more pixelated look.
  return (
    <div 
      className="flex items-center justify-center select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.75,
        filter: 'contrast(1.2) drop-shadow(4px 4px 0px rgba(0,0,0,1))', // Hard shadow for sprite feel
        imageRendering: 'pixelated',
      }}
    >
      {emoji}
    </div>
  );
};