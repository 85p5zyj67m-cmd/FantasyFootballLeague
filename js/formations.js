export const FORMATIONS = [
  {
    id: "4-3-3",
    name: "4-3-3",
    lines: [["LW", "ST", "RW"], ["CM", "CDM", "CM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1",
    lines: [["ST"], ["LW", "CAM", "RW"], ["CDM", "CDM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-4-2",
    name: "4-4-2",
    lines: [["ST", "ST"], ["LM", "CM", "CM", "RM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-4-1-1",
    name: "4-4-1-1",
    lines: [["ST"], ["CF"], ["LM", "CM", "CM", "RM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-1-4-1",
    name: "4-1-4-1",
    lines: [["ST"], ["LM", "CM", "CM", "RM"], ["CDM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-5-1",
    name: "4-5-1",
    lines: [["ST"], ["LM", "CM", "CDM", "CM", "RM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-1-2-1-2",
    name: "4-1-2-1-2 Diamond",
    lines: [["ST", "ST"], ["CAM"], ["CM", "CM"], ["CDM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-3-1-2",
    name: "4-3-1-2",
    lines: [["ST", "ST"], ["CAM"], ["CM", "CDM", "CM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-3-2-1",
    name: "4-3-2-1 Christmas Tree",
    lines: [["ST"], ["CAM", "CAM"], ["CM", "CDM", "CM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-2-2-2",
    name: "4-2-2-2",
    lines: [["ST", "ST"], ["CAM", "CAM"], ["CDM", "CDM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-2-4",
    name: "4-2-4",
    lines: [["LW", "ST", "ST", "RW"], ["CM", "CM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "4-1-2-3",
    name: "4-1-2-3",
    lines: [["LW", "ST", "RW"], ["CM", "CM"], ["CDM"], ["LB", "CB", "CB", "RB"], ["GK"]]
  },
  {
    id: "3-5-2",
    name: "3-5-2",
    lines: [["ST", "ST"], ["LM", "CM", "CDM", "CM", "RM"], ["CB", "CB", "CB"], ["GK"]]
  },
  {
    id: "3-4-3",
    name: "3-4-3",
    lines: [["LW", "ST", "RW"], ["LM", "CM", "CM", "RM"], ["CB", "CB", "CB"], ["GK"]]
  },
  {
    id: "3-4-1-2",
    name: "3-4-1-2",
    lines: [["ST", "ST"], ["CAM"], ["LM", "CM", "CM", "RM"], ["CB", "CB", "CB"], ["GK"]]
  },
  {
    id: "3-4-2-1",
    name: "3-4-2-1",
    lines: [["ST"], ["CAM", "CAM"], ["LM", "CM", "CM", "RM"], ["CB", "CB", "CB"], ["GK"]]
  },
  {
    id: "3-1-4-2",
    name: "3-1-4-2",
    lines: [["ST", "ST"], ["LM", "CM", "CM", "RM"], ["CDM"], ["CB", "CB", "CB"], ["GK"]]
  },
  {
    id: "5-3-2",
    name: "5-3-2",
    lines: [["ST", "ST"], ["CM", "CDM", "CM"], ["LWB", "CB", "CB", "CB", "RWB"], ["GK"]]
  },
  {
    id: "5-2-3",
    name: "5-2-3",
    lines: [["LW", "ST", "RW"], ["CM", "CM"], ["LWB", "CB", "CB", "CB", "RWB"], ["GK"]]
  },
  {
    id: "5-4-1",
    name: "5-4-1",
    lines: [["ST"], ["LM", "CM", "CM", "RM"], ["LWB", "CB", "CB", "CB", "RWB"], ["GK"]]
  },
  {
    id: "5-2-1-2",
    name: "5-2-1-2",
    lines: [["ST", "ST"], ["CAM"], ["CM", "CM"], ["LWB", "CB", "CB", "CB", "RWB"], ["GK"]]
  }
];

export function getFormationById(id) {
  return FORMATIONS.find(f => f.id === id) || FORMATIONS[0];
}
