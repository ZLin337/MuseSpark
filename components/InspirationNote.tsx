import React, { useState } from 'react';
import { InspirationNote } from '../types';

interface NoteProps {
  note: InspirationNote;
  texts: Record<string, string>;
  onSatisfied?: () => void;
  onDissatisfied?: () => void;
  onViewMindMap?: () => void;
  onViewMemo?: () => void;
  isSavedMode?: boolean;
  onBackToList?: () => void;
  onDelete?: () => void;
  onUpdate?: (updatedNote: InspirationNote) => void;
}

const InspirationNoteView: React.FC<NoteProps> = ({ 
  note, 
  texts, 
  onSatisfied, 
  onDissatisfied,
  onViewMindMap,
  onViewMemo,
  isSavedMode = false,
  onBackToList,
  onDelete,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState<InspirationNote>(note);

  const handleTextChange = (section: keyof InspirationNote['project'], value: string) => {
    setEditedNote(prev => ({
      ...prev,
      project: { ...prev.project, [section]: value }
    }));
  };

  const saveEdits = () => {
    if (onUpdate) onUpdate(editedNote);
    setIsEditing(false);
  };

  const cancelEdits = () => {
    setEditedNote(note);
    setIsEditing(false);
  };

  const displayNote = isEditing ? editedNote : note;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden animate-fade-in relative">
      {/* Top Bar for Saved Mode */}
      {isSavedMode && (
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
          <button onClick={onBackToList} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
             {texts.backToList}
          </button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                 <button onClick={cancelEdits} className="px-3 py-1 text-slate-500 hover:text-slate-700 font-medium">{texts.cancelEdit}</button>
                 <button onClick={saveEdits} className="px-3 py-1 bg-indigo-600 text-white rounded shadow-sm hover:bg-indigo-700 font-medium">{texts.save}</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded" title={texts.edit}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded" title={texts.delete}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-24">
        {/* Project Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-start">
            {isEditing ? (
               <input 
                 className="w-full text-3xl font-bold text-slate-800 border-b border-slate-300 focus:border-indigo-500 outline-none pb-2"
                 value={displayNote.project.summary}
                 onChange={(e) => handleTextChange('summary', e.target.value)}
               />
            ) : (
               <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">{displayNote.project.summary}</h2>
            )}

            {isSavedMode && (
              <div className="flex gap-2 shrink-0 ml-4">
                 {onViewMindMap && (
                   <button onClick={onViewMindMap} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title={texts.viewMindMap}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
                   </button>
                 )}
                 {onViewMemo && (
                   <button onClick={onViewMemo} className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors" title={texts.viewMemo}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                   </button>
                 )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {displayNote.project.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Target Audience</h3>
              {isEditing ? (
                <textarea className="w-full bg-white p-2 rounded border" rows={3} value={displayNote.project.targetAudience} onChange={(e) => handleTextChange('targetAudience', e.target.value)} />
              ) : (
                <p className="text-slate-700">{displayNote.project.targetAudience}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Scenarios</h3>
              {isEditing ? (
                 <textarea className="w-full bg-white p-2 rounded border" rows={3} value={displayNote.project.scenarios} onChange={(e) => handleTextChange('scenarios', e.target.value)} />
              ) : (
                 <p className="text-slate-700">{displayNote.project.scenarios}</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Idea Details</h3>
            {isEditing ? (
               <textarea className="w-full bg-white p-2 rounded border" rows={6} value={displayNote.project.details} onChange={(e) => handleTextChange('details', e.target.value)} />
            ) : (
               <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                 {displayNote.project.details}
               </p>
            )}
          </div>
        </section>

        {/* Auto Generated Mind Map Visualization */}
        {displayNote.visualStructure && (
          <section className="border-t border-slate-200 pt-8">
             <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
               <span className="text-indigo-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M12 3v3"/><path d="M12 18v3"/></svg></span>
               {texts.generatedMap}
             </h3>
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 overflow-x-auto">
                <div className="flex flex-col items-center gap-6 min-w-[500px]">
                   <div className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-md">
                      {displayNote.visualStructure.centralNode}
                   </div>
                   <div className="w-px h-6 bg-slate-300"></div>
                   <div className="flex gap-4 items-start w-full justify-center">
                      {displayNote.visualStructure.branches.map((branch, i) => (
                        <div key={i} className="flex flex-col items-center flex-1">
                           <div className="w-full border-t border-slate-300 relative top-0 mb-4"></div>
                           <div className="bg-white border border-indigo-200 text-indigo-800 px-4 py-2 rounded-lg font-semibold shadow-sm mb-3 whitespace-nowrap">
                             {branch.main}
                           </div>
                           <div className="flex flex-col gap-2 items-center">
                             {branch.subs.map((sub, j) => (
                               <div key={j} className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">
                                 {sub}
                               </div>
                             ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </section>
        )}

        {/* Business Section */}
        <section className="border-t border-slate-200 pt-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="bg-purple-100 p-1 rounded text-purple-600">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </span>
            {texts.businessVal}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Value Points</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-sm">
                {displayNote.business.valueProps.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-red-600 mb-2">Difficulties</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-sm">
                {displayNote.business.difficulties.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-indigo-900 text-white p-6 rounded-xl shadow-lg">
            <h4 className="font-bold text-lg mb-4 text-indigo-100">{texts.mvp}</h4>
            <ol className="list-decimal pl-5 space-y-2">
              {displayNote.business.mvpFeatures.map((f, i) => (
                <li key={i} className="text-indigo-50">{f}</li>
              ))}
            </ol>
            <div className="mt-6 pt-4 border-t border-indigo-700/50">
              <h5 className="text-xs uppercase text-indigo-300 font-bold tracking-wider mb-1">Strategy</h5>
              <p className="text-sm text-indigo-100">{displayNote.business.strategy}</p>
            </div>
          </div>
        </section>

        {/* Legal Section */}
        <section className="border-t border-slate-200 pt-8 pb-4">
           <h3 className="text-lg font-bold text-slate-700 mb-4">{texts.risks}</h3>
           <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
              <ul className="list-disc pl-5 text-sm text-orange-800 mb-4">
                {displayNote.legal.risks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
              <p className="text-xs text-orange-600 italic">
                {displayNote.legal.disclaimer}
              </p>
           </div>
        </section>
      </div>

      {/* Footer Actions (Only show in review mode, not saved mode) */}
      {!isSavedMode && onSatisfied && onDissatisfied && (
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0 absolute bottom-0 left-0 right-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <button 
            onClick={onDissatisfied}
            className="px-6 py-3 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-medium"
          >
            {texts.notSatisfied}
          </button>
          <button 
            onClick={onSatisfied}
            className="px-8 py-3 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all font-bold transform hover:scale-[1.02]"
          >
            {texts.satisfied}
          </button>
        </div>
      )}
    </div>
  );
};

export default InspirationNoteView;