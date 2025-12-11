
import React, { useState, useEffect, useRef } from 'react';
import { PixelHeader } from './components/PixelHeader';
import { PixelCard } from './components/PixelCard';
import { FloatingActionButton } from './components/FloatingActionButton';
import { ChatScreen } from './components/ChatScreen';
import { ComposeScreen } from './components/ComposeScreen';
import { SuccessScreen } from './components/SuccessScreen';
import { WrongAnswerScreen } from './components/WrongAnswerScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AuthScreen } from './components/AuthScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { InviteScreen } from './components/InviteScreen';
import { AddFriendScreen } from './components/AddFriendScreen';
import { EmptyStateScreen } from './components/EmptyStateScreen';
import { AvatarSelectionScreen } from './components/AvatarSelectionScreen';
import { FriendSelectionScreen } from './components/FriendSelectionScreen'; 
import { ChangePasswordScreen } from './components/ChangePasswordScreen';
import { MOCK_FRIENDS, MOCK_MESSAGES, COLORS } from './constants';
import { Friend, CardStatus, Message } from './types';
import { supabase } from './lib/supabaseClient';

// Helper to validate UUIDs
const isUUID = (id: string | number) => {
    if (typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'home' | 'chat' | 'compose' | 'success' | 'wrong' | 'profile' | 'settings' | 'invite' | 'addFriend' | 'avatarSelect' | 'friendSelect' | 'changePassword'>('auth');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [session, setSession] = useState<any>(null);
  
  // State for data
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State for current user
  const [currentUserSeed, setCurrentUserSeed] = useState('currentUser_player1');
  const [currentUserBgColor, setCurrentUserBgColor] = useState('#b6e3f4');
  const [currentUsername, setCurrentUsername] = useState(''); 

  // Refs for realtime updates
  const selectedFriendRef = useRef<Friend | null>(null);
  const currentScreenRef = useRef<string>('auth');

  // Scanner state
  const [startScanning, setStartScanning] = useState(false);

  // Game Result State
  const [lastGameResult, setLastGameResult] = useState<{message: Message, score: number, guess: string} | null>(null);

  // Sync refs with state
  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setCurrentScreen('home');
        if (session.user?.user_metadata?.username) {
            setCurrentUsername(session.user.user_metadata.username);
        }
        fetchProfileWithRetry(session.user.id);
        fetchFriends(session.user.id);
      } else {
        setCurrentScreen('auth');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setCurrentScreen('home');
        if (session.user?.user_metadata?.username) {
            setCurrentUsername(session.user.user_metadata.username);
        }
        fetchProfileWithRetry(session.user.id);
        fetchFriends(session.user.id);
      } else {
        setCurrentScreen('auth');
        setFriends([]);
        setCurrentUsername(''); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime subscription for unread counts
  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    const channel = supabase.channel('home_unread_counts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          const newMsg = payload.new;
          
          setFriends(prev => prev.map(f => {
              // If message is from a friend
              if (f.id === newMsg.sender_id) {
                  // If we are currently chatting with this person, don't increment badge
                  // (Optionally we could increment and let the user see it when they back out, 
                  // but typically active chat implies read. For simplicity in this structure,
                  // we will increment so the user sees "1" if they leave, unless ChatScreen marks read.)
                  // Let's increment for now, handleFriendClick clears it.
                  return { ...f, unreadCount: (f.unreadCount || 0) + 1 };
              }
              return f;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchProfileWithRetry = async (userId: string, retries = 3) => {
      let attempt = 0;
      while (attempt < retries) {
          const success = await fetchProfile(userId);
          if (success) break;
          attempt++;
          if (attempt < retries) await new Promise(r => setTimeout(r, 500));
      }
  };

  const fetchProfile = async (userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
        .from('profiles')
        .select('*') 
        .eq('id', userId)
        .maybeSingle(); 
        
        if (data && data.username) {
            setCurrentUsername(data.username);
            // Map DB columns to State (avatar_id -> seed, color -> bgColor)
            if (data.avatar_id) setCurrentUserSeed(data.avatar_id);
            if (data.color) setCurrentUserBgColor(data.color);
            return true;
        } else {
            console.warn("Profile missing or incomplete. Attempting self-healing...");
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session && session.user && session.user.id === userId) {
                const recoveryUsername = session.user.user_metadata?.username || `PLAYER_${userId.substring(0,4).toUpperCase()}`;
                
                const fullProfile = {
                    id: userId,
                    username: recoveryUsername,
                    avatar_id: `restored_${Math.floor(Math.random() * 1000)}`,
                    color: '#b6e3f4'
                };

                const { error: insertError } = await supabase.from('profiles').upsert(fullProfile);

                if (!insertError) {
                    setCurrentUsername(recoveryUsername);
                    return true;
                }
            }
        }
        return false;
    } catch (e: any) {
        console.error("Profile fetch error:", e.message || e);
        return false;
    }
  };

  const fetchFriends = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Get connections
      const { data: connections, error: connError } = await supabase
        .from('friendships')
        .select('user_id, friend_id, status')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (connError) {
        setFriends(MOCK_FRIENDS); 
        return;
      }

      if (!connections || connections.length === 0) {
        setFriends([]);
        return;
      }

      // 2. Get friend IDs
      const friendIds = connections.map((c: any) => 
        c.user_id === userId ? c.friend_id : c.user_id
      );

      const uniqueFriendIds = [...new Set(friendIds)];

      if (uniqueFriendIds.length === 0) {
        setFriends([]);
        return;
      }

      // 3. Get profiles
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*') 
        .in('id', uniqueFriendIds);

      if (profError) {
        return;
      }

      // 4. Get unread message counts
      const { data: unreadMessages } = await supabase
         .from('messages')
         .select('sender_id')
         .eq('receiver_id', userId)
         .neq('status', 'READ');
      
      const unreadCounts: Record<string, number> = {};
      if (unreadMessages) {
          unreadMessages.forEach((m: any) => {
              unreadCounts[m.sender_id] = (unreadCounts[m.sender_id] || 0) + 1;
          });
      }

      if (profiles) {
        const formattedFriends: Friend[] = profiles.map((p: any) => ({
          id: p.id,
          name: p.username || 'UNKNOWN',
          status: CardStatus.SOLVED, 
          statusIcon: '✓',
          time: '1H',
          color: p.color || COLORS.BLUE, // Use 'color' column
          avatarSeed: p.avatar_id || 'default', // Use 'avatar_id' column
          unreadCount: unreadCounts[p.id] || 0
        }));

        // Sort: Friends with unread messages first
        formattedFriends.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));

        setFriends(formattedFriends);
      }
    } catch (err) {
      setFriends(MOCK_FRIENDS);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {};
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleClearData = async () => {
      const confirmDelete = window.confirm("DELETE ALL HISTORY? THIS CANNOT BE UNDONE!");
      if (!confirmDelete) return;

      setFriends([]);
      setCurrentScreen('home');

      if (session) {
          const userId = session.user.id;
          try {
              await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
              await supabase.from('friendships').delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`);
          } catch (e) {
              console.error("Error clearing cloud data:", e);
          }
      }
  };

  const handleFriendClick = async (friend: Friend) => {
    // Optimistic UI update: Clear badge immediately
    setFriends(prev => prev.map(f => f.id === friend.id ? { ...f, unreadCount: 0 } : f));
    
    setSelectedFriend(friend);
    setCurrentScreen('chat');

    // Update DB: Mark messages as READ
    if (session && isUUID(friend.id)) {
        await supabase
            .from('messages')
            .update({ status: 'READ' })
            .eq('sender_id', friend.id)
            .eq('receiver_id', session.user.id)
            .neq('status', 'READ');
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, friendId: string | number) => {
      e.stopPropagation();
      const confirmDelete = window.confirm("REMOVE FRIEND & DELETE CHAT?");
      if (!confirmDelete) return;

      setFriends(prev => prev.filter(f => f.id !== friendId));
      
      if (session && isUUID(friendId)) {
            await supabase
                .from('friendships')
                .delete()
                .or(`and(user_id.eq.${session.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${session.user.id})`);
      }
  };

  const handleAddNewFriend = async (newFriend: Friend) => {
      setFriends(prev => [newFriend, ...prev]);
      
      if (session && isUUID(newFriend.id)) {
        const { data: existing } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user_id.eq.${session.user.id},friend_id.eq.${newFriend.id}),and(user_id.eq.${newFriend.id},friend_id.eq.${session.user.id})`);
        
        if (existing && existing.length > 0) return;

        await supabase
            .from('friendships')
            .insert({ user_id: session.user.id, friend_id: newFriend.id }); 
      }
  };

  const handleComposeClick = () => {
    if (friends.length > 0) {
        setCurrentScreen('friendSelect');
    } else {
        setCurrentScreen('addFriend');
    }
  };

  const handleFriendSelectForCompose = (friend: Friend) => {
      setSelectedFriend(friend);
      setCurrentScreen('compose');
  };

  const handleBack = () => {
    setCurrentScreen('home');
    setSelectedFriend(null);
    // Refresh friends to ensure unread counts are synced (e.g. if messages arrived while in chat)
    if (session) {
        fetchFriends(session.user.id);
    }
  };

  const handleProfileClick = () => setCurrentScreen('profile');
  const handleSettingsClick = () => setCurrentScreen('settings');
  const handleSettingsBack = () => {
      if (friends.length === 0) setCurrentScreen('home');
      else setCurrentScreen('profile');
  };

  const handleInviteClick = () => setCurrentScreen('invite');
  const handleInviteBack = () => {
      if (friends.length === 0) setCurrentScreen('home');
      else setCurrentScreen('profile');
  };
  
  const handleAddFriendClick = () => {
      setStartScanning(false);
      setCurrentScreen('addFriend');
  };

  const handleScanQRClick = () => {
      setStartScanning(true);
      setCurrentScreen('addFriend');
  };
  
  const handleAddFriendBack = () => {
      setCurrentScreen('home');
      setStartScanning(false);
  };

  const handleGameSuccess = (message: Message) => {
      setLastGameResult({ message, score: 100, guess: "" });
      setCurrentScreen('success');
  };

  const handleGameLoss = (message: Message, score: number, guess: string) => {
      setLastGameResult({ message, score, guess });
      setCurrentScreen('wrong');
  };

  const handleBackToChat = () => {
      setCurrentScreen('chat');
  };
  
  const handleTryAgain = () => {
      setCurrentScreen('chat'); 
  };

  const handleEditProfile = () => setCurrentScreen('avatarSelect');

  const handleChangePasswordClick = () => setCurrentScreen('changePassword');

  const handleAvatarSave = async (newSeed: string, newBgColor: string) => {
    setCurrentUserSeed(newSeed);
    setCurrentUserBgColor(newBgColor);
    setCurrentScreen('profile');
    if (session) {
        // Save using correct column names
        await supabase.from('profiles').update({ 
            avatar_id: newSeed,
            color: newBgColor
        }).eq('id', session.user.id);
    }
  };

  const handleUpdateUsername = async (newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      
      setCurrentUsername(trimmed);

      if (session) {
         const { error } = await supabase
          .from('profiles')
          .update({ username: trimmed })
          .eq('id', session.user.id);
         
         if (error) {
             console.error("Error updating username", error);
             alert("Could not update username. Please try again.");
             fetchProfileWithRetry(session.user.id); // Revert
         }
      }
  };

  return (
    <div className="min-h-screen bg-white font-['Press_Start_2P'] antialiased selection:bg-[#FF4081] selection:text-white overflow-hidden flex flex-col items-center">
      
      <div className="w-full max-w-md bg-white h-screen shadow-2xl relative border-x-4 border-black flex flex-col">
        
        {currentScreen === 'auth' && (
           <AuthScreen onLogin={handleLogin} />
        )}

        {currentScreen === 'home' && (
          <>
            {friends.length === 0 && !loading ? (
                <EmptyStateScreen 
                    onAddFriend={handleAddFriendClick}
                    onInvite={handleInviteClick}
                    onScanQR={handleScanQRClick} 
                    onSettings={handleSettingsClick}
                />
            ) : (
                <>
                    <PixelHeader 
                        currentSeed={currentUserSeed}
                        currentBgColor={currentUserBgColor}
                        onProfileClick={handleProfileClick} 
                        onAddFriendClick={handleAddFriendClick}
                    />
                    <main className="p-5 pb-32 flex flex-col gap-4 overflow-y-auto flex-1 scrollbar-hide">
                    {friends.map((friend) => (
                        <PixelCard 
                        key={friend.id} 
                        friend={friend} 
                        onClick={() => handleFriendClick(friend)}
                        onDelete={(e) => handleDeleteConversation(e, friend.id)}
                        />
                    ))}
                    <div className="flex justify-center mt-8 opacity-50">
                        <div className="h-2 w-2 bg-black mx-1"></div>
                        <div className="h-2 w-2 bg-black mx-1"></div>
                        <div className="h-2 w-2 bg-black mx-1"></div>
                    </div>
                    </main>
                    <FloatingActionButton onClick={handleComposeClick} />
                </>
            )}
          </>
        )}

        {currentScreen === 'friendSelect' && (
            <FriendSelectionScreen 
                friends={friends}
                onSelect={handleFriendSelectForCompose}
                onBack={handleBack}
            />
        )}

        {currentScreen === 'chat' && selectedFriend && (
          <ChatScreen 
            friend={selectedFriend} 
            messages={MOCK_MESSAGES}
            onBack={handleBack}
            onGameSuccess={handleGameSuccess}
            onGameLoss={handleGameLoss}
          />
        )}

        {currentScreen === 'compose' && selectedFriend && (
          <ComposeScreen 
            friend={selectedFriend} 
            onBack={handleBack}
          />
        )}

        {currentScreen === 'success' && selectedFriend && (
            <SuccessScreen 
                friend={selectedFriend}
                message={lastGameResult?.message}
                onSendBack={handleBackToChat}
                onBackToChat={handleBackToChat}
            />
        )}

        {currentScreen === 'wrong' && selectedFriend && (
            <WrongAnswerScreen
                friend={selectedFriend}
                message={lastGameResult?.message}
                userGuess={lastGameResult?.guess}
                score={lastGameResult?.score}
                onTryAgain={handleTryAgain}
                onNext={handleBackToChat}
            />
        )}

        {currentScreen === 'profile' && (
            <ProfileScreen 
                onBack={handleBack} 
                onSettingsClick={handleSettingsClick} 
                onInviteClick={handleInviteClick}
                onEditProfile={handleEditProfile}
                onUpdateUsername={handleUpdateUsername}
                currentSeed={currentUserSeed}
                currentBgColor={currentUserBgColor}
                username={currentUsername}
            />
        )}
        
        {currentScreen === 'avatarSelect' && (
            <AvatarSelectionScreen 
                currentSeed={currentUserSeed}
                currentBgColor={currentUserBgColor}
                onBack={() => setCurrentScreen('profile')}
                onSave={handleAvatarSave}
            />
        )}
        
        {currentScreen === 'settings' && (
            <SettingsScreen 
                onBack={handleSettingsBack} 
                onLogout={handleLogout}
                onClearData={handleClearData}
                onEditProfile={handleEditProfile}
                onChangePassword={handleChangePasswordClick}
                currentSeed={currentUserSeed}
            />
        )}

        {currentScreen === 'changePassword' && (
            <ChangePasswordScreen 
                onBack={() => setCurrentScreen('settings')}
            />
        )}

        {currentScreen === 'invite' && (
            <InviteScreen 
                onBack={handleInviteBack} 
                currentUserId={session?.user?.id}
                currentUsername={currentUsername}
            />
        )}
        
        {currentScreen === 'addFriend' && (
            <AddFriendScreen 
                onBack={handleAddFriendBack} 
                onAddFriend={handleAddNewFriend}
                currentUserId={session?.user?.id}
                startScanning={startScanning}
            />
        )}
      </div>
      
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[#2196F3] pattern-dots pointer-events-none hidden md:block">
         <div className="absolute top-1/2 left-10 text-white text-4xl max-w-xs drop-shadow-[4px_4px_0_#000]">
            VIBE<br/>BITES<br/><span className="text-yellow-400 text-sm">MOBILE PREVIEW</span>
         </div>
      </div>
    </div>
  );
};

export default App;
