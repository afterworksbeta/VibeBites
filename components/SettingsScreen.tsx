import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { COLORS } from '../constants';
import { PixelSprite } from './PixelSprite';
import { PixelAvatar } from './PixelAvatar';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onClearData?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onLogout, onClearData }) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(false);

  // Helper for Pixel Toggle Switch
  const Toggle = ({ checked, onToggle }: { checked: boolean; onToggle: () => void }) => (
    <div 
      onClick={onToggle}
      className={`w-[56px] h-[32px] border-[3px] border-black rounded-full relative cursor-pointer transition-colors ${checked ? 'bg-[#00E676]' : 'bg-[#9E9E9E]'}`}
    >
      <div 
        className={`absolute top-1/2 -translate-y-1/2 w-[20px] h-[20px] bg-white border-2 border-black rounded-full transition-all ${checked ? 'right-1' : 'left-1'}`}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-black font-['Press_Start_2P'] overflow-hidden animate-in slide-in-from-right duration-300">
        {/* HEADER */}
        <div 
            className="w-full h-[100px] border-b-4 border-black flex items-center justify-between px-4 relative z-50 shrink-0"
            style={{ backgroundColor: COLORS.BLUE }}
        >
             <button onClick={onBack} className="active:scale-90 transition-transform">
                <ArrowLeft size={24} color="white" strokeWidth={4} />
             </button>
             <h1 className="text-white text-[16px] uppercase tracking-wide">=== SETTINGS ===</h1>
             <div className="w-[24px]" /> {/* Spacer */}
        </div>

        {/* MAIN SCROLL AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
            
            {/* SECTION 1: ACCOUNT */}
            <div className="p-5 border-b-4 border-black" style={{ backgroundColor: COLORS.RED }}>
                <h2 className="text-black text-[12px] mb-4 uppercase">ACCOUNT</h2>
                <div className="flex flex-col gap-3">
                    {/* Edit Profile Row */}
                    <div className="h-[52px] bg-white border-[3px] border-black rounded-lg flex items-center px-3 cursor-pointer active:scale-[0.98] transition-transform">
                         <div className="mr-3">
                            <PixelAvatar seed="currentUser_player1" size={32} borderWidth={2} />
                         </div>
                         <span className="flex-1 text-[10px] text-black uppercase">EDIT PROFILE</span>
                         <ArrowRight size={20} color="black" strokeWidth={3} />
                    </div>
                     {/* Change Password Row */}
                     <div className="h-[52px] bg-white border-[3px] border-black rounded-lg flex items-center px-3 cursor-pointer active:scale-[0.98] transition-transform">
                         <div className="mr-3 w-[32px] flex justify-center">
                            <PixelSprite emoji="🔑" size={32} />
                         </div>
                         <span className="flex-1 text-[10px] text-black uppercase">CHANGE PASSWORD</span>
                         <ArrowRight size={20} color="black" strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* SECTION 2: NOTIFICATIONS */}
            <div className="p-5 border-b-4 border-black" style={{ backgroundColor: COLORS.YELLOW }}>
                <h2 className="text-black text-[12px] mb-4 uppercase">NOTIFICATIONS</h2>
                <div className="flex flex-col gap-3">
                    {/* Push */}
                    <div className="h-[52px] bg-white border-[3px] border-black rounded-lg flex items-center px-3 justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-[32px] flex justify-center"><PixelSprite emoji="🔔" size={32} /></div>
                            <span className="text-[10px] text-black uppercase">PUSH NOTIFS</span>
                         </div>
                         <Toggle checked={pushEnabled} onToggle={() => setPushEnabled(!pushEnabled)} />
                    </div>
                    {/* Sound */}
                    <div className="h-[52px] bg-white border-[3px] border-black rounded-lg flex items-center px-3 justify-between">
                         <div className="flex items-center gap-3">
                             <div className="w-[32px] flex justify-center"><PixelSprite emoji="🔊" size={32} /></div>
                            <span className="text-[10px] text-black uppercase">SOUND FX</span>
                         </div>
                         <Toggle checked={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
                    </div>
                     {/* Vibrate */}
                     <div className="h-[52px] bg-white border-[3px] border-black rounded-lg flex items-center px-3 justify-between">
                         <div className="flex items-center gap-3">
                             <div className="w-[32px] flex justify-center"><PixelSprite emoji="📳" size={32} /></div>
                            <span className="text-[10px] text-black uppercase">VIBRATE</span>
                         </div>
                         <Toggle checked={vibrateEnabled} onToggle={() => setVibrateEnabled(!vibrateEnabled)} />
                    </div>
                </div>
            </div>

            {/* SECTION 3: PRIVACY */}
             <div className="p-5 border-b-4 border-black" style={{ backgroundColor: COLORS.PURPLE }}>
                <h2 className="text-white text-[12px] mb-4 uppercase">PRIVACY</h2>
                <div className="flex flex-col gap-3">
                    {/* Blocked Users */}
                    <div className="h-[52px] bg-white/20 border-[3px] border-white rounded-lg flex items-center px-3 cursor-pointer active:scale-[0.98] transition-transform">
                         <div className="mr-3 w-[32px] flex justify-center">
                            <PixelSprite emoji="🔒" size={32} />
                         </div>
                         <span className="flex-1 text-[10px] text-white uppercase">BLOCKED USERS</span>
                         <div className="bg-[#FFD740] w-[24px] h-[24px] rounded-full border-2 border-black flex items-center justify-center mr-2 shadow-[2px_2px_0_0_black]">
                            <span className="text-black text-[10px] font-bold">3</span>
                         </div>
                         <ArrowRight size={20} color="white" strokeWidth={3} />
                    </div>
                    {/* Privacy Policy */}
                    <div className="h-[52px] bg-white/20 border-[3px] border-white rounded-lg flex items-center px-3 cursor-pointer active:scale-[0.98] transition-transform">
                         <div className="mr-3 w-[32px] flex justify-center">
                            <PixelSprite emoji="👁️" size={32} />
                         </div>
                         <span className="flex-1 text-[10px] text-white uppercase">PRIVACY POLICY</span>
                         <ArrowRight size={20} color="white" strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* SECTION 4: ABOUT */}
            <div className="p-5 border-b-4 border-black" style={{ backgroundColor: COLORS.GREEN }}>
                <h2 className="text-black text-[12px] mb-4 uppercase">ABOUT</h2>
                <div className="flex flex-col gap-3">
                    {/* Version */}
                    <div className="h-[44px] bg-white border-[3px] border-black rounded-lg flex items-center px-3">
                         <span className="text-[10px] text-black uppercase w-full text-center">VERSION: 1.2.0</span>
                    </div>
                     {/* Rate App */}
                     <div className="h-[52px] bg-white border-[3px] border-black rounded-lg flex items-center px-3 cursor-pointer active:scale-[0.98] transition-transform">
                         <div className="mr-3 w-[32px] flex justify-center">
                            <PixelSprite emoji="⭐" size={32} />
                         </div>
                         <span className="flex-1 text-[10px] text-black uppercase">RATE APP</span>
                         <ArrowRight size={20} color="black" strokeWidth={3} />
                    </div>
                     {/* FAQ */}
                     <div className="h-[52px] bg-white border-[3px] border-black rounded-lg flex items-center px-3 cursor-pointer active:scale-[0.98] transition-transform">
                         <div className="mr-3 w-[32px] flex justify-center">
                            <PixelSprite emoji="❓" size={32} />
                         </div>
                         <span className="flex-1 text-[10px] text-black uppercase">HELP & FAQ</span>
                         <ArrowRight size={20} color="black" strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* SECTION 5: DANGER ZONE */}
            <div className="p-5 pb-20" style={{ backgroundColor: COLORS.PINK }}>
                <h2 className="text-black text-[12px] mb-4 uppercase">DANGER ZONE</h2>
                
                <div className="flex flex-col gap-3">
                    {/* Clear Data (Demo) */}
                    <button 
                        onClick={onClearData}
                        className="w-full h-[56px] bg-white border-[5px] border-black shadow-[5px_5px_0_0_black] flex items-center justify-center gap-3 active:translate-y-[4px] active:shadow-none transition-all"
                    >
                        <div className="w-[32px] flex justify-center">
                            <PixelSprite emoji="🗑️" size={32} />
                        </div>
                        <span className="text-black text-[12px] font-bold uppercase">DELETE ALL DATA</span>
                    </button>

                    {/* Logout */}
                    <button 
                        onClick={onLogout}
                        className="w-full h-[56px] bg-black border-[5px] border-[#FF5252] shadow-[5px_5px_0_0_#FF5252] flex items-center justify-center gap-3 active:translate-y-[4px] active:shadow-none transition-all"
                    >
                        <div className="w-[32px] flex justify-center">
                            <PixelSprite emoji="🚪" size={32} />
                        </div>
                        <span className="text-[#FF5252] text-[14px] font-bold uppercase">LOGOUT</span>
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
};