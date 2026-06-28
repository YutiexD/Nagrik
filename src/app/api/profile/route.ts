import { getMockDb } from "@/lib/mock-db-helper";
import { createClient } from "@/lib/supabase/server";
import { getActivitySessionId } from "@/lib/activity-session";
import { mockProfile } from "@/lib/mock-data";

function buildOrFilter(userId: string | undefined, sessionId: string) {
  if (userId) return `user_id.eq.${userId},session_id.eq.${sessionId}`;
  return `session_id.eq.${sessionId}`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const sessionId = await getActivitySessionId();

    if (!supabase) {
      const db = getMockDb();
      const reportsCreated = db.issues.length;
      const issuesVerified = db.activities.filter(
        (activity) => activity.action === "verified" || activity.action === "marked resolved"
      ).length;

      // Merge mockProfile activities with DB activities
      const recent_activity = [
        ...db.activities,
        ...mockProfile.recent_activity
      ];

      return Response.json({
        profile: {
          ...mockProfile,
          reports_created: mockProfile.reports_created + reportsCreated,
          issues_verified: mockProfile.issues_verified + issuesVerified,
          recent_activity,
        },
        uploaded_issues: db.issues,
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: storedProfile } = user
      ? await supabase.from("profiles").select("*").eq("id", user.id).single()
      : { data: null };

    const activityFilter = buildOrFilter(user?.id, sessionId);

    const [{ data: activities }, { data: uploadedIssues }] = await Promise.all([
      supabase
        .from("user_activities")
        .select("id, action, issue_title, created_at")
        .or(activityFilter)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("issues")
        .select("id, title, category, severity, status, address, created_at")
        .or(user ? `user_id.eq.${user.id},reporter_session_id.eq.${sessionId}` : `reporter_session_id.eq.${sessionId}`)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    const reportsCreated = uploadedIssues?.length || storedProfile?.reports_created || 0;
    const issuesVerified =
      activities?.filter((activity) => activity.action === "verified" || activity.action === "marked resolved").length ||
      storedProfile?.issues_verified ||
      0;

    return Response.json({
      profile: {
        id: user?.id || sessionId,
        name: storedProfile?.name || user?.user_metadata?.full_name || "Utsav",
        avatar_url: storedProfile?.avatar_url,
        impact_score: storedProfile?.impact_score || reportsCreated * 10 + issuesVerified * 3,
        reports_created: reportsCreated,
        issues_verified: issuesVerified,
        people_helped: storedProfile?.people_helped || reportsCreated,
        title: storedProfile?.title || "Neighbour Helper",
        recent_activity:
          activities?.map((activity) => ({
            id: activity.id,
            action: activity.action,
            issue_title: activity.issue_title,
            timestamp: activity.created_at,
          })) || [],
      },
      uploaded_issues: uploadedIssues || [],
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return Response.json(
      {
        profile: {
          ...mockProfile,
          name: "Utsav",
          recent_activity: [],
        },
        uploaded_issues: [],
      },
      { status: 200 }
    );
  }
}
