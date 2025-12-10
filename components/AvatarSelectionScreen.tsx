import React, { useState } from 'react';
import { ArrowLeft, Shuffle, Check } from 'lucide-react';
import { PixelAvatar } from './PixelAvatar';

interface AvatarSelectionScreenProps {
  currentSeed: string;
  currentBgColor?: string;
  onBack: () => void;
  onSave: (newSeed: string, newBgColor: string) => void;
}

interface AvatarOption {
  id: string;
  seed: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  skinColor: string;
  style: 'CASUAL' | 'SPORTY' | 'COOL' | 'FANCY';
}

const AVATAR_OPTIONS: AvatarOption[] = [
  // ROW 1: Light Skin Males
  { id: '1', seed: 'boy_classic_1', name: 'RETRO_BOY', gender: 'MALE', skinColor: '#FFCCB0', style: 'CASUAL' },
  { id: '2', seed: 'boy_sporty_2', name: 'SPORT_DUDE', gender: 'MALE', skinColor: '#FFE0BD', style: 'SPORTY' },
  { id: '3', seed: 'boy_cool_3', name: 'BLUE_HERO', gender: 'MALE', skinColor: '#FFCD94', style: 'COOL' },
  
  // ROW 2: Medium/Dark Skin Males
  { id: '4', seed: 'boy_curly_4', name: 'FUNKY_MAN', gender: 'MALE', skinColor: '#E0AC69', style: 'FANCY' },
  { id: '5', seed: 'boy_green_5', name: 'GREEN_GUY', gender: 'MALE', skinColor: '#8D5524', style: 'CASUAL' },
  { id: '6', seed: 'boy_cap_6', name: 'CAP_KING', gender: 'MALE', skinColor: '#523218', style: 'COOL' },

  // ROW 3: Light Skin Females
  { id: '7', seed: 'girl_pink_1', name: 'PINK_LADY', gender: 'FEMALE', skinColor: '#FFCCB0', style: 'FANCY' },
  { id: '8', seed: 'girl_pony_2', name: 'SUNNY_GIRL', gender: 'FEMALE', skinColor: '#FFE0BD', style: 'CASUAL' },
  { id: '9', seed: 'girl_short_3', name: 'VIBE_QUEEN', gender: 'FEMALE', skinColor: '#F5C4A6', style: 'COOL' },

  // ROW 4: Medium/Dark Skin Females
  { id: '10', seed: 'girl_braids_4', name: 'BRAID_STAR', gender: 'FEMALE', skinColor: '#C68642', style: 'SPORTY' },
  { id: '11', seed: 'girl_curly_5', name: 'SUMMER_LUV', gender: 'FEMALE', skinColor: '#8D5524', style: 'FANCY' },
  { id: '12', seed: 'girl_bun_6', name: 'CHILL_GAL', gender: 'FEMALE', skinColor: '#452815', style: 'CASUAL' },
];

const TABS = ['ALL', 'MALE', 'FEMALE', 'RANDOM'];

const BG_COLORS = [
  '#b6e3f4', // Default Blue
  '#ffc1c1', // Red
  '#c1ffc1', // Green
  '#fff4c1', // Yellow
  '#e1c1ff', // Purple
  '#ffffff', // White
];

