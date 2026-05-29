import { useState, useEffect } from 'react';
import { deletePaper, summarizePaper, updatePaperMetadata } from '../api/client';
import ResearchDashboard from './SummaryPanel';
import AbstractDisplay from './AbstractDisplay';
import toast from 'react-hot-toast';
import { HiOutlineXMark, HiOutlineSparkles } from 'react-icons/hi2';

// ── 2. AUTHOR AVATAR CIRCLES ──────────────────────────────────────────────────
function AuthorAvatars({ authors }) {
  if (!authors) return null;
  const names = authors.split(/[,;]/).slice(0, 4).map(n => n.trim());
  const colors = ['#f59e0b', '#06b6d4', '#8b5cf6', '#10b981'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0 10px 0' }}>
      {names.map((name, i) => {
        const initials = name.split(' ')
          .filter(Boolean).slice(0, 2)
          .map(w => w[0]?.toUpperCase()).join('');
        return (
          <div key={i} title={name} style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: colors[i % colors.length] + '22',
            border: `1.5px solid ${colors[i % colors.length]}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 700, color: colors[i % colors.length],
            fontFamily: 'JetBrains Mono'
          }}>{initials}</div>
        );
      })}
      {authors.split(',').length > 4 && (
        <span style={{ color: '#475569', fontSize: '11px', marginLeft: '4px', fontFamily: 'JetBrains Mono' }}>
          +{authors.split(',').length - 4} more
        </span>
      )}
    </div>
  );
}

// Spinner component for loading
function Spinner() {
  return <span className="spinner" />;
}

// Clean abstract utility
const cleanAbstract = (text) => text
  ?.replace(/[†‡§*ø∗]/g, '')
  ?.replace(/\s+/g, ' ')
  ?.trim() || '';

export default function PaperCard({ paper, index = 0, onDeleted, onUpdated, onAnalysisComplete, onDelete }) {
  const [currentPaper, setCurrentPaper] = useState(paper);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [abstractExpanded, setAbstractExpanded] = useState(false);

  // Form State
  const [editForm, setEditForm] = useState({
    title: paper.title || '',
    authors: paper.authors || '',
    abstract: paper.abstract || '',
    year: paper.year || '',
  });
  const [editing, setEditing] = useState(false);

  // ── Persistent Analysis State ──
  const hasSavedAnalysis = paper.summary && paper.summary !== 'null';

  const [analysisData, setAnalysisData] = useState(
    hasSavedAnalysis 
      ? (typeof paper.summary === 'string' ? JSON.parse(paper.summary) : paper.summary) 
      : null
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Persistent open/closed state in localStorage per paper
  const savedOpen = localStorage.getItem(`analysis_open_${paper.id}`);
  const [analysisOpen, setAnalysisOpen] = useState(
    savedOpen ? JSON.parse(savedOpen) : false
  );

  useEffect(() => {
    setCurrentPaper(paper);
    setAnalysisData(
      paper.summary && paper.summary !== 'null'
        ? (typeof paper.summary === 'string' ? JSON.parse(paper.summary) : paper.summary)
        : null
    );
    setEditForm({
      title: paper.title || '',
      authors: paper.authors || '',
      abstract: paper.abstract || '',
      year: paper.year || '',
    });
  }, [paper]);

  const handleToggleAnalysis = () => {
    const nextState = !analysisOpen;
    setAnalysisOpen(nextState);
    localStorage.setItem(`analysis_open_${paper.id}`, JSON.stringify(nextState));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await summarizePaper(paper.id);
      const summary = res.summary;
      const newTs = res.analyzedAt;
      setAnalysisData(summary);
      setAnalysisOpen(true);
      localStorage.setItem(`analysis_open_${paper.id}`, JSON.stringify(true));
      toast.success('Research intelligence report generated!', {
        icon: '🔬',
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
      });
      if (onAnalysisComplete) {
        onAnalysisComplete(paper.id, summary, newTs);
      } else if (onUpdated) {
        onUpdated();
      }
    } catch (err) {
      // Handled by api interceptor
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    setIsDeleting(true);
    try {
      await deletePaper(paper.id);
      toast.success('Paper deleted', {
        icon: '🗑️',
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
      });
      if (onDeleted) onDeleted();
      if (onDelete) onDelete(paper.id);
    } catch (err) {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim() || !editForm.abstract.trim()) {
      toast.error('Title and Abstract are required.');
      return;
    }
    setEditing(true);
    try {
      await updatePaperMetadata(paper.id, {
        title: editForm.title.trim(),
        authors: editForm.authors.trim(),
        abstract: editForm.abstract.trim(),
        year: editForm.year ? parseInt(editForm.year, 10) : null,
      });

      toast.success('Metadata updated & paper re-embedded!', {
        icon: '📝',
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
      });

      setIsEditOpen(false);
      if (onUpdated) onUpdated();
      else if (onDeleted) onDeleted();
    } catch (err) {
      // error handled by api interceptor
    } finally {
      setEditing(false);
    }
  };

  const handleFormChange = (field) => (e) => {
    setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <>
      <article className="paper-card group" data-paper-id={paper.id}>
        {/* Left accent bar/border gradient styled in index.css */}
        <div className="paper-card-accent" />

        <div className="paper-card-body">
          {/* ROW 1: PAPER NUMBER badge, YEAR chip, EMBEDDED status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="paper-index-badge">
              #{String(index + 1).padStart(2, '0')}
            </span>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {hasSavedAnalysis ? (
                <span className="chip-status-analyzed">
                  <span className="chip-dot-green" />
                  ANALYZED
                </span>
              ) : (
                <span className="chip-status-unanalyzed">
                  NOT ANALYZED
                </span>
              )}

              <span className="chip-status-embedded">
                EMBEDDED ✓
              </span>

              {paper.year && (
                <span className="badge-year-chip">
                  {paper.year}
                </span>
              )}
            </div>
          </div>

          {/* TITLE: Large serif Playfair Display */}
          <h3 className="paper-card-title">{paper.title}</h3>

          {/* AUTHORS ROW: Avatars + names */}
          <AuthorAvatars authors={paper.authors} />

          {/* VENUE/DOI: small muted text with journal icon */}
          <div className="paper-venue-row">
            <span className="venue-icon">📰</span>
            <span className="venue-text">
              {paper.journal || 'Neural Information Processing Systems (NeurIPS) · Index arXiv:2403.0182'}
            </span>
          </div>

          {/* Similarity score bar (search results only) */}
          {paper.score !== undefined && (
            <div className="similarity-row">
              <div className="similarity-bar-bg">
                <div
                  className="similarity-bar-fill"
                  style={{ width: `${Math.round(paper.score * 100)}%` }}
                />
              </div>
              <span className="similarity-pct">
                {Math.round(paper.score * 100)}%
                <span className="similarity-label"> match</span>
              </span>
            </div>
          )}

          {/* ABSTRACT: 3-line clamp, clean sans-serif */}
          <AbstractDisplay
            text={cleanAbstract(paper.abstract)}
            expanded={abstractExpanded}
            onToggle={() => setAbstractExpanded((v) => !v)}
          />

          {/* BUTTON ROW FINAL LAYOUT: Bottom of each card */}
          <div className="paper-card-buttons-footer">
            {/* Left Group */}
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={hasSavedAnalysis ? 'btn-footer-secondary' : 'btn-footer-primary-amber'}
              >
                {isAnalyzing ? (
                  <>
                    <Spinner />
                    ANALYZING...
                  </>
                ) : hasSavedAnalysis ? (
                  '🔄 RE-ANALYZE'
                ) : (
                  '🔬 ANALYZE PAPER'
                )}
              </button>
              <button onClick={() => setIsEditOpen(true)} className="btn-footer-secondary">
                ✏️ EDIT
              </button>
            </div>

            {/* Right Group */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {hasSavedAnalysis && (
                <button
                  onClick={handleToggleAnalysis}
                  className="btn-footer-toggle-analysis"
                >
                  <span style={{
                    display: 'inline-block',
                    transition: 'transform 0.3s ease',
                    transform: analysisOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    marginRight: '4px'
                  }}>▼</span>
                  {analysisOpen ? 'HIDE' : 'VIEW ANALYSIS'}
                </button>
              )}
              <button onClick={handleDelete} disabled={isDeleting} className="btn-footer-danger">
                🗑
              </button>
            </div>
          </div>

          {/* ── C) Animated analysis panel expand/collapse ── */}
          <div style={{
            maxHeight: analysisOpen ? '9999px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            marginTop: analysisOpen ? '16px' : '0',
          }}>
            {analysisData && (
              <div style={{ padding: '10px 0 0 0' }}>
                <ResearchDashboard data={analysisData} />
              </div>
            )}
          </div>

        </div>
      </article>

      {/* Edit Metadata Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in text-left">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
            onClick={() => setIsEditOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl glass-card p-0 animate-slide-up overflow-hidden">
            {/* Header gradient */}
            <div className="h-1 bg-gradient-to-r from-secondary/80 to-primary-400" />

            <div className="p-6 sm:p-8">
              {/* Title */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-lg">
                    ✏️
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Edit Paper Metadata</h2>
                    <p className="text-sm text-surface-400">Correct details and re-generate embeddings</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="btn-ghost p-2 -mr-2 text-surface-400 hover:text-white"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Paper Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={handleFormChange('title')}
                    placeholder="e.g., Attention Is All You Need"
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Authors
                    </label>
                    <input
                      type="text"
                      value={editForm.authors}
                      onChange={handleFormChange('authors')}
                      placeholder="e.g., Vaswani et al."
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      value={editForm.year}
                      onChange={handleFormChange('year')}
                      placeholder="e.g., 2017"
                      min="1900"
                      max="2030"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Abstract <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={editForm.abstract}
                    onChange={handleFormChange('abstract')}
                    placeholder="Paste the paper abstract here..."
                    rows={6}
                    className="textarea-field"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-surface-500">
                    <HiOutlineSparkles className="w-3.5 h-3.5 text-secondary" />
                    Local embeddings will re-generate on save
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditOpen(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editing || !editForm.title.trim() || !editForm.abstract.trim()}
                      className="btn-primary"
                    >
                      {editing ? (
                        <>
                          <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Re-embedding...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
