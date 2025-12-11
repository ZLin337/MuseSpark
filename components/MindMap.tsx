import React, { useState, useRef, useEffect } from 'react';
import { MindMapNode, MindMapEdge, MindMapData } from '../types';
import { getMindMapSuggestion } from '../services/geminiService';

interface MindMapProps {
  lang: string;
  texts: Record<string, string>;
  data: MindMapData;
  onUpdate: (data: MindMapData) => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  readOnly?: boolean;
}

const MindMap: React.FC<MindMapProps> = ({ 
  lang, 
  texts, 
  data, 
  onUpdate, 
  isFullScreen, 
  onToggleFullScreen,
  readOnly = false
}) => {
  const { nodes, edges } = data;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [helperInput, setHelperInput] = useState('');
  const [helperResponse, setHelperResponse] = useState('');
  const [isHelperLoading, setIsHelperLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    setDraggingId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId && containerRef.current && !readOnly) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newNodes = nodes.map(n => n.id === draggingId ? { ...n, x, y } : n);
      onUpdate({ ...data, nodes: newNodes });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const addNode = () => {
    if (readOnly) return;
    const newId = Date.now().toString();
    const root = nodes[0] || { x: 250, y: 250 };
    const newNode: MindMapNode = {
      id: newId,
      x: root.x + Math.random() * 100 - 50,
      y: root.y + 100 + Math.random() * 50,
      label: 'New Idea',
      type: 'child'
    };
    const newEdge: MindMapEdge = {
      id: `e-${newId}`,
      source: nodes[0]?.id || newId, // Connect to root if exists
      target: newId
    };
    onUpdate({
      nodes: [...nodes, newNode],
      edges: [...edges, newEdge]
    });
  };

  const handleLabelChange = (id: string, newLabel: string) => {
    if (readOnly) return;
    const newNodes = nodes.map(n => n.id === id ? { ...n, label: newLabel } : n);
    onUpdate({ ...data, nodes: newNodes });
  };

  const askHelper = async () => {
    if (!helperInput.trim()) return;
    setIsHelperLoading(true);
    const nodesSummary = nodes.map(n => n.label).join(', ');
    const response = await getMindMapSuggestion(nodesSummary, helperInput, lang);
    setHelperResponse(response || "");
    setIsHelperLoading(false);
    setHelperInput('');
  };

  return (
    <div className={`flex flex-col h-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-inner ${isFullScreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
      {/* Header */}
      <div className="bg-white p-2 border-b border-slate-200 flex justify-between items-center shrink-0">
         <span className="font-bold text-slate-700 text-sm pl-2">{texts.mindMap}</span>
         <div className="flex gap-2">
            {!readOnly && (
              <button onClick={addNode} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded font-bold text-lg leading-none" title="Add Node">+</button>
            )}
            <button onClick={onToggleFullScreen} className="text-slate-400 hover:text-slate-600 p-1">
              {isFullScreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              )}
            </button>
         </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-grid-slate-200"
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {edges.map(edge => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            if (!source || !target) return null;
            return (
              <line 
                key={edge.id}
                x1={source.x} y1={source.y}
                x2={target.x} y2={target.y}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {nodes.map(node => (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDown(node.id, e)}
            style={{ 
              left: node.x, 
              top: node.y,
              transform: 'translate(-50%, -50%)'
            }}
            className={`absolute z-10 px-3 py-2 rounded-lg shadow-sm cursor-move transition-shadow hover:shadow-md
              ${node.type === 'root' 
                ? 'bg-indigo-600 text-white border-2 border-indigo-700' 
                : 'bg-white text-slate-700 border border-slate-300'}`}
          >
            {readOnly ? (
               <span className="font-medium text-sm whitespace-nowrap">{node.label}</span>
            ) : (
               <input 
                 type="text"
                 value={node.label}
                 onChange={(e) => handleLabelChange(node.id, e.target.value)}
                 className="bg-transparent text-center focus:outline-none min-w-[60px] max-w-[150px] text-sm font-medium"
               />
            )}
          </div>
        ))}
      </div>

      {/* Helper Chat - Hide in readOnly unless we want it, assuming hide for saved view */}
      {!readOnly && (
        <div className="h-40 border-t border-slate-200 bg-white p-3 flex flex-col shrink-0">
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            {texts.mindMapHelper}
          </div>
          <div className="flex-1 overflow-y-auto mb-2 text-xs text-slate-600">
            {helperResponse ? (
              <div className="bg-indigo-50 p-2 rounded text-indigo-800 border border-indigo-100">{helperResponse}</div>
            ) : (
              <div className="text-slate-300 italic pt-1 text-center">{texts.mindMapPlaceholder}</div>
            )}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={helperInput}
              onChange={e => setHelperInput(e.target.value)}
              placeholder="..."
              className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
              onKeyDown={e => e.key === 'Enter' && askHelper()}
            />
            <button 
              onClick={askHelper}
              disabled={isHelperLoading}
              className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {isHelperLoading ? '...' : '→'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMap;