/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Live Customer Chat & Realtime Messaging Service
 */

import { db, isFirebaseConfigured } from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  where
} from 'firebase/firestore';

export interface ChatSession {
  id: string;
  userName: string;
  userPhone: string;
  status: 'pending' | 'active' | 'closed';
  lastMessage: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  acceptedBy?: string | null;
  closedAt?: string | null;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: 'customer' | 'admin' | 'system';
  senderName: string;
  text: string;
  createdAt: string; // ISO string
}

export interface PremadeOption {
  id: string;
  question: string;
  answer: string;
}

export const PREMADE_QUICK_QUESTIONS: PremadeOption[] = [
  {
    id: 'q1',
    question: "What are today's 22K & 24K Gold rates?",
    answer: "Hello! Today's indicative gold rates in Kolkata are ₹14,480/10g for 22K Gold and ₹15,790/10g for 24K Hallmarked Gold. Rates fluctuate with live bullion updates. How can we help with your purchase today?"
  },
  {
    id: 'q2',
    question: "Do you offer custom handcrafted jewellery design?",
    answer: "Yes, absolutely! Parasmoni Jewellers specializes in bespoke handcrafted Nakashi, Filigree, Antique & Bridal customized jewellery. Share your sketch or inspiration image with us!"
  },
  {
    id: 'q3',
    question: "Where is your physical showroom located?",
    answer: "Our flagship showroom is located at 124/1A Bowbazar Street, Kolkata 700012 (Near Central Metro Station). Open Monday - Saturday: 10:30 AM to 8:30 PM."
  },
  {
    id: 'q4',
    question: "How can I book a live video call shopping session?",
    answer: "You can book a live video call session directly with our senior jewellery consultant! Send us your preferred date & time, or call/WhatsApp us at +91 9051412413."
  },
  {
    id: 'q5',
    question: "What is your hallmark purity & return policy?",
    answer: "100% of our gold jewellery is BIS 916 Hallmarked and diamonds are IGI/GIA certified. We offer lifetime exchange guarantees and transparent net weight valuation."
  }
];

const CHAT_RETENTION_MS = 3 * 24 * 60 * 60 * 1000; // 3 Days in milliseconds (72 Hours)
const LOCAL_CHATS_KEY = 'parasmoni_local_chats_db';
const LOCAL_MESSAGES_KEY = 'parasmoni_local_chat_messages_db';

/**
 * 3-Day Auto Cleanup: Deletes chat sessions and messages older than 3 days
 */
export async function purgeExpiredChats(): Promise<void> {
  const now = Date.now();
  const cutoffTime = now - CHAT_RETENTION_MS;

  // 1. Purge from localStorage fallback DB
  try {
    const localChatsRaw = localStorage.getItem(LOCAL_CHATS_KEY);
    if (localChatsRaw) {
      const chats: ChatSession[] = JSON.parse(localChatsRaw);
      const validChats = chats.filter(c => new Date(c.createdAt).getTime() >= cutoffTime);
      localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(validChats));

      // Filter messages belonging to valid chats
      const validChatIds = new Set(validChats.map(c => c.id));
      const localMsgsRaw = localStorage.getItem(LOCAL_MESSAGES_KEY);
      if (localMsgsRaw) {
        const msgs: ChatMessage[] = JSON.parse(localMsgsRaw);
        const validMsgs = msgs.filter(m => validChatIds.has(m.chatId));
        localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(validMsgs));
      }
    }
  } catch (err) {
    console.warn('Local chat purge error:', err);
  }

  // 2. Purge from Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const chatsRef = collection(db, 'chats');
      const snapshot = await getDocs(chatsRef);
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const createdAtTime = new Date(data.createdAt || 0).getTime();
        
        if (createdAtTime < cutoffTime) {
          // Delete messages subcollection
          const msgsRef = collection(db, 'chats', docSnap.id, 'messages');
          const msgsSnap = await getDocs(msgsRef);
          for (const msgDoc of msgsSnap.docs) {
            await deleteDoc(msgDoc.ref);
          }
          // Delete main chat session doc
          await deleteDoc(docSnap.ref);
        }
      }
    } catch (err) {
      console.warn('Firestore expired chat cleanup error:', err);
    }
  }
}

