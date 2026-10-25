import { getRequests } from "../../../lib/requests";

// Year and month in UTC, e.g. "2026-8", so the month never shifts with the
// server's time zone.
function monthKey(value) {
  const date = new Date(value);
  return date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1);
}

export async function GET() {
  try {
    const requests = await getRequests();
    const open = requests.filter((request) => request.status !== "Complete");

    // "This month" is the month of the most recent request, not today's date.
    // getRequests() returns newest first, so that's the first row.
    const latestMonth = requests.length > 0 ? monthKey(requests[0].created_at) : null;

    const summary = {
      open_requests: open.length,
      urgent_open: open.filter((request) => request.priority === "Urgent").length,
      completed_this_month: requests.filter(
        (request) =>
          request.status === "Complete" &&
          monthKey(request.created_at) === latestMonth
      ).length,
    };

    return Response.json(summary, { status: 200 });
  } catch (error) {
    console.error("GET /api/summary failed:", error);
    return Response.json(
      { error: "Could not load the summary. Please try again." },
      { status: 500 }
    );
  }
}
