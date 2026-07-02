import { formatTraits, getDisplayPosition, getPositionGroup, getRatingTier, getTraitList } from "../playerUtils.js";
import { getFormationById } from "../formations.js";
import { getSlotsFromFormation, getPlayersBySlot } from "../lineup.js";

export function clearApp() {
  const app = document.getElementById("app");
  app.replaceChildren();
  return app;
}

export function pageShell({ title, subtitle = "" }) {
  const section = document.createElement("section");
  section.className = "linear-page";

  const card = document.createElement("div");
  card.className = "linear-card";

  const heading = document.createElement("h1");
  heading.textContent = title;
  card.appendChild(heading);

  if (subtitle) {
    const text = document.createElement("p");
    text.className = "subtitle";
    text.textContent = subtitle;
    card.appendChild(text);
  }

  section.appendChild(card);
  return { section, card };
}

export function attachHeaderAction(shell, actionElement) {
  const heading = shell.card.querySelector("h1");
  if (!heading) {
    shell.card.appendChild(actionElement);
    return;
  }

  const row = document.createElement("div");
  row.className = "linear-header-action-row";
  heading.replaceWith(row);
  row.append(heading, actionElement);
}

export function primaryButton(text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-btn linear-next-btn";
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

export function miniCard(title, body = "") {
  const card = document.createElement("div");
  card.className = "linear-mini-card";
  const h = document.createElement("h3");
  h.textContent = title;
  card.appendChild(h);
  if (body) {
    const p = document.createElement("p");
    p.textContent = body;
    card.appendChild(p);
  }
  return card;
}

export function twoColumnRow(left, right) {
  const row = document.createElement("div");
  row.className = "linear-row";
  const a = document.createElement("strong");
  a.textContent = left;
  const b = document.createElement("span");
  b.textContent = right;
  row.append(a, b);
  return row;
}

export function playerCard(player, onClick = null) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "linear-player-card draft-list-player-card";
  card.disabled = !onClick;
  if (player?.id) card.dataset.playerId = player.id;
  card.dataset.posGroup = getPositionGroup(player);

  const top = document.createElement("span");
  top.className = "linear-player-top draft-list-card-top";

  const overall = document.createElement("strong");
  overall.className = "draft-list-rating";
  overall.dataset.tier = getRatingTier(player.overall);
  overall.textContent = String(player.overall);

  const separator = document.createElement("span");
  separator.className = "draft-list-separator";
  separator.textContent = "-";

  const pos = document.createElement("b");
  pos.className = "draft-list-position";
  pos.textContent = getDisplayPosition(player);
  pos.title = player.positionGroup ? `Draft group: ${player.positionGroup}` : "";

  top.append(overall, separator, pos);

  const name = document.createElement("span");
  name.className = "linear-player-name draft-list-name";
  name.textContent = player.name;

  const club = document.createElement("span");
  club.className = "draft-list-club";
  club.textContent = `${player.club} (${player.year})`;

  const nat = document.createElement("span");
  nat.className = "draft-list-nationality";
  nat.textContent = player.nationality;

  const traitRow = document.createElement("span");
  traitRow.className = "linear-trait-chip-row draft-list-traits";
  traitRow.title = formatTraits(player);

  const traits = getTraitList(player);
  const visibleTraits = traits.length ? traits : ["No traits"];

  visibleTraits.forEach(trait => {
    const chip = document.createElement("small");
    chip.className = traits.length ? "linear-trait-chip draft-list-trait" : "linear-trait-chip draft-list-trait empty";
    chip.textContent = trait;
    traitRow.appendChild(chip);
  });

  card.append(top, name, club, nat, traitRow);
  if (onClick) card.addEventListener("click", () => onClick(player));
  return card;
}

export function renderReadOnlyPitch(team) {
  const formation = getFormationById(team.formationId);
  const slots = getSlotsFromFormation(formation);
  const playersBySlot = getPlayersBySlot(team);
  const pitch = document.createElement("div");
  pitch.className = "linear-pitch compact-player-pitch";

  const lines = new Map();
  slots.forEach(slot => {
    const line = slot.key.split("-")[0];
    if (!lines.has(line)) lines.set(line, []);
    lines.get(line).push(slot);
  });

  Array.from(lines.values()).forEach(lineSlots => {
    const line = document.createElement("div");
    line.className = "linear-pitch-line compact-player-line";
    lineSlots.forEach(slot => {
      const player = playersBySlot.get(slot.key);
      const box = document.createElement("div");
      box.className = player ? "linear-slot linear-slot-card" : "linear-slot linear-empty-slot";
      box.dataset.slot = slot.key;
      box.dataset.position = slot.position;

      if (player) {
        box.appendChild(createReadOnlyPitchCard(player));
      } else {
        const position = document.createElement("strong");
        position.textContent = slot.position;
        const name = document.createElement("span");
        name.textContent = "Empty";
        box.append(position, name);
      }
      line.appendChild(box);
    });
    pitch.appendChild(line);
  });

  return pitch;
}

function createReadOnlyPitchCard(player) {
  const card = document.createElement("div");
  card.className = "linear-info-player-card";

  const top = document.createElement("div");
  top.className = "linear-info-player-top";

  const rating = document.createElement("strong");
  rating.className = "linear-info-rating";
  rating.textContent = String(player.overall);

  const identity = document.createElement("div");
  identity.className = "linear-info-identity";

  const name = document.createElement("b");
  name.className = "linear-info-name";
  name.textContent = player.name;

  const position = document.createElement("span");
  position.className = "linear-info-position";
  position.textContent = getDisplayPosition(player);

  identity.append(name, position);
  top.append(rating, identity);

  const meta = document.createElement("div");
  meta.className = "linear-info-meta";
  const club = document.createElement("span");
  club.textContent = `${player.club} (${player.year})`;
  const country = document.createElement("span");
  country.textContent = player.nationality;
  meta.append(club, country);

  card.append(top, meta);
  return card;
}

const SCOUT_STYLE_NOTES = {
  Balanced: "look drilled to stay compact and hard to break down",
  Attacking: "clearly want the ball forward at every opportunity",
  "Midfield Control": "look built to dominate the middle of the park",
  "Defensive Wall": "look organised to shut up shop first",
  "Star Hunter": "seem to lean heavily on one or two standout names",
  "Goalkeeper Early": "look well marshalled from the back"
};

export function generateScoutingReport(team) {
  const players = team.players || [];
  if (!players.length) {
    return "Our scouts haven't seen enough of this squad yet to file a report.";
  }

  const groupCounts = players.reduce((counts, player) => {
    const group = getPositionGroup(player);
    counts[group] = (counts[group] || 0) + 1;
    return counts;
  }, {});
  const strongestGroup = Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const groupLabel = { ATT: "attack", MID: "midfield", DEF: "defence", GK: "goalkeeping" }[strongestGroup] || "squad";

  const bestPlayer = players.slice().sort((a, b) => b.overall - a.overall)[0];
  const tierNote = bestPlayer.overall >= 90
    ? "led by a genuine world-class talent"
    : bestPlayer.overall >= 84
      ? "with a couple of real quality names to watch"
      : "without an obvious standout star";

  const styleNote = SCOUT_STYLE_NOTES[team.playStyle] || "haven't shown a clear identity yet";

  return `Scouting notes on ${team.name}: set up in a ${team.formationId} shape, they ${styleNote}. Their ${groupLabel} looks like the deepest part of the squad, ${tierNote} — but the full picture will only become clear once the season kicks off.`;
}
