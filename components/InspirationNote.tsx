import React, { useState } from 'react';
import { InspirationNote } from '../types';

interface NoteProps {
  note: InspirationNote;
  texts: Record<string, string>;
  onSatisfied?: () => void;
  onDissatisfied?: () => void;
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
              <h4 className="font-semibold text-slate-700 mb-2">MVP Features</h4>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                 {displayNote.business.mvpFeatures.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Strategy</h4>
              <p className="text-slate-600">{displayNote.business.strategy}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-semibold text-slate-700 mb-2">Value Propositions</h4>
            <div className="flex flex-wrap gap-2">
               {displayNote.business.valueProps.map((v, i) => (
                 <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded text-sm">{v}</span>
               ))}
            </div>
          </div>
        </section>

        {/* Legal Section */}
        <section className="border-t border-slate-200 pt-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
             <span className="bg-orange-100 p-1 rounded text-orange-600">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
             </span>
             {texts.risks}
          </h3>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
            <ul className="space-y-2 mb-4">
              {displayNote.legal.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700">
                  <span className="text-orange-500 mt-1">•</span>
                  {r}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-400 italic border-t border-orange-200 pt-4 mt-4">
               {texts.legalWarning}
            </p>
          </div>
        </section>

        {/* Bottom Actions */}
        {!isSavedMode && (
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200">
             <button 
               onClick={onDissatisfied}
               className="flex-1 py-3 px-6 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
             >
               {texts.notSatisfied}
             </button>
             <button 
               onClick={onSatisfied}
               className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors"
             >
               {texts.satisfied}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspirationNoteView;