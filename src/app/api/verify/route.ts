import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { issue_id, action } = await request.json();

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
      return Response.json({
        verification_count: 5,
        confidence: 90,
        status: "unchanged",
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: verifyError } = await supabase
      .from("verifications")
      .upsert(
        { issue_id, user_id: user.id, action },
        { onConflict: "issue_id,user_id" }
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("issues_verified")
      .eq("id", user.id)
      .single();

    const currentVerified = profile?.issues_verified || 0;

    await supabase
      .from("profiles")
      .update({ issues_verified: currentVerified + 1 })
      .eq("id", user.id);

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
