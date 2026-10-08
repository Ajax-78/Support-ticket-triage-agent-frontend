export type Evidence = {
  source: string;
  section: string;
  quote: string;
};

export type TriageResult = {
  category: string;
  confidence: number;
  priority: "low" | "medium" | "high";
  sentiment: "neutral" | "positive" | "frustrated" | "angry";
  issues: string[];
  escalate: boolean;
  escalation_reason?: string | null;
  draft_reply: string;
  evidence: Evidence[];
  model: string;
  latency_ms: number;
};
