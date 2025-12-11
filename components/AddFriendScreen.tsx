import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ScanLine, Search, X, UserPlus, Check, QrCode, CameraOff, Loader, Keyboard } from 'lucide-react';
import { COLORS } from '../constants';
import { PixelAvatar } from './PixelAvatar';
import { Friend, CardStatus } from '../types';
import { supabase } from '../lib/supabaseClient';
import jsQR from 'jsqr';

interface AddFriendScreenProps {
  onBack: () => void;
  onAddFriend: (friend: Friend) => void;
  currentUserId?: string;
  startScanning?: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  lvl: number;
  stars: number;
  solved: boolean; 
  mutual?: number;
  avatarSeed: string;
  isSuggested?: boolean;
}

export const AddFriendScreen: React.FC<AddFriendScreenProps> = ({ 
  onBack, 
  onAddFriend, 
  currentUserId,
  startScanning = false
}) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'USERNAME' | 'CODE'>('USERNAME');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  
  // Code Tab States
  const [codeInput, setCodeInput] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Scanner States
  const [isScanning, setIsScanning] = useState(startScanning);
  const [cameraError, setCameraError] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);

  // Ensure isScanning updates if prop changes
  useEffect(() => {
    if (startScanning) {
        setIsScanning(true);
    }
  }, [startScanning]);

  // --- HELPER: ADD FRIEND ---
  const handleAdd = (result: SearchResult) => {
    if (addedIds.has(result.id)) return;

    setAddedIds(prev => new Set(prev).add(result.id));
    
    // Convert to Friend object
    const newFriend: Friend = {
        id: result.id, // Real UUID
        name: result.name,
        status: CardStatus.NEW_VIBE,
        statusIcon: '👋',
        time: 'JUST NOW',
        color: COLORS.BLUE, 
        avatarSeed: result.avatarSeed
    };
    onAddFriend(newFriend);
  };

  // --- TAB 1: USERNAME SEARCH LOGIC ---
  useEffect(() => {
    const trimmedSearch = searchText.trim();
    if (!trimmedSearch || activeTab !== 'USERNAME') {
        setSearchResults([]);
        return;
    }

    const timer = setTimeout(async () => {
        setSearching(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .ilike('username', `%${trimmedSearch}%`) // Case-insensitive partial match
                .limit(10);
            
            // Exclude current user if possible
            if (currentUserId) {
                query = query.neq('id', currentUserId);
            }

            const { data, error } = await query;
            
            if (error) throw error;

            if (data) {
                const results: SearchResult[] = data.map((profile: any) => ({
                    id: profile.id,
                    name: profile.username || 'UNKNOWN',
                    lvl: Math.floor(Math.random() * 20) + 1, // Mock stat
                    stars: Math.floor(Math.random() * 500), // Mock stat
                    solved: Math.random() > 0.5,
                    avatarSeed: profile.avatar_seed || 'default',
                    mutual: 0
                }));
                setSearchResults(results);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setSearching(false);
        }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText, activeTab, currentUserId]);

  // --- TAB 2: CODE ENTRY LOGIC ---
  const handleConnectByCode = async (rawInput: string) => {
    const input = rawInput.trim();
    if (!input) return;

    setLoadingCode(true);
    setCodeError(null);
    setCodeSuccess(null);

    // 1. Clean Code: Robustly remove "VB-" prefix (case insensitive)
    // "VB-BUBU" -> "BUBU", "vb-bubu" -> "bubu", "BUBU" -> "BUBU"
    const searchVal = input.replace(/^vb-/i, '');
    
    console.log(`Searching DB for username: '${searchVal}'`);

    try {
        // 2. Search Supabase by Username (exact case-insensitive match)
        // Ensure we find a single user
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', searchVal); // Case-insensitive exact match

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
             const user = data[0];
             
             if (currentUserId && user.id === currentUserId) {
                 setCodeError("CANNOT ADD YOURSELF!");
                 setLoadingCode(false);
                 return;
             }

             // Found! Add them.
             handleAdd({
                 id: user.id,
                 name: user.username,
                 lvl: 1,
                 stars: 0,
                 solved: false,
                 avatarSeed: user.avatar_seed,
                 mutual: 0
             });
             
             setCodeSuccess(`ADDED ${user.username}!`);
             setCodeInput(''); // Clear input
             setIsScanning(false); // Close scanner if open
             setActiveTab('CODE'); // Switch to code tab so user sees success message
        } else {
             setCodeError(`USER '${searchVal}' NOT FOUND`);
             setIsScanning(false);
             setActiveTab('CODE'); 
        }
    } catch (e: any) {
        console.error("Code search error:", e);
        setCodeError("DB SEARCH FAILED");
        setIsScanning(false);
        setActiveTab('CODE');
    } finally {
        setLoadingCode(false);
    }
  };

  const clearSearch = () => setSearchText('');

  // --- REAL QR SCANNER LOGIC ---
  const scanFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Check if jsQR loaded correctly
            if (jsQR) {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
    
                if (code && code.data) {
                    console.log("QR Code found:", code.data);
                    handleConnectByCode(code.data);
                    return; // Stop scanning loop on success (handleConnectByCode will close scanner)
                }
            }
        }
    }
    requestRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    const startCamera = async () => {
      try {
        setCameraError(false);
        setPermissionDenied(false);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera API not available");
        }

        try {
             // First try environment (back) camera
             stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        } catch (e: any) {
             console.log("Back camera failed, trying any camera", e);
             // If back camera fails, try any video source
             stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (mounted && videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          // Start Scanning Loop
          requestRef.current = requestAnimationFrame(scanFrame);
        } else if (!mounted && stream) {
           stream.getTracks().forEach(track => track.stop());
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        if (mounted) {
            setCameraError(true);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setPermissionDenied(true);
            }
        }
      }
    };

    if (isScanning) {
      startCamera();
    }

    return () => {
      mounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Also stop the tracks on the video element if they were assigned
      if (videoRef.current && videoRef.current.srcObject) {
         const s = videoRef.current.srcObject as MediaStream;
         s.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning]);

  const handleStopScanning = () => {
      setIsScanning(false);
  };

  const handleManualEntryFallback = () => {
      setIsScanning(false);
      setActiveTab('CODE');
  };

  return (
    <div className="flex flex-col h-full w-full bg-white font-['Press_Start_2P'] overflow-hidden animate-in slide-in-from-right duration-300 relative">
      
      {/* HEADER (100px) */}
      <div 
        className="h-[100px] border-b-4 border-black flex items-center justify-between px-4 shrink-0 relative z-20"
        style={{ backgroundColor: COLORS.PINK }}
      >
        <button onClick={onBack} className="active:scale-90 transition-transform">
          <ArrowLeft size={24} color="black" strokeWidth={4} />
        </button>
        <h1 className="text-black text-[16px] uppercase tracking-tighter">=== ADD FRIEND ===</h1>
        <button 
            onClick={() => setIsScanning(true)} 
            className="active:scale-90 transition-transform"
        >
          <ScanLine size={24} color="black" strokeWidth={4} />
        </button>
      </div>

      {/* TABS SECTION */}
      <div 
        className="h-[60px] border-b-4 border-black p-2 flex gap-2 shrink-0 relative z-10"
        style={{ backgroundColor: COLORS.YELLOW }}
      >
        <button 
          onClick={() => setActiveTab('USERNAME')}
          className={`flex-1 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_0_black] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] transition-all gap-2 ${activeTab === 'USERNAME' ? 'bg-[#00E676]' : 'bg-white'}`}
        >
          <Search size={14} color="black" strokeWidth={3} />
          <span className="text-[8px] font-bold text-black uppercase">USERNAME</span>
        </button>
        <button 
          onClick={() => setActiveTab('CODE')}
          className={`flex-1 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_0_black] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] transition-all gap-2 ${activeTab === 'CODE' ? 'bg-[#00E676]' : 'bg-white'}`}
        >
          <Keyboard size={14} color="black" strokeWidth={3} />
          <span className="text-[8px] font-bold text-black uppercase">ENTER CODE</span>
        </button>
      </div>

      {/* MAIN CONTENT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
        
        <div 
          className="p-4 flex flex-col gap-3 min-h-[300px]"
          style={{ backgroundColor: COLORS.BLUE }}
        >
           {activeTab === 'USERNAME' ? (
             <>
                {/* Username Search Input */}
                <div className="h-[48px] bg-[#333] border-[2px] border-black shadow-[4px_4px_0_0_black] flex items-center px-3 relative mb-2">
                    <input 
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="TYPE USERNAME..."
                    className="flex-1 h-full bg-transparent outline-none text-[12px] font-['Press_Start_2P'] text-white placeholder:text-gray-500"
                    autoFocus
                    />
                    {searchText && (
                    <button onClick={clearSearch}>
                        <X size={16} color="white" strokeWidth={3} />
                    </button>
                    )}
                </div>

               {searching ? (
                   <div className="flex items-center justify-center pt-8 text-white text-[10px]">
                       SEARCHING...
                   </div>
               ) : searchResults.length > 0 ? (
                   searchResults.map((user) => {
                     const isAdded = addedIds.has(user.id);
                     return (
                       <div 
                         key={user.id}
                         className="h-[88px] bg-white border-[4px] border-black rounded-xl shadow-[4px_4px_0_0_black] flex items-center px-3 relative"
                       >
                          <div className="shrink-0 mr-3">
                            <PixelAvatar seed={user.avatarSeed} size={64} borderWidth={3} />
                          </div>

                          <div className="flex-1 flex flex-col justify-center min-w-0">
                             <span className="text-[14px] text-black font-bold truncate mb-1">{user.name}</span>
                             <span className="text-[8px] text-gray-500 mb-1">LVL {user.lvl} ★ {user.stars}</span>
                          </div>

                          <button 
                            onClick={() => handleAdd(user)}
                            disabled={isAdded}
                            className={`w-[80px] h-[40px] border-[3px] border-black rounded-lg shadow-[3px_3px_0_0_black] flex items-center justify-center ml-2 active:translate-y-[2px] active:shadow-[1px_1px_0_0_black] transition-all ${isAdded ? 'bg-gray-300' : 'bg-[#00E676]'}`}
                          >
                             {isAdded ? (
                                <span className="text-[8px] text-black font-bold">SENT ✓</span>
                             ) : (
                                <span className="text-[12px] text-black font-bold">ADD</span>
                             )}
                          </button>
                       </div>
                     );
                   })
               ) : searchText ? (
                   <div className="flex items-center justify-center pt-8 text-white/70 text-[10px]">
                       NO PLAYERS FOUND.
                   </div>
               ) : (
                   <div className="flex items-center justify-center pt-8 text-white/50 text-[10px] text-center">
                       SEARCH FOR FRIENDS<br/>TO ADD THEM!
                   </div>
               )}
             </>
           ) : (
             <div className="flex flex-col items-center pt-6 gap-6 w-full max-w-xs mx-auto">
                {/* CODE TAB UI */}
                <div className="w-full text-center">
                    <span className="text-white text-[10px] mb-2 block uppercase">ENTER FRIEND'S USERNAME:</span>
                    <span className="text-[#FFD740] text-[8px] mb-4 block">EX: VB-PLAYER1 OR PLAYER1</span>
                </div>

                <div className="w-full relative">
                    <input 
                        type="text" 
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        className="w-full h-[64px] bg-white border-[4px] border-black shadow-[6px_6px_0_0_black] px-4 text-center text-[16px] font-bold outline-none placeholder:text-gray-300 text-black"
                        placeholder="ENTER CODE"
                    />
                </div>

                {codeError && (
                    <div className="bg-[#FF5252] text-white text-[10px] p-2 border-2 border-black shadow-[2px_2px_0_0_black] w-full text-center">
                        {codeError}
                    </div>
                )}
                
                {codeSuccess && (
                    <div className="bg-[#00E676] text-black text-[10px] p-2 border-2 border-black shadow-[2px_2px_0_0_black] flex items-center gap-2 w-full justify-center">
                        <Check size={12} /> {codeSuccess}
                    </div>
                )}

                <button 
                    onClick={() => handleConnectByCode(codeInput)}
                    disabled={loadingCode || !codeInput}
                    className="w-full h-[64px] bg-[#FFD740] border-[4px] border-black shadow-[6px_6px_0_0_black] flex items-center justify-center gap-3 active:translate-y-[4px] active:shadow-[2px_2px_0_0_black] transition-all disabled:opacity-50 disabled:grayscale"
                >
                   {loadingCode ? (
                       <Loader size={24} color="black" className="animate-spin" />
                   ) : (
                       <>
                           <Check size={24} color="black" strokeWidth={4} />
                           <span className="text-black text-[12px] font-bold uppercase">CONNECT</span>
                       </>
                   )}
                </button>
             </div>
           )}
        </div>
      </div>

      {/* REAL SCANNER OVERLAY */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">
             <div className="absolute inset-0 overflow-hidden bg-black">
                {cameraError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white p-8 text-center bg-[#111]">
                        <CameraOff size={48} className="mb-4 text-[#FF5252]" />
                        <p className="text-[12px] mb-6 leading-relaxed whitespace-pre-wrap">
                            {permissionDenied 
                                ? "PERMISSION DENIED.\nPLEASE ENABLE CAMERA IN SETTINGS." 
                                : "CAMERA ERROR.\nCOULD NOT START VIDEO."}
                        </p>
                        
                        <div className="flex flex-col gap-3 w-full max-w-[200px]">
                            <button 
                                onClick={() => { setIsScanning(false); setTimeout(() => setIsScanning(true), 100); }} 
                                className="bg-white text-black px-4 py-3 border-[4px] border-black shadow-[4px_4px_0_0_gray] text-[10px] font-bold active:translate-y-1 active:shadow-none uppercase"
                            >
                                TRY AGAIN
                            </button>
                            
                            <button 
                                onClick={handleManualEntryFallback} 
                                className="bg-[#FFD740] text-black px-4 py-3 border-[4px] border-black shadow-[4px_4px_0_0_white] text-[10px] font-bold active:translate-y-1 active:shadow-none uppercase"
                            >
                                ENTER CODE
                            </button>
                            
                             <button onClick={handleStopScanning} className="text-white/50 text-[10px] mt-2 underline">
                                CANCEL
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover opacity-80" 
                        />
                        <canvas ref={canvasRef} className="hidden" />
                    </>
                )}
             </div>
             
             {!cameraError && (
                 <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-[260px] h-[260px] relative">
                        {/* QR Target Frame */}
                        <div className="absolute top-0 left-0 w-10 h-10 border-t-[6px] border-l-[6px] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.5)]"></div>
                        <div className="absolute top-0 right-0 w-10 h-10 border-t-[6px] border-r-[6px] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.5)]"></div>
                        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[6px] border-l-[6px] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.5)]"></div>
                        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[6px] border-r-[6px] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.5)]"></div>
                        
                        {/* Scan Line Animation */}
                        <div className="absolute top-[50%] left-0 w-full h-[2px] bg-[#FF4081] shadow-[0_0_15px_#FF4081] animate-pulse"></div>
                    </div>

                    <div className="mt-12 bg-black/70 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">
                        <span className="text-white text-[10px] uppercase tracking-widest font-bold">
                            SCANNING REAL QR...
                        </span>
                    </div>
                 </div>
             )}

             <div className="absolute top-6 right-4 z-50 pointer-events-auto">
                 <button 
                    onClick={handleStopScanning} 
                    className="w-12 h-12 bg-white border-[4px] border-black flex items-center justify-center active:scale-90 transition-transform shadow-[4px_4px_0_0_black]"
                 >
                     <X size={24} color="black" strokeWidth={4} />
                 </button>
             </div>
        </div>
      )}

    </div>
  );
};