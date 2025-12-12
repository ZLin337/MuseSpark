import React, { useState, useEffect, useMemo } from 'react';
import { InspirationNote, MindMapData, MindMapNode, MindMapEdge } from '../types';
import MindMap from './MindMap';

interface NoteProps {
  note: InspirationNote;
  texts: Record<string, string>;
  onSatisfied?: () => void;
  onDissatisfied?: () => void;
  isSavedMode?: boolean;
  onBackToList?: () => void;
  onDelete?: () => void;
  onUpdate?: (updatedNote: InspirationNote) => void;
  lang?: string; // Add lang prop for MindMap AI
}

// Helper to transform Note to MindMap Data
const transformNoteToMap = (note: InspirationNote): MindMapData => {
  const nodes: MindMapNode[] = [];
  const edges: MindMapEdge[] = [];
  
  // Center: Project Summary
  const centerId = 'root';
  nodes.push({ id: centerId, x: 400, y: 300, label: note.project.summary.slice(0, 20) + '...', type: 'root' });

  // Level 1 Categories
  const categories = [
    { id: 'cat-proj', label: 'Project', x: 400, y: 150 },
    { id: 'cat-biz', label: 'Business', x: 600, y: 300 },
    { id: 'cat-legal', label: 'Legal', x: 200, y: 300 },
  ];

  categories.forEach(cat => {
    nodes.push({ id: cat.id, x: cat.x, y: cat.y, label: cat.label, type: 'child' });
    edges.push({ id: `e-${centerId}-${cat.id}`, source: centerId, target: cat.id });
  });

  // Level 2 Details (Distributed relative to categories)
  
  // Project Children
  const projChildren = [
    { id: 'p-target', label: note.project.targetAudience.slice(0, 15) + '...' },
    { id: 'p-tags', label: note.project.tags[0] || 'Tag' },
  ];
  projChildren.forEach((child, i) => {
    const id = child.id;
    nodes.push({ id, x: 400 + (i === 0 ? -80 : 80), y: 80, label: child.label, type: 'child' });
    edges.push({ id: `e-cat-proj-${id}`, source: 'cat-proj', target: id });
  });

  // Business Children
  const bizChildren = [
    { id: 'b-mvp', label: 'MVP: ' + (note.business.mvpFeatures[0]?.slice(0, 10) || 'Feature') + '...' },
    { id: 'b-val', label: 'Value: ' + (note.business.valueProps[0]?.slice(0, 10) || 'Prop') + '...' },
  ];
  bizChildren.forEach((child, i) => {
    const id = child.id;
    nodes.push({ id, x: 750, y: 300 + (i === 0 ? -60 : 60), label: child.label, type: 'child' });
    edges.push({ id: `e-cat-biz-${id}`, source: 'cat-biz', target: id });
  });

  // Legal Children
  const legalChildren = [
    { id: 'l-risk', label: 'Risk: ' + (note.legal.risks[0]?.slice(0, 10) || 'None') + '...' },
  ];
  legalChildren.forEach((child, i) => {
    const id = child.id;
    nodes.push({ id, x: 50, y: 300, label: child.label, type: 'child' });
    edges.push({ id: `e-cat-legal-${id}`, source: 'cat-legal', target: id });
  });

  return { nodes, edges };
};

