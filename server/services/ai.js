import Groq from 'groq-sdk';
import { pipeline } from '@xenova/transformers';

// ── Groq client (summarization) ──────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Local embedding pipeline (lazy-loaded once per model) ──────────────
let currentModelName = null;
let embedder = null;

async function getEmbedder(modelName = 'text-embedding-3-small') {
  // Map our UI model names to Xenova model names for local testing
  const hfModelName = 
    modelName === 'text-embedding-3-small' ? 'Xenova/all-MiniLM-L6-v2' :
    modelName === 'text-embedding-ada-002' ? 'Xenova/all-MiniLM-L12-v2' :
    'Xenova/jina-embeddings-v2-small-en';

  if (!embedder || currentModelName !== hfModelName) {
    console.log(`Loading local embedding model: ${hfModelName} (first time may take ~30s)...`);
    embedder = await pipeline('feature-extraction', hfModelName);
    currentModelName = hfModelName;
    console.log(`Embedding model ${hfModelName} ready.`);
  }
  return embedder;
}

// ── Deep Research Intelligence Analysis via Groq ──────────────
export async function summarizePaper(abstract, title = '', authors = '') {
  if (!abstract || abstract.trim().length === 0) {
    throw new Error('Cannot summarize empty abstract');
  }

  const context = [
    title   ? `Title: ${title}`     : '',
    authors ? `Authors: ${authors}` : '',
    `Abstract:\n${abstract.substring(0, 7000)}`
  ].filter(Boolean).join('\n\n');

  const systemPrompt = `You are a senior academic research analyst and peer reviewer with expertise across computer science, engineering, and applied sciences. Your job is to produce DEEP, STRUCTURED intelligence reports on research papers that help students understand, evaluate, and build upon the work. Always respond with valid JSON only. No markdown. No backticks. No preamble.`;

  const userPrompt = `Analyze this research paper. The text below may be a full 
paper or just the abstract. Extract ALL metadata you can find directly in the text.

CRITICAL EXTRACTION RULES:
- For "authorList": scan the text for real author names (look near the title, 
  before "Abstract", or in "Author Contributions" section). 
  NEVER return "Unknown Author" if real names exist in the text.
- For "affiliationHint": look for university/institution names near author names.
- For "venue": look for journal name, conference name, DOI, ISSN, or publisher.
- For "estimatedEra": find "Received:", "Published:", "©", or year in DOI/citation.
- For "inferredTitle": extract the actual paper title from the text, clean OCR artifacts.

If the text contains phrases like "Unknown Author" or "[Please refine]" — 
IGNORE those placeholders and scan deeper in the text for real metadata.

Return ONLY valid JSON. No markdown. No backticks.

{
  "paperIdentity": {
    "inferredTitle": "Clean formatted title (fix any OCR artifacts)",
    "venue": "Journal or conference name if detectable, else 'Not specified'",
    "publicationType": "journal | conference | preprint | workshop | thesis",
    "domain": "Primary research domain (e.g. Computer Vision, NLP, Robotics)",
    "subfields": ["subfield1", "subfield2", "subfield3"]
  },
  "authorship": {
    "authorList": ["Author 1", "Author 2"],
    "authorCount": 0,
    "affiliationHint": "Institutional affiliation if mentioned, else 'Not mentioned'",
    "correspondingAuthorHint": "Name if detectable, else 'Not specified'"
  },
  "paperTimeline": {
    "estimatedEra": "Year or decade the work likely belongs to",
    "isFoundationalWork": true,
    "buildsUpon": ["Prior work 1", "Prior work 2"],
    "supersededBy": "Later work this leads to, or 'Unknown'"
  },
  "researchProfile": {
    "difficulty": "beginner | intermediate | advanced",
    "researchType": "empirical | theoretical | survey | experimental | case-study | hybrid",
    "noveltyScore": 8,
    "impactScore": 9,
    "readingTimeMinutes": 25,
    "mathematicsLevel": "none | basic | intermediate | heavy",
    "codeAvailability": "likely | unlikely | mentioned | not-mentioned"
  },
  "problemStatement": {
    "coreProblem": "Detailed description of the exact problem being solved (2-3 sentences)",
    "whyItWasUnsolved": "Why previous approaches failed or were insufficient (1-2 sentences)",
    "realWorldContext": "The practical scenario or application driving this problem (1-2 sentences)",
    "researchQuestion": "The central research question this paper answers (1 sentence)"
  },
  "proposedSolution": {
    "solutionName": "Name of the proposed method, model, or framework",
    "coreIdea": "The key insight or idea that makes this solution work (2-3 sentences)",
    "innovationOver": "What specifically it improves over prior work (1-2 sentences)",
    "architectureOrDesign": "High-level description of the system/model architecture (2-3 sentences)"
  },
  "methodology": {
    "approach": "Detailed methodology description (2-3 sentences)",
    "datasetUsed": ["Dataset 1", "Dataset 2"],
    "evaluationMetrics": ["Metric 1", "Metric 2", "Metric 3"],
    "baselineComparisons": ["Baseline 1", "Baseline 2"],
    "experimentalSetup": "Brief description of how experiments were conducted (1-2 sentences)"
  },
  "keyFindings": [
    { "finding": "Finding description", "significance": "Why this finding matters" }
  ],
  "contributions": {
    "primary": "The single most important contribution (1 sentence)",
    "secondary": ["Secondary contribution 1", "Secondary contribution 2"],
    "openSourced": "Yes / No / Not mentioned",
    "reproducible": "Easy / Hard / Not discussed"
  },
  "critique": {
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "limitations": "Main limitations acknowledged or inferred (2 sentences)",
    "assumptions": ["Assumption 1", "Assumption 2"],
    "reviewerVerdict": "Accept | Weak Accept | Borderline | Weak Reject",
    "reviewerRationale": "1-2 sentence rationale for the verdict"
  },
  "impact": {
    "whyItMatters": "Real-world or scientific significance (2 sentences)",
    "industrialApplications": ["Application 1", "Application 2"],
    "citationWorthiness": "High | Medium | Low",
    "influencedFields": ["Field 1", "Field 2"]
  },
  "futureDirections": {
    "openProblems": ["Open problem 1", "Open problem 2"],
    "suggestedExtensions": ["Extension 1", "Extension 2"],
    "relatedPapers": ["Related work 1", "Related work 2"]
  },
  "studentGuide": {
    "tldr": "One punchy sentence for a non-expert",
    "prerequisiteKnowledge": ["Prereq 1", "Prereq 2", "Prereq 3"],
    "keyTermsToLearn": ["Term 1", "Term 2", "Term 3"],
    "howToReadIt": "Recommended reading strategy (which sections to focus on)",
    "discussionQuestions": [
      "Discussion question 1?",
      "Discussion question 2?",
      "Discussion question 3?"
    ]
  }
}

Paper text to analyze:
${context.substring(0, 7000)}`;

  try {
    const chat = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   }
      ],
      max_tokens: 2000,
      temperature: 0.15,
      response_format: { type: 'json_object' }
    });

    const raw = chat.choices[0]?.message?.content?.trim();
    const parsed = JSON.parse(raw);
    return parsed;

  } catch (err) {
    console.error('Groq deep analysis error:', err?.message);
    if (err instanceof SyntaxError) throw new Error('AI returned malformed JSON. Retry.');
    if (err?.status === 401) throw new Error('Invalid Groq API key.');
    if (err?.status === 429) throw new Error('Rate limit hit. Wait a moment and retry.');
    throw new Error(`Analysis failed: ${err?.message}`);
  }
}

