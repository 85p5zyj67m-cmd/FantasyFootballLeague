export const FORMATION_CHAIN_LINKS = {
  "4-3-3": [
    ["0-0", "0-1"], // LW - ST
    ["0-1", "0-2"], // ST - RW

    ["0-0", "1-0"], // LW - LCM
    ["0-1", "1-0"], // ST - LCM
    ["0-1", "1-1"], // ST - RCM
    ["0-2", "1-1"], // RW - RCM

    ["1-0", "1-1"], // LCM - RCM
    ["1-0", "2-0"], // LCM - CDM
    ["1-1", "2-0"], // RCM - CDM

    ["3-0", "0-0"], // LB - LW
    ["3-0", "1-0"], // LB - LCM
    ["3-0", "3-1"], // LB - LCB

    ["3-3", "0-2"], // RB - RW
    ["3-3", "1-1"], // RB - RCM
    ["3-3", "3-2"], // RB - RCB

    ["3-1", "2-0"], // LCB - CDM
    ["3-2", "2-0"], // RCB - CDM
    ["3-1", "3-2"], // LCB - RCB

    ["4-0", "3-1"], // GK - LCB
    ["4-0", "3-2"]  // GK - RCB
  ]
};

export function getFormationChainLinkScore(formationId, slotAKey, slotBKey) {
  const links = FORMATION_CHAIN_LINKS[formationId];
  if (!links) return null;

  const matchIndex = links.findIndex(([a, b]) =>
    (a === slotAKey && b === slotBKey) ||
    (a === slotBKey && b === slotAKey)
  );

  return matchIndex >= 0 ? 1 + matchIndex / 100 : null;
}

export function hasFormationSpecificChainLinks(formationId) {
  return Array.isArray(FORMATION_CHAIN_LINKS[formationId]);
}
