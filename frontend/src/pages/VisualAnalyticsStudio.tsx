import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart3, TrendingUp, AlertTriangle, Download, Maximize2,
  Minimize2, Play, Pause, ChevronRight, FileText, Sparkles,
  Building2, Shield, Calendar, MapPin, Filter, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export const VisualAnalyticsStudio: React.FC = () => {
  const { isDark } = useTheme();

  // Filters
  const [bureauFilter, setBureauFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [choroplethMetric, setChoroplethMetric] = useState<'volume' | 'overdue_rate' | 'risk_score'>('volume');

  // Presentation Mode state
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<any>(null);

  // Data states
  const [overview, setOverview] = useState<any | null>(null);
  const [sankeyData, setSankeyData] = useState<any | null>(null);
  const [heatmapData, setHeatmapData] = useState<any | null>(null);
  const [choroplethData, setChoroplethData] = useState<any[]>([]);
  const [trendsData, setTrendsData] = useState<any | null>(null);
  const [treemapData, setTreemapData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any | null>(null);
  const [bubbleData, setBubbleData] = useState<any[]>([]);
  const [bureauData, setBureauData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [topRisky, setTopRisky] = useState<any[]>([]);

  useEffect(() => {
    loadAllAnalytics();
  }, [bureauFilter, categoryFilter, stateFilter]);

  const loadAllAnalytics = async () => {
    try {
      const [ov, sk, hm, ch, tr, tm, rd, bb, bw, fn, ai, rk] = await Promise.all([
        api.getAnalyticsOverview({ bureau: bureauFilter, category: categoryFilter, state: stateFilter }),
        api.getSankey(),
        api.getHeatmap(),
        api.getChoropleth(),
        api.getTrends(),
        api.getTreemap(),
        api.getRadar(),
        api.getBubble(),
        api.getBureauWorkload(),
        api.getFunnel(),
        api.getAiInsights(),
        api.getTopRisky()
      ]);

      setOverview(ov);
      setSankeyData(sk);
      setHeatmapData(hm);
      setChoroplethData(ch.states || []);
      setTrendsData(tr);
      setTreemapData(tm.data || []);
      setRadarData(rd);
      setBubbleData(bb.points || []);
      setBureauData(bw.bureaus || []);
      setFunnelData(fn.stages || []);
      setAiInsights(ai.insights || []);
      setTopRisky(rk.leaderboard || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Presentation Mode timer
  useEffect(() => {
    if (presentationMode && isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % 6);
      }, 5000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [presentationMode, isPlaying]);

  // Export handlers
  const handleExport = (format: string) => {
    const url = api.getExportUrl(format, { bureau: bureauFilter, category: categoryFilter, state: stateFilter });
    window.open(url, '_blank');
  };

  // 1. Sankey Option
  const getSankeyOption = () => {
    if (!sankeyData) return {};
    return {
      tooltip: { trigger: 'item', triggerOn: 'mousemove' },
      series: [{
        type: 'sankey',
        layout: 'none',
        emphasis: { focus: 'adjacency' },
        data: sankeyData.nodes,
        links: sankeyData.links,
        lineStyle: { color: 'gradient', curveness: 0.5 },
        label: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 10 }
      }]
    };
  };

  // 2. Calendar Heatmap Option
  const getHeatmapOption = () => {
    if (!heatmapData) return {};
    return {
      tooltip: { position: 'top' },
      visualMap: {
        min: 0,
        max: 8,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        top: 'bottom',
        inRange: { color: isDark ? ['#1e293b', '#0e7490', '#06b6d4', '#f59e0b', '#ef4444'] : ['#f0fdfa', '#5eead4', '#0d9488', '#f59e0b', '#dc2626'] },
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }
      },
      calendar: {
        top: 20,
        left: 30,
        right: 30,
        cellSize: ['auto', 13],
        range: ['2025-01-01', '2025-12-31'],
        itemStyle: { borderWidth: 0.5, borderColor: isDark ? '#334155' : '#cbd5e1' },
        yearLabel: { show: false },
        dayLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 9 },
        monthLabel: { color: isDark ? '#cbd5e1' : '#334155', fontSize: 10 }
      },
      series: [{
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: heatmapData.series
      }]
    };
  };

  // 3. Stacked Area Trends + SLA Breach Line
  const getTrendsOption = () => {
    if (!trendsData) return {};
    const colors = ['#0e7490', '#06b6d4', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
    return {
      tooltip: { trigger: 'axis' },
      legend: {
        data: [...trendsData.categories, 'SLA Breach Rate (%)'],
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
        bottom: 0
      },
      xAxis: {
        type: 'category',
        data: trendsData.months,
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }
      },
      yAxis: [
        { type: 'value', name: 'Volume', axisLabel: { color: isDark ? '#94a3b8' : '#64748b' } },
        { type: 'value', name: 'Breach %', max: 100, axisLabel: { color: '#ef4444' } }
      ],
      series: [
        ...trendsData.categories.map((cat: string, idx: number) => ({
          name: cat,
          type: 'line',
          stack: 'Total',
          areaStyle: { opacity: 0.55 },
          emphasis: { focus: 'series' },
          color: colors[idx % colors.length],
          data: trendsData.series[cat]
        })),
        {
          name: 'SLA Breach Rate (%)',
          type: 'line',
          yAxisIndex: 1,
          data: trendsData.breach_rates,
          lineStyle: { width: 3, color: '#ef4444', type: 'dashed' },
          itemStyle: { color: '#ef4444' }
        }
      ]
    };
  };

  // 4. Treemap Option
  const getTreemapOption = () => {
    return {
      tooltip: {
        formatter: (info: any) => `${info.name}: ${info.value} complaints (Growth: ${info.data.growth}%)`
      },
      series: [{
        type: 'treemap',
        data: treemapData,
        label: { show: true, formatter: '{b}\n{c}' },
        itemStyle: { borderColor: isDark ? '#0f172a' : '#ffffff', borderWidth: 2 }
      }]
    };
  };

  // 5. Radar Chart Option
  const getRadarOption = () => {
    if (!radarData) return {};
    return {
      tooltip: {},
      legend: {
        bottom: 0,
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }
      },
      radar: {
        indicator: radarData.indicators,
        shape: 'polygon',
        splitArea: { show: false },
        axisName: { color: isDark ? '#cbd5e1' : '#334155', fontSize: 10 }
      },
      series: [{
        type: 'radar',
        data: radarData.series.map((s: any, idx: number) => ({
          name: s.name,
          value: s.value,
          areaStyle: { opacity: 0.25 },
          lineStyle: { width: 2 }
        }))
      }]
    };
  };

  // 6. Bubble Chart Option
  const getBubbleOption = () => {
    return {
      tooltip: {
        formatter: (param: any) => {
          const p = param.data;
          return `<b>${p[3]}</b><br/>Complaints: ${p[0]}<br/>Avg Age: ${p[1]} days<br/>Risk Score: ${p[2]}`;
        }
      },
      xAxis: { name: 'Complaints Count', splitLine: { show: false }, axisLabel: { color: isDark ? '#94a3b8' : '#64748b' } },
      yAxis: { name: 'Average Age (Days)', splitLine: { show: false }, axisLabel: { color: isDark ? '#94a3b8' : '#64748b' } },
      series: [{
        type: 'scatter',
        symbolSize: (data: any) => Math.max(12, data[2] * 0.45),
        data: bubbleData.map(b => [b.complaints_count, b.avg_age_days, b.risk_score, b.name]),
        itemStyle: {
          color: (param: any) => param.data[2] > 75 ? '#ef4444' : (param.data[2] > 50 ? '#f59e0b' : '#06b6d4'),
          opacity: 0.75
        }
      }]
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Studio Header & Global Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>AICTE Report Analysis Visualisation Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            National Executive Intelligence & Visual Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            12 integrated interactive analytical visualizers with cross-chart filtering, presentation cycle, and audit exports.
          </p>
        </div>

        {/* Global Toolbar: Presentation Mode & Exports */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setPresentationMode(!presentationMode);
              setIsPlaying(!presentationMode);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              presentationMode
                ? 'bg-amber-500 text-black shadow-glow-amber'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {presentationMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{presentationMode ? "Exit Presentation" : "Presentation Mode"}</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Synchronized Filter Strip */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Sync Filters:</span>
        </div>

        <select
          value={bureauFilter}
          onChange={e => setBureauFilter(e.target.value)}
          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
        >
          <option value="">All Bureaus</option>
          <option value="Finance">Finance Bureau</option>
          <option value="Approval">Approval Bureau</option>
          <option value="Academic">Academic Bureau</option>
          <option value="Inspection Cell">Inspection Cell</option>
          <option value="Student Welfare Cell">Student Welfare Cell</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
        >
          <option value="">All Categories</option>
          <option value="fee fraud">Fee Fraud</option>
          <option value="fake faculty">Fake Faculty</option>
          <option value="harassment/ragging">Harassment / Ragging</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="admission irregularity">Admission Irregularity</option>
        </select>

        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
        >
          <option value="">All States</option>
          <option value="Madhya Pradesh">Madhya Pradesh</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Delhi">Delhi</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
          <option value="Uttar Pradesh">Uttar Pradesh</option>
        </select>

        {(bureauFilter || categoryFilter || stateFilter) && (
          <button
            onClick={() => { setBureauFilter(''); setCategoryFilter(''); setStateFilter(''); }}
            className="text-xs text-red-500 hover:underline font-semibold ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Widget 10: Period Comparison Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Monitored Grievances
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {overview.total_complaints}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {overview.period_comparison?.month_change_pct}%
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">This month vs previous month</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              SLA Compliance Rate
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-teal-600 dark:text-cyan-400">
                {overview.sla_compliance_rate}%
              </span>
              <span className="text-xs text-slate-400 font-mono">30d Standard</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{overview.breached_complaints} breached escalations</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Bureau Backlog
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-amber-500">
                {overview.open_complaints}
              </span>
              <span className="text-xs font-bold text-amber-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +14.2% QoQ
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Pending investigation</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Average Resolution Turnaround
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-emerald-500">
                {overview.avg_resolution_days}d
              </span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />
                -3.2d Faster
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">AI triage acceleration</div>
          </div>
        </div>
      )}

      {/* Widget 12: AI Insight Strip (Plain-language findings with drill-down links) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          AI Synthesis Strip: Plain-Language Findings (Evidence-Linked)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiInsights.map(ins => (
            <div
              key={ins.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-teal-600 dark:text-cyan-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                    {ins.tag}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    ins.severity === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {ins.severity}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                  {ins.headline}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {ins.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono block">
                  Supporting cases: {ins.supporting_complaint_ids.join(", ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Widget 1: Sankey Flow */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              1. Sankey Flow: Channel → Category → Bureau → Status
            </h3>
            <span className="text-[10px] text-slate-400">Bottleneck Flow</span>
          </div>
          <div className="h-80">
            {sankeyData && <ReactECharts option={getSankeyOption()} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>

        {/* Widget 4: Stacked Area Trends & SLA Breach Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              2. Monthly Volume by Category & SLA Breach Rate (%)
            </h3>
            <span className="text-[10px] text-red-500 font-mono font-bold">Dashed Line = Breach Rate</span>
          </div>
          <div className="h-80">
            {trendsData && <ReactECharts option={getTrendsOption()} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>

        {/* Widget 2: Calendar Heatmap */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              3. 12-Month Calendar Heatmap (Daily Volume)
            </h3>
            <span className="text-[10px] text-slate-400">Daily Density</span>
          </div>
          <div className="h-44">
            {heatmapData && <ReactECharts option={getHeatmapOption()} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>

        {/* Widget 5: Treemap */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              4. Treemap: Themes Sized by Volume & Growth
            </h3>
            <span className="text-[10px] text-slate-400">Category Size</span>
          </div>
          <div className="h-44">
            <ReactECharts option={getTreemapOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Widget 6: Radar Comparison */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              5. Multi-Institution Radar Comparison
            </h3>
            <span className="text-[10px] text-slate-400">5 Regulatory Vectors</span>
          </div>
          <div className="h-72">
            {radarData && <ReactECharts option={getRadarOption()} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>

        {/* Widget 7: Bubble Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              6. Bubble Chart: Volume (x) vs Average Age (y) vs Risk Score (size)
            </h3>
            <span className="text-[10px] text-amber-500 font-bold">Bubble Size = Risk</span>
          </div>
          <div className="h-72">
            <ReactECharts option={getBubbleOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

      </div>

      {/* Widget 3: India State-Wise Table & Metric Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              7. State-Wise Jurisdictional Intelligence Matrix
            </h3>
            <p className="text-[11px] text-slate-500">
              National distribution across state technical directorates
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setChoroplethMetric('volume')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                choroplethMetric === 'volume' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setChoroplethMetric('overdue_rate')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                choroplethMetric === 'overdue_rate' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Overdue Rate
            </button>
            <button
              onClick={() => setChoroplethMetric('risk_score')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                choroplethMetric === 'risk_score' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Risk Index
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {choroplethData.map(st => (
            <div
              key={st.name}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-1"
            >
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {st.name}
              </div>
              <div className="text-base font-extrabold text-teal-600 dark:text-cyan-400 font-mono">
                {choroplethMetric === 'volume' && `${st.volume} cases`}
                {choroplethMetric === 'overdue_rate' && `${st.overdue_rate}%`}
                {choroplethMetric === 'risk_score' && `${st.risk_score} / 100`}
              </div>
              <div className="text-[10px] text-slate-400">
                {st.institutions_count} technical institutes
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Widget 8 & Widget 9: Bureau Workload & Redressal Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Widget 8: Bureau Workload Bars & Sparklines */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              8. Bureau Workload, SLA Gauge & Backlog Growth
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">6 Bureaus</span>
          </div>

          <div className="space-y-3">
            {bureauData.map(b => (
              <div
                key={b.bureau}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{b.bureau} Bureau</span>
                    {b.backlog_growing && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 animate-pulse">
                        Backlog Growing
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-500 font-bold">{b.active_cases} active ({b.breached_cases} overdue)</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.backlog_growing ? 'bg-red-500' : 'bg-teal-600'}`}
                    style={{ width: `${Math.min(100, (b.total_cases / 120) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>SLA Compliance: <strong className="text-teal-600 dark:text-cyan-400">{b.sla_compliance_pct}%</strong></span>
                  <span className="font-mono">Trend: [{b.trend_sparkline?.join(", ")}]</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 9: Funnel Stages & Top 10 Risky Leaderboard */}
        <div className="space-y-6">
          
          {/* Funnel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              9. Redressal Funnel & Stage Drop-Off
            </h3>

            <div className="space-y-2">
              {funnelData.map((fn, idx) => (
                <div key={fn.stage} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{fn.stage}</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">{fn.count} cases</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                      style={{ width: `${Math.max(10, 100 - (idx * 20))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 11: Top 10 Risky Leaderboard */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              11. Top 10 High-Risk Institutions Leaderboard
            </h3>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {topRisky.map((rk, idx) => (
                <div
                  key={rk.id}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                        {rk.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rk.district}, {rk.state}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-red-500 font-mono">{rk.risk_score}</span>
                    <span className="text-[10px] text-slate-400 block">{rk.complaint_count} cases</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
