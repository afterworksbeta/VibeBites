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
  const mapToMessage = (m: any, currentUserId: string): Message => {
    // DB Schema Mapping:
    // original_text -> Raw content (JSON packed)
    // emoji_sequences -> Emoji array
    // sent_at -> Time
    
    let content = m.original_text; 
    let emojiList = m.emoji_sequences || [];
    let topic = m.topic;
    let difficulty = m.difficulty;
    let status = m.status || 'SENT';
    
    // Default type based on sender
    let msgType = m.sender_id === currentUserId ? MessageType.OUTGOING : MessageType.INCOMING_UNSOLVED;

    // PROTOCOL: Attempt to parse JSON from original_text column (Schema Fix)
    if (typeof content === 'string' && content.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(content);
            // Check if it looks like our packed object
            if (parsed && typeof parsed === 'object') {
                if (parsed.text !== undefined) content = parsed.text;
                // If emoji_sequences is empty in DB but present in JSON, use JSON (backup)
                if (emojiList.length === 0 && Array.isArray(parsed.emojis)) emojiList = parsed.emojis;
                if (parsed.topic) topic = parsed.topic;
                if (parsed.difficulty) difficulty = parsed.difficulty;
                if (parsed.status) status = parsed.status;
                
                // If we are the receiver, trust the type in the payload (e.g. game vs text)
                if (m.sender_id !== currentUserId && parsed.type) {
                     msgType = parsed.type;
                }
            }
        } catch (e) {
            // content remains as is
        }
    }

    // Determine timestamp source (sent_at prefered, then created_at, then now)
    const timeSource = m.sent_at || m.created_at;

    return {
        id: m.id,
        type: msgType,
        text: content || '',
        emojis: emojiList,
        time: timeSource 
            ? new Date(timeSource).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '', 
        status: status,
        sender_id: m.sender_id,
        topic: topic || undefined,
        difficulty: difficulty || undefined
    };
  };

  const fetchMessages = async (currentUserId: string) => {
    if (!isUUID(friend.id)) {
        if (initialMessages.length > 0 && chatMessages.length === 0) {
            setChatMessages(initialMessages);
        }
        return;
    }

    console.log(`[ChatScreen] Fetching messages: Me=${currentUserId} Friend=${friend.id}`);

    // Explicit OR filter string to prevent syntax errors
    const filter = `and(sender_id.eq.${currentUserId},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUserId})`;

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(filter)
        .order('sent_at', { ascending: true }); // Ordered by sent_at as UUIDs are random

    if (error) {
        console.error("[ChatScreen] Error fetching messages:", error);
    } else if (data) {
        console.log(`[ChatScreen] Fetched ${data.length} messages`);
        setChatMessages(prev => {
            const dbMessages = data.map(m => mapToMessage(m, currentUserId));
            // Keep local pending messages that haven't been saved yet
            const localPending = prev.filter(m => m.status === 'SENDING');
            
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

        await fetchMessages(currentUserId);

        // Realtime
        channel = supabase.channel(`chat_${currentUserId}_${friend.id}_${Date.now()}`)
            .on(
                'postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}`
                }, 
                (payload) => {
                    console.log("🔔 [ChatScreen] Realtime Message Received:", payload);
                    if (payload.new.sender_id === friend.id) {
                         const newMessage = mapToMessage(payload.new, currentUserId);
                         setChatMessages(prev => {
                             if (prev.some(m => m.id === newMessage.id)) return prev;
                             return [...prev, newMessage];
                         });
                         setTimeout(scrollToBottom, 100);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`🔌 [ChatScreen] Subscription Status: ${status}`);
            });

        // Polling backup
        pollingInterval = setInterval(() => {
            fetchMessages(currentUserId);
        }, 5000);
    };

    if (isUUID(friend.id)) {
        setupChat();
    } else {
        setChatMessages(initialMessages);
    }

    return () => {
        if (channel) supabase.removeChannel(channel);
        if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [friend.id]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length]);

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
    console.log("[ChatScreen] Sending message...", { text, emojis });
    
    if (!userId) {
        alert("ERROR: User ID missing. Please re-login.");
        return;
    }
    if (isSending) return;
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
    
    setChatMessages(prev => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 50);

    if (!isUUID(friend.id)) {
        console.log("Mock Friend: Skipped DB insert");
        setIsSending(false);
        setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'SENT' } : m));
        return;
    }

    try {
        // 1. Pack Data
        const payload = {
            text: text,
            emojis: emojis || [],
            status: 'SENT',
            type: 'INCOMING_UNSOLVED'
        };
        const jsonPayload = JSON.stringify(payload);
        const currentIsoTime = new Date().toISOString();

        // 2. Insert into DB (Correct Schema)
        console.log("[ChatScreen] Inserting into DB...", {
            sender_id: userId,
            receiver_id: friend.id,
            original_text: jsonPayload.substring(0, 20) + "...",
            emoji_sequences: emojis || [],
            sent_at: currentIsoTime
        });

        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: userId,
                receiver_id: friend.id,
                original_text: jsonPayload, // Changed from 'text'
                emoji_sequences: emojis || [], // Added NOT NULL column
                sent_at: currentIsoTime // Added for sorting
            })
            .select()
            .single();
        
        if (error) {
            console.error("[ChatScreen] INSERT ERROR:", error);
            throw error;
        }

        if (data) {
            console.log("[ChatScreen] INSERT SUCCESS:", data);
            const realMessage = mapToMessage(data, userId);
            setChatMessages(prev => prev.map(m => m.id === tempId ? realMessage : m));
        }
    } catch (err: any) {
        console.error("[ChatScreen] Exception sending:", err);
        alert(`SEND FAILED: ${err.message || 'Unknown error'}`);
        setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      <ChatHeader friend={friend} onBack={onBack} />
      
      <main 
        className="flex-1 overflow-y-auto p-4 flex flex-col scrollbar-hide"
        style={{ backgroundColor: COLORS.YELLOW }}
      >
        <div className="flex justify-center mb-6">
           <div className="bg-black px-4 py-2 rounded-lg">
              <span className="text-white text-[10px] uppercase tracking-wider">- TODAY -</span>
           </div>
        </div>

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

      {showGamePopup && selectedMessage?.type === MessageType.INCOMING_UNSOLVED && (
        <GamePopup 
            friend={friend} 
            message={selectedMessage}
            onClose={handleClosePopup} 
            onWin={handleWin}
            onLoss={handleLoss}
        />
      )}

      {selectedMessage && selectedMessage.type === MessageType.OUTGOING && (
        <SentVibePopup 
            message={selectedMessage} 
            onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
};