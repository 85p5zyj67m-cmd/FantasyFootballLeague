import { formatTraits, getDisplayPosition, getTraitList } from "../playerUtils.js";

export function clearApp() {
  const app = document.getElementById("app");
  app.replaceChildren();
  return app;
}

export function pageShell({ eyebrow, title, subtitle = "" }) {
  const section = document.createElement("section");
  section.className = "linear-page";

  const card = document.createElement("div");
  card.className = "linear-card";

  if (eyebrow) {
    const small = document.createElement("p");
    small.className = "eyebrow";
    small.textContent = eyebrow;
    card.appendChild(small);
  }

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

  const top = document.createElement("span");
  top.className = "linear-player-top draft-list-card-top";

  const overall = document.createElement("strong");
  overall.className = "draft-list-rating";
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
