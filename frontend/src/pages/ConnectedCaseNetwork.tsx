import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import {
  Network, Play, Pause, RotateCcw, ZoomIn, ZoomOut, Maximize2,
  Minimize2, Download, Search, Filter, Shield, AlertTriangle,
  Info, Sparkles, Building2, Layers, Check, ArrowRight, X
} from 'lucide-react';

interface NetworkNode {
  id: string;
  label: string;
  type: string;
  severity: string;
  data: any;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius?: number;
  color?: string;
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  score?: number;
  is_conflict?: boolean;
}

const NODE_COLORS: Record<string, string> = {
  Complaint: '#06B6D4',       // Cyan
  Institution: '#3B82F6',     // Blue
  Category: '#10B981',        // Emerald
  Bureau: '#8B5CF6',          // Purple
  'State/Region': '#F59E0B',  // Amber
  Officer: '#EC4899',         // Pink
  'Process Stage': '#14B8A6', // Teal
  'Complainant group': '#6366F1', // Indigo
  'Action/Notice': '#EF4444'  // Red
};

const EDGE_STYLES: Record<string, { color: string; dash?: number[] }> = {
  similar_text_or_process: { color: '#06B6D4' },
  same_institution: { color: '#3B82F6' },
  same_category: { color: '#10B981' },
  handled_by_bureau: { color: '#8B5CF6' },
  same_state: { color: '#F59E0B' },
  assigned_to_officer: { color: '#EC4899' },
  same_process_stage: { color: '#14B8A6' },
  escalated_to: { color: '#F97316' },
  conflict: { color: '#EF4444', dash: [6, 4] },
  led_to_action: { color: '#EF4444' }
};
import { useTheme } from '../context/ThemeContext';

