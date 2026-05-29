import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPapers } from '../api/client';
import PaperCard from '../components/PaperCard';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 600, start = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!start || target === 0) return;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, start]);

  return value;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, suffix = '', animated, delay = 0 }) {
  const [active, setActive] = useState(false);
  const displayVal = useCountUp(typeof value === 'number' ? value : 0, 600, active && animated);

  useEffect(() => {
    if (animated) {
      const t = setTimeout(() => setActive(true), delay);
      return () => clearTimeout(t);
    }
  }, [animated, delay]);

  const display = typeof value === 'number' ? displayVal : value;

  return (
    <div className="stat-card group">
      <span className="stat-icon">{icon}</span>
      <div className="stat-number">
        {display}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PapersPage({ onNavigateToUploads }) {
  const [papers, setPapers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statsReady, setStatsReady] = useState(false);

  const loadPapers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPapers(page, 15);
      setPapers(data.papers);
      setPagination(data.pagination);
      setStatsReady(true);
    } catch (err) {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page]);

  const handleAnalysisComplete = (paperId, summary, analyzedAt) => {
    setPapers(prev => prev.map(p =>
      p.id === paperId
        ? { ...p, summary, analyzed_at: analyzedAt }
        : p
    ));
  };

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  // Derived stats
  const totalPapers = pagination?.total ?? 0;
  const analyzedCount = papers.filter((p) => p.hasEmbedding).length;
  const latestYear = papers.reduce((max, p) => (p.year && p.year > max ? p.year : max), 0);
  const embeddingsActive = papers.filter((p) => p.hasEmbedding).length;

  return (
    <div className="page-enter w-full">
      {/* ── A) HEADER ──────────────────────────────────────────────────────── */}
      <div className="catalog-header">
        <div className="catalog-header-left">
          <h2 className="catalog-title">Library Catalog</h2>
          <p className="catalog-subtitle">
            {pagination
              ? `${pagination.total} papers indexed · semantic search active`
              : 'Loading index status…'}
          </p>
        </div>
        <button onClick={onNavigateToUploads} className="btn-add-doc" id="add-document-btn">
          <span className="material-symbols-outlined text-base leading-none">upload_file</span>
          ADD DOCUMENT
        </button>
      </div>

      {/* Amber gradient divider */}
      <div className="catalog-divider" />

      {/* ── B) STATS BAR ───────────────────────────────────────────────────── */}
      <div className="stats-bar">
        <StatCard
          icon="📚"
          label="Total Papers"
          value={totalPapers}
          animated={statsReady}
          delay={0}
        />
        <StatCard
          icon="🔬"
          label="Analyzed"
          value={analyzedCount}
          animated={statsReady}
          delay={80}
        />
        <StatCard
          icon="📅"
          label="Latest Year"
          value={latestYear || '—'}
          animated={latestYear > 0 && statsReady}
          delay={160}
        />
        <StatCard
          icon="🧠"
          label="Embeddings Active"
          value={embeddingsActive}
          animated={statsReady}
          delay={240}
        />
      </div>

      {/* ── C) PAPERS LIST ─────────────────────────────────────────────────── */}
      <div className="mt-10">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '240px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="empty-state-container flex flex-col items-center justify-center py-20 px-6 text-center bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-slate-800 rounded-2xl">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px', opacity: 0.85 }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-slate-800" />
              <line x1="8" y1="21" x2="12" y2="12" />
              <line x1="12" y1="12" x2="16" y2="21" />
              <line x1="12" y1="12" x2="12" y2="21" strokeDasharray="2 2" />
              <path d="M5.5 8.5 l13-3" strokeWidth="2.5" />
              <path d="M17.5 5 l2 1-1 3.5-2-1z" fill="#f59e0b" stroke="none" />
              <circle cx="18.5" cy="5.5" r="1.5" className="fill-white dark:fill-[#0d1117]" stroke="none" />
              <path d="M5.5 8.5 l-2 .5 .2 2 2-.5z" fill="#f59e0b" stroke="none" />
              <circle cx="12" cy="7" r="1" fill="#f59e0b" stroke="none" />
              <circle cx="9" cy="11" r="0.75" fill="#f59e0b" stroke="none" />
              <circle cx="16" cy="10" r="0.75" fill="#f59e0b" stroke="none" />
            </svg>
            <h3 className="font-headline-md text-3xl font-semibold text-gray-900 dark:text-slate-50 mb-3">
              Your semantic library is empty
            </h3>
            <p className="font-body-mono text-xs text-gray-500 dark:text-slate-500 max-w-md leading-relaxed mb-6">
              Upload your first paper to begin indexing
            </p>
            <button
              onClick={onNavigateToUploads}
              className="btn-add-doc"
              style={{ marginTop: 0 }}
            >
              <span className="material-symbols-outlined text-base leading-none">upload_file</span>
              INGEST FIRST PAPER
            </button>
          </div>
        ) : (
          <>
            <div className="papers-list">
              {papers.map((paper, idx) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  index={idx}
                  onDeleted={loadPapers}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary"
                  id="prev-page-btn"
                >
                  ← PREVIOUS
                </button>
                <span className="pagination-label">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="btn-secondary"
                  id="next-page-btn"
                >
                  NEXT →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
