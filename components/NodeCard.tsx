
import React, { useState, useRef, useEffect } from 'react';
import { Node, ChatMessage } from '../types';

interface NodeCardProps {
  node: Node;
  isEditing: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onStartConnection: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onDelete: () => void;
  onDoubleClick: () => void;
  onUpdate: (data: Partial<Node>) => void;
  onCancelEdit: () => void;
  onSendMessage?: (nodeId: string, text: string) => Promise<void>;
  isAiLoading?: boolean;
}

const NodeCard: React.FC<NodeCardProps> = ({ 
  node, 
  isEditing, 
  onMouseDown, 
  onStartConnection, 
  onMouseUp, 
  onDelete, 
  onDoubleClick,
  onUpdate,
  onCancelEdit,
  onSendMessage,
  isAiLoading
}) => {
  const [editTitle, setEditTitle] = useState(node.title);
  const [editContent, setEditContent] = useState(node.content);
  const [editUrl, setEditUrl] = useState(node.metadata?.url || '');
  const [chatInput, setChatInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [node.metadata?.messages, isAiLoading]);

  useEffect(() => {
    setEditTitle(node.title);
    setEditContent(node.content);
    setEditUrl(node.metadata?.url || '');
  }, [node]);

  const extractYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    let updatedMetadata = { ...node.metadata };
    let finalTitle = editTitle;

    if (node.type === 'website' || node.type === 'youtube') {
      let url = editUrl.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      updatedMetadata.url = url;

      if (node.type === 'youtube') {
        const videoId = extractYoutubeId(url);
        updatedMetadata.videoId = videoId || undefined;
      }

      if ((editTitle === 'New Website' || editTitle === 'New Video' || editTitle === 'youtube.com' || editTitle === 'New Concept') && url) {
        try {
          const urlObj = new URL(url);
          let hostname = urlObj.hostname.replace('www.', '');
          if (hostname.includes('youtube.com')) hostname = 'YouTube';
          else hostname = hostname.charAt(0).toUpperCase() + hostname.slice(1);
          finalTitle = hostname;
        } catch {}
      }
    }

    onUpdate({ 
      title: finalTitle, 
      content: editContent,
      metadata: updatedMetadata
    });
  };

  const handleNewConversation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentMessages = node.metadata?.messages || [];
    if (currentMessages.length === 0) return;

    const currentHistory = node.metadata?.history || [];
    onUpdate({
      metadata: {
        ...node.metadata,
        messages: [],
        history: [...currentHistory, currentMessages]
      }
    });
  };

  const isChat = node.type === 'chat';
  const isGroup = node.type === 'group';
  const hasUrlField = node.type === 'website' || node.type === 'youtube';

  const renderMediaPreview = () => {
    if (node.type === 'youtube') {
      const videoId = node.metadata?.videoId;
      if (!videoId) return (
        <div className="mt-2 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Double-click to paste video link</p>
        </div>
      );
      const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
      return (
        <div className="mt-2 space-y-3">
          <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-slate-100 shadow-sm relative">
            <iframe 
              width="100%" 
              height="100%" 
              src={embedUrl}
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="pointer-events-auto"
            />
          </div>
          <a 
            href={node.metadata?.url} 
            target="_blank" 
            rel="noopener noreferrer"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all pointer-events-auto shadow-sm active:scale-95"
          >
            <span>Open in YouTube</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
      );
    }
    if (node.type === 'photo' && node.metadata?.thumbnail) {
      return (
        <div className="mt-2 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
          <img src={node.metadata.thumbnail} alt={node.title} className="w-full object-cover max-h-48" />
        </div>
      );
    }
    if (node.type === 'website' && node.metadata?.url) {
      return (
        <div className="mt-2">
          <a 
            href={node.metadata.url} 
            target="_blank" 
            rel="noopener noreferrer"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 overflow-hidden hover:bg-indigo-50 hover:border-indigo-100 transition-all group/link pointer-events-auto shadow-sm active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl group-hover/link:scale-110 transition-transform">🌐</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Visit Website</p>
              <p className="text-xs text-slate-500 truncate font-semibold">{node.metadata.url}</p>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover/link:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </a>
        </div>
      );
    }
    return null;
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiLoading || !onSendMessage) return;
    const text = chatInput;
    setChatInput('');
    await onSendMessage(node.id, text);
  };

  if (isChat) {
    const messages = node.metadata?.messages || [];
    const history = node.metadata?.history || [];
    return (
      <div 
        className={`absolute group select-none transition-all duration-300 z-30`}
        style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        <div className="relative w-full h-full bg-white rounded-[24px] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col pointer-events-auto">
          <div className="bg-[#f8faff] px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <h3 className="text-[13px] font-extrabold text-slate-800 uppercase tracking-widest">Assistant</h3>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/4 border-r border-slate-50 bg-slate-50/50 p-4 space-y-4 hidden md:flex flex-col">
              <button 
                onClick={handleNewConversation}
                className="w-full py-3 px-3 bg-white border border-indigo-100 rounded-xl text-[10px] font-extrabold text-indigo-600 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all uppercase tracking-wider"
              >
                + New Conversation
              </button>
              <div className="flex-1 overflow-y-auto space-y-2 py-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">History</p>
                {history.map((h, i) => (
                  <div key={i} className="p-2.5 bg-white/60 border border-slate-100 rounded-lg text-[10px] text-slate-500 font-semibold truncate hover:bg-white transition-colors cursor-default">
                    Session {i + 1}: {h[0]?.text.slice(0, 20)}...
                  </div>
                ))}
                {history.length === 0 && <p className="text-[10px] text-slate-300 font-medium italic px-1">No past sessions</p>}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                {/* Active Chat */}
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-8 opacity-60">
                    <span className="text-3xl mb-3">🧠</span>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Board Synthesis</p>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">Connect your research boxes or links to this chat to start a conversation about them.</p>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-5 py-3 rounded-[20px] text-[11px] font-medium leading-[1.6] shadow-sm ${
                      m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 border border-slate-100'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-[20px] flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                {/* History at the bottom */}
                {history.length > 0 && (
                  <div className="mt-12 space-y-8 border-t border-slate-50 pt-8">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-slate-100"></div>
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em]">Past Conversations</span>
                      <div className="flex-1 h-px bg-slate-100"></div>
                    </div>
                    {history.map((session, sIdx) => (
                      <div key={sIdx} className="space-y-4 opacity-50 hover:opacity-100 transition-opacity">
                        {session.map((m) => (
                          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-2 rounded-[18px] text-[10px] font-medium leading-[1.6] ${
                              m.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-slate-50 text-slate-400 border border-slate-100'
                            }`}>
                              {m.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-50 bg-slate-50/30" onMouseDown={e => e.stopPropagation()}>
                <div className="relative">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Message your research assistant..."
                    className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-5 pr-12 text-[11px] font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all placeholder:text-slate-400 shadow-sm"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div 
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-indigo-400 rounded-full cursor-crosshair hover:scale-125 transition-all flex items-center justify-center z-50 shadow-md opacity-0 group-hover:opacity-100"
            onMouseDown={onStartConnection}
          >
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isGroup) {
    return (
      <div 
        className={`absolute group select-none transition-all duration-300 ${isEditing ? 'z-40' : 'z-10'}`}
        style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onDoubleClick={onDoubleClick}
      >
        <div className="relative w-full h-full bg-slate-50/40 rounded-[20px] border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col pointer-events-auto">
          <div className="bg-[#1e293b] px-5 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <span className="text-sm">📦</span>
              {isEditing ? (
                <input 
                  autoFocus
                  className="bg-transparent border-none text-[11px] font-bold focus:ring-0 p-0 w-full text-white uppercase tracking-wider"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave(e)}
                />
              ) : (
                <h3 className="text-[11px] font-bold tracking-widest uppercase truncate max-w-[200px]">{node.title}</h3>
              )}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all text-xs"
            >✕</button>
          </div>
          <div className="flex-1 relative">
            <div 
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-slate-300 rounded-full cursor-crosshair hover:scale-125 transition-all flex items-center justify-center z-50 shadow-sm opacity-0 group-hover:opacity-100"
              onMouseDown={onStartConnection}
            >
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`absolute group cursor-grab active:cursor-grabbing select-none transition-all duration-200 ${isEditing ? 'z-40 scale-[1.02]' : 'z-20 hover:z-30'}`}
      style={{ 
        left: node.x, 
        top: node.y, 
        width: node.width,
        minHeight: node.height 
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
    >
      <div className={`relative w-full h-full bg-white rounded-[28px] border transition-all duration-500 overflow-hidden pointer-events-auto ${isEditing ? 'border-indigo-500 shadow-2xl ring-8 ring-indigo-50/40' : 'border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] group-hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] group-hover:border-slate-200'}`}>
        {isEditing ? (
          <form onSubmit={handleSave} className="p-7 flex flex-col gap-4" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{node.icon || '📝'}</span>
              <input 
                autoFocus
                className="text-lg font-extrabold w-full bg-transparent border-b-2 border-indigo-100 focus:border-indigo-500 pb-1.5 px-0 transition-all focus:outline-none text-slate-900 tracking-tight"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Node Title"
              />
            </div>
            
            {hasUrlField && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source URL</label>
                <input 
                  type="text"
                  placeholder="https://..."
                  className="text-[11px] font-bold w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all focus:outline-none text-slate-700"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annotation</label>
              <textarea 
                className="text-xs text-slate-600 w-full h-28 bg-transparent border-none p-0 focus:ring-0 resize-none transition-all focus:outline-none font-semibold leading-relaxed"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="What did you learn from this item?"
              />
            </div>

            <div className="flex gap-4 justify-end mt-2 pt-2 border-t border-slate-50">
              <button type="button" onClick={onCancelEdit} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">Discard</button>
              <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform">Update Node</button>
            </div>
          </form>
        ) : (
          <div className="p-7 flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                  {node.icon || '📝'}
                </div>
                <h3 className="text-base font-extrabold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors truncate pr-4 tracking-tight">{node.title}</h3>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >✕</button>
            </div>
            {renderMediaPreview()}
            <p className="mt-4 text-[11px] text-slate-500 whitespace-pre-wrap break-words leading-[1.6] font-semibold line-clamp-5">{node.content}</p>
          </div>
        )}
        {!isEditing && (
          <div 
            className="absolute -right-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-indigo-400 rounded-full cursor-crosshair hover:scale-150 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-50 shadow-md"
            onMouseDown={onStartConnection}
          >
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeCard;
