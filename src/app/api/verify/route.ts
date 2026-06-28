import { createClient } from "@/lib/supabase/server";
import { getActivitySessionId } from "@/lib/activity-session";
import type { NextRequest } from "next/server";
import { addMockActivity } from "@/lib/mock-db-helper";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const sessionId = await getActivitySessionId();
    const { issue_id, issue_title, action } = await request.json();

    if (!issue_id || !action) {
      return Response.json(
        { error: "issue_id and action are required" },
        { status: 400 }
      );
    }

    if (!["still_exists", "resolved"].includes(action)) {
      return Response.json(
        { error: "action must be 'still_exists' or 'resolved'" },
        { status: 400 }
      );
    }

    if (!supabase) {
      // Mock verification mode
      addMockActivity({
        action: action === "resolved" ? "marked resolved" : "verified",
        issue_title: issue_title || "Civic Issue",
        timestamp: new Date().toISOString(),
      });
      return Response.json({
        verification_count: 5,
        confidence: 90,
        status: "unchanged",
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!UUID_RE.test(issue_id)) {
      const { error: activityError } = await supabase.from("user_activities").insert({
        user_id: user?.id ?? null,
        session_id: sessionId,
        issue_id: null,
        issue_title: issue_title || "Civic issue",
        action: action === "resolved" ? "marked resolved" : "verified",
        metadata: { verification_action: action, source_issue_id: issue_id },
      });

      if (activityError) {
        return Response.json({ error: activityError.message }, { status: 500 });
      }

      return Response.json({
        verification_count: 1,
        confidence: 90,
        status: action === "resolved" ? "resolved" : "verified",
      });
    }

    const { data: issueForActivity } = await supabase
      .from("issues")
      .select("title")
      .eq("id", issue_id)
      .single();

    const { error: verifyError } = user
      ? await supabase
          .from("verifications")
          .upsert(
            { issue_id, user_id: user.id, session_id: sessionId, action },
            { onConflict: "issue_id,user_id" }
          )
      : await supabase
          .from("verifications")
          .upsert(
            { issue_id, session_id: sessionId, action },
            { onConflict: "issue_id,session_id" }
          );

    if (verifyError) {
      return Response.json({ error: verifyError.message }, { status: 500 });
    }

    const { data: verifications } = await supabase
      .from("verifications")
      .select("action")
      .eq("issue_id", issue_id);

    const total = verifications?.length || 0;
    const stillExists = verifications?.filter(
      (v) => v.action === "still_exists"
    ).length || 0;
    const resolved = verifications?.filter(
      (v) => v.action === "resolved"
    ).length || 0;

    const confidence = total > 0 ? Math.round((Math.max(stillExists, resolved) / total) * 100) : 50;

    const newStatus =
      resolved >= 5 && resolved > stillExists * 2 ? "resolved" : undefined;

    const updateData: Record<string, unknown> = {
      verification_count: total,
      confidence,
      affected_citizens: total,
      updated_at: new Date().toISOString(),
    };

    if (newStatus) {
      updateData.status = newStatus;
    }

    await supabase.from("issues").update(updateData).eq("id", issue_id);

    await supabase.from("timeline_events").insert({
      issue_id,
      type: action === "resolved" ? "resolved" : "verified",
      description:
        action === "resolved"
          ? `Marked as resolved by citizen`
          : `Verified as still existing by citizen`,
    });

    await supabase.from("user_activities").insert({
      user_id: user?.id ?? null,
      session_id: sessionId,
      issue_id,
      issue_title: issueForActivity?.title || "Civic issue",
      action: action === "resolved" ? "marked resolved" : "verified",
      metadata: { verification_action: action },
    });

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("issues_verified, impact_score")
        .eq("id", user.id)
        .single();

      const currentVerified = profile?.issues_verified || 0;

      await supabase
        .from("profiles")
        .update({
          issues_verified: currentVerified + 1,
          impact_score: (profile?.impact_score || 0) + 3,
        })
        .eq("id", user.id);
    }

    return Response.json({
      verification_count: total,
      confidence,
      status: newStatus || "unchanged",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return Response.json(
      { error: "Failed to verify issue" },
      { status: 500 }
    );
  }
}
