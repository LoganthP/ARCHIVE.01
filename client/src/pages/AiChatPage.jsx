import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { getChats, getChat, createChat, deleteChat, API_BASE_URL } from '../api/client';
import toast from 'react-hot-toast';

export default function AiChatPage() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const data = await getChats();
      setChats(data);
      if (data.length > 0 && !currentChatId) {
        loadChatDetails(data[0].id);
      }
    } catch (err) {
      toast.error('Failed to load chats');
    }
  };

  const loadChatDetails = async (id) => {
    try {
      const data = await getChat(id);
      setCurrentChatId(id);
      setMessages(data.messages || []);
    } catch (err) {
      toast.error('Failed to load chat details');
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await createChat('New Chat');
      setChats([newChat, ...chats]);
      setCurrentChatId(newChat.id);
      setMessages([]);
    } catch (err) {
      toast.error('Failed to create new chat');
    }
  };
  
  const handleDeleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteChat(id);
      setChats(chats.filter(c => c.id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
      }
      toast.success('Chat deleted');
    } catch (err) {
      toast.error('Failed to delete chat');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let chatId = currentChatId;
    if (!chatId) {
      try {
        const newChat = await createChat(input.substring(0, 30) + '...');
        setChats([newChat, ...chats]);
        chatId = newChat.id;
        setCurrentChatId(chatId);
      } catch (err) {
        toast.error('Failed to create chat');
        return;
      }
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Add temporary assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [], isStreaming: true }]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: userMessage.content }),
      });

      if (!response.ok) {
        // Try to extract a specific error message from the JSON body
        let errorMsg = `Server error (${response.status})`;
        try {
          const errBody = await response.json();
          errorMsg = errBody.error || errorMsg;
        } catch (_) { /* ignore parse errors */ }
        toast.error(errorMsg);
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.isStreaming) newMessages.pop();
          return newMessages;
        });
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunks = decoder.decode(value, { stream: true }).split('\n\n');
        
        for (const chunk of chunks) {
          if (!chunk.trim() || !chunk.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(chunk.substring(6));
            
            if (data.error) {
              toast.error(data.error);
              setIsLoading(false);
              return;
            }

            if (data.chunk) {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                newMessages[lastIdx] = { 
                  ...newMessages[lastIdx], 
                  content: newMessages[lastIdx].content + data.chunk 
                };
                return newMessages;
              });
            }

            if (data.done) {
               setMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                newMessages[lastIdx] = { 
                  ...newMessages[lastIdx], 
                  isStreaming: false,
                  sources: data.sources || [],
                  noContext: data.noContext || false
                };
                return newMessages;
              });
            }
          } catch (e) {
            console.error('Error parsing stream chunk:', e);
          }
        }
      }
    } catch (err) {
      console.error('Chat request error:', err);
      const errorMsg = err.message === 'Failed to fetch'
        ? 'Cannot connect to server. Is the backend running?'
        : `Chat error: ${err.message}`;
      toast.error(errorMsg);
      // Remove the temp streaming message on error if it's empty
       setMessages(prev => {
          const newMessages = [...prev];
          const lastIdx = newMessages.length - 1;
          if(newMessages[lastIdx].isStreaming && newMessages[lastIdx].content === '') {
             newMessages.pop();
          } else if(newMessages[lastIdx].isStreaming) {
             newMessages[lastIdx].isStreaming = false;
          }
          return newMessages;
       });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-gray-900 dark:text-on-surface">
            AI Chat <span className="text-secondary font-mono text-sm ml-2 px-2 py-1 bg-secondary/10 rounded">BETA</span>
          </h1>
          <p className="font-metadata text-metadata text-gray-600 dark:text-on-surface-variant mt-1">
            Retrieval-Augmented Generation (RAG) assistant for your research library
          </p>
        </div>
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="p-2 border border-outline dark:border-outline-variant rounded hover:bg-surface-container transition text-on-surface"
          title="Toggle Chat History"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 0' }}>
            {isHistoryOpen ? 'right_panel_close' : 'right_panel_open'}
          </span>
        </button>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-surface-container-low dark:bg-surface-container-lowest border border-outline dark:border-outline-variant rounded-lg overflow-hidden relative shadow-sm">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-on-surface-variant max-w-md mx-auto">
                <span className="material-symbols-outlined text-4xl mb-4 text-secondary/70">forum</span>
                <h3 className="text-lg font-bold text-on-surface mb-2">How can I help you research?</h3>
                <p className="text-sm">I can answer questions based on the papers in your library. Ask me to summarize findings, compare methods, or find specific claims.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded bg-secondary/20 flex items-center justify-center flex-shrink-0 text-secondary border border-secondary/30">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-surface-container-high dark:bg-surface-container-highest border border-outline dark:border-outline-variant text-on-surface rounded-2xl rounded-tr-sm px-4 py-3' : 'text-on-surface'}`}>
                    {msg.role === 'assistant' ? (
                       <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-surface-container-highest prose-pre:border prose-pre:border-outline-variant">
                         <ReactMarkdown>{msg.content}</ReactMarkdown>
                         {msg.isStreaming && <span className="inline-block w-2 h-4 bg-secondary ml-1 animate-pulse" />}
                       </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                    
                    {/* No-context notice */}
                    {msg.noContext && !msg.isStreaming && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container border border-outline-variant rounded px-3 py-2">
                        <span className="material-symbols-outlined text-sm text-amber-500">info</span>
                        <span>No research context found. Answered using general knowledge only.</span>
                      </div>
                    )}
                    {/* Sources section if present */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-outline dark:border-outline-variant">
                        <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Sources Consulted</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map(source => (
                             <div key={source.id} className="text-xs bg-surface-container border border-outline dark:border-outline-variant px-2 py-1 rounded flex items-center gap-1 max-w-xs truncate cursor-help" title={`${source.title} (${source.year || 'N/A'})`}>
                               <span className="material-symbols-outlined text-[10px] text-secondary">description</span>
                               <span className="truncate">[{source.id}] {source.title}</span>
                             </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-on-surface border border-outline-variant">
                      <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-outline dark:border-outline-variant bg-surface">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your research papers..."
                disabled={isLoading}
                className="flex-1 bg-background border border-outline dark:border-outline-variant rounded-md px-4 py-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-on-surface disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-secondary hover:bg-secondary/90 text-[#131313] px-6 py-3 rounded-md font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin" style={{ fontVariationSettings: '"FILL" 0' }}>sync</span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>send</span>
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <p className="text-xs text-on-surface-variant text-center mt-2 font-mono">
              Archive.01 Semantic Engine uses Groq Llama-3 and local FAISS vector search.
            </p>
          </div>
        </div>

        {/* History Panel */}
        {isHistoryOpen && (
          <div className="w-64 flex flex-col bg-surface-container-low dark:bg-surface-container-lowest border border-outline dark:border-outline-variant rounded-lg overflow-hidden shadow-sm flex-shrink-0 animate-in slide-in-from-right-8 duration-200">
            <div className="p-4 border-b border-outline dark:border-outline-variant flex justify-between items-center">
              <h2 className="font-bold text-on-surface">Recent Chats</h2>
              <button 
                onClick={handleNewChat}
                className="text-secondary hover:bg-secondary/10 p-1 rounded transition"
                title="New Chat"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-4 text-center text-sm text-on-surface-variant italic">No chat history</div>
              ) : (
                <ul className="divide-y divide-outline dark:divide-outline-variant/50">
                  {chats.map(chat => (
                    <li key={chat.id}>
                      <button
                        onClick={() => loadChatDetails(chat.id)}
                        className={`w-full text-left p-3 hover:bg-surface-container flex justify-between items-start group transition ${currentChatId === chat.id ? 'bg-surface-container border-l-2 border-secondary' : 'border-l-2 border-transparent'}`}
                      >
                        <div className="truncate pr-2 flex-1">
                          <p className="text-sm font-medium text-on-surface truncate">{chat.title || 'Untitled Chat'}</p>
                          <p className="text-xs text-on-surface-variant mt-1">{new Date(chat.created_at).toLocaleDateString()}</p>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                          className="opacity-0 group-hover:opacity-100 text-error hover:bg-error/10 p-1 rounded transition flex-shrink-0"
                          title="Delete Chat"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
