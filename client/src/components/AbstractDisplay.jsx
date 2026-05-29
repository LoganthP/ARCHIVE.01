// components/AbstractDisplay.jsx

import { useState } from 'react';

function cleanClientSide(text) {
  return (text || '')
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬀ/g, 'ff')
    .replace(/\[\d+(?:[,–\-]\d+)*\]/g, '')
    .replace(/[†‡§¶∗]/g, '')
    .replace(/^(?:JOURNAL OF|VOL\.|IEEE|arXiv).+$/gmi, '')
    .replace(/\b([A-Z])\s([A-Z]{2,})\b/g, '$1$2')
    .replace(/(\w{3,})-\s+([a-z]{2,})/g, '$1$2')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function splitIntoParagraphs(text) {
  const clean = cleanClientSide(text);
  
  // If text has real newlines use them
  const byNewline = clean.split(/\n\n+/).filter(p => p.trim().length > 40);
  if (byNewline.length > 2) return byNewline.map(p => p.replace(/\n/g, ' ').trim());

  // Otherwise split by sentence groups (every 3 sentences)
  const sentences = clean
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter(s => s.length > 20);

  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const p = sentences.slice(i, i + 3).join(' ').trim();
    if (p.length > 30) paragraphs.push(p);
  }
  return paragraphs.length ? paragraphs : [clean];
}

export default function AbstractDisplay({ text, expanded, onToggle }) {
  const paragraphs = splitIntoParagraphs(text || '');
  const previewText = cleanClientSide(text || '').substring(0, 280);
  const isLong = (text || '').length > 280;

  return (
    <div className="mt-3">
      {!expanded ? (
        // COLLAPSED: clean 3-line preview
        <p
          className="font-sans text-[13.5px] leading-relaxed text-slate-600 dark:text-on-surface-variant/80 m-0"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {previewText}{isLong && '...'}
        </p>
      ) : (
        // EXPANDED: formatted paragraphs with light/dark adaptive gradient
        <div className="bg-gradient-to-br from-[#faf9f6] to-[#f1efe9] dark:from-[#0a0f1a] dark:to-[#0d1117] border border-amber-900/10 dark:border-[#1e293b] rounded-[10px] px-6 py-5 mt-2 transition-all duration-300 shadow-inner dark:shadow-none">

          {/* Section header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-900/10 dark:border-[#1e293b]">
            <span style={{ fontSize: '16px' }}>📄</span>
            <span className="font-mono text-[10px] font-bold tracking-widest text-amber-700 dark:text-[#f59e0b]">
              ABSTRACT
            </span>
            <span className="ml-auto font-mono text-[10px] text-slate-500 dark:text-on-surface-variant/60">
              {paragraphs.length} paragraph{paragraphs.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Paragraphs with readable serif text based on theme */}
          <div className="flex flex-col gap-3.5">
            {paragraphs.map((para, i) => (
              <p
                key={i}
                className={`font-serif text-[14px] leading-relaxed m-0 text-justify indent-[1.5em] ${
                  i === 0 
                    ? 'text-slate-800 dark:text-slate-100 font-normal' 
                    : 'text-slate-600 dark:text-slate-400 font-light'
                }`}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Reading time estimate */}
          <div className="mt-4 pt-3 border-t border-amber-900/10 dark:border-[#1e293b] flex justify-between items-center">
            <span className="font-mono text-[10px] text-slate-500 dark:text-on-surface-variant/60">
              ~{Math.ceil((text || '').split(' ').length / 200)} min read
            </span>
            <span className="font-mono text-[10px] text-slate-500 dark:text-on-surface-variant/60">
              {(text || '').split(' ').filter(Boolean).length} words
            </span>
          </div>
        </div>
      )}

      {/* Read More / Collapse toggle with responsive contrast hover */}
      {isLong && (
        <button
          onClick={onToggle}
          className="bg-none border-none cursor-pointer flex items-center gap-1 mt-2 font-mono text-[11px] font-bold tracking-wider text-amber-700 hover:text-amber-600 dark:text-[#f59e0b] dark:hover:text-amber-400 p-0 transition-colors duration-200"
        >
          <span
            className="inline-block transition-transform duration-300 ease-in-out"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
          {expanded ? 'COLLAPSE ABSTRACT' : 'READ FULL ABSTRACT'}
        </button>
      )}
    </div>
  );
}
