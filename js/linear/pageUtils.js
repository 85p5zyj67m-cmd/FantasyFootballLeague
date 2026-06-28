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
  card.className = "linear-player-card";
  card.disabled = !onClick;

  const top = document.createElement("span");
  top.className = "linear-player-top";
  const pos = document.createElement("b");
  pos.textContent = getDisplayPosition(player);
  pos.title = player.positionGroup ? `Draft group: ${player.positionGroup}` : "";
  const overall = document.createElement("strong");
  overall.textContent = player.overall;
  top.append(pos, overall);

  const name = document.createElement("span");
  name.className = "linear-player-name";
  name.textContent = player.name;

  const club = document.createElement("span");
  club.textContent = `${player.club} ${player.year}`;

  const nat = document.createElement("small");
  nat.textContent = player.nationality;

  const traitRow = document.createElement("span");
  traitRow.className = "linear-trait-chip-row";
  traitRow.title = formatTraits(player);
  const traits = getTraitList(player);
  if (traits.length) {
    traits.forEach(trait => {
      const chip = document.createElement("small");
      chip.className = "linear-trait-chip";
      chip.textContent = trait;
      traitRow.appendChild(chip);
    });
  } else {
    const empty = document.createElement("small");
    empty.className = "linear-trait-chip empty";
    empty.textContent = "No traits";
    traitRow.appendChild(empty);
  }

  card.append(top, name, club, nat, traitRow);
  if (onClick) card.addEventListener("click", () => onClick(player));
  return card;
}
