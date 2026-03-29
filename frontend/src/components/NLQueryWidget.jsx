import { useState, useRef, useEffect } from 'react';
import { queryApi } from '../api';
import { MessageCircle, X, Send, Zap, User } from 'lucide-react';

export default function NLQueryWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m RouteIQ\'s logistics assistant. Ask me about courier SLA performance, carbon emissions, or dispatch recommendations.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await queryApi.ask(question, window.location.pathname);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I couldn\'t process your question. Please check that the Claude API key is configured and try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-slate-800 rotate-90'
            : 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow hover:scale-105'
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-slate-300" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Label */}
      {!isOpen && (
        <div className="fixed bottom-[88px] right-6 z-50 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-slate-700 whitespace-nowrap">
          Ask RouteIQ
        </div>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[520px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Ask RouteIQ</h3>
              <p className="text-[10px] text-slate-500">AI Logistics Assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-primary-500/15 flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="w-3 h-3 text-primary-400" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-md'
                    : 'bg-slate-800/80 text-slate-200 rounded-tl-md'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-md bg-primary-500/15 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-primary-400" />
                </div>
                <div className="bg-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-800/60">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about SLA, carbon, dispatch..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="input-field py-2.5 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="btn-primary px-3 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
