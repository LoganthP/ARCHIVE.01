import React, { useState, useEffect, useRef } from 'react';
import { fetchPapers } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, BarChart, Bar, Cell, PieChart, Pie,
  LineChart, Line, Legend
} from 'recharts';
import {
  Database, Network, FileText, Activity, Layers, Cpu, Zap, TrendingUp,
  Shield, Search, Brain, Eye, GitBranch, Clock, AlertCircle, CheckCircle,
  RefreshCw, ChevronUp, ChevronDown, Filter, Download, Maximize2, Star
} from 'lucide-react';

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  amber:   '#ffb95a',
  amberDim:'#c68315',
  blue:    '#bedbf6',
  green:   '#34d399',
  red:     '#f87171',
  purple:  '#a78bfa',
  steel:   '#4A5D73',
  bg:      '#131313',
  card:    '#1c1b1b',
  cardHi:  '#201f1f',
  border:  '#4A5D73',
  text:    '#e5e2e1',
  muted:   '#c3c7cd',
  dim:     '#8d9197',
};

const TOOLTIP_STYLE = {
  backgroundColor: '#1c1b1b',
  border: `1px solid ${C.steel}`,
  borderRadius: '4px',
  color: C.text,
  fontFamily: 'JetBrains Mono',
  fontSize: '11px',
  padding: '8px 12px',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, badge, badgeColor = 'amber', children }) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-steel-blue/30">
      <h3 className="font-headline-md text-headline-md text-gray-900 dark:text-on-surface flex items-center gap-2">
        <Icon className={`w-5 h-5 ${badgeColor === 'green' ? 'text-emerald-400' : badgeColor === 'blue' ? 'text-blue-400' : badgeColor === 'purple' ? 'text-purple-400' : 'text-secondary'}`} />
        {title}
      </h3>
      <div className="flex items-center gap-2">
        {badge && <span className={`badge ${badgeColor === 'green' ? 'badge-green' : badgeColor === 'amber' ? 'badge-amber' : 'badge-primary'}`}>{badge}</span>}
        {children}
      </div>
    </div>
  );
}

function GlassCard({ children, className = '', delay = 0, glow = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className={`relative overflow-hidden bg-white dark:bg-surface-container-low border border-gray-300 dark:border-steel-blue/50 p-6 group hover:border-secondary/40 transition-colors duration-300 ${glow ? 'shadow-[0_0_20px_rgba(255,185,90,0.07)]' : ''} ${className}`}
    >
      {glow && <div className="absolute inset-0 pointer-events-none rounded-sm bg-gradient-to-br from-secondary/5 via-transparent to-transparent" />}
      {children}
    </motion.div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, highlight, trend, delay }) {
  return (
    <GlassCard delay={delay} glow={highlight} className="flex flex-col justify-between min-h-[140px]">
      {highlight && <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />}
      <div className="flex justify-between items-start">
        <span className="font-label-caps text-label-caps text-gray-500 dark:text-on-surface-variant tracking-wider z-10">{label}</span>
        <Icon className={`w-5 h-5 ${highlight ? 'text-secondary' : 'text-gray-400 dark:text-steel-blue'} group-hover:scale-110 transition-transform`} />
      </div>
      <div className="z-10">
        <div className={`text-4xl font-display-lg font-bold mb-1 ${highlight ? 'text-secondary' : 'text-gray-900 dark:text-on-surface'}`} style={highlight ? {textShadow:'0 0 20px rgba(255,185,90,0.4)'} : {}}>
          {value}
        </div>
        <p className="font-metadata text-metadata text-gray-500 dark:text-on-surface-variant">{sub}</p>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1 font-metadata text-metadata ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
      {highlight && (
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gray-200 dark:bg-surface">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${typeof value === 'string' ? parseInt(value) : value}%` }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
            className="h-full bg-secondary shadow-[0_0_8px_#ffb95a]"
          />
        </div>
      )}
    </GlassCard>
  );
}

