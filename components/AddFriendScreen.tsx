import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ScanLine, Search, X, UserPlus, Check, Share, QrCode, CameraOff, Loader } from 'lucide-react';
import { COLORS } from '../constants';
import { PixelAvatar } from './PixelAvatar';
import { PixelSprite } from './PixelSprite';
import { Friend, CardStatus } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AddFriendScreenProps {
  onBack: () => void;
  onAddFriend: (friend: Friend) => void;
  currentUserId?: string;
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

export const AddFriendScreen: React.FC<AddFriendScreenProps> = ({ onBack, onAddFriend, currentUserId }) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'USERNAME' | 'CODE'>('USERNAME');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Debounced search effect
  useEffect(() => {
    if (!searchText.trim() || activeTab !== 'USERNAME') {
        setSearchResults([]);
        return;
    }

    const timer = setTimeout(async () => {
        setSearching(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .ilike('username', `%${searchText}%`)
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

  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    const startCamera = async () => {
      try {
        setCameraError(false);
        try {
             stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        } catch (e) {
             console.log("Specific constraint failed, trying basic video", e);
             stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (mounted && videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        } else if (!mounted && stream) {
           stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (mounted) setCameraError(true);
      }
    };

    if (isScanning) {
      startCamera();
    }

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
         const s = videoRef.current.srcObject as MediaStream;
         s.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning]);

  const handleStopScanning = () => {
      setIsScanning(false);
  };

  const handleAdd = (result: SearchResult) => {
    if (addedIds.has(result.id)) return;

    setAddedIds(prev => new Set(prev).add(result.id));
    
    // Convert to Friend object
    const newFriend: Friend = {
        id: result.id, // Use real UUID
        name: result.name,
        status: CardStatus.NEW_VIBE,
        statusIcon: '👋',
        time: 'JUST NOW',
        color: COLORS.BLUE, // Default color for new friends
        avatarSeed: result.avatarSeed
    };
    onAddFriend(newFriend);
  };

  const clearSearch = () => setSearchText('');

  const handleShareCode = () => {
      // Mock share action
      alert("MY CODE 'VB-USER' COPIED TO CLIPBOARD!");
  };

  const handleSearchCode = () => {
      if (!searchText) return;
      setIsSearchingCode(true);
      setTimeout(() => {
          setIsSearchingCode(false);
          alert(`NO USER FOUND WITH CODE: ${searchText}`);
          setSearchText('');
      }, 1500);
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

      {/* SEARCH SECTION */}
      <div 
        className="h-[80px] border-b-4 border-black p-2 flex flex-col justify-center gap-2 shrink-0 relative z-10"
        style={{ backgroundColor: COLORS.YELLOW }}
      >
         <div className="h-[32px] bg-[#333] border-[2px] border-black shadow-[2px_2px_0_0_black] flex items-center px-2 relative">
            <div className="w-1.5 h-3 bg-white mr-2 animate-pulse shrink-0"></div>
            
            <input 
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={activeTab === 'USERNAME' ? "SEARCH USER..." : "ENTER CODE..."}
              className="flex-1 h-full bg-transparent outline-none text-[8px] uppercase font-['Press_Start_2P'] text-white placeholder:text-gray-500"
            />
            
            {searchText && (
              <button onClick={clearSearch}>
                <X size={14} color="white" strokeWidth={3} />
              </button>
            )}
         </div>

         <div className="flex gap-2 h-[28px]">
            <button 
              onClick={() => setActiveTab('USERNAME')}
              className={`flex-1 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_0_black] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] transition-all ${activeTab === 'USERNAME' ? 'bg-[#00E676]' : 'bg-white'}`}
            >
              <span className="text-[8px] font-bold text-black uppercase">USERNAME</span>
            </button>
            <button 
              onClick={() => setActiveTab('CODE')}
              className={`flex-1 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_0_black] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] transition-all ${activeTab === 'CODE' ? 'bg-[#00E676]' : 'bg-white'}`}
            >
              <span className="text-[8px] font-bold text-black uppercase">CODE</span>
            </button>
         </div>
      </div>

      {/* MAIN CONTENT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
        
        <div 
          className="p-4 flex flex-col gap-3 min-h-[300px]"
          style={{ backgroundColor: COLORS.BLUE }}
        >
           {activeTab === 'USERNAME' ? (
             <>
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
                             <span className="text-[8px] text-gray-500 mb-1">LVL {user.lvl} ★ {user.stars} SOLVED</span>
                             {user.mutual ? (
                               <span className="text-[8px] text-[#2196F3] font-bold">{user.mutual} MUTUAL</span>
                             ) : (
                               <span className="text-[8px] text-gray-400">NEW PLAYER</span>
                             )}
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
             <div className="flex flex-col items-center justify-center h-full pt-10">
                <span className="text-white text-[10px] mb-4">ENTER FRIEND CODE TO FIND:</span>
                <span className="text-white/50 text-[8px] mb-8">EX: VB-X7K9M</span>
                <button 
                    onClick={handleSearchCode}
                    disabled={isSearchingCode}
                    className="w-full h-[56px] bg-[#00E676] border-[4px] border-black shadow-[6px_6px_0_0_black] flex items-center justify-center active:translate-y-[4px] active:shadow-[2px_2px_0_0_black] disabled:opacity-50"
                >
                   {isSearchingCode ? (
                       <Loader size={24} color="black" className="animate-spin" />
                   ) : (
                       <span className="text-black text-[12px] font-bold">SEARCH CODE</span>
                   )}
                </button>
             </div>
           )}
        </div>

        {/* SUGGESTIONS SECTION (Static for demo feel) */}
        {activeTab === 'USERNAME' && !searchText && (
          <div 
             className="p-5 border-t-[4px] border-black flex-1"
             style={{ backgroundColor: COLORS.PURPLE }}
          >
             <h2 className="text-[#FFD740] text-[12px] mb-4 uppercase tracking-wider">SUGGESTED 4 U:</h2>
             
             {/* Mock Suggestion */}
             <div className="h-[72px] bg-white border-[4px] border-black rounded-xl shadow-[4px_4px_0_0_black] flex items-center px-3 relative mb-4">
                <div className="shrink-0 mr-3">
                   <PixelAvatar seed={'arcadekid'} size={48} borderWidth={2} />
                </div>
                
                <div className="flex-1 flex flex-col justify-center min-w-0">
                   <span className="text-[12px] text-black font-bold truncate mb-1">ARCADEKID</span>
                   <span className="text-[8px] text-gray-500 mb-1">LVL 9 ★ 150</span>
                   <div className="bg-[#FFD740] self-start px-2 py-[2px] rounded border border-black">
                     <span className="text-[6px] text-black font-bold">NEARBY</span>
                   </div>
                </div>

                <button 
                   onClick={() => handleAdd({id: 'mock_sugg', name: 'ARCADEKID', lvl: 9, stars: 150, solved: true, avatarSeed: 'arcadekid'})}
                   className={`w-[70px] h-[36px] border-[3px] border-black rounded-lg shadow-[3px_3px_0_0_black] flex items-center justify-center ml-2 bg-[#00E676]`}
                >
                   <span className="text-[10px] text-black font-bold">ADD</span>
                </button>
             </div>
          </div>
        )}
      </div>

      {/* BOTTOM ACTIONS */}
      <div 
        className="p-5 border-t-[4px] border-black flex flex-col gap-3 shrink-0"
        style={{ backgroundColor: COLORS.RED }}
      >
         <button 
            onClick={handleShareCode}
            className="w-full h-[52px] bg-[#FFD740] border-[4px] border-black shadow-[4px_4px_0_0_black] flex items-center px-4 active:translate-y-[2px] active:shadow-[2px_2px_0_0_black] transition-all"
        >
             <div className="mr-3">
                 <Share size={24} color="black" strokeWidth={3} />
             </div>
             <span className="flex-1 text-center text-black text-[12px] font-bold">SHARE MY CODE</span>
         </button>
      </div>

      {/* SCANNER OVERLAY */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">
             <div className="absolute inset-0 overflow-hidden bg-black">
                {cameraError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white p-8 text-center bg-[#111]">
                        <CameraOff size={48} className="mb-4 text-[#FF5252]" />
                        <p className="text-[12px] mb-6 leading-relaxed">CAMERA ACCESS FAILED.<br/>CHECK PERMISSIONS.</p>
                        <button onClick={handleStopScanning} className="bg-white text-black px-6 py-3 border-4 border-black shadow-[4px_4px_0_0_white] text-[12px] font-bold active:translate-y-1 active:shadow-none transition-all">
                            CLOSE
                        </button>
                    </div>
                ) : (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover opacity-80" 
                    />
                )}
             </div>
             
             {!cameraError && (
                 <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-[260px] h-[260px] relative">
                        <div className="absolute top-0 left-0 w-10 h-10 border-t-[6px] border-l-[6px] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.5)]"></div>
                        <div className="absolute top-0 right-0 w-10 h-10 border-t-[6px] border-r-[6px] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.5)]"></div>
                        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[6px] border-l-[6px] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.5)]"></div>
                        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[6px] border-r-[6px] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.5)]"></div>
                        <div className="absolute top-[50%] left-0 w-full h-[2px] bg-[#FF4081] shadow-[0_0_15px_#FF4081] animate-pulse"></div>
                    </div>

                    <div className="mt-12 bg-black/70 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#FF4081] rounded-full animate-ping"></div>
                            <span className="text-white text-[10px] uppercase tracking-widest font-bold">SCANNING...</span>
                        </div>
                    </div>
                 </div>
             )}

             <div className="absolute top-6 right-4 z-50">
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