/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Facebook Messenger Style Customer Live Support Chat
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  User, 
  Phone, 
  Sparkles, 
  Headphones,
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { 
  getOrCreateCustomerChat, 
  subscribeToChatMessages, 
  subscribeToChatSession,
  sendCustomerMessage,
  PREMADE_QUICK_QUESTIONS,
  ChatSession,
  ChatMessage,
  PremadeOption
} from '../services/chatService';

interface CustomerLiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORT_AVATAR_URL = "https://cdn-icons-png.flaticon.com/512/4042/4042422.png";

export function CustomerLiveChatModal({ isOpen, onClose }: CustomerLiveChatModalProps): React.JSX.Element | null {
  const { settings } = useWebsiteSettings();

  // Saved user details state
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  // In-chat Registration Prompt Modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [pendingText, setPendingText] = useState<{ text: string; autoReply?: string } | null>(null);
  const [regError, setRegError] = useState('');

  // Chat room state
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const brandName = settings?.brandName || "Parasmoni Jewellers & Brothers";

  // Check saved customer registration
  useEffect(() => {
    const savedUserRaw = localStorage.getItem('parasmoni_chat_user');
    if (savedUserRaw) {
      try {
        const parsed = JSON.parse(savedUserRaw);
        if (parsed.name && parsed.phone) {
          setUserName(parsed.name);
          setUserPhone(parsed.phone);
          setIsRegistered(true);
        }
      } catch (err) {
        console.warn('Failed to parse saved chat user:', err);
      }
    }
  }, []);

  // Initialize or fetch chat session once registered and open
  useEffect(() => {
    if (!isOpen || !isRegistered || !userPhone || !userName) return;

    let unsubMsgs: (() => void) | undefined;
    let unsubSession: (() => void) | undefined;

    const initChat = async () => {
      const chatSession = await getOrCreateCustomerChat(userName, userPhone);
      setSession(chatSession);

      unsubSession = subscribeToChatSession(chatSession.id, (updatedSession) => {
        setSession(updatedSession);
      });

      unsubMsgs = subscribeToChatMessages(chatSession.id, (msgs) => {
        setMessages(msgs);
      });
    };

    initChat();

    return () => {
      if (unsubMsgs) unsubMsgs();
      if (unsubSession) unsubSession();
    };
  }, [isOpen, isRegistered, userName, userPhone]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, showRegModal]);

  // Execute sending message
  const executeSendMessage = async (textToSend: string, autoReplyAnswer?: string) => {
    if (!textToSend.trim() || isSending) return;

    setIsSending(true);
    setInputText('');

    if (session) {
      await sendCustomerMessage(session.id, userName, textToSend.trim(), autoReplyAnswer);
    } else {
      // If session not created yet, create now
      const newSession = await getOrCreateCustomerChat(userName, userPhone);
      setSession(newSession);
      await sendCustomerMessage(newSession.id, userName, textToSend.trim(), autoReplyAnswer);
    }

    setIsSending(false);
  };

  // Attempt send (Intercept if not registered)
  const handleAttemptSend = (customText?: string, autoReplyAnswer?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    if (!isRegistered) {
      // Save pending message and open In-Chat Registration Popup
      setPendingText({ text: textToSend.trim(), autoReply: autoReplyAnswer });
      setShowRegModal(true);
      return;
    }

    executeSendMessage(textToSend, autoReplyAnswer);
  };

  // Confirm registration inside chat
  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanName = userName.trim();
    const cleanPhone = userPhone.trim().replace(/[^0-9]/g, '');

    if (!cleanName || cleanName.length < 2) {
      setRegError('Please enter your full name (minimum 2 letters).');
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      setRegError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    const userData = { name: cleanName, phone: cleanPhone };
    localStorage.setItem('parasmoni_chat_user', JSON.stringify(userData));
    setUserName(cleanName);
    setUserPhone(cleanPhone);
    setIsRegistered(true);
    setShowRegModal(false);

    // If there was a pending text waiting to be sent, send it now
    if (pendingText) {
      const { text, autoReply } = pendingText;
      setPendingText(null);

      const chatSession = await getOrCreateCustomerChat(cleanName, cleanPhone);
      setSession(chatSession);
      await sendCustomerMessage(chatSession.id, cleanName, text, autoReply);
    }
  };

  const handleResetUser = () => {
    if (window.confirm('Reset saved name and phone number to start as a new customer?')) {
      localStorage.removeItem('parasmoni_chat_user');
      setIsRegistered(false);
      setUserName('');
      setUserPhone('');
      setSession(null);
      setMessages([]);
      setPendingText(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Messenger Card Container */}
      <div 
        className="w-full max-w-md h-[94vh] sm:h-[630px] bg-[#FAF7F2] border border-stone-200 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-900 relative animate-in slide-in-from-bottom duration-300 font-sans"
        id="customer-messenger-modal"
      >
        {/* Messenger Header Bar - Parasmoni Royal Burgundy */}
        <div className="bg-gradient-to-r from-[#6B1F2A] via-[#521720] to-[#6B1F2A] px-4 py-3.5 border-b border-amber-500/20 flex items-center justify-between shrink-0 shadow-sm text-white">
          <div className="flex items-center gap-3">
            {/* Customer Support Avatar / Image Logo */}
            <div className="relative w-10 h-10 rounded-full bg-white/10 border-2 border-amber-300/60 p-0.5 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
              <img 
                src={SUPPORT_AVATAR_URL} 
                alt="Parasmoni Support Avatar" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#6B1F2A] rounded-full animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-serif font-bold text-sm text-white tracking-wide uppercase">
                  Parasmoni Customer Support
                </h2>
              </div>
              <p className="text-[10px] text-amber-100/90 font-sans flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Showroom Support Staff • Active Online</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-200 hover:text-white rounded-full bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
            aria-label="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Indicator Bar */}
        <div className="px-4 py-2 bg-stone-100 border-b border-stone-200/80 flex items-center justify-between text-[11px] shrink-0">
          <div className="flex items-center gap-2 text-stone-700">
            {session?.status === 'pending' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-800 font-semibold">Waiting for showroom staff to accept...</span>
              </>
            ) : session?.status === 'active' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-emerald-800 font-semibold">Connected Live with {session.acceptedBy || 'Showroom Staff'}</span>
              </>
            ) : session?.status === 'closed' ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span className="text-stone-600 font-semibold">Chat session closed by showroom staff</span>
              </>
            ) : (
              <span className="text-stone-600">Type a message below to connect with showroom staff</span>
            )}
          </div>
        </div>

        {/* Messenger Chat Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FAF7F2]">
          
          {/* Default Staff Greeting Card */}
          <div className="flex items-start gap-2.5 max-w-[88%]">
            <div className="w-8 h-8 rounded-full bg-[#6B1F2A] border border-amber-300/40 p-0.5 flex items-center justify-center shrink-0 shadow-xs mt-1 overflow-hidden">
              <img 
                src={SUPPORT_AVATAR_URL} 
                alt="Support Avatar" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="bg-white border border-stone-200/80 p-3.5 rounded-2xl rounded-tl-xs shadow-xs text-xs leading-relaxed text-stone-800">
              <p className="font-bold text-[#6B1F2A] mb-1">Namaste! Welcome to {brandName}.</p>
              <p>How can we assist you today? Feel free to ask a question about live gold rates, custom jewellery, or select a quick inquiry below!</p>
            </div>
          </div>

          {/* Dynamic Chat Messages */}
          {messages.map((m) => {
            const isCustomer = m.sender === 'customer';
            const isSystem = m.sender === 'system';

            if (isSystem) {
              return (
                <div key={m.id} className="flex justify-center my-2">
                  <span className="text-[10px] text-stone-600 bg-stone-200/80 border border-stone-300 px-3 py-1 rounded-full text-center max-w-xs font-mono">
                    {m.text}
                  </span>
                </div>
              );
            }

            return (
              <div 
                key={m.id} 
                className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'} space-y-1`}
              >
                <span className="text-[9px] text-stone-400 px-1 font-mono">
                  {m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <div 
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isCustomer 
                      ? 'bg-[#6B1F2A] text-white font-medium rounded-tr-xs' 
                      : 'bg-white text-stone-800 rounded-tl-xs border border-stone-200/80'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Premade Quick Inquiry Chips (Facebook Messenger Style) */}
        <div className="px-3.5 py-2.5 bg-white border-t border-stone-200/80 shrink-0">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#6B1F2A] mb-1.5 block flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-[#6B1F2A]" />
            <span>Quick Inquiry Chips (Tap for instant response):</span>
          </span>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PREMADE_QUICK_QUESTIONS.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => handleAttemptSend(q.question, q.answer)}
                disabled={session?.status === 'closed'}
                className="shrink-0 px-3 py-1.5 bg-[#6B1F2A]/10 hover:bg-[#6B1F2A] text-[#6B1F2A] hover:text-white text-[11px] font-semibold border border-[#6B1F2A]/30 rounded-full transition-all cursor-pointer disabled:opacity-50 text-left whitespace-nowrap active:scale-95 shadow-xs"
              >
                {q.question}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form Area */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleAttemptSend(); }} 
          className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0 shadow-md"
        >
          <input
            type="text"
            placeholder={session?.status === 'closed' ? 'This chat session is closed' : 'Type your message here...'}
            disabled={session?.status === 'closed' || isSending}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-stone-50 border border-stone-200 focus:border-[#6B1F2A] text-stone-900 text-xs rounded-full px-4 py-2.5 outline-none transition-colors disabled:opacity-50 placeholder:text-stone-400"
          />

          <button
            type="button"
            onClick={() => handleAttemptSend()}
            disabled={!inputText.trim() || session?.status === 'closed' || isSending}
            className="p-2.5 bg-[#6B1F2A] hover:bg-[#521720] active:scale-95 text-white rounded-full transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-md shrink-0"
            aria-label="Send Message"
          >
            <Send className="w-4 h-4 stroke-[2.2]" />
          </button>
        </form>

        {/* IN-CHAT REGISTRATION MODAL / POPUP OVERLAY */}
        {showRegModal && (
          <div className="absolute inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white border border-stone-200 rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 text-stone-900">
              
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#6B1F2A] border border-amber-300/40 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                      src={SUPPORT_AVATAR_URL} 
                      alt="Support Avatar" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#6B1F2A] tracking-wide uppercase">
                      Enter Details to Connect
                    </h3>
                    <p className="text-[10px] text-stone-500">Required once before live chat starts</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Please enter your Full Name and 10-Digit Mobile Number so our showroom staff can identify your inquiry and connect with you live.
              </p>

              <form onSubmit={handleConfirmRegistration} className="space-y-3">
                {regError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{regError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 focus:border-[#6B1F2A] text-stone-900 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    10-Digit Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 focus:border-[#6B1F2A] text-stone-900 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none font-mono font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#6B1F2A] hover:bg-[#521720] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>CONFIRM & SEND MESSAGE</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <p className="text-[9px] text-stone-500 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>100% Secure • Auto-deleted in 3 days</span>
                </p>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