/**
 * Get or create a customer chat session
 */
export async function getOrCreateCustomerChat(userName: string, userPhone: string): Promise<ChatSession> {
  await purgeExpiredChats();

  const chatId = `chat_${userPhone.replace(/[^0-9]/g, '')}`;
  const nowIso = new Date().toISOString();

  const initialSession: ChatSession = {
    id: chatId,
    userName,
    userPhone,
    status: 'pending', // Pending until admin accepts
    lastMessage: 'Customer initialized live support session',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  if (!isFirebaseConfigured || !db) {
    // Local storage fallback
    const localChatsRaw = localStorage.getItem(LOCAL_CHATS_KEY) || '[]';
    const chats: ChatSession[] = JSON.parse(localChatsRaw);
    const existing = chats.find(c => c.id === chatId);

    if (existing) {
      return existing;
    }

    chats.unshift(initialSession);
    localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats));

    // Welcome system message
    const systemMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      chatId,
      sender: 'system',
      senderName: 'Parasmoni Desk',
      text: `Namaste ${userName}! Your chat request has been received. Our showroom desk will connect with you shortly.`,
      createdAt: nowIso
    };
    const localMsgsRaw = localStorage.getItem(LOCAL_MESSAGES_KEY) || '[]';
    const msgs: ChatMessage[] = JSON.parse(localMsgsRaw);
    msgs.push(systemMsg);
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(msgs));

    return initialSession;
  }

  // Firestore path
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(chatDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as ChatSession;
    }

    await setDoc(chatDocRef, initialSession);

    // Add initial system message
    const systemMsgRef = doc(collection(db, 'chats', chatId, 'messages'));
    const systemMsg: ChatMessage = {
      id: systemMsgRef.id,
      chatId,
      sender: 'system',
      senderName: 'Parasmoni Desk',
      text: `Namaste ${userName}! Your chat request has been submitted to Parasmoni Showroom Desk. Please wait while an admin accepts your request.`,
      createdAt: nowIso
    };
    await setDoc(systemMsgRef, systemMsg);

    return initialSession;
  } catch (err) {
    console.warn('Error in getOrCreateCustomerChat:', err);
    return initialSession;
  }
}

/**
 * Real-time listener for chat messages
 */
export function subscribeToChatMessages(
  chatId: string, 
  callback: (messages: ChatMessage[]) => void
): () => void {
  if (!isFirebaseConfigured || !db) {
    // Local listener polling / Storage event listener
    const loadLocal = () => {
      const localMsgsRaw = localStorage.getItem(LOCAL_MESSAGES_KEY) || '[]';
      const msgs: ChatMessage[] = JSON.parse(localMsgsRaw);
      const filtered = msgs.filter(m => m.chatId === chatId);
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      callback(filtered);
    };

    loadLocal();
    const interval = setInterval(loadLocal, 1000);
    const handleStorage = () => loadLocal();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('parasmoni-chat-updated', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('parasmoni-chat-updated', handleStorage);
    };
  }

  // Firestore subscription
  const msgsRef = collection(db, 'chats', chatId, 'messages');
  const q = query(msgsRef, orderBy('createdAt', 'asc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items: ChatMessage[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as ChatMessage));
    callback(items);
  }, (err) => {
    console.warn('Chat messages snapshot error:', err);
  });

  return unsubscribe;
}

/**
 * Real-time listener for a single chat session document
 */
export function subscribeToChatSession(
  chatId: string, 
  callback: (session: ChatSession | null) => void
): () => void {
  if (!isFirebaseConfigured || !db) {
    const loadLocal = () => {
      const localChatsRaw = localStorage.getItem(LOCAL_CHATS_KEY) || '[]';
      const chats: ChatSession[] = JSON.parse(localChatsRaw);
      const found = chats.find(c => c.id === chatId) || null;
      callback(found);
    };

    loadLocal();
    const interval = setInterval(loadLocal, 1000);
    window.addEventListener('parasmoni-chat-updated', loadLocal);

    return () => {
      clearInterval(interval);
      window.removeEventListener('parasmoni-chat-updated', loadLocal);
    };
  }

  const chatDocRef = doc(db, 'chats', chatId);
  const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as ChatSession);
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn('Chat session snapshot error:', err);
  });

  return unsubscribe;
}

