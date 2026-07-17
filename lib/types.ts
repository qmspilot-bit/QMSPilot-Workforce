export type Severity = "critical" | "high" | "medium" | "low";
export type Priority = "urgent" | "high" | "normal" | "low";
export type AgentName = "Pilot" | "Atlas" | "Nexus" | "Forge";

export type WorkProduct = {
  title: string;
  executiveSummary: string;
  workPerformed: string[];
  evidenceConsidered: string[];
  deliverable: string;
  limitations: string[];
  recommendedNextSteps: string[];
  closureEvidence: string[];
  confidence: "high" | "medium" | "low";
  preparedBy: AgentName;
};

export type PilotAnalysis = {
  mode: "live" | "demo";
  generatedAt: string;
  title: string;
  sourceOverview: string;
  executiveSummary: string;
  confidence: "high" | "medium" | "low";
  keyFindings: Array<{
    id: string;
    title: string;
    category: string;
    severity: Severity;
    evidence: string;
    impact: string;
    recommendation: string;
  }>;
  actions: Array<{
    id: string;
    title: string;
    owner: string;
    priority: Priority;
    dueDate: string;
    recommendedAgent: AgentName;
    rationale: string;
    verification: string;
  }>;
  decisionsNeeded: string[];
  risks: Array<{
    risk: string;
    level: Severity;
    mitigation: string;
  }>;
  brief: {
    today: string[];
    next7Days: string[];
    watchlist: string[];
  };
  disclaimer: string;
};
