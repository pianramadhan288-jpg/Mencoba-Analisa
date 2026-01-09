import React from 'react';
import { MindNode } from './types';
import { Sparkles, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

interface NodeProps {
  node: MindNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onExpand: (node: MindNode) => void;
  onVisualize: (node: MindNode) => void;
  onDelete: (id: string) => void;
}

const NodeComponent: React.FC<NodeProps> = ({ 
  node, 
  isSelected, 
  onSelect, 
  onExpand, 
  onVisualize,
  onDelete
}) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      style={{ 
        left: node.x, 
        top: node.y,
        transform: 'translate(-50%, -50%)'
      }}
      className={`absolute group cursor-pointer transition-all duration-300 ease-out z-10
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-950 scale-105' : 'hover:scale-102'}
      `}
    >
      <div className={`
        relative px-6 py-4 rounded-2xl shadow-xl border
        ${node.type === 'root' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-100'}
        ${node.isLoading ? 'animate-pulse' : ''}
      `}>
        {node.imageUrl && (
          <img 
            src={node.imageUrl} 
            alt={node.label} 
            className="w-24 h-24 mb-3 rounded-lg object-cover mx-auto shadow-inner"
          />
        )}
        
        <div className="text-center font-medium text-sm md:text-base whitespace-nowrap">
          {node.label}
        </div>

        {/* Action Tooltip/Toolbar */}
        <div className={`
          absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-2 p-1.5 rounded-full bg-slate-900/90 border border-slate-700 shadow-2xl backdrop-blur-md
          transition-opacity duration-200
          ${isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100'}
        `}>
          <button 
            onClick={(e) => { e.stopPropagation(); onExpand(node); }}
            className="p-2 hover:bg-blue-500/20 rounded-full text-blue-400 transition-colors"
            title="AI Expand"
          >
            <Sparkles size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onVisualize(node); }}
            className="p-2 hover:bg-purple-500/20 rounded-full text-purple-400 transition-colors"
            title="AI Visualize"
          >
            <ImageIcon size={16} />
          </button>
          {node.type !== 'root' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="p-2 hover:bg-red-500/20 rounded-full text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeComponent;