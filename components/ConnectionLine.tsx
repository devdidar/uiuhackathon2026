
import React, { useState } from 'react';
import { Node, ConnectionType } from '../types';

interface ConnectionLineProps {
  id: string;
  from: Node;
  to: Node;
  label: string;
  onLabelChange: (label: string) => void;
  onDelete: () => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ from, to, label, onLabelChange, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  const endX = to.x + to.width / 2;
  const endY = to.y + to.height / 2;

  // Bezier curve calculation
  const cp1x = startX + (endX - startX) * 0.5;
  const cp1y = startY;
  const cp2x = startX + (endX - startX) * 0.5;
  const cp2y = endY;

  const d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

  const midX = startX + (endX - startX) * 0.5;
  const midY = startY + (endY - startY) * 0.5;

  return (
    <g 
      className="pointer-events-auto cursor-pointer" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => { setIsHovered(false); if (!isEditing) setIsEditing(false); }}
    >
      <path 
        d={d} 
        stroke={isHovered ? "#4f46e5" : "#cbd5e1"} 
        strokeWidth={isHovered ? "3" : "2"} 
        fill="transparent"
        strokeDasharray="6,6"
        className="transition-all duration-300"
      />
      
      <path 
        d={d} 
        stroke="transparent" 
        strokeWidth="20" 
        fill="transparent" 
      />

      {/* Label/Delete UI */}
      <foreignObject 
        x={midX - 40} 
        y={midY - 15} 
        width="80" 
        height="30"
        className="overflow-visible"
      >
        <div className="flex items-center justify-center h-full">
          {isEditing ? (
            <select 
              autoFocus
              className="text-[9px] bg-white border border-indigo-200 rounded shadow-sm px-1 focus:outline-none"
              value={label}
              onChange={(e) => { onLabelChange(e.target.value); setIsEditing(false); }}
              onBlur={() => setIsEditing(false)}
            >
              {Object.values(ConnectionType).map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-1 group/label">
              {isHovered && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="w-5 h-5 flex items-center justify-center bg-white text-rose-500 border border-rose-100 rounded-full hover:bg-rose-50 transition-all shadow-sm"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
};

export default ConnectionLine;
