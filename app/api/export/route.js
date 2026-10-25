import { getRequests, toCsvField } from "../../../lib/requests";

const COLUMNS = [
  "id",
  "created_at",
  "requester_name",
  "location",
  "description",
  "priority",
  "status",
];

export async function GET() {
  try {
    const requests = await getRequests();
    const lines = [
      COLUMNS.join(","),
      ...requests.map((request) =>
        COLUMNS.map((column) => toCsvField(request[column] ?? "")).join(",")
      ),
    ];

    return new Response(lines.join("\r\n") + "\r\n", {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="morrowlane-requests.csv"',
      },
    });
  } catch (error) {
    console.error("GET /api/export failed:", error);
    return Response.json(
      { error: "Could not export requests. Please try again." },
      { status: 500 }
    );
  }
}
