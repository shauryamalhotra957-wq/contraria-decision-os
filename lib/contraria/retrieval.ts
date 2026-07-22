import { evidence as defaultCorpus } from "./data";
import type { EvidenceSource, SearchResult } from "./types";

const VECTOR_SIZE = 96;
const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "in", "is", "it", "of", "on", "or", "the", "to", "what", "when", "will", "with"]);

export function tokenize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9€$%.-]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function embed(value: string) {
  const vector = Array.from({ length: VECTOR_SIZE }, () => 0);
  const tokens = tokenize(value);
  for (const token of tokens) {
    const features = [token, `^${token}`, `${token}$`];
    for (let index = 0; index < token.length - 2; index += 1) features.push(token.slice(index, index + 3));
    for (const feature of features) {
      const hashed = hash(feature);
      const bucket = hashed % VECTOR_SIZE;
      vector[bucket] += hashed & 1 ? 1 : -1;
    }
  }
  const norm = Math.sqrt(vector.reduce((total, valueAtIndex) => total + valueAtIndex ** 2, 0)) || 1;
  return vector.map((valueAtIndex) => valueAtIndex / norm);
}

export function cosine(left: number[], right: number[]) {
  return left.reduce((total, value, index) => total + value * (right[index] ?? 0), 0);
}

function corpusText(item: EvidenceSource) {
  return `${item.title} ${item.body} ${item.tags.join(" ")} ${item.source}`;
}

function bm25Scores(query: string, corpus: EvidenceSource[]) {
  const queryTokens = tokenize(query);
  const documents = corpus.map((item) => tokenize(corpusText(item)));
  const averageLength = documents.reduce((sum, document) => sum + document.length, 0) / Math.max(1, documents.length);
  const k1 = 1.5;
  const b = 0.75;

  return documents.map((document) => {
    const frequencies = new Map<string, number>();
    document.forEach((token) => frequencies.set(token, (frequencies.get(token) ?? 0) + 1));
    return queryTokens.reduce((score, token) => {
      const frequency = frequencies.get(token) ?? 0;
      if (!frequency) return score;
      const docsWithTerm = documents.filter((candidate) => candidate.includes(token)).length;
      const inverseDocumentFrequency = Math.log(1 + (documents.length - docsWithTerm + 0.5) / (docsWithTerm + 0.5));
      const numerator = frequency * (k1 + 1);
      const denominator = frequency + k1 * (1 - b + b * (document.length / Math.max(1, averageLength)));
      return score + inverseDocumentFrequency * (numerator / denominator);
    }, 0);
  });
}

function rank(values: number[]) {
  const indexes = values.map((_, index) => index).sort((a, b) => values[b] - values[a]);
  const ranks = Array.from({ length: values.length }, () => values.length);
  indexes.forEach((documentIndex, position) => { ranks[documentIndex] = position + 1; });
  return ranks;
}

function snippetFor(query: string, body: string) {
  const queryTokens = tokenize(query);
  const lower = body.toLowerCase();
  const firstMatch = queryTokens.map((token) => lower.indexOf(token)).filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, firstMatch - 52);
  const end = Math.min(body.length, start + 196);
  return `${start > 0 ? "…" : ""}${body.slice(start, end).trim()}${end < body.length ? "…" : ""}`;
}

export function hybridRetrieve(query: string, limit = 6, corpus = defaultCorpus): SearchResult[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  const lexical = bm25Scores(normalizedQuery, corpus);
  const queryVector = embed(normalizedQuery);
  const semantic = corpus.map((item) => cosine(queryVector, embed(corpusText(item))));
  const lexicalRanks = rank(lexical);
  const semanticRanks = rank(semantic);
  const reliabilityBoost = corpus.map((item) => item.reliability * 0.025);

  return corpus
    .map((item, index) => {
      const reciprocalRankFusion = 1 / (60 + lexicalRanks[index]) + 1 / (60 + semanticRanks[index]);
      return {
        ...item,
        score: reciprocalRankFusion + reliabilityBoost[index],
        lexicalScore: lexical[index],
        semanticScore: semantic[index],
        snippet: snippetFor(normalizedQuery, item.body),
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.max(1, Math.min(limit, 12)));
}
