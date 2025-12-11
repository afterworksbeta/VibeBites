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
  onGameSuccess: (message: Message) => void;
  onGameLoss?: (message: Message, score: number, guess: string) => void;
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
    let content = m.original_text; 
    let emojiList = m.emoji_sequences || [];
    let topic = m.topic;
    let hint = undefined; // Initialize hint
    let difficulty = m.difficulty;
    let status = m.status || 'SENT';
    
    // Default type based on sender
    let msgType = m.sender_id === currentUserId ? MessageType.OUTGOING : MessageType.INCOMING_UNSOLVED;

    // PROTOCOL: Attempt to parse JSON from original_text
    if (typeof content === 'string' && content.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === 'object') {
                if (parsed.text !== undefined) content = parsed.text;
                if (emojiList.length === 0 && Array.isArray(parsed.emojis)) emojiList = parsed.emojis;
                if (parsed.topic) topic = parsed.topic;
                if (parsed.hint) hint = parsed.hint; // Extract hint
                if (parsed.difficulty) difficulty = parsed.difficulty;
                if (parsed.status) status = parsed.status;
                
                // Trust type from payload if incoming
                if (m.sender_id !== currentUserId && parsed.type) {
                     msgType = parsed.type;
                }
            }
        } catch (e) {
            // content remains as is
        }
    }

    // STRICT: Use sent_at as the source of truth
    const timeSource = m.sent_at;

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
        hint: hint, // Assign hint
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

    try {
        const filter = `and(sender_id.eq.${currentUserId},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUserId})`;

        const { data, error } = await supabase
            .from('messages')
            .select('id, sender_id, receiver_id, original_text, emoji_sequences, sent_at')
            .or(filter)
            .order('sent_at', { ascending: true });

        if (error) {
            console.error("[ChatScreen] ❌ Error fetching messages (Detail):", JSON.stringify(error, null, 2));
            throw error;
        } else if (data) {
            setChatMessages(prev => {
                const dbMessages = data.map(m => mapToMessage(m, currentUserId));
                const localPending = prev.filter(m => m.status === 'SENDING');
                return [...dbMessages, ...localPending];
            });
        }
    } catch (e: any) {
        console.error("[ChatScreen] Exception in fetchMessages:", e.message || e);
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
        
        console.log(`[ChatScreen] 🚀 Setup started. Me: ${currentUserId}, Friend: ${friend.id}`);

        await fetchMessages(currentUserId);

        const channelName = `room_chat_${friend.id}_${Date.now()}`;
        channel = supabase.channel(channelName)
            .on(
                'postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages',
                }, 
                (payload) => {
                    const newMsg = payload.new;
                    const isRelevant = 
                        (newMsg.sender_id === friend.id && newMsg.receiver_id === currentUserId) || 
                        (newMsg.sender_id === currentUserId && newMsg.receiver_id === friend.id);   

                    if (isRelevant) {
                         console.log("🔔 [ChatScreen] Relevant Message Received!");
                         const messageObj = mapToMessage(newMsg, currentUserId);
                         setChatMessages(prev => {
                             if (prev.some(m => m.id === messageObj.id)) return prev;
                             return [...prev, messageObj];
                         });
                         setTimeout(scrollToBottom, 100);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`🔌 [ChatScreen] Subscription Status: ${status}`);
            });

        pollingInterval = setInterval(() => {
            fetchMessages(currentUserId);
        }, 3000);
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
      if (selectedMessage) {
        onGameSuccess(selectedMessage);
      }
      setShowGamePopup(false);
      setSelectedMessage(null);
  }

  const handleLoss = (score: number, guess: string) => {
      if (selectedMessage && onGameLoss) {
          onGameLoss(selectedMessage, score, guess);
      }
      setShowGamePopup(false);
      setSelectedMessage(null);
  }
  
  const handleClosePopup = () => {
      setShowGamePopup(false);
      if (selectedMessage?.type === MessageType.INCOMING_UNSOLVED) {
          setSelectedMessage(null);
      }
  };

  const handleSendMessage = async (text: string, emojis?: string[]) => {
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
        setIsSending(false);
        setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'SENT' } : m));
        return;
    }

    try {
        const payload = {
            text: text,
            emojis: emojis || [],
            status: 'SENT',
            type: 'INCOMING_UNSOLVED'
        };
        const jsonPayload = JSON.stringify(payload);
        const currentIsoTime = new Date().toISOString();

        console.log("[ChatScreen] Sending to DB...", { receiver: friend.id });

        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: userId,
                receiver_id: friend.id,
                original_text: jsonPayload,
                emoji_sequences: emojis || [],
                sent_at: currentIsoTime 
            })
            .select('id, sender_id, receiver_id, original_text, emoji_sequences, sent_at')
            .single();
        
        if (error) throw error;

        if (data) {
            console.log("[ChatScreen] Send Success!", data.id);
            const realMessage = mapToMessage(data, userId);
            setChatMessages(prev => prev.map(m => m.id === tempId ? realMessage : m));
        }
    } catch (err: any) {
        console.error("[ChatScreen] Send Failed:", JSON.stringify(err, null, 2));
        alert(`SEND FAILED: ${err.message || "Check console"}`);
        setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
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
                        className="cursor-pointer active:scale-[0.98] transition-transform duration-100 w-full flex flex-col"
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