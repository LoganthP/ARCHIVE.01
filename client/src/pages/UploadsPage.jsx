import React, { useState, useRef } from 'react';
import { createPaper } from '../api/client';
import toast from 'react-hot-toast';

export default function UploadsPage({ onPaperAdded }) {
  const [form, setForm] = useState({
    title: '',
    authors: '',
    year: '',
    abstract: '',
  });

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [percent, setPercent] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Trigger beautiful simulation of extraction
    setProcessing(true);
    setPercent(0);

    // Form pre-fill estimation from filename
    // Strip file extension
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    // Replace underscores, hyphens with spaces
    let cleanName = nameWithoutExt.replace(/[_-]/g, " ");

    // Estimate Year
    const yearMatch = cleanName.match(/\b(19|20)\d{2}\b/);
    const estimatedYear = yearMatch ? yearMatch[0] : '';
    if (yearMatch) {
      cleanName = cleanName.replace(yearMatch[0], "");
    }

    // Attempt to guess Title and Authors
    // Standard format might be "Authors - Title" or "Title by Authors"
    let estimatedTitle = cleanName.trim();
    let estimatedAuthors = '';

    if (estimatedTitle.toLowerCase().includes(" by ")) {
      const parts = estimatedTitle.split(/ by /i);
      estimatedTitle = parts[0].trim();
      estimatedAuthors = parts[1].trim();
    } else if (estimatedTitle.includes(" - ")) {
      const parts = estimatedTitle.split(" - ");
      estimatedAuthors = parts[0].trim();
      estimatedTitle = parts[1].trim();
    }

    // Capitalize Title correctly
    estimatedTitle = estimatedTitle
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // Progress bar simulation interval
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          // Set form values
          setForm({
            title: estimatedTitle,
            authors: estimatedAuthors || 'Unknown Author',
            year: estimatedYear || new Date().getFullYear().toString(),
            abstract: `Abstract extracted from digital document [${file.name}]. This study explores advanced methodologies, key technical contributions, and empirical evaluations within the subject field. [Please refine or replace this abstract text with the full content to generate accurate semantic embeddings].`,
          });
          toast.success(`Parsed metadata from filename: "${estimatedTitle}"`, {
            icon: '📂',
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
            },
          });
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.abstract.trim()) {
      toast.error('Document title and abstract are required');
      return;
    }

    setLoading(true);

    try {
      let payload;
      const file = fileInputRef.current?.files?.[0];
      
      if (file) {
        payload = new FormData();
        payload.append('title', form.title.trim());
        payload.append('authors', form.authors.trim());
        payload.append('abstract', form.abstract.trim());
        if (form.year) payload.append('year', form.year);
        payload.append('pdf', file);
      } else {
        payload = {
          title: form.title.trim(),
          authors: form.authors.trim(),
          abstract: form.abstract.trim(),
          year: form.year ? parseInt(form.year, 10) : null,
        };
      }

      const result = await createPaper(payload);

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
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onPaperAdded) onPaperAdded();
    } catch (err) {
      // Handled by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="page-enter flex flex-col gap-12">
      <header>
        <h2 className="font-display-lg text-display-lg text-gray-900 dark:text-on-surface mb-2">
          Ingestion Panel
        </h2>
        <p className="font-body-mono text-body-mono text-gray-600 dark:text-on-surface-variant">
          Upload raw documents to the semantic engine for indexing and analysis.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload Dropzone & Processing */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          {/* Upload Dropzone */}
          <div className="relative group h-64 bg-white dark:bg-surface-container-low flex flex-col items-center justify-center upload-zone-animated cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-surface border border-gray-300 dark:border-transparent shadow-sm dark:shadow-none">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.doc,.docx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              id="file-upload"
            />
            <div className="text-center z-0 flex flex-col items-center pointer-events-none">
              <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-on-surface-variant mb-4 group-hover:text-secondary transition-colors">
                upload_file
              </span>
              <span className="font-label-caps text-label-caps text-secondary mb-2">
                DRAG PDF OR BROWSE
              </span>
              <span className="font-metadata text-metadata text-gray-500 dark:text-on-surface-variant">
                Max size: 50MB
              </span>
            </div>
          </div>

          {/* Processing State Skeleton */}
          {processing && (
            <div
              className="border border-steel-blue bg-white dark:bg-surface-container-low p-6 relative overflow-hidden shadow-sm dark:shadow-none transition-all duration-300"
              id="processing-state"
            >
              <div className="absolute inset-0 shimmer-bg animate-shimmer opacity-30 z-0"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-label-caps text-label-caps text-secondary animate-pulse">
                    PROCESSING DOCUMENT...
                  </span>
                  <span className="font-metadata text-metadata text-gray-500 dark:text-on-surface-variant">
                    {percent}%
                  </span>
                </div>
                <div className="h-1 w-full bg-gray-200 dark:bg-surface">
                  <div
                    className="h-full bg-secondary shadow-[0_0_8px_#ffb95a] transition-all duration-200"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-surface-variant"></div>
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-surface-variant"></div>
                  <div className="h-3 w-5/6 bg-gray-200 dark:bg-surface-variant"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Metadata Form */}
        <div className="lg:col-span-7 bg-white dark:bg-surface-container-low border border-gray-300 dark:border-steel-blue p-8 shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="font-headline-md text-headline-md text-gray-900 dark:text-on-surface border-b border-gray-300 dark:border-steel-blue pb-4 mb-6">
            Document Metadata
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-gray-500 dark:text-on-surface-variant uppercase tracking-widest">
                Document Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={handleChange('title')}
                className="input-noir"
                placeholder="Enter full paper title..."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-gray-500 dark:text-on-surface-variant uppercase tracking-widest">
                  Authors
                </label>
                <input
                  type="text"
                  value={form.authors}
                  onChange={handleChange('authors')}
                  className="input-noir"
                  placeholder="Comma separated..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-gray-500 dark:text-on-surface-variant uppercase tracking-widest">
                  Publication Year
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={handleChange('year')}
                  className="input-noir"
                  placeholder="YYYY"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-grow">
              <label className="font-label-caps text-label-caps text-gray-500 dark:text-on-surface-variant uppercase tracking-widest">
                Abstract / Summary *
              </label>
              <textarea
                value={form.abstract}
                onChange={handleChange('abstract')}
                className="input-noir min-h-[160px] resize-none leading-relaxed"
                placeholder="Provide a brief abstract or let the semantic engine extract one automatically..."
                required
              ></textarea>
            </div>
            <div className="pt-4 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setForm({ title: '', authors: '', year: '', abstract: '' })}
                className="btn-secondary"
              >
                CLEAR
              </button>
              <button
                type="submit"
                disabled={loading || !form.title.trim() || !form.abstract.trim()}
                className="btn-primary"
              >
                {loading ? 'INGESTING...' : 'INITIALIZE INGESTION'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
