/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Admin Panel Live Customer Support Chats Center
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  User, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Clock, 
  Search, 
  Filter, 
  Sparkles, 
  ExternalLink, 
  ShieldAlert,
  Trash2,
  RefreshCw,
  AlertCircle,
  Headphones
} from 'lucide-react';
import { 
  subscribeToAllChats, 
  subscribeToChatMessages, 
  acceptChatSession, 
  closeChatSession, 
  sendAdminMessage,
  purgeExpiredChats,
  ChatSession, 
  ChatMessage 
} from '../services/chatService';

export function AdminLiveChats(): React.JSX.Element {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'active' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [adminInput, setAdminInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to all chats list
  useEffect(() => {
    purgeExpiredChats();
    const unsub = subscribeToAllChats((items) => {
      setChats(items);
      // Auto-select first chat if none selected
      if (!selectedChatId && items.length > 0) {
        setSelectedChatId(items[0].id);
      }
    });

    return () => unsub();
  }, []);

  // Subscribe to selected chat messages
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const unsub = subscribeToChatMessages(selectedChatId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsub();
  }, [selectedChatId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedChat = chats.find(c => c.id === selectedChatId) || null;

  // Filtered chats list
  const filteredChats = chats.filter(c => {
    if (activeFilter !== 'all' && c.status !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.userName.toLowerCase().includes(q) || c.userPhone.includes(q) || c.lastMessage.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAccept = async () => {
    if (!selectedChatId) return;
    await acceptChatSession(selectedChatId, 'Parasmoni Admin');
  };

  const handleClose = async () => {
    if (!selectedChatId) return;
    if (window.confirm('Close this customer chat session?')) {
      await closeChatSession(selectedChatId);
    }
  };

  const handleAdminSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !adminInput.trim() || isSending) return;

    setIsSending(true);
    const text = adminInput.trim();
    setAdminInput('');

    await sendAdminMessage(selectedChatId, text, 'Showroom Staff');
    setIsSending(false);
  };

  return (
    <div className="space-y-6" id="admin-live-chats-page">
      
      {/* Professional Brand Header Banner (Royal Burgundy) */}
      <div className="bg-gradient-to-r from-[#6B1F2A] via-[#521720] to-[#6B1F2A] border border-amber-500/20 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-amber-300/40 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/4042/4042422.png" 
              alt="Support Desk Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-lg uppercase tracking-wide text-white">
                Live Customer Support Desk
              </h2>
              <span className="bg-amber-400 text-stone-950 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase shadow-xs">
                REALTIME
              </span>
            </div>
            <p className="text-amber-100/80 text-xs mt-0.5">
              Respond directly to customer enquiries logged from the mobile & web app.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-amber-100 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>3-Day Auto Retention Active</span>
        </div>
      </div>

      {/* Main Workspace Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        
        {/* LEFT COLUMN: Customer Chat Requests List (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-stone-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden">
          
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-stone-200/80 bg-stone-50/70 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-200 focus:border-[#6B1F2A] text-xs rounded-xl pl-9 pr-3 py-2 outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold uppercase">
              {(['all', 'pending', 'active', 'closed'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer capitalize ${
                    activeFilter === filter
                      ? 'bg-[#6B1F2A] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {filter} {filter === 'pending' && chats.filter(c => c.status === 'pending').length > 0 && `(${chats.filter(c => c.status === 'pending').length})`}
                </button>
              ))}
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 min-h-[350px] max-h-[520px]">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />
                <p>No customer chat requests found in this view.</p>
              </div>
            ) : (
              filteredChats.map((c) => {
                const isSelected = c.id === selectedChatId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChatId(c.id)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer flex flex-col space-y-1.5 relative ${
                      isSelected ? 'bg-[#6B1F2A]/5 border-l-4 border-[#6B1F2A]' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 truncate">
                        <span>{c.userName}</span>
                        {c.status === 'pending' && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                        )}
                      </div>

                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                        c.status === 'pending' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : c.status === 'active'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-stone-100 text-stone-700 border border-stone-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-500 truncate font-mono">
                      📞 {c.userPhone}
                    </p>

                    <p className="text-xs text-stone-600 truncate italic">
                      "{c.lastMessage}"
                    </p>

                    <span className="text-[9px] text-stone-400 font-mono self-end">
                      {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Active Chat Room Window (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-stone-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden">
          
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-stone-400 space-y-3">
              <Headphones className="w-12 h-12 text-stone-300" />
              <p className="text-sm font-medium">Select a customer from the left list to view and manage live chat.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-stone-200 bg-stone-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-stone-900">
                      {selectedChat.userName}
                    </h3>
                    <span className="text-xs text-stone-500 font-mono">
                      ({selectedChat.userPhone})
                    </span>
                  </div>

                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                    Session Started: {new Date(selectedChat.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedChat.userPhone}`}
                    className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-lg border border-stone-300 flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${selectedChat.userPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {selectedChat.status === 'pending' && (
                    <button
                      type="button"
                      onClick={handleAccept}
                      className="px-3.5 py-1.5 bg-[#6B1F2A] hover:bg-[#521720] text-white font-bold text-xs uppercase rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>ACCEPT CHAT</span>
                    </button>
                  )}

                  {selectedChat.status === 'active' && (
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>CLOSE CHAT</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Status Notice */}
              {selectedChat.status === 'pending' && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-900 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Click <strong>"ACCEPT CHAT"</strong> to begin responding to this customer in real-time.</span>
                </div>
              )}

              {/* Messenger Messages Stream (Light Soft Cream Background) */}
              <div className="flex-1 p-4 bg-[#FAF7F2] overflow-y-auto space-y-3.5 min-h-[300px] max-h-[420px]">
                {messages.map((m) => {
                  const isAdmin = m.sender === 'admin';
                  const isSystem = m.sender === 'system';

                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center my-2">
                        <span className="text-[10px] text-stone-600 bg-stone-200/80 border border-stone-300 px-3 py-1 rounded-full text-center max-w-sm font-mono">
                          {m.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={m.id} 
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <span className="text-[9px] text-stone-400 px-1 font-mono">
                        {m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <div 
                        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isAdmin 
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

              {/* Admin Input Box */}
              <form 
                onSubmit={handleAdminSend}
                className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0 shadow-md"
              >
                <input
                  type="text"
                  placeholder={
                    selectedChat.status === 'pending'
                      ? 'Please click "ACCEPT CHAT" to start responding...'
                      : selectedChat.status === 'closed'
                      ? 'This chat session is closed'
                      : 'Type admin reply to customer...'
                  }
                  disabled={selectedChat.status !== 'active' || isSending}
                  value={adminInput}
                  onChange={(e) => setAdminInput(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-200 focus:border-[#6B1F2A] text-stone-900 text-xs rounded-full px-4 py-2.5 outline-none transition-colors disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={selectedChat.status !== 'active' || !adminInput.trim() || isSending}
                  className="px-4 py-2.5 bg-[#6B1F2A] hover:bg-[#521720] active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all disabled:opacity-40 cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>

            </>
          )}

        </div>

      </div>

    </div>
  );
}