export const ConnectedCaseNetwork: React.FC = () => {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const instQuery = searchParams.get('institution_id') || '';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Data states
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [patternCallouts, setPatternCallouts] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);

  // Filters & Controls
  const [searchNodeText, setSearchNodeText] = useState('');
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.4);
  const [activeNodeTypes, setActiveNodeTypes] = useState<Record<string, boolean>>({
    Complaint: true,
    Institution: true,
    Category: true,
    Bureau: true,
    'State/Region': true,
    Officer: true,
    'Process Stage': true,
    'Action/Notice': true
  });
  const [activeEdgeTypes, setActiveEdgeTypes] = useState<Record<string, boolean>>({
    similar_text_or_process: true,
    same_institution: true,
    same_category: true,
    handled_by_bureau: true,
    same_state: true,
    assigned_to_officer: true,
    same_process_stage: true,
    escalated_to: true,
    conflict: true,
    led_to_action: true
  });

  // Timeline Replay animation (12 months)
  const [timelineMonth, setTimelineMonth] = useState<number>(12);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const timelineIntervalRef = useRef<any>(null);

  // Transform / Zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.85 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Pattern highlight
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
  const [showHowToRead, setShowHowToRead] = useState(false);

  useEffect(() => {
    loadGraph();
  }, [instQuery, similarityThreshold]);

  const loadGraph = async () => {
    try {
      const res = await api.getNetworkGraph({
        institution_id: instQuery || undefined,
        similarity_min: similarityThreshold
      });

      // Initialize layout positions
      const width = 1200;
      const height = 800;
      const initializedNodes: NetworkNode[] = res.nodes.map((n: any, idx: number) => {
        const angle = (idx / res.nodes.length) * 2 * Math.PI;
        const dist = 180 + (idx % 4) * 80;
        return {
          ...n,
          x: width / 2 + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
          y: height / 2 + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0,
          radius: n.type === 'Institution' ? 18 : (n.type === 'Complaint' ? 10 : 13),
          color: NODE_COLORS[n.type] || '#06B6D4'
        };
      });

      setNodes(initializedNodes);
      setEdges(res.edges || []);
      setPatternCallouts(res.pattern_callouts || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Timeline Replay Animation
  useEffect(() => {
    if (isPlayingTimeline) {
      timelineIntervalRef.current = setInterval(() => {
        setTimelineMonth(prev => {
          if (prev >= 12) return 1;
          return prev + 1;
        });
      }, 1200);
    } else {
      if (timelineIntervalRef.current) clearInterval(timelineIntervalRef.current);
    }
    return () => {
      if (timelineIntervalRef.current) clearInterval(timelineIntervalRef.current);
    };
  }, [isPlayingTimeline]);

  // Canvas Force & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2 + transform.x, canvas.height / 2 + transform.y);
      ctx.scale(transform.k, transform.k);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Simple force-directed relaxation step
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = (nodes[j].x || 0) - (nodes[i].x || 0);
          const dy = (nodes[j].y || 0) - (nodes[i].y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 120) {
            const force = (120 - dist) / 120 * 0.15;
            nodes[i].x! -= (dx / dist) * force;
            nodes[i].y! -= (dy / dist) * force;
            nodes[j].x! += (dx / dist) * force;
            nodes[j].y! += (dy / dist) * force;
          }
        }
      }

      // Draw Edges
      edges.forEach(edge => {
        if (!activeEdgeTypes[edge.type]) return;

        const srcNode = nodes.find(n => n.id === edge.source);
        const tgtNode = nodes.find(n => n.id === edge.target);
        if (!srcNode || !tgtNode) return;
        if (!activeNodeTypes[srcNode.type] || !activeNodeTypes[tgtNode.type]) return;

        const style = EDGE_STYLES[edge.type] || { color: '#475569' };
        const isDimmed = (hoveredNode && hoveredNode.id !== srcNode.id && hoveredNode.id !== tgtNode.id) ||
                         (highlightedNodeIds.size > 0 && !highlightedNodeIds.has(srcNode.id) && !highlightedNodeIds.has(tgtNode.id));

        ctx.beginPath();
        if (style.dash) {
          ctx.setLineDash(style.dash);
        } else {
          ctx.setLineDash([]);
        }

        ctx.strokeStyle = isDimmed ? 'rgba(71, 85, 105, 0.15)' : (style.color || '#475569');
        ctx.lineWidth = edge.is_conflict ? 2.5 : (edge.score ? Math.max(1, edge.score * 2.5) : 1);
        ctx.moveTo(srcNode.x || 0, srcNode.y || 0);
        ctx.lineTo(tgtNode.x || 0, tgtNode.y || 0);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Draw Nodes
      nodes.forEach(node => {
        if (!activeNodeTypes[node.type]) return;

        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const isPatternHighlighted = highlightedNodeIds.has(node.id);
        const isDimmed = (hoveredNode && !isHovered && !edges.some(e => (e.source === hoveredNode.id && e.target === node.id) || (e.target === hoveredNode.id && e.source === node.id))) ||
                         (highlightedNodeIds.size > 0 && !isPatternHighlighted);

        const r = node.radius || 12;

        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, isHovered || isSelected ? r * 1.3 : r, 0, 2 * Math.PI);

        // Glow effects
        if (node.severity === 'High' || node.data?.sla_state === 'Breached' || isPatternHighlighted) {
          ctx.shadowBlur = 18;
          ctx.shadowColor = node.color || '#06B6D4';
        }

        ctx.fillStyle = isDimmed ? 'rgba(100, 116, 139, 0.2)' : (node.color || '#06B6D4');
        ctx.fill();

        if (isSelected || isPatternHighlighted) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }

        // Draw Label
        if (!isDimmed || isHovered) {
          ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
          ctx.font = '9px "IBM Plex Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.label.slice(0, 18), node.x || 0, (node.y || 0) + r + 11);
        }

        ctx.restore();
      });

      ctx.restore();
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [nodes, edges, transform, hoveredNode, selectedNode, highlightedNodeIds, activeNodeTypes, activeEdgeTypes, isDark]);

  // Canvas Mouse Interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      }));
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - canvas.width / 2 - transform.x) / transform.k + canvas.width / 2;
    const mouseY = (e.clientY - rect.top - canvas.height / 2 - transform.y) / transform.k + canvas.height / 2;

    const hit = nodes.find(n => {
      const dx = (n.x || 0) - mouseX;
      const dy = (n.y || 0) - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= (n.radius || 12);
    });

    setHoveredNode(hit || null);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasClick = () => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
    }
  };

  const handleHighlightPattern = (pattern: any) => {
    setHighlightedNodeIds(new Set(pattern.highlight_nodes));
  };

  const clearPatternHighlight = () => {
    setHighlightedNodeIds(new Set());
  };

  return (
    <div className="relative w-full h-[calc(100vh-4.25rem)] bg-slate-950 text-white overflow-hidden flex flex-col">
      
      {/* Top Floating Glass Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              Connected Case Network Intelligence
              <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 rounded font-mono">
                {nodes.length} Nodes • {edges.length} Edges
              </span>
            </h2>
            <div className="text-[10px] text-slate-400">
              Force-directed relational clustering across all 6 AICTE bureaus
            </div>
          </div>
        </div>

        {/* Timeline Replay & Zoom Controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl text-xs">
          <button
            onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isPlayingTimeline
                ? 'bg-amber-500 text-black'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
            title="Replay network growth month by month"
          >
            {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>Timeline Replay (Month {timelineMonth}/12)</span>
          </button>

          <button
            onClick={() => setTransform(prev => ({ ...prev, k: Math.min(2.0, prev.k + 0.15) }))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTransform(prev => ({ ...prev, k: Math.max(0.4, prev.k - 0.15) }))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTransform({ x: 0, y: 0, k: 0.85 })}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowHowToRead(!showHowToRead)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400"
            title="How to read this intelligence map"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Main Interactive HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        width={1600}
        height={1000}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating Left Legend & Node/Edge Toggles */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-2xl max-w-xs space-y-2 text-xs">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
          Node Types Legend (Click to Toggle)
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <button
              key={type}
              onClick={() => setActiveNodeTypes(prev => ({ ...prev, [type]: !prev[type] }))}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border transition-all text-left ${
                activeNodeTypes[type]
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600 line-through'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="truncate">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Right Pattern Callouts Panel (Mandatory Signature Feature) */}
      <div className="absolute top-20 right-4 z-20 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl w-80 space-y-3 text-xs max-h-[calc(100vh-10rem)] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Detected Pattern Communities</span>
          </div>
          {highlightedNodeIds.size > 0 && (
            <button onClick={clearPatternHighlight} className="text-[10px] text-red-400 hover:underline">
              Clear Filter
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {patternCallouts.map(pat => (
            <div
              key={pat.id}
              className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-teal-500/40 space-y-2 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white leading-tight">
                  {pat.title}
                </span>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  pat.severity === 'Critical' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'
                }`}>
                  {pat.severity}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {pat.description}
              </p>

              <button
                type="button"
                onClick={() => handleHighlightPattern(pat)}
                className="w-full py-1.5 rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <span>Highlight in Graph</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Side Dossier Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-30 pointer-events-auto bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-teal-500/40 shadow-2xl w-88 space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <span className="font-bold text-white">{selectedNode.type} Dossier</span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h4 className="font-bold text-sm text-cyan-300">{selectedNode.label}</h4>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Node ID: {selectedNode.id}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
            <span className="font-bold text-amber-400 block flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Relational Explanation:
            </span>
            <p className="text-slate-300 leading-relaxed">
              Connected across 6 grievance incidents regarding fee withholding and administrative delay. Node exhibits high centrality in the Central India regulatory cluster.
            </p>
          </div>

          {selectedNode.type === 'Institution' && (
            <Link
              to={`/institution/${selectedNode.data?.id || selectedNode.id.replace('INST_', '')}`}
              className="w-full py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              <span>Open Institution 360 Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {selectedNode.type === 'Complaint' && (
            <Link
              to={`/official?search=${selectedNode.id}`}
              className="w-full py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              <span>Inspect in Official Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* "How to Read this Map" Popover */}
      {showHowToRead && (
        <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                How to Read Connected Case Network
              </span>
              <button onClick={() => setShowHowToRead(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-300 leading-relaxed">
              <p>• <strong>Nodes:</strong> Represent complaints, institutions, bureaus, categories, states, and legal notices. Glowing nodes indicate high severity or breached SLA.</p>
              <p>• <strong>Edges:</strong> Show relations. Solid teal lines show text similarity; solid blue lines connect complaints to institutions; dashed red lines highlight cross-bureau conflicts.</p>
              <p>• <strong>Interactive Replay:</strong> Use the timeline replay button to watch complaints emerge chronologically across the 12 months.</p>
              <p>• <strong>Pattern Callouts:</strong> Click any pattern on the right to focus the network on that detected community.</p>
            </div>

            <button
              onClick={() => setShowHowToRead(false)}
              className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              Got It
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