// ── Document embedding (local, no API key needed) ─────────────
export async function generateEmbedding(text, modelName) {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text');
  }
  try {
    const embed = await getEmbedder(modelName);
    const output = await embed(text.substring(0, 4000), {
      pooling: 'mean',
      normalize: true
    });
    return Array.from(output.data);
  } catch (err) {
    console.error('Embedding error:', err?.message);
    throw new Error(`Embedding failed: ${err?.message}`);
  }
}

// ── Query embedding (same model, same dimensions) ─────────────
export async function generateQueryEmbedding(text, modelName) {
  return generateEmbedding(text, modelName);
}

// ── RAG Chat Completion (Streaming) ─────────────
export async function streamChatCompletion(messages, onChunk, onDone, onError) {
  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      max_tokens: 3000,
      temperature: 0.5,
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        if (onChunk) onChunk(content);
      }
    }
    if (onDone) onDone(fullContent);
  } catch (err) {
    let errorMsg = err?.message || 'Unknown error occurred';
    if (err?.status === 401) errorMsg = 'Invalid Groq API key (401). Please update it in settings.';
    if (err?.status === 413) errorMsg = 'Prompt exceeds token budget (413 Payload Too Large).';
    if (err?.status === 429) errorMsg = 'Rate limit hit for Groq API (429). Please wait a moment and try again.';
    console.error('Groq chat stream error:', errorMsg);
    if (onError) onError(new Error(errorMsg));
  }
}
