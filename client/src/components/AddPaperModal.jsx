import { useState } from 'react';
import { createPaper } from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineXMark, HiOutlineSparkles } from 'react-icons/hi2';

export default function AddPaperModal({ isOpen, onClose, onPaperAdded }) {
  const [form, setForm] = useState({
    title: '',
    authors: '',
    abstract: '',
    year: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createPaper({
        title: form.title,
        authors: form.authors,
        abstract: form.abstract,
        year: form.year ? parseInt(form.year) : null,
      });

      toast.success('Paper added successfully!', {
        icon: '📄',
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #334155',
        },
      });

      if (!result.embeddingGenerated) {
        toast('Embedding could not be generated. Search may not include this paper.', {
          icon: '⚠️',
          style: {
            background: '#1e293b',
            color: '#fbbf24',
            border: '1px solid #334155',
          },
        });
      }

      setForm({ title: '', authors: '', abstract: '', year: '' });
      onPaperAdded();
      onClose();
    } catch (err) {
      // Error toast is handled by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay */}
      <div className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl glass-card p-0 animate-slide-up overflow-hidden">
        {/* Header gradient */}
        <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-emerald-400" />

        <div className="p-6 sm:p-8">
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <HiOutlinePlus className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Research Paper</h2>
                <p className="text-sm text-surface-400">Embeddings generated automatically via Gemini</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost p-2 -mr-2"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Paper Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={handleChange('title')}
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
                  value={form.authors}
                  onChange={handleChange('authors')}
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
                  value={form.year}
                  onChange={handleChange('year')}
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
                value={form.abstract}
                onChange={handleChange('abstract')}
                placeholder="Paste the paper abstract here..."
                rows={6}
                className="textarea-field"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-surface-500">
                <HiOutlineSparkles className="w-3.5 h-3.5 text-primary-400" />
                Gemini will generate embeddings on save
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.title.trim() || !form.abstract.trim()}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating Embedding...
                    </>
                  ) : (
                    <>
                      <HiOutlinePlus className="w-4 h-4" />
                      Add Paper
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
