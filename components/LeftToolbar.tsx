
import React, { useRef } from 'react';
import { NodeType } from '../types';

interface LeftToolbarProps {
  onAddNode: (icon: string, title: string, type: NodeType, metadata?: any) => void;
}

const LeftToolbar: React.FC<LeftToolbarProps> = ({ onAddNode }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => fileInputRef.current?.click();
  const handlePdfClick = () => pdfInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, icon: string, type: NodeType) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        onAddNode(icon, file.name, type, { 
          thumbnail: type === 'photo' ? base64Data : undefined,
          fileData: base64Data,
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const tools = [
    { icon: '💬', label: 'AI Chat', color: 'text-indigo-600', onClick: () => onAddNode('💬', 'AI Chat', 'chat', { messages: [] }) },
    { icon: '📦', label: 'Box', color: 'text-slate-700', onClick: () => onAddNode('📦', 'My Content', 'group') },
    { icon: '🖼️', label: 'Photo', color: 'text-rose-500', onClick: handleFileClick },
    { icon: '📄', label: 'PDF', color: 'text-orange-500', onClick: handlePdfClick },
    { icon: '🌐', label: 'Website', color: 'text-sky-500', onClick: () => onAddNode('🌐', 'New Website', 'website', { url: '' }) },
    { icon: '🎥', label: 'YouTube', color: 'text-red-600', onClick: () => onAddNode('🎥', 'New Video', 'youtube', { url: '', videoId: '' }) },
  ];

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 p-3 bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-40 border border-slate-100">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFileChange(e, '🖼️', 'photo')} 
      />
      <input 
        type="file" 
        ref={pdfInputRef} 
        className="hidden" 
        accept=".pdf" 
        onChange={(e) => handleFileChange(e, '📄', 'pdf')} 
      />

      {tools.map((tool, i) => (
        <button 
          key={i} 
          title={tool.label}
          onClick={tool.onClick}
          className={`w-12 h-12 flex flex-col items-center justify-center rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group relative`}
        >
          <span className={`text-2xl ${tool.color} group-hover:scale-110 transition-transform`}>{tool.icon}</span>
          <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {tool.label}
          </span>
        </button>
      ))}
      
      <div className="w-8 h-px bg-slate-100 my-1" />
      
      <button 
        onClick={() => onAddNode('✨', 'Concept', 'concept')}
        className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-indigo-50 text-indigo-400 text-xl font-bold transition-all active:scale-95"
      >
        +
      </button>
    </div>
  );
};

export default LeftToolbar;
