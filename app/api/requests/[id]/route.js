import { updateRequestStatus } from "../../../../lib/requests";

const STATUSES = ["New", "In Progress", "Complete"];

export async function PATCH(request, { params }) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return Response.json(
      { error: "The request body must be valid JSON." },
      { status: 400 }
    );
  }

  const status = typeof body?.status === "string" ? body.status.trim() : "";
  if (!STATUSES.includes(status)) {
    return Response.json(
      { error: "Status must be New, In Progress, or Complete." },
      { status: 400 }
    );
  }

  try {
    const updated = /^\d+$/.test(id)
      ? await updateRequestStatus(Number(id), status)
      : null;
    if (!updated) {
      return Response.json(
        { error: "Request " + id + " was not found." },
        { status: 404 }
      );
    }
    return Response.json({ request: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/requests/" + id + " failed:", error);
    return Response.json(
      { error: "Could not update the status. Please try again." },
      { status: 500 }
    );
  }
}
