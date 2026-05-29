export function cleanPaperText(raw) {
  let text = raw || '';

  // 1. Fix PDF ligature encoding
  text = text
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬀ/g, 'ff')
    .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl').replace(/ﬅ/g, 'st')
    .replace(/\u0000/g, '');

  // 2. Fix broken hyphenated words across lines
  text = text.replace(/(\w{3,})-\s*\n\s*([a-z]{2,})/g, '$1$2');

  // 3. Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 4. Remove page headers/footers (short lines with vol/page info)
  text = text.replace(/^.{0,80}(?:Vol\.|VOL\.|pp\.|IEEE|arXiv|doi:|ISSN).{0,80}$/gmi, '');

  // 5. Remove "JOURNAL OF L A T E X" style spaced-out headers
  text = text.replace(/^[A-Z](\s[A-Z]){4,}.+$/gm, '');

  // 6. Remove citation references like [1], [2,3], [1–4]
  text = text.replace(/\s*\[\d+(?:[,–\-]\d+)*\]/g, '');
  text = text.replace(/\s*\(\d{4}[a-z]?\)/g, '');

  // 7. Remove "Index Terms—...", "Keywords:..." lines
  text = text.replace(/^(?:Index Terms|Keywords?|Key\s*words?)[:\s—–-].+$/gim, '');

  // 8. Remove footnote symbols
  text = text.replace(/[†‡§¶∗•◦]/g, '');

  // 9. Remove standalone numbers (page numbers, figure refs)
  text = text.replace(/^\s*\d+\s*$/gm, '');

  // 10. Remove "F ACE" style OCR artifacts (spaced caps)
  text = text.replace(/\b([A-Z])\s([A-Z]{2,})\b/g, '$1$2');

  // 11. Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  // 12. Trim each line
  text = text.split('\n').map(l => l.trim()).join('\n');

  return text.trim();
}

export function extractAbstractOnly(fullText) {
  const cleaned = cleanPaperText(fullText);

  // Try to find Abstract section
  const abstractMatch = cleaned.match(
    /\bAbstract[:\s—–]+([^\n].+?)(?=\n\n|\bI\.\s|\b1\.\s|\bIntroduction\b)/is
  );

  if (abstractMatch) {
    return abstractMatch[1]
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/Keywords?[:\s].*/i, '')
      .replace(/Index Terms[:\s—].*/i, '')
      .trim();
  }

  // Fallback: take a clean chunk after first 600 chars
  const lines = cleaned.split('\n').filter(l => l.length > 60);
  return lines.slice(0, 8).join(' ').substring(0, 2000).trim();
}

export function formatForDisplay(rawAbstract) {
  let text = cleanPaperText(rawAbstract);

  // Split into readable paragraphs at sentence boundaries (every ~3-4 sentences)
  const sentences = text
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter(s => s.trim().length > 20);

  // Group into paragraphs of ~3 sentences each
  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const para = sentences.slice(i, i + 3).join(' ').trim();
    if (para.length > 30) paragraphs.push(para);
  }

  return paragraphs.length > 1 ? paragraphs : [text];
}
