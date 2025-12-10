import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, Loader, AlertTriangle } from 'lucide-react';
import { COLORS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface ChangePasswordScreenProps {
  onBack: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ onBack }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdate = async () => {
    if (password.length < 6) {
      setMessage({ text: "TOO SHORT (MIN 6 CHARS)", type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: "PASSWORDS DON'T MATCH", type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      
      setMessage({ text: "PASSWORD UPDATED!", type: 'success' });
      setTimeout(onBack, 1500);
    } catch (err: any) {
      setMessage({ text: err.message || "UPDATE FAILED", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] overflow-hidden animate-in slide-in-from-right duration-300">
       {/* Header */}
       <div 
        className="h-[100px] border-b-4 border-black flex items-center justify-between px-4 shrink-0 relative z-10"
        style={{ backgroundColor: COLORS.RED }}
      >
        <button onClick={onBack} className="active:scale-90 transition-transform">
           <ArrowLeft size={24} color="black" strokeWidth={4} />
        </button>
        <div className="flex flex-col items-center">
            <h1 className="text-black text-[12px] uppercase tracking-wide font-bold">CHANGE PW</h1>
            <span className="text-[8px] text-black/70">SECURE YOUR ACCT</span>
        </div>
        <Lock size={24} color="black" strokeWidth={4} />
      </div>

      <div className="p-6 flex flex-col gap-6 relative" style={{ backgroundColor: COLORS.YELLOW, flex: 1 }}>
         {/* Background Pattern */}
         <div className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{ backgroundImage: 'radial-gradient(black 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
         </div>

         {/* Message Banner */}
         {message && (
             <div className={`p-4 border-[4px] border-black text-center text-[10px] shadow-[4px_4px_0_0_black] flex items-center justify-center gap-2 relative z-20 ${message.type === 'success' ? 'bg-[#00E676]' : 'bg-[#FF5252] text-white'}`}>
                 {message.type === 'error' && <AlertTriangle size={16} strokeWidth={3} />}
                 <span className="font-bold">{message.text}</span>
             </div>
         )}

         {/* Form */}
         <div className="flex flex-col gap-4 mt-4 relative z-10">
            <div className="flex flex-col gap-2">
                <label className="text-[10px] text-black uppercase font-bold pl-1">NEW PASSWORD:</label>
                <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[60px] border-[4px] border-black px-4 font-sans text-[20px] outline-none shadow-[4px_4px_0_0_black] rounded-none focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_black] transition-all"
                placeholder="******"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] text-black uppercase font-bold pl-1">CONFIRM:</label>
                <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-[60px] border-[4px] border-black px-4 font-sans text-[20px] outline-none shadow-[4px_4px_0_0_black] rounded-none focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_black] transition-all"
                placeholder="******"
                />
            </div>
         </div>

         {/* Update Button */}
         <button 
           onClick={handleUpdate}
           disabled={loading || !password || !confirmPassword}
           className="h-[72px] bg-[#2196F3] border-[5px] border-black shadow-[6px_6px_0_0_black] flex items-center justify-center gap-3 active:translate-y-[4px] active:shadow-[2px_2px_0_0_black] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-auto mb-10 relative z-10"
         >
             {loading ? <Loader className="animate-spin" color="white" size={28} strokeWidth={3} /> : <Check size={28} color="white" strokeWidth={4} />}
             <span className="text-white text-[14px] font-bold uppercase tracking-widest">UPDATE</span>
         </button>
      </div>
    </div>
  );
};