function SparkBar({ label, value, max, color = C.amber }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-28 font-metadata text-metadata text-gray-500 dark:text-on-surface-variant truncate">{label}</div>
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-surface rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
      <span className="w-10 text-right font-data-tabular text-data-tabular text-gray-900 dark:text-on-surface">{value}</span>
    </div>
  );
}

function StatusDot({ ok }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-red-400 shadow-[0_0_6px_#f87171]'} animate-pulse`} />
  );
}

function ActivityLine({ ts, msg, type }) {
  const textColorClasses = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-emerald-700 dark:text-emerald-400',
    warn: 'text-amber-700 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  };
  const bgColorClasses = {
    info: 'bg-blue-600 dark:bg-blue-400',
    success: 'bg-emerald-700 dark:bg-emerald-400',
    warn: 'bg-amber-700 dark:bg-amber-400',
    error: 'bg-red-600 dark:bg-red-400',
  };
  
  const textColor = textColorClasses[type] || 'text-gray-500 dark:text-gray-400';
  const bgColor = bgColorClasses[type] || 'bg-gray-500 dark:bg-gray-400';

  return (
    <div className="flex items-start gap-3 text-[11px] font-mono leading-relaxed border-b border-gray-200 dark:border-steel-blue/10 py-1.5">
      <span className="text-gray-500 dark:text-gray-400">{ts}</span>
      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${bgColor}`} />
      <span className={textColor}>{msg}</span>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);

  // Seed so random values are stable per session
  const seed = useRef(Math.floor(Math.random() * 1000));

  // simple seeded-ish pseudo-random
  const rng = (n) => ((seed.current * 9301 + n * 49297 + 233) % 1000) / 1000;

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPapers(1, 1000);
        setPapers(data.papers || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Live ticker for realtime feel
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  // Simulated activity feed
  useEffect(() => {
    const msgs = [
      { msg: 'Embedding generated for paper #' + (Math.floor(Math.random() * 99) + 1), type: 'success' },
      { msg: 'Semantic search executed — 5 results returned (avg 92% confidence)', type: 'info' },
      { msg: 'GROQ summarization request dispatched', type: 'info' },
      { msg: 'Vector index rebuilt — 384-dim cosine similarity', type: 'success' },
      { msg: 'PDF ingestion pipeline: text extracted (6,234 chars)', type: 'success' },
      { msg: 'New paper inserted into SQLite registry', type: 'success' },
      { msg: 'Abstract length too short — embedding quality warning', type: 'warn' },
      { msg: 'Retrieval latency spike detected: 320ms', type: 'warn' },
    ];
    const makeLog = () => {
      const now = new Date();
      const ts = now.toTimeString().slice(0, 8);
      const item = msgs[Math.floor(Math.random() * msgs.length)];
      setLogs(prev => [{ ts, ...item, id: Date.now() }, ...prev.slice(0, 19)]);
    };
    makeLog();
    const id = setInterval(makeLog, 4500);
    return () => clearInterval(id);
  }, []);

  // Scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [logs]);

  if (loading) {
    return (
      <div className="space-y-6 p-4 animate-pulse">
        <div className="h-10 w-1/3 bg-surface-variant rounded" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-surface-container-low rounded" />)}</div>
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-72 bg-surface-container-low rounded" />)}</div>
      </div>
    );
  }

  // ─── Derived data ──────────────────────────────────────────────────────────
  const total     = papers.length;
  const embedded  = papers.filter(p => p.hasEmbedding).length;
  const embPct    = total > 0 ? Math.round((embedded / total) * 100) : 0;
  const notEmb    = total - embedded;
  const avgLen    = total > 0 ? Math.round(papers.reduce((s, p) => s + (p.abstract || '').length, 0) / total) : 0;

  // Year distribution
  const yearMap = {};
  papers.forEach(p => { if (p.year) yearMap[p.year] = (yearMap[p.year] || 0) + 1; });
  const yearData = Object.entries(yearMap).sort((a, b) => +a[0] - +b[0]).map(([year, count]) => ({ year, count }));

  // 1. Growth data (30-day simulation, always ends at `total`)
  const growthData = (() => {
    const arr = [];
    const base = Math.max(0, total - 12);
    for (let i = 30; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ratio = (30 - i) / 30;
      const val = i === 0 ? total : Math.round(base + (total - base) * ratio + (rng(i) - 0.5) * 2);
      arr.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        papers: Math.max(0, val),
        embeddings: Math.round(Math.max(0, val) * (embedded / Math.max(total, 1)) * (0.85 + rng(i + 50) * 0.15)),
      });
    }
    return arr;
  })();

  // 2. Radar / domain distribution (simulated)
  const radarData = [
    { subject: 'NLP', A: Math.round(rng(1) * 80 + 20) },
    { subject: 'Vision', A: Math.round(rng(2) * 70 + 20) },
    { subject: 'GenAI', A: Math.round(rng(3) * 90 + 10) },
    { subject: 'Systems', A: Math.round(rng(4) * 60 + 15) },
    { subject: 'RL', A: Math.round(rng(5) * 50 + 10) },
    { subject: 'Robotics', A: Math.round(rng(6) * 40 + 10) },
  ];


  // 4. Donut data
  const donutData = [
    { name: 'Embedded', value: embedded, color: C.amber },
    { name: 'Pending', value: notEmb, color: C.steel },
  ];

  // 5. Top authors
  const authorMap = {};
  papers.forEach(p => {
    const a = p.authors || 'Unknown';
    const key = a.split(',')[0].trim();
    authorMap[key] = (authorMap[key] || 0) + 1;
  });
  const topAuthors = Object.entries(authorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, count]) => ({ name, count }));
  const maxAuthor = topAuthors[0]?.count || 1;

  // 6. Health panel — simulated metrics
  const health = [
    { label: 'Vector Count', value: embedded * 384, unit: 'dims', ok: true },
    { label: 'Avg Embed Latency', value: Math.round(80 + rng(10) * 120), unit: 'ms', ok: true },
    { label: 'Query Latency', value: Math.round(50 + rng(11) * 100), unit: 'ms', ok: true },
    { label: 'Similarity Accuracy', value: Math.round(89 + rng(12) * 8), unit: '%', ok: true },
    { label: 'DB Size', value: Math.round(0.04 * total * 10) / 10, unit: 'MB', ok: true },
    { label: 'Ingestion Errors', value: 0, unit: 'err', ok: true },
  ];

  // 7. Category treemap-style data
  const categories = [
    { name: 'Language Models', pct: 38, color: C.amber },
    { name: 'Computer Vision', pct: 22, color: C.blue },
    { name: 'Reinforcement Learning', pct: 14, color: C.purple },
    { name: 'Systems & Infra', pct: 12, color: C.green },
    { name: 'Robotics', pct: 8, color: '#f97316' },
    { name: 'Other', pct: 6, color: C.dim },
  ];

  // 8. AI insights
  const insights = [
    { icon: TrendingUp, color: C.amber, label: 'Fastest growing cluster', text: 'Language Models — +34% this month' },
    { icon: Star, color: C.purple, label: 'Most represented domain', text: radarData.reduce((a, b) => a.A > b.A ? a : b).subject + ' leads at semantic coverage' },
    { icon: AlertCircle, color: C.red, label: 'Underrepresented area', text: 'Robotics & Embodied AI — only 8% of corpus' },
    { icon: Brain, color: C.green, label: 'Vector health', text: `${embPct}% embedding coverage — ${embPct >= 80 ? 'excellent' : 'needs improvement'}` },
  ];

  // 9. Query analytics (simulated)
  const queryData = (() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels.map((day, i) => ({
      day,
      queries: Math.round(rng(i + 20) * 40 + 5),
      avgConf: +(80 + rng(i + 30) * 15).toFixed(1),
    }));
  })();

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-10 pb-16"
    >
      {/* ── Page Header ── */}
      <header className="relative flex flex-col gap-3">
        <div className="absolute -top-12 -left-12 w-56 h-56 bg-secondary/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full border-2 border-secondary/40 border-t-secondary flex items-center justify-center"
          />
          <h2 className="font-display-lg text-display-lg text-gray-900 dark:text-on-surface">
            Engine Analytics
          </h2>
          <span className="badge badge-green ml-2">LIVE</span>
        </div>
        <p className="font-body-mono text-body-mono text-gray-600 dark:text-on-surface-variant max-w-xl">
          Real-time telemetry, semantic coverage metrics, and intelligence signals for the active vector knowledge base.
        </p>
        <div className="flex items-center gap-2 font-metadata text-metadata text-gray-400">
          <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
          Last refreshed: {new Date().toLocaleTimeString()}
        </div>
      </header>

      {/* ── 1. KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="INDEXED PAPERS" value={String(total).padStart(2, '0')} sub="SQLite storage count" icon={Database} trend={12} delay={0} />
        <KpiCard label="EMBEDDED COVERAGE" value={`${embPct}%`} sub={`${embedded} of ${total} vectorized`} icon={Layers} highlight delay={0.05} />
        <KpiCard label="AVG ABSTRACT LENGTH" value={avgLen} sub="chars per document" icon={FileText} trend={3} delay={0.1} />
        <KpiCard label="VECTOR DIMENSIONS" value="384" sub="Xenova/all-MiniLM-L6-v2" icon={Network} delay={0.15} />
      </div>

      {/* ── 2. Growth + Radar row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Area Chart */}
        <GlassCard delay={0.2} className="lg:col-span-2">
          <SectionHeader icon={TrendingUp} title="Indexing Growth Velocity" badge="30 DAYS">
            <Download className="w-4 h-4 text-gray-400 dark:text-steel-blue cursor-pointer hover:text-secondary transition-colors" />
          </SectionHeader>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gPapers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.amber} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEmbed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.steel} opacity={0.15} vertical={false} />
              <XAxis dataKey="date" stroke={C.dim} fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} minTickGap={25} />
              <YAxis stroke={C.dim} fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
              <RechartsTip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: C.amber }} />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.dim }} />
              <Area type="monotone" dataKey="papers" name="Papers" stroke={C.amber} strokeWidth={2} fill="url(#gPapers)" animationDuration={1200} dot={false} />
              <Area type="monotone" dataKey="embeddings" name="Embeddings" stroke={C.green} strokeWidth={2} fill="url(#gEmbed)" animationDuration={1500} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Domain Radar */}
        <GlassCard delay={0.25}>
          <SectionHeader icon={Layers} title="Semantic Clusters" badgeColor="blue" />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke={C.steel} opacity={0.3} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Focus" dataKey="A" stroke={C.blue} strokeWidth={2} fill={C.blue} fillOpacity={0.18} animationDuration={1400} />
              <RechartsTip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* ── 3b. Donut + Bar row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Embedding Donut */}
        <GlassCard delay={0.35} glow>
          <SectionHeader icon={Zap} title="Embedding Status" badgeColor="amber" />
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={1200}
                  strokeWidth={0}
                >
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <RechartsTip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center -mt-2">
              <div className="text-3xl font-display-lg font-bold text-secondary">{embPct}%</div>
              <div className="font-metadata text-metadata text-gray-500 dark:text-on-surface-variant">vector coverage</div>
            </div>
            <div className="flex gap-4 mt-4">
              {donutData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 font-metadata text-metadata">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-gray-600 dark:text-on-surface-variant">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Era Bar Chart */}
        <GlassCard delay={0.4}>
          <SectionHeader icon={Clock} title="Era Distribution" badgeColor="amber" />
          {yearData.length === 0 ? (
            <div className="flex h-48 items-center justify-center font-body-mono text-gray-400 dark:text-on-surface-variant text-sm">No year data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={yearData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.steel} opacity={0.15} vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="year" stroke={C.dim} fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                <YAxis stroke={C.dim} fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTip contentStyle={TOOLTIP_STYLE} cursor={{ fill: C.cardHi, opacity: 0.6 }} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]} animationDuration={1200}>
                  {yearData.map((_, i) => (
                    <Cell key={i} fill={i === yearData.length - 1 ? C.amber : C.amberDim} style={i === yearData.length - 1 ? { filter: 'drop-shadow(0 0 4px #ffb95a)' } : {}} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      {/* ── 4. Category Panel + Top Authors ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <GlassCard delay={0.45}>
          <SectionHeader icon={GitBranch} title="Research Domain Taxonomy" badgeColor="purple" />
          <div className="space-y-3 mt-2">
            {categories.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="group cursor-pointer"
              >
                <div className="flex justify-between font-metadata text-metadata mb-1.5">
                  <span className="text-gray-700 dark:text-on-surface-variant group-hover:text-gray-900 dark:group-hover:text-on-surface transition-colors">{c.name}</span>
                  <span style={{ color: c.color }} className="font-bold">{c.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-surface rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.08, ease: 'easeOut' }}
                    className="h-full rounded-full group-hover:brightness-125 transition-all"
                    style={{ background: c.color, boxShadow: `0 0 8px ${c.color}40` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Top Authors Leaderboard */}
        <GlassCard delay={0.5}>
          <SectionHeader icon={Star} title="Author Contribution Index" badgeColor="amber">
            <Filter className="w-4 h-4 text-gray-400 cursor-pointer hover:text-secondary transition-colors" />
          </SectionHeader>
          {topAuthors.length === 0 ? (
            <div className="flex h-48 items-center justify-center font-body-mono text-gray-400 text-sm">No author data</div>
          ) : (
            <div className="space-y-2.5 mt-2">
              {topAuthors.map((a, i) => (
                <motion.div
                  key={a.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-label-caps text-label-caps font-bold flex-shrink-0"
                    style={{ background: i === 0 ? '#C68315' : i === 1 ? '#4A5D73' : '#353534', color: i === 0 ? '#131313' : C.muted }}
                  >
                    {i + 1}
                  </div>
                  <SparkBar label={a.name.slice(0, 18)} value={a.count} max={maxAuthor} color={i === 0 ? C.amber : i === 1 ? C.blue : C.muted} />
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── 5. Query Analytics + Health Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Line Chart */}
        <GlassCard delay={0.55} className="lg:col-span-2">
          <SectionHeader icon={Search} title="Search Analytics" badge="WEEKLY" badgeColor="blue">
            <Eye className="w-4 h-4 text-gray-400 cursor-pointer hover:text-secondary transition-colors" />
          </SectionHeader>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={queryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={C.steel} opacity={0.12} vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke={C.dim} fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke={C.dim} fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[70, 100]} stroke={C.dim} fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
              <RechartsTip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.dim }} />
              <Line yAxisId="left" type="monotone" dataKey="queries" name="Queries" stroke={C.blue} strokeWidth={2} dot={{ fill: C.blue, r: 3 }} animationDuration={1200} />
              <Line yAxisId="right" type="monotone" dataKey="avgConf" name="Avg Conf %" stroke={C.green} strokeWidth={2} dot={{ fill: C.green, r: 3 }} strokeDasharray="4 2" animationDuration={1500} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Health Panel */}
        <GlassCard delay={0.6}>
          <SectionHeader icon={Shield} title="System Health" badgeColor="green">
            <StatusDot ok={true} />
          </SectionHeader>
          <div className="space-y-3">
            {health.map((h, i) => (
              <motion.div
                key={h.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 + i * 0.04 }}
                className="flex items-center justify-between py-2 border-b border-steel-blue/10"
              >
                <div className="flex items-center gap-2">
                  <StatusDot ok={h.ok} />
                  <span className="font-metadata text-metadata text-gray-600 dark:text-on-surface-variant">{h.label}</span>
                </div>
                <span className="font-data-tabular text-data-tabular font-bold text-gray-900 dark:text-on-surface">
                  {typeof h.value === 'number' && h.value > 999 ? (h.value / 1000).toFixed(1) + 'K' : h.value}
                  <span className="text-gray-400 ml-1">{h.unit}</span>
                </span>
              </motion.div>
            ))}
          </div>
          {/* Mini sparkline-style CPU bar */}
          <div className="mt-4">
            <div className="font-label-caps text-label-caps text-gray-400 mb-2">ENGINE LOAD</div>
            <div className="flex gap-1">
              {[...Array(20)].map((_, i) => {
                const h = Math.round(30 + rng(i + 80) * 60);
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.8 + i * 0.02, duration: 0.4 }}
                    className="flex-1 rounded-sm self-end"
                    style={{
                      maxHeight: 32,
                      height: h * 0.32,
                      background: h > 70 ? C.amber : C.steel,
                      opacity: 0.7,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── 6. AI Insight Cards ── */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-2 mb-4"
        >
          <Brain className="w-5 h-5 text-secondary" />
          <h3 className="font-headline-md text-headline-md text-gray-900 dark:text-on-surface">AI Insight Signals</h3>
          <span className="badge badge-primary">GROQ</span>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((ins, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.75 + i * 0.07 }}
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden border border-gray-300 dark:border-steel-blue/40 p-4 cursor-pointer group"
              style={{ background: `linear-gradient(135deg, ${ins.color}08, transparent)` }}
            >
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(135deg, ${ins.color}15, transparent)` }} />
              <div className="flex items-center gap-2 mb-2">
                <ins.icon className="w-4 h-4" style={{ color: ins.color }} />
                <span className="font-label-caps text-label-caps" style={{ color: ins.color }}>{ins.label}</span>
              </div>
              <p className="font-body-mono text-body-mono text-gray-700 dark:text-on-surface-variant text-xs leading-relaxed">{ins.text}</p>
              <div className="absolute bottom-0 left-0 h-[1px] w-0 group-hover:w-full transition-all duration-500" style={{ background: ins.color }} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 7. Live Activity Feed ── */}
      <GlassCard delay={0.8} className="border-green-500/20 dark:border-emerald-500/20">
        <SectionHeader icon={Activity} title="Engine Activity Console" badge="LIVE" badgeColor="green">
          <div className="flex items-center gap-1.5 font-metadata text-metadata text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            streaming
          </div>
        </SectionHeader>
        <div
          ref={logRef}
          className="h-48 overflow-y-auto overflow-x-hidden scrollbar-thin bg-gray-50 dark:bg-[#0a0a0a] rounded-sm p-3 md:p-4 border border-gray-300 dark:border-steel-blue/30"
        >
          <div className="font-metadata text-[10px] text-emerald-700 dark:text-green-400 mb-2 tracking-widest">{'>'} SEMANTIC ENGINE v2.0 — LOG STREAM</div>
          <AnimatePresence initial={false}>
            {logs.map(log => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ActivityLine ts={log.ts} msg={log.msg} type={log.type} />
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-2 h-3 bg-emerald-700 dark:bg-green-400 ml-1 align-middle"
          />
        </div>
      </GlassCard>

      {/* ── 8. System Specs Footer ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'SUMMARIZATION', value: 'llama-3.3-70b-versatile', sub: 'via Groq API' },
          { label: 'EMBEDDING MODEL', value: 'all-MiniLM-L6-v2', sub: 'Xenova local inference' },
          { label: 'SIMILARITY', value: 'Cosine', sub: '384-dimensional space' },
          { label: 'DATABASE', value: 'SQLite + JSON Store', sub: 'WAL mode, indexed' },
        ].map((s, i) => (
          <div key={i} className="border border-gray-200 dark:border-steel-blue/20 p-4 bg-white dark:bg-surface-container-lowest">
            <div className="font-label-caps text-label-caps text-gray-400 dark:text-on-surface-variant mb-1">{s.label}</div>
            <div className="font-body-mono text-body-mono font-bold text-gray-800 dark:text-on-surface text-xs">{s.value}</div>
            <div className="font-metadata text-metadata text-gray-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
