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

export const ChatScreen: React.FC<ChatScreenProps> = ({ friend, messages: initialMessages, onBack, onGameSuccess, onGameLoss }) => {
  const [showGamePopup, setShowGamePopup] = useState(false);
  const [selectedSentMessage, setSelectedSentMessage] = useState<Message | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
            setUserId(data.user.id);
            fetchMessages(data.user.id);
            subscribeToMessages(data.user.id);
        }
    });
  }, [friend]);

  const fetchMessages = async (currentUserId: string) => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching messages", error);
        if (chatMessages.length === 0) setChatMessages(initialMessages);
    } else if (data && data.length > 0) {
        const formatted: Message[] = data.map((m: any) => ({
            id: m.id,
            type: m.sender_id === currentUserId ? MessageType.OUTGOING : MessageType.INCOMING_UNSOLVED,
            text: m.text,
            emojis: m.emojis || [],
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: m.status,
            sender_id: m.sender_id
        }));
        setChatMessages(formatted);
    }
  };

  const subscribeToMessages = (currentUserId: string) => {
    // Listen for new messages where receiver is me and sender is friend
    const subscription = supabase
      .channel(`chat:${currentUserId}:${friend.id}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
      }, (payload) => {
          if (payload.new.sender_id === friend.id) {
              const newMessage: Message = {
                  id: payload.new.id,
                  type: MessageType.INCOMING_UNSOLVED,
                  text: payload.new.text,
                  emojis: payload.new.emojis || [],
                  time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: payload.new.status,
                  sender_id: payload.new.sender_id
              };
              setChatMessages(prev => [...prev, newMessage]);
          }
      })
      .subscribe();

    return () => {
        subscription.unsubscribe();
    };
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMessageClick = (msg: Message) => {
    if (msg.type === MessageType.INCOMING_UNSOLVED) {
      setShowGamePopup(true);
    } else if (msg.type === MessageType.OUTGOING) {
      setSelectedSentMessage(msg);
    }
  };

  const handleWin = () => {
      setShowGamePopup(false);
      onGameSuccess();
  }

  const handleLoss = () => {
      setShowGamePopup(false);
      if (onGameLoss) onGameLoss();
  }

  const handleSendMessage = async (text: string, emojis?: string[]) => {
    if (!userId) return;

    const newMessage: Message = {
        id: Date.now(),
        type: MessageType.OUTGOING,
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "SENT",
        emojis: emojis || [] 
    };
    
    // Optimistic Update
    setChatMessages(prev => [...prev, newMessage]);

    // Send to DB
    const { error } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: friend.id,
        text: text,
        emojis: emojis,
        status: 'SENT'
    });
    
    if (error) console.error("Failed to send message", error);
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
                    <span className="text-black text-[10px] bg-white/50 px-3 py-1 rounded">NO MESSAGES...</span>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSend={handleSendMessage} />

      {/* GAME POPUP (Incoming) */}
      {showGamePopup && (
        <GamePopup 
            friend={friend} 
            onClose={() => setShowGamePopup(false)} 
            onWin={handleWin}
            onLoss={handleLoss}
        />
      )}

      {/* SENT VIBE POPUP (Outgoing) */}
      {selectedSentMessage && (
        <SentVibePopup 
            message={selectedSentMessage} 
            onClose={() => setSelectedSentMessage(null)}
        />
      )}
    </div>
  );
};