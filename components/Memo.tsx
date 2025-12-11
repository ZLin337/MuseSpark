import React from 'react';

interface MemoProps {
  content: string;
  onChange: (val: string) => void;
  texts: Record<string, string>;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  readOnly?: boolean;
}

const Memo: React.FC<MemoProps> = ({ 
  content, 
  onChange, 
  texts, 
  isFullScreen, 
  onToggleFullScreen,
  readOnly = false
}) => {
  return (
    <div className={`flex flex-col h-full bg-yellow-50 rounded-lg overflow-hidden border border-yellow-200 shadow-sm ${isFullScreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
      <div className="bg-yellow-100/50 p-2 border-b border-yellow-200 flex justify-between items-center shrink-0">
         <span className="font-bold text-yellow-800 text-sm pl-2">{texts.memo}</span>
         <button onClick={onToggleFullScreen} className="text-yellow-600 hover:text-yellow-800 p-1">
            {isFullScreen ? (
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
            ) : (
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            )}
         </button>
      </div>
      <textarea 
        className="flex-1 w-full h-full p-4 bg-transparent resize-none focus:outline-none text-slate-700 leading-relaxed"
        placeholder={readOnly ? "" : "Type your notes here..."}
        value={content}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        readOnly={readOnly}
      />
    </div>
  );
};

export default Memo;