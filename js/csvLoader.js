export async function loadPlayersFromCSV(filePath) {
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error("Could not load players.csv");
  }

  const text = await response.text();
  const rows = text.trim().split(/\r?\n/);

  return rows.slice(1)
    .filter(row => row.trim().length > 0)
    .map(row => {
      const columns = row.split(",");

      return {
        name: columns[0].trim(),
        year: Number(columns[1]),
        club: columns[2].trim(),
        nationality: columns[3].trim(),
        position: columns[4].trim(),
        overall: Number(columns[5])
      };
    });
}