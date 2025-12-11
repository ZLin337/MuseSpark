import React, { useState, useEffect, useRef } from 'react';
import { TEXTS, PLACEHOLDER_AVATAR } from './constants';
import { Message, Language, AppView, InspirationNote, SavedInspiration, ChatSession, Attachment } from './types';
import { chatWithGemini, analyzeAndGenerateNote, translateNoteContent } from './services/geminiService';
import MindMap from './components/MindMap';
import Memo from './components/Memo';
import InspirationNoteView from './components/InspirationNote';

// Icons
const IconMenu = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>;
const IconSend = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconSparkles = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>;
const IconBrain = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>;
const IconFileText = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconFolder = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
const IconImage = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const IconCrown = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>;

const App = () => {
  // --- State ---
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<AppView>('home');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Data persistence
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [savedInspirations, setSavedInspirations] = useState<SavedInspiration[]>([]);
  
  // UI Interaction
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const [isTyping, setIsTyping] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Temporary state for generated note review flow
  const [pendingNote, setPendingNote] = useState<InspirationNote | null>(null);
  
  // Tools Visibility
  const [showMindMap, setShowMindMap] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [toolFullScreen, setToolFullScreen] = useState(false);

  // Tools Viewer (Read/Edit for Saved Inspirations)
  const [viewerData, setViewerData] = useState<{ type: 'mindMap' | 'memo', data: any } | null>(null);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TEXTS[lang];

  // Derived State
  const activeSession = sessions.find(s => s.id === currentSessionId);
  const activeMessages = activeSession?.messages || [];
  
  // --- Effects ---
  useEffect(() => {
    const loadedSessions = localStorage.getItem('museSparkSessions');
    const loadedSaved = localStorage.getItem('museSparkSaved');
    if (loadedSessions) setSessions(JSON.parse(loadedSessions));
    if (loadedSaved) setSavedInspirations(JSON.parse(loadedSaved));
  }, []);

  useEffect(() => {
    localStorage.setItem('museSparkSessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('museSparkSaved', JSON.stringify(savedInspirations));
  }, [savedInspirations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, isTyping]);

  // Language Change & Content Translation
  const handleLanguageChange = async (newLang: Language) => {
    setLang(newLang);
    // Trigger translation of currently visible generated content
    if (view === 'note_review' && pendingNote) {
       setIsTranslating(true);
       const translated = await translateNoteContent(pendingNote, newLang);
       if (translated) setPendingNote(translated);
       setIsTranslating(false);
    }
  };

  // --- Handlers ---
  
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `${t.startChat} ${sessions.length + 1}`,
      messages: [],
      mindMap: { 
        nodes: [{ id: 'root', x: 250, y: 250, label: 'Central Idea', type: 'root' }],
        edges: []
      },
      memo: "",
      lastUpdated: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setActiveSavedId(null);
    setView('chat');
    setPendingNote(null);
    setViewerData(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const updateCurrentSession = (updates: Partial<ChatSession>) => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, ...updates, lastUpdated: Date.now() } : s));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         setAttachment({
           mimeType: file.type,
           data: (reader.result as string).split(',')[1] // base64
         });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachment) || !currentSessionId) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachment: attachment,
      timestamp: Date.now()
    };

    const updatedMessages = [...(activeSession?.messages || []), newMessage];
    
    updateCurrentSession({ 
      messages: updatedMessages,
      title: updatedMessages.length === 1 ? (input ? input.slice(0, 20) : "Image Chat") + "..." : activeSession?.title 
    });
    
    setInput('');
    setAttachment(undefined);
    setIsTyping(true);
    
    // Call Gemini
    const responseText = await chatWithGemini(updatedMessages.slice(0, -1), newMessage, lang);
    
    const reply: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: responseText || "System Error",
      timestamp: Date.now()
    };
    
    updateCurrentSession({ messages: [...updatedMessages, reply] });
    setIsTyping(false);
  };

  const handleGenerateNote = async () => {
    if (!activeSession) return;
    setIsTyping(true);
    const context = activeMessages.map(m => `${m.role}: ${m.content}`).join('\n');
    const note = await analyzeAndGenerateNote(context, lang);
    
    setIsTyping(false);
    if (note) {
      setPendingNote(note);
      setView('note_review');
    } else {
      alert("Could not generate plan. Please try again or add more details.");
    }
  };

  const handleSaveNote = () => {
    if (!pendingNote || !currentSessionId || !activeSession) return;
    
    const newEntry: SavedInspiration = {
      id: Date.now().toString(),
      sessionId: currentSessionId,
      title: pendingNote.project.summary,
      date: new Date().toLocaleDateString(),
      note: pendingNote,
      mindMapSnapshot: activeSession.mindMap,
      memoSnapshot: activeSession.memo
    };
    
    setSavedInspirations(prev => [newEntry, ...prev]);
    setView('my_inspirations');
    setPendingNote(null);
  };

  const handleUpdateSavedNote = (updatedNote: InspirationNote) => {
    if (!activeSavedId) return;
    
    setSavedInspirations(prev => prev.map(item => 
      item.id === activeSavedId 
        ? { ...item, note: updatedNote, title: updatedNote.project.summary } 
        : item
    ));
    // Also update pendingNote to reflect changes in UI
    setPendingNote(updatedNote);
  };

  const handleDeleteSaved = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if(confirm("Are you sure you want to delete this inspiration?")) {
      setSavedInspirations(prev => prev.filter(i => i.id !== id));
      if (view === 'note_review' && activeSavedId === id) {
        setView('my_inspirations');
        setPendingNote(null);
        setActiveSavedId(null);
      }
    }
  };

  const openSavedInspiration = (item: SavedInspiration) => {
    setActiveSavedId(item.id);
    setPendingNote(item.note);
    setView('note_review');
  };

  // --- Render Sections ---

  const renderSidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex flex-col shrink-0`}>
      <div className="p-6 flex items-center gap-3 font-bold text-white text-xl cursor-pointer" onClick={() => setView('home')}>
        <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <IconSparkles />
        </div>
        {t.appTitle}
      </div>
      
      <div className="px-4 mb-2">
        <button 
          onClick={createNewSession}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-lg shadow-indigo-900/20"
        >
          <span>+</span> {t.startChat}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1 mt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">{t.history}</div>
        {sessions.length === 0 && <div className="text-sm text-slate-600 px-2 italic">{t.emptyHistory}</div>}
        {sessions.map(s => (
          <button 
            key={s.id}
            onClick={() => {
              setCurrentSessionId(s.id);
              setView('chat');
              setActiveSavedId(null);
              setPendingNote(null);
              setViewerData(null);
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={`w-full text-left p-3 rounded-lg truncate text-sm transition-all flex flex-col ${currentSessionId === s.id && view === 'chat' ? 'bg-slate-800 text-white shadow-sm' : 'hover:bg-slate-800/50 text-slate-400'}`}
          >
            <span className="font-medium truncate">{s.title}</span>
            <span className="text-[10px] text-slate-500">{new Date(s.lastUpdated).toLocaleDateString()}</span>
          </button>
        ))}
      </nav>

      {/* Subscription & User */}
      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-900">
         <button 
           onClick={() => setShowSubModal(true)}
           className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 mb-2"
         >
           <IconCrown /> {t.subscribe}
         </button>

         <select 
            value={lang}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
         >
           <option value="en">English</option>
           <option value="zh">中文</option>
           <option value="es">Español</option>
           <option value="ja">日本語</option>
         </select>
         <button 
           onClick={() => setShowAuthModal(true)}
           className="flex items-center gap-2 w-full p-2 hover:bg-slate-800 rounded text-sm transition-colors"
         >
           <img src={PLACEHOLDER_AVATAR} className="w-6 h-6 rounded-full" alt="User" />
           <span>{t.login}</span>
         </button>
      </div>
    </aside>
  );

  const renderHeader = () => (
    <header className="h-16 border-b border-slate-100 flex items-center justify-between px-4 md:px-6 bg-white shrink-0 shadow-sm z-30">
      <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-600"><IconMenu /></button>
          <h2 className="font-semibold text-slate-700 truncate max-w-[150px] md:max-w-md">
            {isTranslating ? t.translating : (
              view === 'my_inspirations' ? t.myInspirations : 
              view === 'note_review' ? (activeSavedId ? t.update : t.generateNote) :
              activeSession?.title || t.appTitle
            )}
          </h2>
      </div>
      <div className="flex items-center gap-2">
        {/* Only show Tools toggle in Chat Mode */}
        {view === 'chat' && (
          <>
            <button 
              onClick={() => { setShowMindMap(!showMindMap); setShowMemo(false); setToolFullScreen(false); }}
              className={`p-2 rounded-lg transition-colors relative ${showMindMap ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
              title={t.mindMap}
            >
              <IconBrain />
            </button>
            <button 
              onClick={() => { setShowMemo(!showMemo); setShowMindMap(false); setToolFullScreen(false); }}
              className={`p-2 rounded-lg transition-colors ${showMemo ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-slate-100 text-slate-500'}`}
              title={t.memo}
            >
              <IconFileText />
            </button>
          </>
        )}

        <div className="h-6 w-px bg-slate-200 mx-2"></div>

        <button 
           onClick={() => { setView('my_inspirations'); setViewerData(null); setActiveSavedId(null); }}
           className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'my_inspirations' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}
        >
           <IconFolder /> <span className="hidden sm:inline">{t.myInspirations}</span>
        </button>
      </div>
    </header>
  );

  const renderToolsPanel = () => {
    if ((!showMindMap && !showMemo) || !activeSession || view !== 'chat') return null;
    
    const isMobile = window.innerWidth < 1024;
    const panelClasses = toolFullScreen 
      ? 'fixed inset-0 z-50 bg-white p-4'
      : `w-full lg:w-96 border-l border-slate-200 bg-white flex flex-col shadow-xl z-20 ${isMobile ? 'fixed inset-y-0 right-0 max-w-[90vw]' : ''}`;

    return (
      <div className={panelClasses}>
        <div className="flex justify-between items-center mb-2 px-2 pt-2 lg:hidden">
          <span className="font-bold text-slate-500">{showMindMap ? t.mindMap : t.memo}</span>
          <button onClick={() => {setShowMindMap(false); setShowMemo(false)}} className="p-2 text-slate-400">✕</button>
        </div>
        
        <div className="flex-1 overflow-hidden p-2 lg:p-4 bg-slate-50 h-full">
          {showMindMap && (
            <MindMap 
              lang={lang} 
              texts={t} 
              data={activeSession.mindMap}
              onUpdate={(newData) => updateCurrentSession({ mindMap: newData })}
              isFullScreen={toolFullScreen}
              onToggleFullScreen={() => setToolFullScreen(!toolFullScreen)}
            />
          )}
          {showMemo && (
             <Memo 
               content={activeSession.memo}
               onChange={(val) => updateCurrentSession({ memo: val })}
               texts={t}
               isFullScreen={toolFullScreen}
               onToggleFullScreen={() => setToolFullScreen(!toolFullScreen)}
             />
          )}
        </div>
      </div>
    );
  };

  const renderViewerModal = () => {
    if (!viewerData) return null;
    
    // Support Editing Saved Data
    const handleSaveSnapshot = (newData: any) => {
       if (!activeSavedId) return;
       const update = viewerData.type === 'mindMap' ? { mindMapSnapshot: newData } : { memoSnapshot: newData };
       setSavedInspirations(prev => prev.map(s => s.id === activeSavedId ? { ...s, ...update } : s));
    };

    return (
      <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl w-full max-w-5xl h-[85vh] flex flex-col relative shadow-2xl overflow-hidden animate-fade-in">
           <div className="flex justify-between items-center p-4 border-b border-slate-100">
             <h3 className="font-bold text-slate-700 flex items-center gap-2">
               {viewerData.type === 'mindMap' ? <IconBrain /> : <IconFileText />}
               {viewerData.type === 'mindMap' ? t.viewMindMap : t.viewMemo}
             </h3>
             <button onClick={() => setViewerData(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">✕</button>
           </div>
           <div className="flex-1 p-4 bg-slate-50 overflow-hidden">
             {viewerData.type === 'mindMap' ? (
                <MindMap 
                  lang={lang} texts={t} 
                  data={viewerData.data} 
                  onUpdate={(d) => {
                    // Update local view state to reflect drag immediately
                    setViewerData({ ...viewerData, data: d });
                    // Persist to saved
                    handleSaveSnapshot(d);
                  }} 
                  isFullScreen={false} 
                  onToggleFullScreen={() => {}} 
                  readOnly={!activeSavedId} // Read only if not a saved item (shouldn't happen in this flow)
                />
             ) : (
                <Memo 
                   content={viewerData.data} 
                   onChange={(v) => {
                     setViewerData({ ...viewerData, data: v });
                     handleSaveSnapshot(v);
                   }} 
                   texts={t} 
                   isFullScreen={false} 
                   onToggleFullScreen={() => {}} 
                   readOnly={!activeSavedId} 
                />
             )}
           </div>
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
       {/* Messages */}
       <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth" ref={scrollRef}>
          {activeMessages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                 <IconSparkles />
               </div>
               <p className="text-sm font-medium">{t.placeholder}</p>
             </div>
          )}
          {activeMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm leading-relaxed whitespace-pre-wrap ${
                 msg.role === 'user' 
                 ? 'bg-slate-900 text-white rounded-br-none' 
                 : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
               }`}>
                 {msg.attachment && (
                   <div className="mb-2">
                     <img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} className="max-h-60 rounded-lg border border-white/20" alt="attachment" />
                   </div>
                 )}
                 {msg.content}
               </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none flex gap-1 items-center">
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
               </div>
             </div>
          )}
       </div>

       {/* Input Area */}
       <div className="p-4 bg-white border-t border-slate-100 shrink-0 z-20">
          {attachment && (
            <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 w-fit">
              <img src={`data:${attachment.mimeType};base64,${attachment.data}`} className="h-10 w-10 object-cover rounded" />
              <button onClick={() => setAttachment(undefined)} className="text-slate-400 hover:text-red-500">✕</button>
            </div>
          )}
          <div className="max-w-4xl mx-auto relative flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors"
              title={t.uploadImage}
            >
              <IconImage />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect}
            />
            <input 
              type="text" 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              placeholder={t.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isTyping}
            />
            <button 
              onClick={handleSendMessage}
              disabled={(!input.trim() && !attachment) || isTyping}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200"
            >
              <IconSend />
            </button>
            {activeMessages.length > 2 && (
              <button 
                onClick={handleGenerateNote}
                disabled={isTyping}
                className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 hover:-translate-y-1 transition-transform animate-fade-in"
              >
                <IconSparkles /> {t.generateNote}
              </button>
            )}
          </div>
       </div>
    </div>
  );

  const renderMyInspirations = () => (
    <div className="flex-1 bg-slate-50 p-6 md:p-8 overflow-y-auto">
       <div className="max-w-6xl mx-auto">
         <div className="flex justify-between items-end mb-8">
           <div>
             <h1 className="text-3xl font-bold text-slate-800 mb-2">{t.myInspirations}</h1>
             <p className="text-slate-500">Your collection of refined ideas and business plans.</p>
           </div>
         </div>
         
         {savedInspirations.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="text-slate-300 mb-4 flex justify-center"><IconFolder /></div>
              <p className="text-slate-500 font-medium">{t.emptyInspirations}</p>
              <button onClick={createNewSession} className="mt-4 text-indigo-600 font-bold hover:underline">{t.startChat}</button>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedInspirations.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => openSavedInspiration(item)}
                  className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer border border-slate-100 group relative"
                >
                   <button 
                     onClick={(e) => handleDeleteSaved(item.id, e)} 
                     className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                     title={t.delete}
                   >
                     ✕
                   </button>
                   <div className="text-xs font-bold text-indigo-500 mb-2 uppercase tracking-wide">{item.date}</div>
                   <h3 className="text-xl font-bold text-slate-800 mb-3 line-clamp-2">{item.title}</h3>
                   <p className="text-slate-500 text-sm line-clamp-3 mb-4">{item.note.project.details}</p>
                   <div className="flex gap-2 mt-auto">
                      {item.note.project.tags.slice(0,2).map(tag => (
                        <span key={tag} className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600">{tag}</span>
                      ))}
                   </div>
                   {/* Quick Actions */}
                   <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveSavedId(item.id); setViewerData({ type: 'mindMap', data: item.mindMapSnapshot }) }}
                        className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <IconBrain /> {t.mindMap}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveSavedId(item.id); setViewerData({ type: 'memo', data: item.memoSnapshot }) }}
                        className="flex-1 py-2 bg-yellow-50 text-yellow-600 rounded text-xs font-bold hover:bg-yellow-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <IconFileText /> {t.memo}
                      </button>
                   </div>
                </div>
              ))}
           </div>
         )}
       </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {renderSidebar()}
      
      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col relative transition-all duration-300 ${isSidebarOpen ? 'translate-x-64' : ''} md:translate-x-0 h-full`}>
         {renderHeader()}
         
         <div className="flex-1 flex overflow-hidden relative">
            {view === 'home' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center animate-fade-in">
                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-400 to-purple-400 rounded-3xl shadow-2xl flex items-center justify-center mb-8 rotate-3">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 mb-4 tracking-tight">{t.welcome}</h1>
                <p className="text-lg text-slate-500 mb-8 max-w-lg leading-relaxed">
                  Collaborate with AI to refine your ideas, visualize structure, and generate professional execution plans.
                </p>
                <button 
                  onClick={createNewSession}
                  className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  {t.startChat} →
                </button>
              </div>
            )}

            {view === 'chat' && (
              <>
                {renderChat()}
                {renderToolsPanel()}
              </>
            )}

            {view === 'note_review' && pendingNote && (
               <div className="flex-1 h-full overflow-hidden">
                 <InspirationNoteView 
                   note={pendingNote} 
                   texts={t} 
                   onSatisfied={handleSaveNote}
                   onDissatisfied={() => setView('chat')}
                   isSavedMode={!!activeSavedId} 
                   onBackToList={() => { setView('my_inspirations'); setActiveSavedId(null); setPendingNote(null); }}
                   onDelete={() => activeSavedId && handleDeleteSaved(activeSavedId)}
                   onUpdate={handleUpdateSavedNote}
                   onViewMindMap={
                     () => {
                        const saved = savedInspirations.find(i => i.id === activeSavedId);
                        if(saved) setViewerData({ type: 'mindMap', data: saved.mindMapSnapshot });
                        else if(activeSession) { setShowMindMap(true); setView('chat'); }
                     }
                   }
                   onViewMemo={
                      () => {
                        const saved = savedInspirations.find(i => i.id === activeSavedId);
                        if(saved) setViewerData({ type: 'memo', data: saved.memoSnapshot });
                        else if(activeSession) { setShowMemo(true); setView('chat'); }
                     }
                   }
                 />
               </div>
            )}

            {view === 'my_inspirations' && renderMyInspirations()}
         </div>
      </main>

      {/* Overlays */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
      {renderViewerModal()}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
              <h2 className="text-2xl font-bold mb-2 text-slate-800">{t.login}</h2>
              <p className="text-slate-500 mb-6">{t.loginDesc}</p>
              <div className="space-y-4">
                 <input type="email" placeholder={t.email} className="w-full border p-3 rounded-lg" />
                 <input type="password" placeholder={t.password} className="w-full border p-3 rounded-lg" />
                 <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold">{t.signIn}</button>
              </div>
           </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative text-center">
              <button onClick={() => setShowSubModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                <IconCrown />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-800">{t.subscribeModalTitle}</h2>
              <p className="text-slate-500 mb-6">{t.subscriptionDesc}</p>
              <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold shadow-lg shadow-slate-900/20">{t.subscribeBtn}</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;