/**
 * Send a message from Customer
 */
export async function sendCustomerMessage(
  chatId: string, 
  senderName: string, 
  text: string,
  autoReplyAnswer?: string
): Promise<void> {
  const nowIso = new Date().toISOString();

  if (!isFirebaseConfigured || !db) {
    // Local storage fallback
    const localMsgsRaw = localStorage.getItem(LOCAL_MESSAGES_KEY) || '[]';
    const msgs: ChatMessage[] = JSON.parse(localMsgsRaw);

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      chatId,
      sender: 'customer',
      senderName,
      text,
      createdAt: nowIso
    };
    msgs.push(userMsg);

    if (autoReplyAnswer) {
      const autoMsg: ChatMessage = {
        id: `msg_${Date.now() + 10}`,
        chatId,
        sender: 'admin',
        senderName: 'Parasmoni AI Assistant',
        text: autoReplyAnswer,
        createdAt: new Date(Date.now() + 100).toISOString()
      };
      msgs.push(autoMsg);
    }

    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(msgs));

    // Update session
    const localChatsRaw = localStorage.getItem(LOCAL_CHATS_KEY) || '[]';
    const chats: ChatSession[] = JSON.parse(localChatsRaw);
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex >= 0) {
      chats[chatIndex].lastMessage = text;
      chats[chatIndex].updatedAt = nowIso;
      localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats));
    }

    window.dispatchEvent(new Event('parasmoni-chat-updated'));
    return;
  }

  // Firestore path
  try {
    const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
    const userMsg: ChatMessage = {
      id: msgRef.id,
      chatId,
      sender: 'customer',
      senderName,
      text,
      createdAt: nowIso
    };
    await setDoc(msgRef, userMsg);

    if (autoReplyAnswer) {
      const autoRef = doc(collection(db, 'chats', chatId, 'messages'));
      const autoMsg: ChatMessage = {
        id: autoRef.id,
        chatId,
        sender: 'admin',
        senderName: 'Parasmoni Showroom Desk',
        text: autoReplyAnswer,
        createdAt: new Date(Date.now() + 100).toISOString()
      };
      await setDoc(autoRef, autoMsg);
    }

    // Update parent session lastMessage & updatedAt
    const chatDocRef = doc(db, 'chats', chatId);
    await updateDoc(chatDocRef, {
      lastMessage: text,
      updatedAt: nowIso
    });
  } catch (err) {
    console.warn('Error sending customer message:', err);
  }
}

/**
 * Admin Panel: Subscribe to all customer chat sessions
 */
export function subscribeToAllChats(
  callback: (chats: ChatSession[]) => void
): () => void {
  purgeExpiredChats();

  if (!isFirebaseConfigured || !db) {
    const loadLocal = () => {
      const localChatsRaw = localStorage.getItem(LOCAL_CHATS_KEY) || '[]';
      const chats: ChatSession[] = JSON.parse(localChatsRaw);
      chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      callback(chats);
    };

    loadLocal();
    const interval = setInterval(loadLocal, 1000);
    window.addEventListener('parasmoni-chat-updated', loadLocal);

    return () => {
      clearInterval(interval);
      window.removeEventListener('parasmoni-chat-updated', loadLocal);
    };
  }

  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items: ChatSession[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as ChatSession));
    callback(items);
  }, (err) => {
    console.warn('All chats snapshot error:', err);
  });

  return unsubscribe;
}

/**
 * Admin Panel: Accept a pending chat
 */