export const AvatarSelectionScreen: React.FC<AvatarSelectionScreenProps> = ({ currentSeed, currentBgColor = '#b6e3f4', onBack, onSave }) => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    const found = AVATAR_OPTIONS.find(Opt => Opt.seed === currentSeed);
    return found ? found.id : '1';
  });
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedBgColor, setSelectedBgColor] = useState(currentBgColor);

  const selectedAvatar = AVATAR_OPTIONS.find(a => a.id === selectedId) || AVATAR_OPTIONS[0];
  const hasChanged = selectedAvatar.seed !== currentSeed || selectedBgColor !== currentBgColor;

  const filteredAvatars = AVATAR_OPTIONS.filter(avatar => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'RANDOM') return true; // Show all for now, randomize logic separate
    return avatar.gender === activeTab;
  });

  const handleRandomize = () => {
    const randomIdx = Math.floor(Math.random() * AVATAR_OPTIONS.length);
    setSelectedId(AVATAR_OPTIONS[randomIdx].id);
    
    // Also randomize color
    const randomColorIdx = Math.floor(Math.random() * BG_COLORS.length);
    setSelectedBgColor(BG_COLORS[randomColorIdx]);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] overflow-hidden">
      
      {/* HEADER - Compact */}
      <div 
        className="h-[70px] border-b-[4px] border-black flex items-center justify-between px-4 shrink-0 relative z-20"
        style={{ backgroundColor: '#9C27B0' }}
      >
         <button onClick={onBack} className="active:scale-90 transition-transform">
            <ArrowLeft size={24} color="white" strokeWidth={4} />
         </button>
         <h1 className="text-white text-[14px] uppercase tracking-wide">PICK AVATAR</h1>
         <button onClick={handleRandomize} className="active:rotate-180 transition-transform duration-300">
            <Shuffle size={24} color="white" strokeWidth={4} />
         </button>
      </div>

      {/* COMPACT PREVIEW SECTION */}
      <div 
        className="h-[160px] border-b-[4px] border-black p-3 flex items-center justify-center gap-4 shrink-0 relative z-10"
        style={{ backgroundColor: '#FFD740' }}
      >
          {/* Avatar Display - Fixed size */}
          <div 
            className="w-[100px] h-[100px] bg-white border-[4px] border-black rounded-xl overflow-hidden shadow-[4px_4px_0_0_black] shrink-0" 
          >
              <PixelAvatar seed={selectedAvatar.seed} size={100} borderWidth={0} backgroundColor={selectedBgColor} />
          </div>

          {/* Controls Side */}
          <div className="flex flex-col gap-2 w-[160px]">
              {/* Name */}
              <div className="bg-black px-2 py-1.5 border-[2px] border-black relative">
                  <div className="absolute inset-[1px] border-[1px] border-white/20 pointer-events-none"></div>
                  <span className="text-[#FFD740] text-[10px] uppercase block text-center truncate">
                      {selectedAvatar.name}
                  </span>
              </div>

              {/* Tags */}
              <div className="flex gap-2 justify-between">
                  <div className={`flex-1 py-1 border-[2px] border-black rounded flex items-center justify-center ${selectedAvatar.gender === 'MALE' ? 'bg-blue-200' : 'bg-pink-200'}`}>
                      <span className="text-[6px] text-black">{selectedAvatar.gender}</span>
                  </div>
                  <div className="flex-1 py-1 bg-[#00E676] border-[2px] border-black rounded flex items-center justify-center">
                      <span className="text-[6px] text-black">{selectedAvatar.style}</span>
                  </div>
              </div>
              
              {/* Color Picker Bar */}
              <div className="flex justify-between items-center bg-black/10 p-1 border-2 border-black/20 rounded">
                  {BG_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedBgColor(color)}
                        className={`w-4 h-4 border-2 border-black transition-transform active:scale-90 ${selectedBgColor === color ? 'ring-2 ring-white scale-110 z-10 shadow-[1px_1px_0_0_black]' : 'opacity-80'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select background color ${color}`}
                      />
                  ))}
              </div>
          </div>
      </div>

      {/* CHARACTER GRID SECTION */}
      <div 
        className="flex-1 flex flex-col min-h-0"
        style={{ backgroundColor: '#2196F3' }}
      >
          {/* TABS */}
          <div className="p-3 flex gap-2 justify-center shrink-0 border-b-4 border-black bg-[#2196F3]">
             {TABS.map(tab => (
                 <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`h-[30px] flex-1 border-[3px] border-black rounded flex items-center justify-center transition-all ${activeTab === tab ? 'bg-[#FFD740] shadow-[2px_2px_0_0_black] -translate-y-[1px]' : 'bg-white'}`}
                 >
                     <span className="text-[8px] text-black uppercase">{tab}</span>
                 </button>
             ))}
          </div>

          {/* GRID */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-3 content-start pb-24 scrollbar-hide">
              {filteredAvatars.map((avatar) => {
                  const isSelected = selectedId === avatar.id;
                  return (
                    <div 
                        key={avatar.id}
                        onClick={() => setSelectedId(avatar.id)}
                        className={`aspect-square bg-white border-[3px] rounded-lg relative flex items-center justify-center cursor-pointer transition-all active:scale-95 overflow-hidden ${isSelected ? 'border-[#FFD740] shadow-[0_0_0_4px_black] z-10 scale-105' : 'border-black'}`}
                    >
                        <div className={isSelected ? 'scale-110 transition-transform' : ''}>
                             <PixelAvatar seed={avatar.seed} size={56} borderWidth={0} backgroundColor={selectedBgColor} />
                        </div>
                        
                        {isSelected && (
                            <div className="absolute top-0 right-0 bg-[#00E676] p-[2px] border-l-2 border-b-2 border-black z-20">
                                <Check size={10} color="black" strokeWidth={4} />
                            </div>
                        )}
                    </div>
                  );
              })}
              
              {/* Spacer */}
              <div className="col-span-4 h-16"></div>
          </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div 
        className="h-[90px] border-t-[5px] border-[#FFD740] bg-black p-4 flex items-center justify-between gap-4 shrink-0 absolute bottom-0 w-full z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]"
      >
          <button 
             onClick={onBack}
             className="w-[100px] h-[50px] bg-transparent border-[3px] border-white rounded-xl flex items-center justify-center active:bg-white/10 transition-colors"
          >
              <span className="text-white text-[10px] uppercase">CANCEL</span>
          </button>

          <button 
             onClick={() => hasChanged && onSave(selectedAvatar.seed, selectedBgColor)}
             disabled={!hasChanged}
             className={`flex-1 h-[56px] border-[5px] border-black rounded-xl shadow-[4px_4px_0_0_#333] flex items-center justify-center gap-2 active:translate-y-[4px] active:shadow-none transition-all ${hasChanged ? 'bg-[#00E676]' : 'bg-[#9E9E9E]'}`}
          >
              {hasChanged && <Check size={20} color="black" strokeWidth={4} />}
              <span className={`text-[12px] font-bold uppercase ${hasChanged ? 'text-black' : 'text-gray-600'}`}>
                  {hasChanged ? ">>> SAVE <<<" : "NO CHANGE"}
              </span>
          </button>
      </div>

    </div>
  );
};