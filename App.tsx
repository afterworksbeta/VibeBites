
import React, { useState, useEffect } from 'react';
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

  // Scanner state
  const [startScanning, setStartScanning] = useState(false);

  // Game Result State
  const [lastGameResult, setLastGameResult] = useState<{message: Message, score: number, guess: string} | null>(null);

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
      // 1. Fetch Friendships
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

      const friendIds = connections.map((c: any) => 
        c.user_id === userId ? c.friend_id : c.user_id
      );

      const uniqueFriendIds = [...new Set(friendIds)];

      if (uniqueFriendIds.length === 0) {
        setFriends([]);
        return;
      }

      // 2. Fetch Profiles
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*') 
        .in('id', uniqueFriendIds);

      if (profError) return;

      // 3. Fetch Unread Counts
      // We look for messages where receiver is current user and status is NOT 'READ'
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', userId)
        .neq('status', 'READ');
      
      const unreadMap: Record<string, number> = {};
      if (unreadMessages) {
          unreadMessages.forEach((msg: any) => {
              const sid = String(msg.sender_id);
              unreadMap[sid] = (unreadMap[sid] || 0) + 1;
          });
      }

      if (profiles) {
        const palette = [COLORS.RED, COLORS.YELLOW, COLORS.PURPLE, COLORS.BLUE, COLORS.PINK, COLORS.GREEN];
        
        const formattedFriends: Friend[] = profiles.map((p: any) => {
            // Deterministic Color Assignment based on ID
            let hash = 0;
            const idStr = String(p.id);
            for (let i = 0; i < idStr.length; i++) {
                hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
            }
            const colorIndex = Math.abs(hash) % palette.length;

            return {
                id: p.id,
                name: p.username || 'UNKNOWN',
                status: CardStatus.SOLVED, 
                statusIcon: '✓',
                time: '1H',
                color: palette[colorIndex], 
                avatarSeed: p.avatar_id || 'default',
                unreadCount: unreadMap[String(p.id)] || 0 // Assign unread count
            };
        });
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
    setSelectedFriend(friend);
    setCurrentScreen('chat');

    // 1. Locally clear the unread count immediately for UI responsiveness
    setFriends(prev => prev.map(f => 
        f.id === friend.id ? { ...f, unreadCount: 0 } : f
    ));

    // 2. Mark messages as READ in database
    if (session && isUUID(friend.id)) {
        try {
            await supabase
                .from('messages')
                .update({ status: 'READ' })
                .eq('receiver_id', session.user.id)
                .eq('sender_id', friend.id)
                .neq('status', 'READ'); // Only update if not already read
        } catch (e) {
            console.error("Failed to mark messages as read", e);
        }
    }
  };

  const handleDeleteConversation = async (friendId: string | number) => {
      const confirmDelete = window.confirm("CLEAR CHAT HISTORY? Messages will be gone, but friend will remain.");
      if (!confirmDelete) return;

      // 1. Immediate Visual Feedback
      setFriends(currentFriends => {
          return currentFriends.map(f => {
              if (String(f.id) === String(friendId)) {
                  return { ...f, status: CardStatus.NEW_VIBE, statusIcon: '✨', time: 'CLEARED' };
              }
              return f;
          });
      });

      // 2. Database Operation
      if (session && isUUID(friendId)) {
            const { error } = await supabase
                .from('messages')
                .delete()
                .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${session.user.id})`);
            
            if (error) {
                console.error("Failed to clear messages:", error);
            }
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
    // Refresh friends to get updated unread counts if any arrived while away
    if (session) {
        fetchFriends(session.user.id);
    }
  };
  
  const handleComposeSuccess = () => {
      setCurrentScreen('chat');
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
        await supabase.from('profiles').update({ 
            avatar_id: newSeed,
            color: newBgColor
        }).eq('id', session.user.id);
    }
  };

  const handleUpdateUsername = async (newName: string): Promise<boolean> => {
      const trimmed = newName.trim();
      if (!trimmed) return false;
      
      const previousUsername = currentUsername;
      
      // 1. Optimistic Update (Immediate UI change)
      setCurrentUsername(trimmed);

      if (session) {
          try {
             // 2. Update Database (Source of Truth)
             const { error: dbError } = await supabase
              .from('profiles')
              .update({ username: trimmed })
              .eq('id', session.user.id);
             
             if (dbError) {
                 // Explicitly log the error object as a string so it's readable
                 console.error("DB Error updating username:", JSON.stringify(dbError));
                 throw new Error(dbError.message || "Database update failed");
             }

             // 3. Update Auth Session Metadata (Persistence - Non-Fatal)
             try {
                const { error: authError } = await supabase.auth.updateUser({
                    data: { username: trimmed }
                });
                if (authError) {
                    console.warn("Auth metadata update warning:", JSON.stringify(authError));
                }
             } catch (authEx) {
                console.warn("Auth metadata update exception:", authEx);
             }
             
             return true;

          } catch (error: any) {
             console.error("Error updating username:", error);
             // Revert optimistic update
             setCurrentUsername(previousUsername);
             
             let friendlyMessage = error.message || "Unknown error";
             
             // Handle "violates check constraint" error from DB
             if (friendlyMessage.includes("username_length") || friendlyMessage.includes("violates check constraint")) {
                 friendlyMessage = "Username must be between 3 and 12 characters.";
             } else if (friendlyMessage.includes("duplicate key") || friendlyMessage.includes("violates unique constraint")) {
                 friendlyMessage = "Username already taken.";
             }

             alert(`Update Failed: ${friendlyMessage}`);
             fetchProfileWithRetry(session.user.id); 
             return false;
          }
      }
      return true;
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
                        onDelete={() => handleDeleteConversation(friend.id)}
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
            onSuccess={handleComposeSuccess} // Pass the success handler
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
                userId={session?.user?.id}
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
