import React, { useState, useEffect, useRef } from 'react';
import { TEXTS, PLACEHOLDER_AVATAR, STARTERS } from './constants';
import { Message, Language, AppView, InspirationNote, SavedInspiration, ChatSession, Attachment } from './types';
import { chatWithGemini, analyzeAndGenerateNote, translateNoteContent } from './services/geminiService';
import InspirationNoteView from './components/InspirationNote';

// Icons
const IconMenu = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>;
const IconSend = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconSparkles = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>;
const IconFolder = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
const IconImage = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const IconCrown = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;

const App = () => {
  // --- State ---
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<AppView>('home');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Data persistence
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [savedInspirations, setSavedInspirations] = useState<SavedInspiration[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // UI Interaction
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const [isTyping, setIsTyping] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Temporary state for generated note review flow
  const [pendingNote, setPendingNote] = useState<InspirationNote | null>(null);
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
    try {
      const loadedSessions = localStorage.getItem('museSparkSessions');
      const loadedSaved = localStorage.getItem('museSparkSaved');
      if (loadedSessions) setSessions(JSON.parse(loadedSessions));
      if (loadedSaved) setSavedInspirations(JSON.parse(loadedSaved));
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem('museSparkSessions', JSON.stringify(sessions));
  }, [sessions, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem('museSparkSaved', JSON.stringify(savedInspirations));
  }, [savedInspirations, isDataLoaded]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, isTyping, view]); 

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
  
  const createNewSession = async (initialPrompt?: string) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: initialPrompt 
        ? initialPrompt.slice(0, 30) + (initialPrompt.length > 30 ? '...' : '') 
        : `${t.startChat} ${sessions.length + 1}`,
      messages: [],
      lastUpdated: Date.now()
    };

    // If starting with a prompt, add it immediately to the session state
    if (initialPrompt) {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: initialPrompt,
        timestamp: Date.now()
      };
      newSession.messages.push(userMsg);
    }

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setActiveSavedId(null);
    setView('chat');
    setPendingNote(null);
    if (window.innerWidth < 768) setSidebarOpen(false);

    // If there was a prompt, trigger the API call immediately
    if (initialPrompt) {
      setIsTyping(true);
      // Construct the message object again for the API call to ensure valid ref
      const userMsg: Message = newSession.messages[0];
      
      const responseText = await chatWithGemini([], userMsg, lang);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText || "System Error",
        timestamp: Date.now()
      };

      // Update the specific session with the response
      setSessions(prev => prev.map(s => 
        s.id === newId 
          ? { ...s, messages: [...s.messages, modelMsg], lastUpdated: Date.now() } 
          : s
      ));
      setIsTyping(false);
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(t.deleteChatConfirm)) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setView('home');
      }
    }
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
    
    const activeSess = sessions.find(s => s.id === currentSessionId);
    if (!activeSess) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachment: attachment,
      timestamp: Date.now()
    };

    const updatedMessages = [...activeSess.messages, newMessage];
    
    // Optimistic Update
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { 
            ...s, 
            messages: updatedMessages, 
            title: s.messages.length === 0 ? (input ? input.slice(0, 30) : "Image Chat") + "..." : s.title,
            lastUpdated: Date.now() 
          } 
        : s
    ));
    
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
    
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...updatedMessages, reply] } 
        : s
    ));
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
      note: pendingNote
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
    setPendingNote(updatedNote);
  };

  const handleDeleteSaved = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.confirm(t.deleteInspirationConfirm)) {
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
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass-panel-dark text-slate-300 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex flex-col shrink-0`}>
      <div className="p-6 flex items-center gap-3 font-display font-bold text-white text-2xl cursor-pointer" onClick={() => { setView('home'); setCurrentSessionId(null); if (window.innerWidth < 768) setSidebarOpen(false); }}>
        <div className="w-10 h-10 bg-gradient-to-tr from-muse-500 to-spark-500 rounded-xl flex items-center justify-center shadow-lg shadow-muse-500/30">
          <IconSparkles />
        </div>
        {t.appTitle}
      </div>
      
      <div className="px-4 mb-2">
        <button 
          onClick={() => {
            setView('home');
            setCurrentSessionId(null);
            if (window.innerWidth < 768) setSidebarOpen(false);
          }}
          className="w-full bg-gradient-to-r from-muse-600 to-muse-500 hover:from-muse-500 hover:to-muse-400 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold shadow-lg shadow-muse-900/40 hover:shadow-muse-600/20 group"
        >
          <span className="group-hover:rotate-90 transition-transform duration-300">+</span> {t.startChat}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1 mt-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
          <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
          {t.history}
        </div>
        {sessions.length === 0 && <div className="text-sm text-slate-600 px-2 italic font-light">{t.emptyHistory}</div>}
        {sessions.map(s => (
          <div 
            key={s.id}
            onClick={() => {
              setCurrentSessionId(s.id);
              setView('chat');
              setActiveSavedId(null);
              setPendingNote(null);
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={`w-full group relative flex items-center p-3 rounded-xl transition-all cursor-pointer border border-transparent ${currentSessionId === s.id && view === 'chat' ? 'bg-white/10 text-white shadow-inner border-white/5' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <div className="flex-1 min-w-0 pr-6">
              <div className="font-medium truncate text-sm">{s.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-light">{new Date(s.lastUpdated).toLocaleDateString()}</div>
            </div>
            <button 
              onClick={(e) => handleDeleteSession(s.id, e)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-spark-400 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20"
              title={t.delete}
            >
              <IconTrash />
            </button>
          </div>
        ))}
      </nav>

      {/* Subscription & User */}
      <div className="p-4 border-t border-white/5 space-y-3 bg-black/20 backdrop-blur-md">
         <button 
           onClick={() => setShowSubModal(true)}
           className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:to-orange-400 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
         >
           <IconCrown /> {t.subscribe}
         </button>

         <div className="flex gap-2">
           <select 
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="flex-1 bg-slate-800/50 border border-slate-700 text-xs text-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-muse-500 outline-none cursor-pointer"
           >
             <option value="en">English</option>
             <option value="zh">中文</option>
             <option value="es">Español</option>
             <option value="ja">日本語</option>
           </select>
           <button 
             onClick={() => setShowAuthModal(true)}
             className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-sm transition-colors"
           >
             <img src={PLACEHOLDER_AVATAR} className="w-5 h-5 rounded-full ring-2 ring-slate-600" alt="User" />
           </button>
         </div>
      </div>
    </aside>
  );

  const renderHeader = () => (
    <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 bg-transparent z-30 shrink-0">
      <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-white/50 rounded-lg transition-colors"><IconMenu /></button>
          <h2 className="font-display font-semibold text-lg md:text-xl text-slate-800 truncate max-w-[150px] md:max-w-md drop-shadow-sm">
            {isTranslating ? t.translating : (
              view === 'my_inspirations' ? t.myInspirations : 
              view === 'note_review' ? (activeSavedId ? t.update : t.generateNote) :
              activeSession?.title || "" // Hide title on home
            )}
          </h2>
      </div>
      <div className="flex items-center gap-2">
        <button 
           onClick={() => { setView('my_inspirations'); setActiveSavedId(null); }}
           className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-sm font-semibold transition-all ${view === 'my_inspirations' ? 'bg-white shadow-md text-muse-700 ring-1 ring-slate-100' : 'text-slate-600 hover:bg-white/50'}`}
        >
           <IconFolder /> <span className="hidden sm:inline">{t.myInspirations}</span>
        </button>
      </div>
    </header>
  );

  const renderHome = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center animate-fade-in relative z-10 max-w-5xl mx-auto w-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-muse-200/30 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      
      <div className="mb-10 relative">
        <div className="w-20 h-20 bg-gradient-to-tr from-muse-500 to-spark-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-muse-500/40 rotate-6 mx-auto mb-6 animate-slide-up">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </div>
        <h1 className="text-4xl md:text-7xl font-display font-bold text-slate-900 mb-6 tracking-tight leading-tight drop-shadow-sm animate-slide-up" style={{animationDelay: '0.1s'}}>
          {t.welcome}
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-xl mx-auto leading-relaxed animate-slide-up" style={{animationDelay: '0.2s'}}>
          {t.welcomeSub}
        </p>
      </div>

      {/* Hero Input */}
      <div className="w-full max-w-2xl relative group animate-slide-up" style={{animationDelay: '0.3s'}}>
         <div className="absolute inset-0 bg-gradient-to-r from-muse-400 to-spark-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
         <div className="relative glass-input rounded-2xl p-2 flex items-center shadow-2xl">
           <textarea 
             className="flex-1 bg-transparent border-none focus:ring-0 text-base md:text-lg p-3 md:p-4 text-slate-800 placeholder:text-slate-400 resize-none h-[50px] md:h-[60px] leading-relaxed"
             placeholder={t.placeholder}
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => {
               if(e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 createNewSession(input);
               }
             }}
           />
           <button 
              onClick={() => createNewSession(input)}
              disabled={!input.trim()}
              className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
           >
              <IconSend />
           </button>
         </div>
      </div>

      {/* Starters */}
      <div className="mt-12 animate-slide-up" style={{animationDelay: '0.4s'}}>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{t.startersTitle}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {STARTERS[lang].map((starter, idx) => (
            <button 
              key={idx}
              onClick={() => createNewSession(starter)}
              className="bg-white/60 hover:bg-white backdrop-blur-sm border border-white/50 px-4 py-2 rounded-full text-sm text-slate-700 hover:text-muse-700 hover:border-muse-200 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
       {/* Messages */}
       <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth" ref={scrollRef}>
          {activeMessages.map((msg, index) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 md:gap-4 animate-slide-up w-full ${msg.role === 'user' ? 'flex-row-reverse justify-start' : 'flex-row justify-start'}`}
            >
               {/* Avatar - Now handled with Flexbox, not absolute positioning */}
               {msg.role === 'model' && (
                  <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-muse-500 to-spark-500 rounded-xl flex items-center justify-center text-white shadow-lg mt-1">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                  </div>
               )}
               {msg.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden shadow-lg mt-1">
                     <img src={PLACEHOLDER_AVATAR} className="w-full h-full object-cover" alt="User" />
                  </div>
               )}

               <div className={`max-w-[80%] md:max-w-[70%] p-4 md:p-6 rounded-3xl shadow-sm leading-relaxed whitespace-pre-wrap ${
                 msg.role === 'user' 
                 ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-tr-sm shadow-xl shadow-slate-900/10' 
                 : 'glass-panel text-slate-800 rounded-tl-sm shadow-sm border-white/60'
               }`}>
                 {msg.attachment && (
                   <div className="mb-4 rounded-xl overflow-hidden border border-white/20 shadow-md">
                     <img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} className="max-h-64 object-cover w-full" alt="attachment" />
                   </div>
                 )}
                 <div className="text-[15px] md:text-base">{msg.content}</div>
               </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex gap-4 animate-fade-in w-full justify-start">
               <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-muse-500 to-spark-500 rounded-xl flex items-center justify-center text-white shadow-lg mt-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
               </div>
               <div className="glass-panel px-6 py-4 rounded-3xl rounded-tl-sm flex gap-2 items-center">
                 <span className="w-2 h-2 bg-muse-400 rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-muse-400 rounded-full animate-bounce delay-75"></span>
                 <span className="w-2 h-2 bg-muse-400 rounded-full animate-bounce delay-150"></span>
               </div>
             </div>
          )}
          <div className="h-4"></div>
       </div>

       {/* Input Area */}
       <div className="p-4 md:p-6 shrink-0 z-20">
          <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-2 shadow-2xl shadow-muse-900/5 ring-1 ring-white/50 relative">
             
             {/* Floating Generate Button */}
             {activeMessages.length > 2 && (
                <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 mb-2 z-30 animate-slide-up w-max">
                   <button
                     onClick={handleGenerateNote}
                     disabled={isTyping}
                     className="flex items-center gap-2 bg-gradient-to-r from-muse-600 to-violet-600 hover:from-muse-500 hover:to-violet-500 text-white px-6 py-3 rounded-full shadow-lg shadow-muse-500/30 font-display font-semibold transition-all hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-md"
                   >
                     <IconSparkles />
                     {t.generateNote}
                   </button>
                </div>
             )}

             {/* Attachment Preview */}
            {attachment && (
              <div className="absolute -top-16 left-4 bg-white p-2 rounded-xl shadow-lg border border-slate-100 animate-slide-up flex items-center gap-3">
                <img src={`data:${attachment.mimeType};base64,${attachment.data}`} className="h-10 w-10 object-cover rounded-lg" />
                <button onClick={() => setAttachment(undefined)} className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-slate-50">✕</button>
              </div>
            )}
            
            <div className="flex gap-2 items-end">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-muse-600 hover:bg-muse-50 rounded-2xl transition-colors mb-1"
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
                <textarea 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 resize-none py-3.5 max-h-[120px]"
                  placeholder={t.placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                  disabled={isTyping}
                />
                <div className="flex flex-col gap-2 pb-1">
                   <button 
                     onClick={() => handleSendMessage()}
                     disabled={(!input.trim() && !attachment) || isTyping}
                     className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                   >
                     <IconSend />
                   </button>
                </div>
            </div>
          </div>
       </div>
    </div>
  );

  const renderMyInspirations = () => (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto animate-fade-in z-10 relative">
       <div className="max-w-7xl mx-auto">
         <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-slate-200/60">
           <div>
             <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">{t.myInspirations}</h1>
             <p className="text-slate-600 font-medium text-lg">Your curated collection of realized visions.</p>
           </div>
         </div>
         
         {savedInspirations.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 border border-slate-100">
                <IconFolder />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t.emptyInspirations}</h3>
              <p className="text-slate-500 mb-8 max-w-sm">Capture your first spark by starting a chat with the AI assistant.</p>
              <button onClick={() => createNewSession()} className="bg-muse-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-muse-700 transition-colors">
                 {t.startChat}
              </button>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedInspirations.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => openSavedInspiration(item)}
                  className="glass-panel p-6 rounded-3xl hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group relative border-white/60 bg-white/60"
                >
                   <button 
                     onClick={(e) => handleDeleteSaved(item.id, e)} 
                     className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-50 rounded-full"
                     title={t.delete}
                   >
                     <IconTrash />
                   </button>
                   <div className="text-[10px] font-bold text-muse-700 mb-3 uppercase tracking-widest bg-muse-100 inline-block px-2 py-1 rounded-md">{item.date}</div>
                   <h3 className="text-xl font-bold font-display text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-muse-700 transition-colors">{item.title}</h3>
                   <p className="text-slate-600 text-sm line-clamp-3 mb-6 font-normal leading-relaxed">{item.note.project.details}</p>
                   <div className="flex gap-2 mt-auto">
                      {item.note.project.tags.slice(0,3).map(tag => (
                        <span key={tag} className="text-[10px] bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-700 font-bold">{tag}</span>
                      ))}
                   </div>
                </div>
              ))}
           </div>
         )}
       </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden font-sans aurora-bg selection:bg-muse-200 selection:text-muse-900">
      {renderSidebar()}
      
      {/* Main Content Area - Corrected Layout for Mobile/Desktop */}
      <main className="flex-1 flex flex-col relative h-full w-full">
         {/* Background Elements */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[80px] animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[80px] animate-blob" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-pink-200/40 rounded-full blur-[80px] animate-blob" style={{animationDelay: '4s'}}></div>
         </div>

         {view !== 'home' && renderHeader()}
         
         <div className="flex-1 flex overflow-hidden relative z-10">
            {view === 'home' && renderHome()}

            {view === 'chat' && renderChat()}

            {view === 'note_review' && pendingNote && (
               <div className="flex-1 h-full overflow-hidden z-20">
                 <InspirationNoteView 
                   note={pendingNote} 
                   texts={t} 
                   onSatisfied={handleSaveNote}
                   onDissatisfied={() => setView('chat')}
                   isSavedMode={!!activeSavedId} 
                   onBackToList={() => { setView('my_inspirations'); setActiveSavedId(null); setPendingNote(null); }}
                   onDelete={() => activeSavedId && handleDeleteSaved(activeSavedId)}
                   onUpdate={handleUpdateSavedNote}
                 />
               </div>
            )}

            {view === 'my_inspirations' && renderMyInspirations()}
         </div>
      </main>

      {/* Overlays */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
              <h2 className="text-2xl font-display font-bold mb-2 text-slate-800">{t.login}</h2>
              <p className="text-slate-500 mb-6 font-light">{t.loginDesc}</p>
              <div className="space-y-4">
                 <input type="email" placeholder={t.email} className="w-full bg-slate-50 border-none p-4 rounded-xl focus:ring-2 focus:ring-muse-500" />
                 <input type="password" placeholder={t.password} className="w-full bg-slate-50 border-none p-4 rounded-xl focus:ring-2 focus:ring-muse-500" />
                 <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors">{t.signIn}</button>
              </div>
           </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative text-center border border-white/50">
              <button onClick={() => setShowSubModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-white animate-bounce">
                <IconCrown />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2 text-slate-800">{t.subscribeModalTitle}</h2>
              <p className="text-slate-500 mb-8 font-light">{t.subscriptionDesc}</p>
              <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:scale-105 transition-transform">{t.subscribeBtn}</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;