
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Node, Connection, Point, ConnectionType } from '../types';
import NodeCard from './NodeCard';
import ConnectionLine from './ConnectionLine';

interface ResearchCanvasProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  onSendMessage?: (nodeId: string, text: string) => Promise<void>;
  isAiLoading?: boolean;
}

const ResearchCanvas: React.FC<ResearchCanvasProps> = ({ 
  nodes, 
  setNodes, 
  connections, 
  setConnections,
  onSendMessage,
  isAiLoading
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('grid-background')) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left - 100;
      const y = e.clientY - rect.top - 50;

      const newNode: Node = {
        id: crypto.randomUUID(),
        title: 'New Concept',
        content: 'Double click to add details...',
        type: 'concept',
        x,
        y,
        width: 240,
        height: 160,
        color: 'bg-white'
      };

      setNodes(prev => [...prev, newNode]);
    }
  };

  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    setDraggedNodeId(id);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y
    });
  };

  const startConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingFromId(id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (draggedNodeId) {
      const draggedNode = nodes.find(n => n.id === draggedNodeId);
      if (draggedNode) {
        const nextX = e.clientX - dragOffset.x;
        const nextY = e.clientY - dragOffset.y;
        const dx = nextX - draggedNode.x;
        const dy = nextY - draggedNode.y;

        setNodes(prev => {
          const isGroup = draggedNode.type === 'group';
          return prev.map(node => {
            if (node.id === draggedNodeId) {
              return { ...node, x: nextX, y: nextY };
            }
            if (isGroup && node.parentId === draggedNodeId) {
              return { ...node, x: node.x + dx, y: node.y + dy };
            }
            return node;
          });
        });
      }
    }

    if (connectingFromId) {
      setMousePos({ x: currentX, y: currentY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      const droppedNode = nodes.find(n => n.id === draggedNodeId);
      if (droppedNode && droppedNode.type !== 'group') {
        const group = nodes.find(n => 
          n.type === 'group' && 
          droppedNode.x >= n.x && droppedNode.x <= n.x + n.width &&
          droppedNode.y >= n.y && droppedNode.y <= n.y + n.height
        );
        
        if (group) {
          setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, parentId: group.id } : n));
        } else {
          setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, parentId: undefined } : n));
        }
      }
    }

    if (connectingFromId) {
      setConnectingFromId(null);
    }
    setDraggedNodeId(null);
  };

  const finalizeConnection = (toId: string) => {
    if (connectingFromId && connectingFromId !== toId) {
      const exists = connections.some(c => 
        (c.fromId === connectingFromId && c.toId === toId) || 
        (c.fromId === toId && c.toId === connectingFromId)
      );
      
      if (!exists) {
        const newConn: Connection = {
          id: crypto.randomUUID(),
          fromId: connectingFromId,
          toId,
          label: 'related_to'
        };
        setConnections(prev => [...prev, newConn]);
      }
    }
    setConnectingFromId(null);
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id).map(n => n.parentId === id ? { ...n, parentId: undefined } : n));
    setConnections(prev => prev.filter(c => c.fromId !== id && c.toId !== id));
  };

  const updateNode = (id: string, data: Partial<Node>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n));
  };

  const updateConnectionLabel = (id: string, label: string) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, label } : c));
  };

  const deleteConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  return (
    <main 
      ref={containerRef}
      className="flex-1 relative overflow-hidden grid-background bg-slate-50 cursor-crosshair canvas-container"
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
          </defs>
          
          {connections.map(conn => {
            const from = nodes.find(n => n.id === conn.fromId);
            const to = nodes.find(n => n.id === conn.toId);
            if (!from || !to) return null;
            return (
              <ConnectionLine 
                key={conn.id}
                id={conn.id}
                from={from}
                to={to}
                label={conn.label}
                onLabelChange={(label) => updateConnectionLabel(conn.id, label)}
                onDelete={() => deleteConnection(conn.id)}
              />
            );
          })}

          {connectingFromId && (() => {
            const from = nodes.find(n => n.id === connectingFromId);
            if (!from) return null;
            const startX = from.x + from.width / 2;
            const startY = from.y + from.height / 2;
            return (
              <line 
                x1={startX} y1={startY} 
                x2={mousePos.x} y2={mousePos.y} 
                stroke="#6366f1" 
                strokeWidth="2" 
                strokeDasharray="5,5" 
              />
            );
          })()}
        </svg>
      </div>

      {nodes.map(node => (
        <NodeCard 
          key={node.id}
          node={node}
          isEditing={isEditing === node.id}
          onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
          onStartConnection={(e) => startConnection(node.id, e)}
          onMouseUp={() => finalizeConnection(node.id)}
          onDelete={() => deleteNode(node.id)}
          onDoubleClick={() => setIsEditing(node.id)}
          onUpdate={(data) => {
            updateNode(node.id, data);
            setIsEditing(null);
          }}
          onCancelEdit={() => setIsEditing(null)}
          onSendMessage={onSendMessage}
          isAiLoading={isAiLoading}
        />
      ))}

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-lg font-medium text-slate-400">Add content boxes and chat nodes to synthesize research</p>
          </div>
        </div>
      )}
    </main>
  );
};

export default ResearchCanvas;
