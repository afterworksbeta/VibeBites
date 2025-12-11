import React, { useState, useEffect, useRef } from 'react';
import { Friend, Message, MessageType } from '../types';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { GamePopup } from './GamePopup';
import { SentVibePopup } from './SentVibePopup';
import { COLORS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface ChatScreenProps {
  friend: Friend;
  messages: Message[]; 
  onBack: () => void;
  onGameSuccess: () => void;
  onGameLoss?: () => void;
}

// Helper to validate UUIDs
const isUUID = (id: string | number) => {
    if (typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

export const ChatScreen: React.FC<ChatScreenProps> = ({ friend, messages: initialMessages, onBack, onGameSuccess, onGameLoss }) => {
  const [showGamePopup, setShowGamePopup] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Helper to map DB row to Message type
  const mapToMessage = (m: any, currentUserId: string): Message => ({
    id: m.id,
    type: m.sender_id === currentUserId ? MessageType.OUTGOING : MessageType.INCOMING_UNSOLVED,
    text: m.text,
    emojis: m.emojis || [],
    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: m.status,
    sender_id: m.sender_id,
    topic: m.topic || undefined,
    difficulty: m.difficulty || undefined
  });

  const fetchMessages = async (currentUserId: string) => {
    if (!isUUID(friend.id)) {
        if (initialMessages.length > 0 && chatMessages.length === 0) {
            setChatMessages(initialMessages);
        }
        return;
    }

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching messages:", error.message);
    } else if (data) {
        // Smart Merge: Keep "SENDING" messages that are local-only
        setChatMessages(prev => {
            const dbMessages = data.map(m => mapToMessage(m, currentUserId));
            const localPending = prev.filter(m => m.status === 'SENDING');
            
            // Avoid duplicates if a pending message was just fetched
            // (Though usually pending has temp ID vs DB ID, so they are distinct until we resolve them)
            return [...dbMessages, ...localPending];
        });
    }
  };

  useEffect(() => {
    let pollingInterval: any;
    let channel: any;

    const setupChat = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const currentUserId = user.id;
        setUserId(currentUserId);

        // 1. Initial Fetch
        await fetchMessages(currentUserId);

        // 2. Setup Realtime Subscription
        // Listen for ANY insert into messages. We will filter in client to be safe and simple.
        channel = supabase.channel(`chat_${currentUserId}_${friend.id}_${Date.now()}`)
            .on(
                'postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}` // Listen for incoming messages
                }, 
                (payload) => {
                    console.log("🔔 Realtime Message Received!", payload);
                    if (payload.new.sender_id === friend.id) {
                         const newMessage = mapToMessage(payload.new, currentUserId);
                         setChatMessages(prev => {
                             // Dedup: Check if ID already exists
                             if (prev.some(m => m.id === newMessage.id)) return prev;
                             return [...prev, newMessage];
                         });
                         // Scroll on new message
                         setTimeout(scrollToBottom, 100);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`🔌 Chat Subscription Status: ${status}`);
            });

        // 3. Setup Polling (Backup Strategy)
        // Poll every 3 seconds to ensure messages appear even if Realtime fails
        pollingInterval = setInterval(() => {
            fetchMessages(currentUserId);
        }, 3000);
    };

    if (isUUID(friend.id)) {
        setupChat();
    } else {
        // Mock mode: just use initial
        setChatMessages(initialMessages);
    }

    return () => {
        if (channel) supabase.removeChannel(channel);
        if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [friend.id]); // Re-run only if friend ID changes

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length]); // Scroll when count changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMessageClick = (msg: Message) => {
    if (msg.type === MessageType.INCOMING_UNSOLVED) {
      setSelectedMessage(msg);
      setShowGamePopup(true);
    } else if (msg.type === MessageType.OUTGOING) {
      setSelectedMessage(msg);
    }
  };

  const handleWin = () => {
      setShowGamePopup(false);
      setSelectedMessage(null);
      onGameSuccess();
  }

  const handleLoss = () => {
      setShowGamePopup(false);
      setSelectedMessage(null);
      if (onGameLoss) onGameLoss();
  }
  
  const handleClosePopup = () => {
      setShowGamePopup(false);
      if (selectedMessage?.type === MessageType.INCOMING_UNSOLVED) {
          setSelectedMessage(null);
      }
  };

  const handleSendMessage = async (text: string, emojis?: string[]) => {
    if (!userId || isSending) return;
    setIsSending(true);

    const tempId = Date.now();
    const optimisticMessage: Message = {
        id: tempId,
        type: MessageType.OUTGOING,
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "SENDING",
        emojis: emojis || [] 
    };
    
    // 1. Optimistic Update
    setChatMessages(prev => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 50);

    if (!isUUID(friend.id)) {
        console.log("Mock Friend: Skipped DB insert");
        setIsSending(false);
        // Simulate success for mock
        setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'SENT' } : m));
        return;
    }

    // 2. Send to DB and SELECT returned row
    const { data, error } = await supabase
        .from('messages')
        .insert({
            sender_id: userId,
            receiver_id: friend.id,
            text: text,
            emojis: emojis,
            status: 'SENT'
        })
        .select()
        .single();
    
    if (error) {
        console.error("Failed to send message", error.message);
        // Mark as failed
        setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
    } else if (data) {
        // 3. Replace Optimistic Message with Real DB Message
        const realMessage = mapToMessage(data, userId);
        setChatMessages(prev => prev.map(m => m.id === tempId ? realMessage : m));
    }
    
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      <ChatHeader friend={friend} onBack={onBack} />
      
      <main 
        className="flex-1 overflow-y-auto p-4 flex flex-col scrollbar-hide"
        style={{ backgroundColor: COLORS.YELLOW }}
      >
        {/* Date Separator */}
        <div className="flex justify-center mb-6">
           <div className="bg-black px-4 py-2 rounded-lg">
              <span className="text-white text-[10px] uppercase tracking-wider">- TODAY -</span>
           </div>
        </div>

        {/* Message List */}
        <div className="flex flex-col gap-2 pb-4">
            {chatMessages.length > 0 ? (
                chatMessages.map((msg) => (
                    <div 
                        key={msg.id} 
                        onClick={() => handleMessageClick(msg)} 
                        className="cursor-pointer active:scale-[0.98] transition-transform duration-100"
                    >
                        <MessageBubble message={msg} friend={friend} />
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center mt-10 opacity-50">
                    <span className="text-black text-[10px] bg-white/50 px-3 py-1 rounded">
                        {isUUID(friend.id) ? "NO MESSAGES YET..." : "MOCK CHAT MODE"}
                    </span>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSend={handleSendMessage} />

      {/* GAME POPUP (Incoming) */}
      {showGamePopup && selectedMessage?.type === MessageType.INCOMING_UNSOLVED && (
        <GamePopup 
            friend={friend} 
            message={selectedMessage}
            onClose={handleClosePopup} 
            onWin={handleWin}
            onLoss={handleLoss}
        />
      )}

      {/* SENT VIBE POPUP (Outgoing) */}
      {selectedMessage && selectedMessage.type === MessageType.OUTGOING && (
        <SentVibePopup 
            message={selectedMessage} 
            onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
};