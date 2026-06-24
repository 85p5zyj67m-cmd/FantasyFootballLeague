export const FORMATIONS = [
  {
    id: "4-4-2",
    name: "4-4-2",
    lines: [["ATT", "ATT"], ["MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]]
  },
  {
    id: "4-3-3",
    name: "4-3-3",
    lines: [["ATT", "ATT", "ATT"], ["MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]]
  },
  {
    id: "3-5-2",
    name: "3-5-2",
    lines: [["ATT", "ATT"], ["MID", "MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF"], ["GK"]]
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1",
    lines: [["ATT"], ["MID", "MID", "MID"], ["MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]]
  }
];

export function getFormationById(id) {
  return FORMATIONS.find(f => f.id === id) || FORMATIONS[0];
}