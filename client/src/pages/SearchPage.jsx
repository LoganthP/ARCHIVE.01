import React from 'react';
import PaperCard from '../components/PaperCard';

const EXAMPLE_QUERIES = [
  'transformer architecture for natural language processing',
  'reinforcement learning in robotics',
  'graph neural networks for molecular property prediction',
  'few-shot learning with large language models',
  'diffusion models for image generation',
];

export default function SearchPage({ query, results, loading, onSearch }) {
  const handleExampleClick = (example) => {
    if (onSearch) onSearch(example);
  };

  const hasSearched = !!query;

  return (
    <div className="page-enter space-y-12">
      {/* Search Hero */}
      <div className="relative">
        <div className="relative text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-secondary/15 border border-secondary/20 text-xs font-metadata text-secondary mb-4 uppercase tracking-widest">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: '"FILL" 1' }}>
              auto_awesome
            </span>
            Gemini Embeddings Index v4
          </div>
          <h2 className="font-display-lg text-display-lg text-gray-900 dark:text-on-surface mb-2">
            Semantic Index Query
          </h2>
          <p className="font-body-mono text-body-mono text-gray-600 dark:text-on-surface-variant max-w-2xl">
            Find papers by meaning and abstract similarity, rather than rigid keyword matching. Search results are mapped in an in-memory cosine vector store.
          </p>
        </div>

        {/* Example Queries (Before Search or as helper) */}
        {!hasSearched && !loading && (
          <div className="mt-12 space-y-6">
            <h4 className="font-label-caps text-label-caps text-gray-500 dark:text-on-surface-variant uppercase tracking-widest border-b border-gray-200 dark:border-steel-blue/30 pb-3">
              SUGGESTED SEMANTIC INQUIRIES
            </h4>
            <div className="flex flex-col gap-3 max-w-2xl">
              {EXAMPLE_QUERIES.map((example) => (
                <button
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  className="font-body-mono text-body-mono text-left px-5 py-3 bg-white dark:bg-surface-container-low border border-gray-300 dark:border-steel-blue/40 text-gray-800 dark:text-on-surface-variant hover:border-secondary hover:text-secondary hover:shadow-[0_0_8px_rgba(255,185,90,0.15)] transition-all duration-200"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-6">
          <div className="h-4 w-1/4 bg-gray-200 dark:bg-surface-variant animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-surface-container-low border border-gray-300 dark:border-steel-blue p-6 relative overflow-hidden animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-grow space-y-2">
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-surface-variant" />
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-surface-variant" />
                </div>
                <div className="h-10 w-16 bg-gray-200 dark:bg-surface-variant" />
              </div>
              <div className="h-1 w-full bg-gray-200 dark:bg-surface mb-4" />
              <div className="h-16 w-full bg-gray-200 dark:bg-surface-variant" />
            </div>
          ))}
        </div>
      )}

      {/* Results View */}
      {!loading && results && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-300 dark:border-steel-blue/30 pb-4">
            <p className="font-body-mono text-body-mono text-gray-600 dark:text-on-surface-variant">
              FOUND <span className="text-gray-900 dark:text-on-surface font-bold">{results.results.length}</span> RELEVANT DOCUMENTS FOR QUERY:
            </p>
            <span className="badge-primary font-mono text-xs px-3 py-1 text-secondary uppercase font-bold tracking-wider">
              &ldquo;{results.query}&rdquo;
            </span>
          </div>

          {/* Results List */}
          {results.results.length === 0 ? (
            <div className="bg-white dark:bg-surface-container-low border border-gray-300 dark:border-steel-blue p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-on-surface-variant mb-4">
                search_off
              </span>
              <h3 className="font-headline-md text-headline-md text-gray-900 dark:text-on-surface mb-2">
                No matching documents found
              </h3>
              <p className="font-body-mono text-body-mono text-gray-500 dark:text-on-surface-variant max-w-md mx-auto">
                No indexed items exceed the minimum similarity match threshold for this semantic query.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.results.map((paper, index) => (
                <div key={paper.id} className="relative pl-0 lg:pl-10">
                  {/* Numerical index display on wide screens */}
                  <div className="absolute -left-6 top-6 hidden lg:flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-surface font-metadata text-metadata text-gray-500 dark:text-on-surface-variant border border-gray-300 dark:border-steel-blue/50">
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                  <PaperCard paper={paper} onDeleted={() => {}} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visual Infographics for System architecture */}
      {!hasSearched && !loading && (
        <div className="border-t border-gray-300 dark:border-steel-blue/30 pt-12">
          <h4 className="font-label-caps text-label-caps text-gray-500 dark:text-on-surface-variant uppercase tracking-widest mb-6">
            HOW SEMANTIC PIPELINE WORKS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-body-mono text-body-mono">
            {[
              {
                step: '01',
                title: 'TEXT EMBEDDING',
                desc: 'Papers abstracts are processed via Google text-embedding-004 model into high-dimensional numerical arrays representing abstract conceptual meaning.',
              },
              {
                step: '02',
                title: 'QUERY VECTOR',
                desc: 'Your search criteria is embedded in real-time on query execution, creating a dynamic multi-dimensional matching vector.',
              },
              {
                step: '03',
                title: 'COSINE CALCULUS',
                desc: 'Results are computed via vector dot product similarity scoring. Ranks are compiled and returned in strict similarity index descending order.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white dark:bg-surface-container-low border border-gray-300 dark:border-steel-blue/40 p-6">
                <span className="font-metadata text-metadata text-secondary font-bold mb-3 block">
                  {item.step}
                </span>
                <h5 className="font-label-caps text-label-caps text-gray-900 dark:text-on-surface mb-2 font-bold">
                  {item.title}
                </h5>
                <p className="font-body-mono text-body-mono text-gray-500 dark:text-on-surface-variant leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
