// ResearchDashboard.jsx — Full academic intelligence dashboard

const DIFFICULTY_STYLE = {
  beginner:     { bg: '#052e16', color: '#4ade80' },
  intermediate: { bg: '#422006', color: '#fb923c' },
  advanced:     { bg: '#3b0764', color: '#c084fc' },
};

const VERDICT_STYLE = {
  'Accept':       { bg: '#052e16', color: '#4ade80' },
  'Weak Accept':  { bg: '#1c1917', color: '#84cc16' },
  'Borderline':   { bg: '#422006', color: '#fbbf24' },
  'Weak Reject':  { bg: '#3b0000', color: '#f87171' },
};

const TYPE_ICON = {
  empirical: '📊', theoretical: '📐', survey: '🗂️',
  experimental: '🧪', 'case-study': '🔍', hybrid: '🔀',
};

export default function ResearchDashboard({ data }) {
  let s;
  try {
    s = typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return (
      <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--on-surface-variant)',
        fontSize: '13px', fontStyle: 'italic', padding: '16px',
        background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: '8px', marginTop: '12px' }}>
        {String(data)}
      </div>
    );
  }
  if (!s) return null;

  // Graceful fallback if it's an old-format flat object (from previous version)
  if (s.tldr && !s.studentGuide) {
    return (
      <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--on-surface)',
        fontSize: '13px', padding: '16px', background: 'var(--surface)',
        border: '1px solid var(--outline-variant)',
        borderRadius: '8px', marginTop: '12px', lineHeight: '1.7' }}>
        <div style={{ color: 'var(--secondary)', fontStyle: 'italic', marginBottom: '8px' }}>
          ⚡ {s.tldr}
        </div>
        {s.coreProblem && <p style={{ margin: '4px 0' }}><strong>🎯 Problem:</strong> {s.coreProblem}</p>}
        {s.keyContribution && <p style={{ margin: '4px 0' }}><strong>💡 Contribution:</strong> {s.keyContribution}</p>}
        {s.whyItMatters && <p style={{ margin: '4px 0' }}><strong>🌍 Impact:</strong> {s.whyItMatters}</p>}
      </div>
    );
  }

  const diff    = DIFFICULTY_STYLE[s.researchProfile?.difficulty] || DIFFICULTY_STYLE.intermediate;
  const verdict = VERDICT_STYLE[s.critique?.reviewerVerdict]      || VERDICT_STYLE['Borderline'];

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      color: 'var(--on-background)', display: 'flex', flexDirection: 'column', gap: '16px',
      marginTop: '16px' }}>

      {/* ── HEADER BADGES ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <Badge bg={diff.bg} color={diff.color}>
          {s.researchProfile?.difficulty?.toUpperCase()}
        </Badge>
        <Badge bg='var(--surface-container-high)' color='var(--on-surface)'>
          {TYPE_ICON[s.researchProfile?.researchType] || '📄'} {s.researchProfile?.researchType}
        </Badge>
        <Badge bg='var(--surface-container-high)' color='var(--on-surface-variant)'>
          ⏱ {s.researchProfile?.readingTimeMinutes} min read
        </Badge>
        <Badge bg='var(--surface-container-high)' color='var(--on-surface-variant)'>
          ∑ Math: {s.researchProfile?.mathematicsLevel}
        </Badge>
        <Badge bg={verdict.bg} color={verdict.color}>
          🧑‍⚖️ {s.critique?.reviewerVerdict}
        </Badge>
        <Badge bg='var(--surface-container-high)' color='var(--on-surface-variant)'>
          📈 Novelty {s.researchProfile?.noveltyScore}/10
        </Badge>
        <Badge bg='var(--surface-container-high)' color='var(--on-surface-variant)'>
          💥 Impact {s.researchProfile?.impactScore}/10
        </Badge>
      </div>

      {/* ── TL;DR ── */}
      <div style={{ borderLeft: '3px solid var(--secondary)', background: 'var(--surface-container-low)',
        borderRadius: '0 6px 6px 0', border: '1px solid var(--outline-variant)', borderLeftWidth: '3px', padding: '12px 12px 12px 16px' }}>
        <SectionLabel>⚡ TL;DR</SectionLabel>
        <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--on-surface)',
          fontSize: '13px', lineHeight: '1.7' }}>{s.studentGuide?.tldr}</p>
      </div>

      {/* ── PAPER IDENTITY & AUTHORSHIP ── */}
      <SectionCard title="👤 Paper Identity & Authorship">
        <TwoCol>
          <InfoBlock label="📰 Venue / Type">
            {s.paperIdentity?.venue} · {s.paperIdentity?.publicationType}
          </InfoBlock>
          <InfoBlock label="🏛️ Domain">
            {s.paperIdentity?.domain}
          </InfoBlock>
          <InfoBlock label="✍️ Authors">
            {s.authorship?.authorList?.join(', ') || 'Not extracted'}
          </InfoBlock>
          <InfoBlock label="🏢 Affiliation">
            {s.authorship?.affiliationHint}
          </InfoBlock>
        </TwoCol>
        <ChipRow label="Subfields" items={s.paperIdentity?.subfields} color='#7dd3fc' />
      </SectionCard>

      {/* ── PAPER TIMELINE ── */}
      <SectionCard title="📅 Paper Timeline & Lineage">
        <TwoCol>
          <InfoBlock label="📆 Estimated Era">{s.paperTimeline?.estimatedEra}</InfoBlock>
          <InfoBlock label="🏛️ Foundational?">
            {s.paperTimeline?.isFoundationalWork ? '✅ Yes' : '❌ No'}
          </InfoBlock>
        </TwoCol>
        <ChipRow label="Builds Upon" items={s.paperTimeline?.buildsUpon} color='#a78bfa' />
        <InfoBlock label="⏩ Leads To">{s.paperTimeline?.supersededBy}</InfoBlock>
      </SectionCard>

      {/* ── PROBLEM STATEMENT ── */}
      <SectionCard title="🎯 Problem Statement">
        <InfoBlock label="Core Problem">{s.problemStatement?.coreProblem}</InfoBlock>
        <InfoBlock label="Why Was It Unsolved?">{s.problemStatement?.whyItWasUnsolved}</InfoBlock>
        <InfoBlock label="Real-World Context">{s.problemStatement?.realWorldContext}</InfoBlock>
        <InfoBlock label="Research Question" highlight>
          {s.problemStatement?.researchQuestion}
        </InfoBlock>
      </SectionCard>

      {/* ── PROPOSED SOLUTION ── */}
      <SectionCard title="💡 Proposed Solution">
        <InfoBlock label={`🔖 Method: ${s.proposedSolution?.solutionName || 'Not named'}`}>
          {s.proposedSolution?.coreIdea}
        </InfoBlock>
        <InfoBlock label="🆕 Innovation Over Prior Work">
          {s.proposedSolution?.innovationOver}
        </InfoBlock>
        <InfoBlock label="🏗️ Architecture / Design">
          {s.proposedSolution?.architectureOrDesign}
        </InfoBlock>
      </SectionCard>

      {/* ── METHODOLOGY ── */}
      <SectionCard title="🔬 Methodology">
        <InfoBlock label="Approach">{s.methodology?.approach}</InfoBlock>
        <InfoBlock label="Experimental Setup">{s.methodology?.experimentalSetup}</InfoBlock>
        <ChipRow label="Datasets"  items={s.methodology?.datasetUsed}          color='#34d399' />
        <ChipRow label="Metrics"   items={s.methodology?.evaluationMetrics}    color='#60a5fa' />
        <ChipRow label="Baselines" items={s.methodology?.baselineComparisons}  color='#f472b6' />
      </SectionCard>

      {/* ── KEY FINDINGS ── */}
      {s.keyFindings?.length > 0 && (
        <SectionCard title="📈 Key Findings">
          {s.keyFindings.map((f, i) => {
            const finding   = typeof f === 'string' ? f : f.finding;
            const signif    = typeof f === 'string' ? null : f.significance;
            return (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '4px',
                background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: '6px', padding: '10px' }}>
                <span style={{ color: 'var(--secondary)', fontWeight: 700, minWidth: '20px' }}>
                  {i + 1}.
                </span>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: 'var(--on-surface)', fontSize: '12px' }}>
                    {finding}
                  </p>
                  {signif && (
                    <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '11px', fontStyle: 'italic' }}>
                      → {signif}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </SectionCard>
      )}

      {/* ── CONTRIBUTIONS ── */}
      <SectionCard title="🏆 Contributions">
        <InfoBlock label="⭐ Primary Contribution" highlight>
          {s.contributions?.primary}
        </InfoBlock>
        <ChipRow label="Secondary" items={s.contributions?.secondary} color='#a78bfa' />
        <TwoCol>
          <InfoBlock label="📦 Open Sourced">{s.contributions?.openSourced}</InfoBlock>
          <InfoBlock label="🔁 Reproducible">{s.contributions?.reproducible}</InfoBlock>
        </TwoCol>
      </SectionCard>

      {/* ── PEER REVIEW CRITIQUE ── */}
      <SectionCard title="🧑‍⚖️ Peer Review Critique">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <SectionLabel>✅ Strengths</SectionLabel>
            {s.critique?.strengths?.map((str, i) => (
              <BulletItem key={i} color='#4ade80'>▸ {str}</BulletItem>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <SectionLabel>⚠️ Weaknesses</SectionLabel>
            {s.critique?.weaknesses?.map((w, i) => (
              <BulletItem key={i} color='#f87171'>▸ {w}</BulletItem>
            ))}
          </div>
        </div>
        <InfoBlock label="📋 Limitations">{s.critique?.limitations}</InfoBlock>
        <ChipRow label="Assumptions" items={s.critique?.assumptions} color='#fbbf24' />
        <div style={{ marginTop: '10px', background: verdict.bg, borderRadius: '6px',
          padding: '10px 14px', border: `1px solid ${verdict.color}30` }}>
          <span style={{ color: verdict.color, fontWeight: 700, fontSize: '12px' }}>
            Verdict: {s.critique?.reviewerVerdict}
          </span>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '11px' }}>
            {s.critique?.reviewerRationale}
          </p>
        </div>
      </SectionCard>

      {/* ── IMPACT ── */}
      <SectionCard title="🌍 Impact & Applications">
        <InfoBlock label="Why It Matters">{s.impact?.whyItMatters}</InfoBlock>
        <ChipRow label="Industrial Applications"
          items={s.impact?.industrialApplications} color='#34d399' />
        <TwoCol>
          <InfoBlock label="📚 Citation Worthiness">{s.impact?.citationWorthiness}</InfoBlock>
        </TwoCol>
        <ChipRow label="Influenced Fields" items={s.impact?.influencedFields} color='#60a5fa' />
      </SectionCard>

      {/* ── FUTURE DIRECTIONS ── */}
      <SectionCard title="🚀 Future Directions">
        <ChipRow label="Open Problems"        items={s.futureDirections?.openProblems}        color='#f472b6' />
        <ChipRow label="Suggested Extensions" items={s.futureDirections?.suggestedExtensions} color='#a78bfa' />
        <ChipRow label="Related Papers"       items={s.futureDirections?.relatedPapers}       color='#7dd3fc' />
      </SectionCard>

      {/* ── STUDENT STUDY GUIDE ── */}
      <SectionCard title="🎓 Student Study Guide">
        <ChipRow label="📚 Prerequisites"      items={s.studentGuide?.prerequisiteKnowledge} color='#34d399' />
        <ChipRow label="🔑 Key Terms to Learn" items={s.studentGuide?.keyTermsToLearn}       color='#fbbf24' />
        <InfoBlock label="📖 How to Read This Paper">
          {s.studentGuide?.howToReadIt}
        </InfoBlock>
        {s.studentGuide?.discussionQuestions?.length > 0 && (
          <div>
            <SectionLabel>💬 Discussion Questions</SectionLabel>
            {s.studentGuide.discussionQuestions.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px',
                background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: '6px', padding: '10px' }}>
                <span style={{ color: 'var(--secondary)', fontWeight: 700, minWidth: '28px' }}>Q{i + 1}.</span>
                <span style={{ color: 'var(--on-surface)', fontSize: '12px' }}>{q}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  );
}