const InspirationNoteView: React.FC<NoteProps> = ({ 
  note, 
  texts, 
  onSatisfied, 
  onDissatisfied,
  isSavedMode = false,
  onBackToList,
  onDelete,
  onUpdate,
  lang = 'en'
}) => {
  const [activeTab, setActiveTab] = useState<'doc' | 'map'>('doc');
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState<InspirationNote>(note);
  const [mapData, setMapData] = useState<MindMapData>(() => transformNoteToMap(note));
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);

  // Reset map when note changes deeply (e.g. translation)
  useEffect(() => {
    setEditedNote(note);
    setMapData(transformNoteToMap(note));
  }, [note.id, note.project.summary]); // Basic check

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
      {/* Header / Tabs */}
      <div className="shrink-0 border-b border-slate-200 bg-white z-10">
        {isSavedMode && (
          <div className="flex justify-between items-center p-4 pb-2">
            <button onClick={onBackToList} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
               {texts.backToList}
            </button>
            <div className="flex gap-2">
              {activeTab === 'doc' && (
                isEditing ? (
                  <>
                     <button onClick={cancelEdits} className="px-3 py-1 text-slate-500 hover:text-slate-700 font-medium text-sm">{texts.cancelEdit}</button>
                     <button onClick={saveEdits} className="px-3 py-1 bg-indigo-600 text-white rounded shadow-sm hover:bg-indigo-700 font-medium text-sm">{texts.save}</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title={texts.edit}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={onDelete} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded" title={texts.delete}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex px-6 gap-6 pt-2">
          <button 
            onClick={() => setActiveTab('doc')}
            className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'doc' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {texts.viewNote}
            {activeTab === 'doc' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'map' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {texts.mindMap}
            {activeTab === 'map' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-slate-50/30">
        {/* Document View */}
        {activeTab === 'doc' && (
          <div className="h-full overflow-y-auto p-6 md:p-8 space-y-8 pb-24 animate-fade-in">
            {/* Project Section */}
            <section className="space-y-4 max-w-4xl mx-auto">
              <div className="flex justify-between items-start">
                {isEditing ? (
                   <input 
                     className="w-full text-3xl font-bold text-slate-800 border-b border-slate-300 focus:border-indigo-500 outline-none pb-2 bg-transparent"
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Target Audience</h3>
                  {isEditing ? (
                    <textarea className="w-full bg-slate-50 p-2 rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500" rows={3} value={displayNote.project.targetAudience} onChange={(e) => handleTextChange('targetAudience', e.target.value)} />
                  ) : (
                    <p className="text-slate-700">{displayNote.project.targetAudience}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Scenarios</h3>
                  {isEditing ? (
                     <textarea className="w-full bg-slate-50 p-2 rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500" rows={3} value={displayNote.project.scenarios} onChange={(e) => handleTextChange('scenarios', e.target.value)} />
                  ) : (
                     <p className="text-slate-700">{displayNote.project.scenarios}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-800 mb-3">Idea Details</h3>
                {isEditing ? (
                   <textarea className="w-full bg-slate-50 p-2 rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500" rows={6} value={displayNote.project.details} onChange={(e) => handleTextChange('details', e.target.value)} />
                ) : (
                   <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                     {displayNote.project.details}
                   </p>
                )}
              </div>
            </section>

            {/* Business Section */}
            <section className="max-w-4xl mx-auto pt-4">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="bg-purple-100 p-1.5 rounded-lg text-purple-600">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </span>
                {texts.businessVal}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span> MVP Features
                  </h4>
                  <ul className="space-y-2 text-slate-600">
                     {displayNote.business.mvpFeatures.map((f, i) => <li key={i} className="flex gap-2"><span className="text-slate-400">•</span> {f}</li>)}
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span> Strategy
                  </h4>
                  <p className="text-slate-600 leading-relaxed">{displayNote.business.strategy}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-slate-700 mb-3">Value Propositions</h4>
                <div className="flex flex-wrap gap-2">
                   {displayNote.business.valueProps.map((v, i) => (
                     <span key={i} className="bg-white text-purple-700 px-3 py-1.5 rounded-lg text-sm border border-purple-100 shadow-sm font-medium">{v}</span>
                   ))}
                </div>
              </div>
            </section>

            {/* Legal Section */}
            <section className="max-w-4xl mx-auto pt-4">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <span className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                 </span>
                 {texts.risks}
              </h3>
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-6">
                <ul className="space-y-2 mb-4">
                  {displayNote.legal.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <svg className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      {r}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 italic border-t border-orange-200/50 pt-4 mt-4">
                   {texts.legalWarning}
                </p>
              </div>
            </section>
            
            {/* Bottom Actions */}
            {!isSavedMode && (
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200 max-w-4xl mx-auto">
                 <button 
                   onClick={onDissatisfied}
                   className="flex-1 py-3 px-6 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                 >
                   {texts.notSatisfied}
                 </button>
                 <button 
                   onClick={onSatisfied}
                   className="flex-1 py-3 px-6 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02]"
                 >
                   {texts.satisfied}
                 </button>
              </div>
            )}
            <div className="h-12"></div>
          </div>
        )}

        {/* Mind Map View */}
        {activeTab === 'map' && (
          <div className="h-full p-4 animate-fade-in bg-slate-50">
             <MindMap 
                lang={lang}
                texts={texts}
                data={mapData}
                onUpdate={setMapData}
                isFullScreen={isFullScreenMap}
                onToggleFullScreen={() => setIsFullScreenMap(!isFullScreenMap)}
                readOnly={isSavedMode && !isEditing} // Allow edits in map only if we add map saving logic later, for now allow playing around
             />
          </div>
        )}
      </div>
    </div>
  );
};

export default InspirationNoteView;