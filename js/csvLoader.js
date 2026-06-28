import { getPositionGroupFromPosition } from "./playerUtils.js";

export async function loadPlayersFromCSV(filePath) {
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error("Could not load players.csv");
  }

  const text = await response.text();
  const rows = text.trim().split(/\r?\n/);

  return rows.slice(1)
    .filter(row => row.trim().length > 0)
    .map(parsePlayerRow)
    .filter(Boolean);
}

function parsePlayerRow(row) {
  const columns = parseCSVLine(row);

  if (columns.length < 6) {
    return null;
  }

  const detailedPosition = columns[4].trim();
  const traits = [columns[6], columns[7], columns[8]]
    .map(value => String(value || "").trim())
    .filter(Boolean);

  return {
    name: columns[0].trim(),
    year: Number(columns[1]),
    club: columns[2].trim(),
    nationality: columns[3].trim(),
    position: getPositionGroupFromPosition(detailedPosition),
    positionGroup: getPositionGroupFromPosition(detailedPosition),
    detailedPosition,
    overall: Number(columns[5]),
    firstTrait: traits[0] || "",
    secondTrait: traits[1] || "",
    thirdTrait: traits[2] || "",
    traits
  };
}

function parseCSVLine(row) {
  const columns = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === "\"" && inQuotes && nextChar === "\"") {
      current += "\"";
      i++;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      columns.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  columns.push(current);
  return columns;
}
