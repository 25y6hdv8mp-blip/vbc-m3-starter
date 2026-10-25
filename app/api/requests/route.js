import { createRequest, getRequests } from "../../../lib/requests";

const LOCATIONS = ["Minneapolis", "Chicago", "Denver", "Austin"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const MAX_DESCRIPTION_LENGTH = 500;

const REQUIRED_FIELDS = [
  ["requester_name", "Requester name"],
  ["location", "Location"],
  ["description", "Description"],
  ["priority", "Priority"],
];

// Returns a message naming the first field that fails, or null if the
// submission is valid. Expects values that have already been trimmed.
function validate(fields) {
  for (const [key, label] of REQUIRED_FIELDS) {
    if (fields[key] === "") {
      return label + " is required.";
    }
  }
  if (!LOCATIONS.includes(fields.location)) {
    return "Location must be Minneapolis, Chicago, Denver, or Austin.";
  }
  if (!PRIORITIES.includes(fields.priority)) {
    return "Priority must be Low, Medium, High, or Urgent.";
  }
  if (fields.description.length > MAX_DESCRIPTION_LENGTH) {
    return (
      "Description must be " + MAX_DESCRIPTION_LENGTH + " characters or fewer (it is " +
      fields.description.length + ")."
    );
  }
  return null;
}

// Non-string values (missing, null, numbers, objects) count as empty.
function cleanField(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  try {
    const requests = await getRequests();
    return Response.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("GET /api/requests failed:", error);
    return Response.json(
      { error: "Could not load requests. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return Response.json(
      { error: "The request body must be valid JSON." },
      { status: 400 }
    );
  }

  const fields = {
    requester_name: cleanField(body?.requester_name),
    location: cleanField(body?.location),
    description: cleanField(body?.description),
    priority: cleanField(body?.priority),
  };

  const error = validate(fields);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  try {
    const saved = await createRequest(fields);
    return Response.json({ request: saved }, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests failed:", error);
    return Response.json(
      { error: "Could not save the request. Please try again." },
      { status: 500 }
    );
  }
}
