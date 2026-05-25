"use client";

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const renderMessageContent = (content: string) => {
  const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      return (
        <a
          key={index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-semibold"
        >
          {match[1]}
        </a>
      );
    }

    const urlParts = part.split(/(https?:\/\/[^\s]+)/g);
    return urlParts.map((urlPart, i) => {
      if (urlPart.match(/^https?:\/\//)) {
        return (
          <a
            key={`${index}-${i}`}
            href={urlPart}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {urlPart}
          </a>
        );
      }
      return <span key={`${index}-${i}`}>{urlPart}</span>;
    });
  });
};

export default function ChatbotWindow() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessionId, setSessionId] = useState('temp-session');

  useEffect(() => {
    const saved = localStorage.getItem('chatbot_session_id');
    if (saved) {
      setSessionId(saved);
    } else {
      const newId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chatbot_session_id', newId);
      setSessionId(newId);
    }
  }, []);

  const uid = "anonymous";

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (pathname?.startsWith('/account')) {
    return null;
  }

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CHATBOT_URL}/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_input: userMessage,
          session_id: sessionId,
          uid: uid
        })
      });

      const data = await response.json();

      if (data.response) {
        setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: "Xin lỗi, đã xảy ra lỗi khi kết nối với máy chủ." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Không thể kết nối đến Chatbot." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-80 sm:w-[350px] h-[500px] flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <h3 className="font-semibold text-lg">Snack Việt Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950">
            {messages.length === 0 && (
              <div className="text-center text-zinc-500 dark:text-zinc-400 mt-10">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Xin chào! Tôi có thể giúp gì cho bạn hôm nay?</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  msg.role === 'user' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "px-3 py-2 rounded-2xl text-sm",
                  msg.role === 'user'
                    ? "bg-orange-500 text-white rounded-tr-sm"
                    : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-tl-sm shadow-sm"
                )}>
                  <div className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 max-w-[85%] mr-auto">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-3 py-2 rounded-2xl text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-tl-sm shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  <span className="text-zinc-500">Đang trả lời...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {
        !isOpen && <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95",
            isOpen ? "bg-zinc-800 text-white" : "bg-orange-500 text-white hover:bg-orange-600"
          )}
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      }
    </div>
  );
}