// ── Reusable primitives ────────────────────────────────────────

function Badge({ bg, color, children }) {
  return (
    <span style={{ background: bg, color, padding: '3px 10px', borderRadius: '4px',
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
      {children}
    </span>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', borderRadius: '8px',
      padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ color: 'var(--on-surface)', fontWeight: 700, fontSize: '13px',
        borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px', marginBottom: '4px' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ color: 'var(--steel-blue)', fontSize: '10px', fontWeight: 700,
      letterSpacing: '0.08em', marginBottom: '6px' }}>
      {children}
    </div>
  );
}

function InfoBlock({ label, children, highlight }) {
  return (
    <div style={{
      background:  highlight ? 'color-mix(in srgb, var(--secondary) 8%, var(--surface))' : 'var(--surface)',
      borderRadius: '6px', padding: '10px 12px',
      border: highlight ? '1px solid var(--secondary)' : '1px solid var(--outline-variant)',
    }}>
      <SectionLabel>{label}</SectionLabel>
      <p style={{ margin: 0, color: highlight ? 'var(--on-surface)' : 'var(--on-surface-variant)',
        fontSize: '12px', lineHeight: '1.7' }}>{children}</p>
    </div>
  );
}

function TwoCol({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {children}
    </div>
  );
}

function ChipRow({ label, items, color }) {
  if (!items?.length) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {items.map((item, i) => (
          <span key={i} style={{
            background: 'var(--surface-container-high)', color, fontSize: '11px',
            padding: '3px 10px', borderRadius: '20px',
            border: `1px solid ${color}30`,
          }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function BulletItem({ color, children }) {
  return (
    <p style={{ margin: '0 0 5px 0', color: 'var(--on-surface)', fontSize: '12px',
      display: 'flex', gap: '6px' }}>
      <span style={{ color }}>{children}</span>
    </p>
  );
}
