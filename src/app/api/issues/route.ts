import { createClient } from "@/lib/supabase/server";
import { getActivitySessionId } from "@/lib/activity-session";
import type { NextRequest } from "next/server";
import { getMockDb, addMockIssue, addMockActivity } from "@/lib/mock-db-helper";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;

    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    if (!supabase) {
      const db = getMockDb();
      let issues = [...db.issues];
      
      if (category) issues = issues.filter(i => i.category === category);
      if (status) issues = issues.filter(i => i.status === status);
      
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const cosLat = Math.cos(lat * Math.PI / 180);
        issues = issues.sort((a, b) => {
          const dyA = a.latitude - lat;
          const dxA = (a.longitude - lng) * cosLat;
          const distA = dyA * dyA + dxA * dxA;

          const dyB = b.latitude - lat;
          const dxB = (b.longitude - lng) * cosLat;
          const distB = dyB * dyB + dxB * dxB;

          return distA - distB;
        });
      }
      
      return Response.json(issues.slice(0, limit));
    }

    let query = supabase
      .from("issues")
      .select("*, timeline_events(*)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    let issues = (data || []).map((issue) => ({
      ...issue,
      timeline: issue.timeline_events || [],
    }));

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const cosLat = Math.cos(lat * Math.PI / 180);
      issues = issues.sort((a, b) => {
        const dyA = a.latitude - lat;
        const dxA = (a.longitude - lng) * cosLat;
        const distA = dyA * dyA + dxA * dxA;

        const dyB = b.latitude - lat;
        const dxB = (b.longitude - lng) * cosLat;
        const distB = dyB * dyB + dxB * dxB;

        return distA - distB;
      });
    }

    return Response.json(issues);
  } catch (error) {
    console.error("Issues fetch error:", error);
    return Response.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const sessionId = await getActivitySessionId();
    const body = await request.json();

    if (!supabase) {
      const newIssue = {
        id: "mock-" + Math.random().toString(36).slice(2, 11),
        title: body.title,
        description: body.description,
        category: body.category,
        severity: body.severity,
        status: "reported",
        priority_score: body.priority_score || 50,
        confidence: 85,
        affected_citizens: 1,
        verification_count: 0,
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        root_cause: body.root_cause || "Pending AI analysis",
        root_cause_confidence: body.root_cause_confidence || 70,
        similar_cases: 0,
        timeline: [
          {
            id: `t-mock-${Date.now()}`,
            type: "reported",
            description: "Issue first reported by citizen",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      addMockIssue(newIssue);
      addMockActivity({
        action: "reported",
        issue_title: newIssue.title,
        timestamp: newIssue.created_at,
      });
      return Response.json(newIssue, { status: 201 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: issue, error } = await supabase
      .from("issues")
      .insert({
        user_id: user?.id ?? null,
        reporter_session_id: sessionId,
        title: body.title,
        description: body.description,
        category: body.category,
        severity: body.severity,
        priority_score: body.priority_score || 50,
        confidence: 50,
        affected_citizens: 1,
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address || "",
        image_url: body.image_url,
        root_cause: body.root_cause,
        root_cause_confidence: body.root_cause_confidence,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const { error: timelineError } = await supabase.from("timeline_events").insert({
      issue_id: issue.id,
      type: "reported",
      description: "Issue first reported",
    });

    if (timelineError) {
      return Response.json({ error: timelineError.message }, { status: 500 });
    }

    const { error: activityError } = await supabase.from("user_activities").insert({
      user_id: user?.id ?? null,
      session_id: sessionId,
      issue_id: issue.id,
      issue_title: issue.title,
      action: "reported",
      metadata: {
        category: issue.category,
        severity: issue.severity,
        upload_type: body.upload_type || "report",
      },
    });

    if (activityError) {
      return Response.json({ error: activityError.message }, { status: 500 });
    }

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("reports_created, impact_score")
        .eq("id", user.id)
        .single();

      await supabase
        .from("profiles")
        .update({
          reports_created: (profile?.reports_created || 0) + 1,
          impact_score: (profile?.impact_score || 0) + 10,
        })
        .eq("id", user.id);
    }

    return Response.json(
      {
        ...issue,
        timeline: [
          {
            id: `timeline-${issue.id}`,
            type: "reported",
            description: "Issue first reported",
            timestamp: issue.created_at,
          },
        ],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Issue creation error:", error);
    return Response.json({ error: "Failed to create issue" }, { status: 500 });
  }
}
