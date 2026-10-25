import { appendFile, readFile, writeFile } from "fs/promises";
import path from "path";

const SEED_FILE = path.join(process.cwd(), "data", "seed-requests.csv");

// Splits CSV text into rows of fields. Handles quoted fields that contain
// commas, newlines, or escaped quotes ("").
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((value) => value.trim() !== ""));
}

// Reads the seed CSV and returns every request, newest first.
// Ids are assigned by file order, since the CSV has no id column.
export async function getRequests() {
  const text = await readFile(SEED_FILE, "utf8");
  const [header, ...rows] = parseCsv(text);
  const columns = header.map((name) => name.trim());

  const requests = rows.map((values, index) => {
    const request = { id: index + 1 };
    columns.forEach((column, i) => {
      request[column] = (values[i] || "").trim();
    });
    return request;
  });

  return requests.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

// Wraps a value in quotes when it contains a comma, quote, or newline, so it
// stays one field when the file is read back.
export function toCsvField(value) {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

// Appends a new request to the seed CSV with status "New" and returns it.
export async function createRequest({ requester_name, location, description, priority }) {
  const text = await readFile(SEED_FILE, "utf8");
  const [header, ...rows] = parseCsv(text);

  const request = {
    id: rows.length + 1,
    created_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    requester_name,
    location,
    description,
    priority,
    status: "New",
  };

  const line = header
    .map((column) => toCsvField(request[column.trim()] ?? ""))
    .join(",");
  const prefix = text.endsWith("\n") ? "" : "\n";
  await appendFile(SEED_FILE, prefix + line + "\n", "utf8");

  return request;
}

// Sets the status of the request with the given id and rewrites the CSV.
// Returns the updated request, or null if no request has that id.
export async function updateRequestStatus(id, status) {
  const text = await readFile(SEED_FILE, "utf8");
  const [header, ...rows] = parseCsv(text);
  const columns = header.map((name) => name.trim());

  // Ids follow file order, matching getRequests().
  const values = rows[id - 1];
  if (!values) {
    return null;
  }
  values[columns.indexOf("status")] = status;

  const lines = [header, ...rows].map((row) => row.map(toCsvField).join(","));
  await writeFile(SEED_FILE, lines.join("\n") + "\n", "utf8");

  const request = { id };
  columns.forEach((column, i) => {
    request[column] = (values[i] || "").trim();
  });
  return request;
}
