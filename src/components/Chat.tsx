"use client";
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Chat({ isOpen, onClose }: ChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  // const [isTyping, setIsTyping] = useState(false);
  // const [onlineUsers, setOnlineUsers] = useState(1234);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages
  useEffect(() => {
    if (isOpen) {
      const mockMessages: Message[] = [
        {
          id: '1',
          userId: '1',
          userName: 'Ana García',
          content: '¡Hola a todos! ¿Cómo van las votaciones? 👋',
          timestamp: new Date(Date.now() - 300000),
          isOwn: false,
        },
        {
          id: '2',
          userId: '2',
          userName: 'Carlos López',
          content: 'Muy reñida la votación esta semana 🔥',
          timestamp: new Date(Date.now() - 240000),
          isOwn: false,
        },
        {
          id: '3',
          userId: '3',
          userName: session?.user?.name || 'Tú',
          content: '¡Vamos que se puede! 💪',
          timestamp: new Date(Date.now() - 180000),
          isOwn: true,
        },
        {
          id: '4',
          userId: '4',
          userName: 'María Rodríguez',
          content: 'Los nominados están muy nerviosos 😅',
          timestamp: new Date(Date.now() - 120000),
          isOwn: false,
        },
      ];
      setMessages(mockMessages);
    }
  }, [isOpen, session]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !session) return;

    const message: Message = {
      id: Date.now().toString(),
      userId: 'current',
      userName: session.user?.name || 'Tú',
      content: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simular respuesta automática
    setTimeout(() => {
      const responses = [
        '¡Totalmente de acuerdo! 👍',
        'Interesante punto de vista 🤔',
        '¡Exacto! 💯',
        'No lo había pensado así 🧐',
        '¡Vamos a ver qué pasa! 🍿',
      ];
      
      const randomResponse: Message = {
        id: (Date.now() + 1).toString(),
        userId: 'bot',
        userName: 'Usuario' + Math.floor(Math.random() * 100),
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        isOwn: false,
      };
      
      setMessages(prev => [...prev, randomResponse]);
    }, 1000 + Math.random() * 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ←
          </button>
          <div>
            <h2 className="font-semibold text-foreground">💬 Casa Famosos 2025</h2>
            <p className="text-xs text-muted-foreground">
              🟢 1,234 usuarios activos
            </p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          ⚙️
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${message.isOwn ? 'order-2' : 'order-1'}`}>
              {!message.isOwn && (
                <p className="text-xs text-muted-foreground mb-1 px-2">
                  {message.userName}
                </p>
              )}
              <div
                className={`rounded-2xl px-4 py-2 ${
                  message.isOwn
                    ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground ml-2 glow'
                    : 'bg-card text-card-foreground mr-2 border border-border/20'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className={`text-xs mt-1 ${
                  message.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {formatTime(message.timestamp)}
                  {message.isOwn && (
                    <span className="ml-1">
                      ✓✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {false && (
          <div className="flex justify-start">
            <div className="bg-card text-card-foreground rounded-2xl px-4 py-2 mr-2 border border-border/20">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card/95 backdrop-blur border-t border-border/20 p-4">
        <div className="flex items-center space-x-3">
          <button className="text-muted-foreground hover:text-foreground">
            😊
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Escribe un mensaje..."
              className="w-full bg-input border border-border rounded-full px-4 py-2 pr-12 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              maxLength={500}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              <span className="text-primary-foreground text-sm">➤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 