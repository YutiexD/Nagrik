import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      // Return empty so the client uses mock data
      return Response.json([]);
    }

    const { searchParams } = request.nextUrl;

    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

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

    const issues = (data || []).map((issue) => ({
      ...issue,
      timeline: issue.timeline_events || [],
    }));

    return Response.json(issues);
  } catch (error) {
    console.error("Issues fetch error:", error);
    return Response.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!supabase) {
      // Offline/Mock mode submission success
      return Response.json({
        id: "mock-" + Math.random().toString(36).substr(2, 9),
        title: body.title,
        description: body.description,
        category: body.category,
        severity: body.severity,
        priority_score: body.priority_score || 50,
        confidence: 85,
        affected_citizens: 1,
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { status: 201 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: issue, error } = await supabase
      .from("issues")
      .insert({
        user_id: user.id,
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

    await supabase.from("timeline_events").insert({
      issue_id: issue.id,
      type: "reported",
      description: "Issue first reported",
    });

    await supabase
      .from("profiles")
      .update({
        reports_created: user.user_metadata?.reports_created
          ? user.user_metadata.reports_created + 1
          : 1,
      })
      .eq("id", user.id);

    return Response.json(issue, { status: 201 });
  } catch (error) {
    console.error("Issue creation error:", error);
    return Response.json({ error: "Failed to create issue" }, { status: 500 });
  }
}
