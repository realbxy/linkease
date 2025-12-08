'use client';

import { useState, useEffect, useRef } from 'react';
import { loadProfile, Profile } from '../utils/profileStorage';

interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: Date;
}

const EMOJI_SHORTCUTS = ['😂', '🔥', '💀', '✨', '🎯', '🚀', '❤️', '👀', '🎉', '💯', '🙏', '😭', '🤔', '👏', '🍕', '🌙', '⚡', '🔔'];
const CHAT_STORAGE_KEY = 'livechat_messages_v1';

export function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load profile and messages on mount
  useEffect(() => {
    setProfile(loadProfile());
    loadMessagesFromStorage();
  }, []);

  // Load messages from localStorage
  const loadMessagesFromStorage = () => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<ChatMessage & { timestamp: string }>;
        setMessages(
          parsed.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      }
    } catch (e) {
      console.error('Failed to load messages from storage', e);
    }
  };

  // Save messages to localStorage
  const saveMessagesToStorage = (msgs: ChatMessage[]) => {
    try {
      const toStore = msgs.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }));
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.error('Failed to save messages to storage', e);
    }
  };

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // When opening the chat, ensure we start scrolled to the most recent messages
  useEffect(() => {
    if (isExpanded) {
      // wait for DOM to layout
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          const el = messagesContainerRef.current;
          el.scrollTop = el.scrollHeight;
        } else if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      });
    }
  }, [isExpanded]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !profile) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      username: profile.username,
      avatar: profile.avatar,
      message: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, newMessage];
      const sliced = updated.slice(Math.max(0, updated.length - 100));
      saveMessagesToStorage(sliced);
      return sliced;
    });

    setInputValue('');
    
    // Focus back on input for better UX
    setTimeout(() => {
      const input = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
      if (input) input.focus();
    }, 0);
  };

  const addEmojiToMessage = (emoji: string) => {
    setInputValue((prev) => prev + ' ' + emoji);
  };

  const handleEmojiClick = (e: React.MouseEvent<HTMLButtonElement>, emoji: string) => {
    e.preventDefault();
    e.stopPropagation();
    addEmojiToMessage(emoji);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!profile) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans pointer-events-auto">
      {/* Chat Box */}
      <div
        className={`
          relative z-50 bg-[rgba(6,6,7,0.98)] border border-white/8 rounded-2xl 
          shadow-[0_25px_80px_rgba(0,0,0,0.9)] backdrop-blur-sm
          transition-all duration-300 overflow-hidden
          ${isExpanded ? 'w-96 h-[520px]' : 'w-72 h-auto'}
        `}
      >
        {/* Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-black/40 border-b border-white/8
            px-4 py-3 cursor-pointer hover:bg-black/50 
            transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60" />
            <span className="text-sm font-semibold text-white">Messages</span>
          </div>
          <svg
            className={`w-5 h-5 text-white/70 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>

        {/* Messages Container */}
        {isExpanded && (
          <>
            <div ref={messagesContainerRef} className="h-80 overflow-y-auto flex flex-col gap-3 p-4 bg-black/20 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/40">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  Start a conversation...
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex gap-3 group hover:bg-white/5 rounded-lg p-2 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <img
                          src={msg.avatar}
                          alt={msg.username}
                          className="w-10 h-10 rounded-full border border-white/20 object-cover"
                        />
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-white">
                            {msg.username}
                          </span>
                          <span className="text-xs text-gray-600 group-hover:text-gray-500">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-200 break-words leading-relaxed mt-1">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/8 p-3 bg-black/40">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  disabled={!inputValue.trim()}
                  className="relative z-50 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-lg px-3 py-2 transition-all flex items-center justify-center active:scale-95"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16151496 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.98796573 L3.03521743,10.4289588 C3.03521743,10.5860561 3.19218622,10.7431535 3.50612381,10.7431535 L16.6915026,11.5286404 C16.6915026,11.5286404 17.1624089,11.5286404 17.1624089,12.0000501 C17.1624089,12.4714598 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
                  </svg>
                </button>
              </div>

              {/* Emoji Shortcuts */}
              <div className="grid grid-cols-9 gap-1">
                {EMOJI_SHORTCUTS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleEmojiClick(e, emoji);
                    }}
                    className="relative z-50 w-full aspect-square bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
                    title={`Add ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Collapsed Preview */}
        {!isExpanded && messages.length > 0 && (
          <div className="px-4 py-3 bg-black/30 cursor-pointer hover:bg-black/40 transition-colors">
            <div className="flex gap-3 items-start">
              <img
                src={messages[messages.length - 1].avatar}
                alt="latest"
                className="w-10 h-10 rounded-full border border-white/20 object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {messages[messages.length - 1].username}
                </p>
                <p className="text-sm text-gray-400 truncate line-clamp-2">
                  {messages[messages.length - 1].message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Count Badge */}
      {messages.length > 0 && (
        <div className="mt-3 text-xs text-gray-500 ml-1">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
