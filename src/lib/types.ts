export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type IssueCategory =
  | "road_damage"
  | "water"
  | "waste"
  | "lighting"
  | "drainage"
  | "noise"
  | "safety"
  | "other";

export type IssueStatus =
  | "reported"
  | "verified"
  | "in_progress"
  | "resolved";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  priority_score: number;
  confidence: number;
  affected_citizens: number;
  verification_count: number;
  latitude: number;
  longitude: number;
  address: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  root_cause?: string;
  root_cause_confidence?: number;
  similar_cases?: number;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  type: "reported" | "citizens_increased" | "priority_increased" | "verified" | "resolved";
  description: string;
  timestamp: string;
}

export interface FlashAlert {
  id: string;
  title: string;
  description: string;
  severity: "warning" | "critical" | "info";
  affected_population: number;
  timestamp: string;
}

export interface FeedItem {
  id: string;
  icon: string;
  text: string;
  timestamp: string;
  category: IssueCategory;
}

export interface CommunityPulse {
  overall: number;
  categories: {
    name: string;
    score: number;
    icon: string;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  impact_score: number;
  reports_created: number;
  issues_verified: number;
  people_helped: number;
  title: string;
  recent_activity: {
    id: string;
    action: string;
    issue_title: string;
    timestamp: string;
  }[];
}

export interface CityMood {
  summary: string[];
  generated_at: string;
}

export interface PredictiveInsight {
  id: string;
  description: string;
  confidence: number;
  category: IssueCategory;
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  road_damage: "Road Damage",
  water: "Water",
  waste: "Waste",
  lighting: "Lighting",
  drainage: "Drainage",
  noise: "Noise",
  safety: "Safety",
  other: "Other",
};

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

export const CATEGORY_ICONS: Record<IssueCategory, string> = {
  road_damage: "🕳",
  water: "💧",
  waste: "🗑",
  lighting: "💡",
  drainage: "🌊",
  noise: "🔊",
  safety: "🛡",
  other: "📌",
};
