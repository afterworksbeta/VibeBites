import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { PixelSprite } from './PixelSprite';
import { Eye, EyeOff, Lock, ArrowRight, Loader, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AuthScreenProps {
  onLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('vb_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  const toggleMode = () => {
    const nextIsLogin = !isLogin;
    setIsLogin(nextIsLogin);
    
    // If switching back to login and we have a saved email, restore it
    // Otherwise clear fields
    if (nextIsLogin) {
        const saved = localStorage.getItem('vb_saved_email');
        if (saved) {
            setEmail(saved);
        } else {
            setEmail('');
        }
    } else {
        setEmail('');
    }
    
    setPassword('');
    setUsername('');
    setErrorMsg('');
  };

  const generateRandomUsername = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed lookalikes like I,1,0,O
      let randomStr = '';
      for (let i = 0; i < 4; i++) {
          randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `PLAYER_${randomStr}`;
  };

  const checkUsernameAvailable = async (name: string): Promise<boolean> => {
      const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .ilike('username', name) // Case insensitive check
          .maybeSingle(); // Returns null if not found, object if found
      
      if (error && error.code !== 'PGRST116') {
          // If error (network etc), assume available to let backend constraint handle it, or block.
          // Blocking is safer to prevent UI confusion.
          return false; 
      }
      
      return !data; // If data exists, it's NOT available
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    // Handle Remember Email Logic
    if (isLogin) {
        if (rememberEmail) {
            localStorage.setItem('vb_saved_email', email);
        } else {
            localStorage.removeItem('vb_saved_email');
        }
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
      } else {
        // REGISTRATION FLOW
        
        // 1. Determine Username
        let finalUsername = username.trim().toUpperCase();
        
        if (!finalUsername) {
            finalUsername = generateRandomUsername();
        }

        // 2. Pre-check availability
        const available = await checkUsernameAvailable(finalUsername);
        if (!available) {
            // If user typed it, tell them. If generated, try one more time or fail.
            if (username.trim()) {
                throw new Error(`USERNAME '${finalUsername}' IS TAKEN.`);
            } else {
                // Regen once
                finalUsername = generateRandomUsername();
                const retryAvailable = await checkUsernameAvailable(finalUsername);
                if (!retryAvailable) {
                     throw new Error("COULD NOT GENERATE UNIQUE NAME. PLEASE TYPE ONE.");
                }
            }
        }

        // 3. Sign Up
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: finalUsername,
            },
          },
        });
        
        if (error) throw error;

        // CRITICAL FIX: Manually Insert Profile
        // This ensures the profile exists even if the DB Trigger fails or is missing.
        // We use upsert to avoid errors if the trigger actually worked.
        if (authData.user) {
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: authData.user.id,
                username: finalUsername,
                avatar_seed: `player_${Math.floor(Math.random() * 10000)}`,
                bg_color: '#b6e3f4'
            });

            if (profileError) {
                console.error("Manual profile creation failed:", profileError);
                // We don't throw here to avoid blocking the user if auth succeeded,
                // App.tsx has self-healing logic now too.
            }
        }
        
        // Auto login handling or waiting for email confirmation depends on settings
        // For this demo, assuming auto-confirm or immediate login
        onLogin();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AUTH FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] overflow-y-auto scrollbar-hide">
      
      {/* TOP LOGO SECTION (Red) */}
      <div 
        className="relative flex flex-col items-center justify-center py-10 border-b-[6px] border-black shrink-0 overflow-hidden"
        style={{ backgroundColor: COLORS.RED, minHeight: '280px' }}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 animate-bounce hidden md:block">
           <PixelSprite emoji="😉" size={64} />
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-bounce hidden md:block" style={{ animationDelay: '0.5s' }}>
           <PixelSprite emoji="🤔" size={64} />
        </div>
        <div className="absolute left-2 top-6 animate-bounce md:hidden">
           <PixelSprite emoji="😉" size={48} />
        </div>
         <div className="absolute right-2 top-6 animate-bounce md:hidden" style={{ animationDelay: '0.5s' }}>
           <PixelSprite emoji="🤔" size={48} />
        </div>

        {/* LOGO SQUARE */}
        <div className="relative z-10 mb-6">
            <div 
                className="w-[160px] h-[160px] border-[6px] border-black flex items-center justify-center text-center shadow-[10px_10px_0_0_#000000] relative"
                style={{ backgroundColor: COLORS.YELLOW }}
            >
                <div className="absolute inset-[3px] border-[3px] border-white pointer-events-none"></div>
                
                <h1 className="text-[32px] leading-tight text-black uppercase tracking-widest">
                    ViBe<br/>BiTeS
                </h1>
            </div>
        </div>

        <div className="bg-black border-[2px] border-white px-3 py-1 relative z-10 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
            <span className="text-white text-[10px] tracking-wide">SECRET MSG GAME!</span>
        </div>
      </div>

      {/* AUTH OPTIONS SECTION (Yellow) */}
      <div 
        className="flex-1 flex flex-col p-6 relative border-b-[4px] border-black"
        style={{ backgroundColor: COLORS.YELLOW }}
      >
        <div className="text-center mb-6">
            <span className="text-[14px] text-black">=== {isLogin ? 'LOGIN' : 'REGISTER'} ===</span>
        </div>

        {errorMsg && (
          <div className="bg-red-500 border-4 border-black p-2 mb-4 text-white text-[10px] text-center flex items-center gap-2 justify-center">
             <AlertCircle size={16} />
             <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM */}
        <div className="flex flex-col gap-4 mb-6">
            
            {/* Username (Register only) */}
            {!isLogin && (
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-black">USERNAME (UNIQUE):</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="LEAVE BLANK FOR AUTO"
                        className="h-[48px] bg-white border-[4px] border-black rounded-lg px-3 text-[12px] text-black outline-none focus:border-[#2196F3] transition-colors placeholder:text-gray-400 font-['Press_Start_2P'] uppercase"
                    />
                    <span className="text-[8px] text-black/50">*MUST BE UNIQUE TO YOU</span>
                </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] text-black">EMAIL:</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="NAME@MAIL.COM"
                    className="h-[48px] bg-white border-[4px] border-black rounded-lg px-3 text-[12px] text-black outline-none focus:border-[#2196F3] transition-colors placeholder:text-gray-400 font-['Press_Start_2P'] uppercase"
                />
            </div>

            {/* Remember Email Checkbox (Login Only) */}
            {isLogin && (
                <div 
                    onClick={() => setRememberEmail(!rememberEmail)}
                    className="flex items-center gap-3 cursor-pointer select-none -mt-1"
                >
                    <div className={`w-[16px] h-[16px] border-[3px] border-black shadow-[2px_2px_0_0_black] flex items-center justify-center transition-all active:translate-y-[1px] active:shadow-none ${rememberEmail ? 'bg-[#00E676]' : 'bg-white'}`}>
                        {rememberEmail && <Check size={12} color="black" strokeWidth={3} />}
                    </div>
                    <span className="text-[8px] text-black uppercase font-bold">REMEMBER EMAIL</span>
                </div>
            )}

            {/* Password */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] text-black">PASSWORD:</label>
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        className="w-full h-[48px] bg-white border-[4px] border-black rounded-lg px-3 pr-12 text-[12px] text-black outline-none focus:border-[#2196F3] transition-colors placeholder:text-gray-400 font-['Press_Start_2P']"
                    />
                    <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                    >
                        {showPassword ? <EyeOff size={20} color="black" /> : <Eye size={20} color="black" />}
                    </button>
                </div>
            </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-[56px] border-[5px] border-black shadow-[6px_6px_0_0_#000000] flex items-center justify-center active:translate-y-[4px] active:shadow-[2px_2px_0_0_#000000] transition-all mb-4 disabled:opacity-50"
            style={{ backgroundColor: isLogin ? COLORS.GREEN : COLORS.BLUE }}
        >
            {loading ? (
               <Loader size={24} color="black" className="animate-spin" />
            ) : (
                <span className="text-[14px] text-black font-bold tracking-wide">
                    {isLogin ? ">>> LOGIN! <<<" : ">>> CREATE! <<<"}
                </span>
            )}
        </button>

        {/* TOGGLE LINK */}
        <div className="text-center mt-auto pb-4">
            <button onClick={toggleMode} className="text-[10px] text-black hover:scale-105 transition-transform">
                {isLogin ? (
                    <>NO ACCOUNT? <span style={{ color: COLORS.PINK }}>[REGISTER]</span></>
                ) : (
                    <>HAVE ACCOUNT? <span style={{ color: COLORS.BLUE }}>[LOGIN]</span></>
                )}
            </button>
        </div>

      </div>

      {/* FOOTER (Purple) */}
      <div 
        className="h-[80px] border-t-[4px] border-black flex flex-col items-center justify-center shrink-0 p-4 gap-2"
        style={{ backgroundColor: COLORS.PURPLE }}
      >
         <div className="flex items-center gap-2">
            <Lock size={16} color="white" strokeWidth={3} />
            <span className="text-white text-[8px] text-center leading-tight">
                SECURED BY SUPABASE
            </span>
         </div>
      </div>

    </div>
  );
};