import React, { useState, useRef, useEffect, useCallback } from 'react';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useAuthStore } from '../../stores/authStore';

// ─── Types ─────────────────────────────────────────────────

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Pre-built responses for common queries (fallback when Gemini not available)
const QUICK_RESPONSES: Record<string, string> = {
    'hello': 'Hello! Welcome to Deltablue Jet Air. How can I help you today? I can assist with bookings, baggage, check-in, flight status, and more.',
    'hi': 'Hi there! I\'m here to help. What can I assist you with?',
    'booking': 'I can help with bookings! You can search and book flights at /book, manage existing bookings at /manage-booking, or cancel a booking from your booking details page. What would you like to do?',
    'baggage': 'For baggage information: Economy allows 1 bag (23kg), Business 2 bags (32kg each), First 3 bags (32kg each). You can add extra bags during booking or check-in. Track lost bags at /manage-booking/baggage.',
    'checkin': 'Online check-in opens 48 hours and closes 2 hours before departure. Visit /checkin to get started — you\'ll need your booking reference and last name.',
    'flight status': 'Check your flight status at /flight-status. Enter your flight number or route to see real-time departure and arrival information.',
    'cancel': 'To cancel a booking, go to /manage-booking, enter your PNR and last name, then select "Cancel Booking". Refund policies vary by fare class.',
    'loyalty': 'Our loyalty program rewards you with miles on every flight. Visit /loyalty to view your balance, tier status, and redeem miles for flights or upgrades.',
    'help': 'I can help with: ✈️ Booking flights, 🧳 Baggage policies, ✅ Check-in, 📍 Flight status, 🔄 Modifications, ❌ Cancellations, ⭐ Loyalty program. Just ask!',
};

function getAutoResponse(input: string): string {
    const lower = input.toLowerCase().trim();
    for (const [key, response] of Object.entries(QUICK_RESPONSES)) {
        if (lower.includes(key)) return response;
    }
    return 'Thank you for your message. Our support team will follow up shortly. In the meantime, you can visit our Help Center at /help for instant answers, or submit a support ticket for personalized assistance.';
}

// ─── Component ─────────────────────────────────────────────

const LiveChatWidget: React.FC = () => {
    const user = useAuthStore(s => s.user);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '0',
            role: 'assistant',
            content: 'Welcome to Deltablue Jet Air! 👋 I\'m your virtual assistant. How can I help you today?',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const saveChatToFirestore = useCallback(async (userMsg: string, assistantMsg: string) => {
        try {
            await addDoc(collection(db, 'support_chats'), {
                userId: user?.uid || 'anonymous',
                userMessage: userMsg,
                assistantResponse: assistantMsg,
                createdAt: Timestamp.now(),
            });
        } catch {
            // Silent fail — chat saving is non-critical
        }
    }, [user]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        const userMessage: ChatMessage = {
            id: String(Date.now()),
            role: 'user',
            content: trimmed,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate brief typing delay
        await new Promise(r => setTimeout(r, 800 + Math.random() * 700));

        const responseText = getAutoResponse(trimmed);
        const assistantMessage: ChatMessage = {
            id: String(Date.now() + 1),
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);

        await saveChatToFirestore(trimmed, responseText);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const unreadCount = isOpen ? 0 : 1;

    return (
        <>
            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-[90] w-[380px] max-h-[520px] bg-white rounded-3xl shadow-2xl border border-navy-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 font-display">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-primary-600 p-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white">smart_toy</span>
                            </div>
                            <div>
                                <p className="text-white font-black text-xs tracking-tight">Deltablue Assistant</p>
                                <p className="text-white/70 text-[10px] font-bold">Online • Typically replies instantly</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ maxHeight: '340px' }}>
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-primary text-white rounded-br-md'
                                        : 'bg-navy-50 text-navy-800 rounded-bl-md'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-navy-50 px-4 py-3 rounded-2xl rounded-bl-md">
                                    <div className="flex gap-1">
                                        <div className="size-1.5 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="size-1.5 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="size-1.5 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-navy-100 shrink-0">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type a message..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-navy-50 border-none text-xs font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20"
                                aria-label="Chat message input"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="size-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-30 shadow-lg shadow-primary/20"
                                aria-label="Send message"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[90] size-14 rounded-full bg-primary text-white shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 transition-all group"
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                <span className={`material-symbols-outlined text-xl transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                    {isOpen ? 'close' : 'chat'}
                </span>
                {!isOpen && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-5 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>
        </>
    );
};

export default LiveChatWidget;
