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
import { Friend, CardStatus } from './types';
import { supabase } from './lib/supabaseClient';

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
  const [currentUsername, setCurrentUsername] = useState(''); // Initial empty

  // Scanner state
  const [startScanning, setStartScanning] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setCurrentScreen('home');
        
        // IMMEDIATE: Set username from metadata if available (faster than DB fetch)
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
        
        // IMMEDIATE: Set username from metadata if available (faster than DB fetch)
        if (session.user?.user_metadata?.username) {
            setCurrentUsername(session.user.user_metadata.username);
        }

        // Add a small delay/retry for profile fetch as DB trigger might be slightly delayed on signup
        fetchProfileWithRetry(session.user.id);
        fetchFriends(session.user.id);
      } else {
        setCurrentScreen('auth');
        setFriends([]);
        setCurrentUsername(''); // Reset on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Robust fetch with retries for new accounts
  const fetchProfileWithRetry = async (userId: string, retries = 3) => {
      let attempt = 0;
      while (attempt < retries) {
          const success = await fetchProfile(userId);
          if (success) break;
          attempt++;
          // Wait 500ms before retry
          if (attempt < retries) await new Promise(r => setTimeout(r, 500));
      }
  };

  const fetchProfile = async (userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_seed, bg_color')
        .eq('id', userId)
        .single();
        
        if (data) {
            // Update username from DB if it exists (source of truth)
            if (data.username) setCurrentUsername(data.username);
            if (data.avatar_seed) setCurrentUserSeed(data.avatar_seed);
            if (data.bg_color) setCurrentUserBgColor(data.bg_color);
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
  };

  const fetchFriends = async (userId: string) => {
    setLoading(true);
    
    try {
      // 1. Fetch friendships (connections)
      const { data: connections, error: connError } = await supabase
        .from('friendships')
        .select('user_id, friend_id, status')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (connError) {
        console.error('Error fetching friendships:', connError);
        setFriends(MOCK_FRIENDS); // Fallback to mock if DB fails
        return;
      }

      if (!connections || connections.length === 0) {
        setFriends([]);
        return;
      }

      // 2. Extract IDs of the "other" users
      const friendIds = connections.map((c: any) => 
        c.user_id === userId ? c.friend_id : c.user_id
      );

      // Filter out duplicates if any
      const uniqueFriendIds = [...new Set(friendIds)];

      if (uniqueFriendIds.length === 0) {
        setFriends([]);
        return;
      }

      // 3. Fetch profiles for those IDs
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, username, avatar_seed, bg_color')
        .in('id', uniqueFriendIds);

      if (profError) {
        console.error('Error fetching profiles:', profError);
        return;
      }

      // 4. Merge data
      if (profiles) {
        const formattedFriends: Friend[] = profiles.map((p: any) => ({
          id: p.id,
          name: p.username || 'UNKNOWN',
          status: CardStatus.SOLVED, 
          statusIcon: '✓',
          time: '1H',
          color: p.bg_color || COLORS.BLUE,
          avatarSeed: p.avatar_seed || 'default'
        }));
        setFriends(formattedFriends);
      }
      
    } catch (err) {
      console.error('Unexpected error in fetchFriends:', err);
      setFriends(MOCK_FRIENDS);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // Handled by auth state change
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleClearData = async () => {
      const confirmDelete = window.confirm("DELETE ALL HISTORY? THIS CANNOT BE UNDONE!");
      if (!confirmDelete) return;

      // Optimistic Update
      setFriends([]);
      setCurrentScreen('home');

      if (session) {
          const userId = session.user.id;
          try {
              // Delete all messages involved with user
              await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
              
              // Delete all friendships involved with user
              await supabase.from('friendships').delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`);
              
              console.log("Data cleared from Supabase");
          } catch (e) {
              console.error("Error clearing cloud data:", e);
          }
      }
  };

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setCurrentScreen('chat');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, friendId: string | number) => {
      e.stopPropagation();
      
      const confirmDelete = window.confirm("REMOVE FRIEND & DELETE CHAT?");
      if (!confirmDelete) return;

      // Optimistic update
      setFriends(prev => prev.filter(f => f.id !== friendId));
      
      if (session) {
           const isUUID = (id: string | number) => {
                if (typeof id !== 'string') return false;
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return uuidRegex.test(id);
            };

            if (isUUID(friendId)) {
                // Delete friendship in DB (Messages usually cascade delete or can remain orphan depending on schema, 
                // but here we just break the link)
                const { error } = await supabase
                    .from('friendships')
                    .delete()
                    .or(`and(user_id.eq.${session.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${session.user.id})`);

                if (error) console.error("Error deleting friend from DB:", error);
            }
      }
  };

  const handleAddNewFriend = async (newFriend: Friend) => {
      // Optimistic update
      setFriends(prev => [newFriend, ...prev]);
      
      if (session) {
        // Validate if ID is a valid UUID before database operation
        const isUUID = (id: string | number) => {
            if (typeof id !== 'string') return false;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(id);
        };

        if (!isUUID(newFriend.id)) {
            console.log("Skipping DB insert for non-UUID friend (mock/demo data):", newFriend.id);
            return;
        }

        // Create friendship in DB
        // Check if friendship already exists
        const { data: existing, error: fetchError } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user_id.eq.${session.user.id},friend_id.eq.${newFriend.id}),and(user_id.eq.${newFriend.id},friend_id.eq.${session.user.id})`);
        
        if (fetchError) {
             console.error("Error checking existing friendship:", fetchError);
             return;
        }

        if (existing && existing.length > 0) {
            console.log("Friendship already exists");
            return;
        }

        const { error } = await supabase
            .from('friendships')
            .insert({ user_id: session.user.id, friend_id: newFriend.id }); 
            
        if (error) {
             console.error("Failed to add friend to DB:", error.message || error);
        }
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
  };

  const handleProfileClick = () => {
      setCurrentScreen('profile');
  };
  
  const handleSettingsClick = () => {
      setCurrentScreen('settings');
  };
  
  const handleSettingsBack = () => {
      if (friends.length === 0) {
          setCurrentScreen('home');
      } else {
          setCurrentScreen('profile');
      }
  };

  const handleInviteClick = () => {
      setCurrentScreen('invite');
  };
  
  const handleInviteBack = () => {
      if (friends.length === 0) {
          setCurrentScreen('home');
      } else {
          setCurrentScreen('profile');
      }
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
      setStartScanning(false); // Reset to ensure next open is fresh
  };

  const handleGameSuccess = () => {
      setCurrentScreen('success');
  };

  const handleGameLoss = () => {
      setCurrentScreen('wrong');
  };

  const handleBackToChat = () => {
      setCurrentScreen('chat');
  };
  
  const handleTryAgain = () => {
      setCurrentScreen('chat'); 
  };

  // Avatar Selection Handlers
  const handleEditProfile = () => {
    setCurrentScreen('avatarSelect');
  };

  const handleChangePasswordClick = () => {
    setCurrentScreen('changePassword');
  };

  const handleAvatarSave = async (newSeed: string, newBgColor: string) => {
    setCurrentUserSeed(newSeed);
    setCurrentUserBgColor(newBgColor);
    setCurrentScreen('profile');
    
    if (session) {
        await supabase.from('profiles').update({ 
            avatar_seed: newSeed,
            bg_color: newBgColor
        }).eq('id', session.user.id);
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Press_Start_2P'] antialiased selection:bg-[#FF4081] selection:text-white overflow-hidden flex flex-col items-center">
      
      {/* Mobile Container Limited Width */}
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
                    
                    {/* Decorative "End of List" marker */}
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
            messages={MOCK_MESSAGES} // Initial placeholder, ChatScreen will fetch real
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
                onSendBack={handleBackToChat}
                onBackToChat={handleBackToChat}
            />
        )}

        {currentScreen === 'wrong' && selectedFriend && (
            <WrongAnswerScreen
                friend={selectedFriend}
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
      
      {/* Desktop Background Decoration */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[#2196F3] pattern-dots pointer-events-none hidden md:block">
         <div className="absolute top-1/2 left-10 text-white text-4xl max-w-xs drop-shadow-[4px_4px_0_#000]">
            VIBE<br/>BITES<br/><span className="text-yellow-400 text-sm">MOBILE PREVIEW</span>
         </div>
      </div>
    </div>
  );
};

export default App;