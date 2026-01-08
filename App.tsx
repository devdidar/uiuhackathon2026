
import React, { useState, useEffect } from 'react';
import { Node, Connection, ChatMessage, NodeType } from './types';
import ResearchCanvas from './components/ResearchCanvas';
import Header from './components/Header';
import LeftToolbar from './components/LeftToolbar';
import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'vro-research-data-v3';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { nodes: savedNodes, connections: savedConnections } = JSON.parse(saved);
        setNodes(savedNodes || []);
        setConnections(savedConnections || []);
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, connections }));
    alert('Progress saved successfully!');
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas?')) {
      setNodes([]);
      setConnections([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleAddNode = (icon: string, title: string, type: NodeType = 'concept', metadata?: any) => {
    let width = 300;
    let height = 240;

    if (type === 'chat') {
      width = 600;
      height = 450;
    } else if (type === 'group') {
      width = 500;
      height = 350;
    }

    const newNode: Node = {
      id: crypto.randomUUID(),
      title: title,
      content: type === 'chat' ? '' : type === 'group' ? '' : `Notes for ${title.toLowerCase()}...`,
      type,
      x: window.innerWidth / 2 - width / 2 + (Math.random() * 60 - 30),
      y: window.innerHeight / 2 - height / 2 + (Math.random() * 60 - 30),
      width,
      height,
      color: 'bg-white',
      icon: icon,
      metadata: metadata || {}
    };
    setNodes(prev => [...prev, newNode]);
  };

  const handleSendNodeMessage = async (nodeId: string, text: string) => {
    const chatNode = nodes.find(n => n.id === nodeId);
    if (!chatNode || chatNode.type !== 'chat') return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    const currentMessages = chatNode.metadata?.messages || [];
    const updatedMessagesWithUser = [...currentMessages, userMsg];

    setNodes(prev => prev.map(n => n.id === nodeId ? { 
      ...n, 
      metadata: { ...n.metadata, messages: updatedMessagesWithUser } 
    } : n));

    setIsAiLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const connectedNodeIds = connections
        .filter(c => c.toId === nodeId || c.fromId === nodeId)
        .map(c => c.toId === nodeId ? c.fromId : c.toId);
      
      const contextNodes = nodes.filter(n => connectedNodeIds.includes(n.id));
      const groupIds = contextNodes.filter(n => n.type === 'group').map(g => g.id);
      
      const childNodes = nodes.filter(n => 
        n.parentId && 
        groupIds.includes(n.parentId) && 
        n.id !== nodeId
      );
      
      const allRelevantNodes = [...contextNodes, ...childNodes];

      const parts: any[] = [];
      allRelevantNodes.forEach(n => {
        if (n.type === 'photo' && n.metadata?.fileData) {
          const split = n.metadata.fileData.split(',');
          if (split.length > 1) {
            const mimeType = split[0].split(':')[1].split(';')[0];
            parts.push({
              inlineData: {
                data: split[1],
                mimeType: mimeType
              }
            });
          }
        } else if (n.type === 'pdf' && n.metadata?.fileData) {
          const split = n.metadata.fileData.split(',');
          if (split.length > 1) {
            parts.push({
              inlineData: {
                data: split[1],
                mimeType: 'application/pdf'
              }
            });
          }
        }
      });

      const contextSummary = {
        connectedItems: contextNodes.map(n => ({ 
          id: n.id, 
          title: n.title, 
          type: n.type,
          content: n.content,
          url: n.metadata?.url
        })),
        itemsInsideBoxes: childNodes.map(n => ({ 
          id: n.id, 
          title: n.title, 
          type: n.type, 
          content: n.content,
          url: n.metadata?.url,
          parentBoxId: n.parentId 
        }))
      };

      const systemInstruction = `
        You are a warm, intelligent Second Brain assistant helping a human researcher. 
        
        STRICT FORMATTING RULE: 
        - ABSOLUTELY NO markdown symbols. Never use asterisks (* or **), underscores (_), or hashes (#).
        - Speak in plain, elegant text. 
        - Use simple line breaks to separate ideas and natural paragraphs.
        - NEVER use machine-like labels like "Topic:", "Summary:", or "Based on...".
        
        TONE & STYLE:
        - Be human. Speak like a smart friend sitting next to the user.
        - Instead of saying "I see a link," say things like "That YouTube video about..." or "I checked out that website you linked..."
        - Keep it flowing and conversational. 
        
        VISUAL CONTEXT:
        Current Board State: ${JSON.stringify(contextSummary)}

        GUIDELINES:
        1. MULTI-MODAL ANALYSIS: You will receive images (photos) and document files (PDFs) in the payload. Read and describe them naturally.
        2. WEBSITES & VIDEOS: Use Google Search to look up titles, summaries, and transcripts for any URLs in the context. 
        3. SYNTHESIS: Connect ideas between different items on the board. If a photo and a video are related, point that out.
        4. CLARITY: If you mention an item, just use its title. No quotes, no bolding.
      `;

      const chatHistory = updatedMessagesWithUser.map((m, idx) => {
        if (idx === updatedMessagesWithUser.length - 1) {
          return { role: m.role, parts: [...parts, { text: m.text }] };
        }
        return { role: m.role, parts: [{ text: m.text }] };
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: chatHistory,
        config: { 
          systemInstruction, 
          temperature: 0.9,
          tools: [{ googleSearch: {} }] 
        }
      });

      const modelText = response.text || "I am looking into that for you.";
      const modelMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', text: modelText };
      
      setNodes(prev => prev.map(n => n.id === nodeId ? { 
        ...n, 
        metadata: { ...n.metadata, messages: [...updatedMessagesWithUser, modelMsg] } 
      } : n));
    } catch (error) {
      console.error("AI Error:", error);
      setNodes(prev => prev.map(n => n.id === nodeId ? { 
        ...n, 
        metadata: { 
          ...n.metadata, 
          messages: [...updatedMessagesWithUser, { 
            id: crypto.randomUUID(), 
            role: 'model', 
            text: "I hit a snag trying to analyze the links or files. Could you try asking again in a moment?" 
          }] 
        } 
      } : n));
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f8fafc] overflow-hidden relative">
      <Header onSave={handleSave} onClear={handleClear} />
      
      <div className="flex flex-1 relative overflow-hidden">
        <LeftToolbar onAddNode={handleAddNode} />
        
        <ResearchCanvas 
          nodes={nodes} 
          setNodes={setNodes}
          connections={connections}
          setConnections={setConnections}
          onSendMessage={handleSendNodeMessage}
          isAiLoading={isAiLoading}
        />
      </div>
    </div>
  );
};

export default App;
