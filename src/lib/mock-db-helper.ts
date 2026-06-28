import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src/lib/db.json");

export interface MockDbIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  priority_score: number;
  confidence: number;
  affected_citizens: number;
  verification_count: number;
  latitude: number;
  longitude: number;
  address: string;
  created_at: string;
  updated_at: string;
  root_cause: string;
  root_cause_confidence: number;
  similar_cases: number;
  timeline: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface MockDbActivity {
  id: string;
  action: "reported" | "verified" | "marked resolved";
  issue_title: string;
  timestamp: string;
}

interface MockDb {
  issues: MockDbIssue[];
  activities: MockDbActivity[];
}

export function getMockDb(): MockDb {
  try {
    if (!fs.existsSync(dbPath)) {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify({ issues: [], activities: [] }, null, 2));
      return { issues: [], activities: [] };
    }
    const raw = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading mock DB:", e);
    return { issues: [], activities: [] };
  }
}

export function saveMockDb(db: MockDb) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Error writing mock DB:", e);
  }
}

export function addMockIssue(issue: MockDbIssue) {
  const db = getMockDb();
  db.issues.unshift(issue);
  saveMockDb(db);
}

export function addMockActivity(activity: Omit<MockDbActivity, "id">) {
  const db = getMockDb();
  const newActivity: MockDbActivity = {
    ...activity,
    id: "act-" + Math.random().toString(36).slice(2, 11),
  };
  db.activities.unshift(newActivity);
  saveMockDb(db);
}