export async function acceptChatSession(chatId: string, adminName: string = 'Admin Staff'): Promise<void> {
  const nowIso = new Date().toISOString();

  if (!isFirebaseConfigured || !db) {
    const localChatsRaw = localStorage.getItem(LOCAL_CHATS_KEY) || '[]';
    const chats: ChatSession[] = JSON.parse(localChatsRaw);
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex >= 0) {
      chats[chatIndex].status = 'active';
      chats[chatIndex].acceptedBy = adminName;
      chats[chatIndex].updatedAt = nowIso;
      localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats));
    }

    // Add system notification message
    const localMsgsRaw = localStorage.getItem(LOCAL_MESSAGES_KEY) || '[]';
    const msgs: ChatMessage[] = JSON.parse(localMsgsRaw);
    msgs.push({
      id: `msg_${Date.now()}`,
      chatId,
      sender: 'system',
      senderName: 'Parasmoni System',
      text: `Chat accepted by ${adminName}. You are now connected directly with our showroom team.`,
      createdAt: nowIso
    });
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(msgs));

    window.dispatchEvent(new Event('parasmoni-chat-updated'));
    return;
  }

  try {
    const chatDocRef = doc(db, 'chats', chatId);
    await updateDoc(chatDocRef, {
      status: 'active',
      acceptedBy: adminName,
      updatedAt: nowIso
    });

    const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
    await setDoc(msgRef, {
      id: msgRef.id,
      chatId,
      sender: 'system',
      senderName: 'Parasmoni System',
      text: `Chat request accepted by ${adminName}. You are now connected with live showroom staff.`,
      createdAt: nowIso
    });
  } catch (err) {
    console.warn('Error accepting chat session:', err);
  }
}

/**
 * Admin Panel: Close an active chat
 */
export async function closeChatSession(chatId: string): Promise<void> {
  const nowIso = new Date().toISOString();

  if (!isFirebaseConfigured || !db) {
    const localChatsRaw = localStorage.getItem(LOCAL_CHATS_KEY) || '[]';
    const chats: ChatSession[] = JSON.parse(localChatsRaw);
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex >= 0) {
      chats[chatIndex].status = 'closed';
      chats[chatIndex].closedAt = nowIso;
      chats[chatIndex].updatedAt = nowIso;
      localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats));
    }

    const localMsgsRaw = localStorage.getItem(LOCAL_MESSAGES_KEY) || '[]';
    const msgs: ChatMessage[] = JSON.parse(localMsgsRaw);
    msgs.push({
      id: `msg_${Date.now()}`,
      chatId,
      sender: 'system',
      senderName: 'Parasmoni System',
      text: 'This chat session has been closed by Showroom Staff. Thank you for contacting Parasmoni Jewellers!',
      createdAt: nowIso
    });
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(msgs));

    window.dispatchEvent(new Event('parasmoni-chat-updated'));
    return;
  }

  try {
    const chatDocRef = doc(db, 'chats', chatId);
    await updateDoc(chatDocRef, {
      status: 'closed',
      closedAt: nowIso,
      updatedAt: nowIso
    });

    const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
    await setDoc(msgRef, {
      id: msgRef.id,
      chatId,
      sender: 'system',
      senderName: 'Parasmoni System',
      text: 'This chat session has been closed by Showroom Staff. Thank you for contacting Parasmoni Jewellers!',
      createdAt: nowIso
    });
  } catch (err) {
    console.warn('Error closing chat session:', err);
  }
}

/**
 * Admin Panel: Send message to Customer
 */
export async function sendAdminMessage(
  chatId: string, 
  text: string, 
  adminName: string = 'Showroom Admin'
): Promise<void> {
  const nowIso = new Date().toISOString();

  if (!isFirebaseConfigured || !db) {
    const localMsgsRaw = localStorage.getItem(LOCAL_MESSAGES_KEY) || '[]';
    const msgs: ChatMessage[] = JSON.parse(localMsgsRaw);

    msgs.push({
      id: `msg_${Date.now()}`,
      chatId,
      sender: 'admin',
      senderName: adminName,
      text,
      createdAt: nowIso
    });
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(msgs));

    const localChatsRaw = localStorage.getItem(LOCAL_CHATS_KEY) || '[]';
    const chats: ChatSession[] = JSON.parse(localChatsRaw);
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex >= 0) {
      chats[chatIndex].lastMessage = text;
      chats[chatIndex].updatedAt = nowIso;
      localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats));
    }

    window.dispatchEvent(new Event('parasmoni-chat-updated'));
    return;
  }

  try {
    const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
    await setDoc(msgRef, {
      id: msgRef.id,
      chatId,
      sender: 'admin',
      senderName: adminName,
      text,
      createdAt: nowIso
    });

    const chatDocRef = doc(db, 'chats', chatId);
    await updateDoc(chatDocRef, {
      lastMessage: text,
      updatedAt: nowIso
    });
  } catch (err) {
    console.warn('Error sending admin message:', err);
  }
}
