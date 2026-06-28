window.FantasyMomentumEngine = {
  build(events, timelineEnd, homeName, awayName) {
    const rng = seededRandom(`${homeName}-${awayName}-${events.map(event => event.text).join("|")}`);
    const buckets = groupEvents(events);
    const points = [];
    let momentum = randomBetween(rng, -0.08, 0.08);
    let phaseSide = rng() > 0.5 ? "home" : "away";
    let phaseStrength = randomBetween(rng, 0.12, 0.42);
    let phaseLeft = Math.floor(randomBetween(rng, 4, 11));
    let phaseKind = pickPhaseKind(rng);
    let phaseStartMinute = 0;
    const narrativeEvents = [];

    for (let minute = 0; minute <= timelineEnd; minute++) {
      if (phaseLeft <= 0 || rng() < 0.12) {
        phaseSide = nextPhaseSide(rng, momentum, phaseSide);
        phaseStrength = randomBetween(rng, 0.12, 0.65);
        phaseLeft = Math.floor(randomBetween(rng, 3, 10));
        phaseKind = pickPhaseKind(rng);
        phaseStartMinute = minute;
        maybePushNarrative(narrativeEvents, minute, phaseSide, phaseKind, phaseStrength, homeName, awayName, rng);
      }

      const direction = phaseSide === "home" ? 1 : -1;
      const pulse = Math.sin(minute / randomBetween(rng, 3.8, 6.8)) * 0.07;
      const chaos = randomBetween(rng, -0.12, 0.12);
      const lateSwing = minute > 76 ? randomBetween(rng, -0.07, 0.07) : 0;
      const addedSwing = isAddedTime(minute) ? randomBetween(rng, -0.18, 0.18) : 0;
      const phaseBonus = getPhaseBonus(phaseKind, phaseStrength, minute - phaseStartMinute);

      momentum = momentum * 0.78 + direction * (phaseStrength + phaseBonus) * 0.22 + pulse + chaos + lateSwing + addedSwing;

      (buckets.get(Math.floor(minute)) || []).forEach(event => {
        const impact = eventImpact(event);
        if (event.side === "home") momentum += impact;
        if (event.side === "away") momentum -= impact;
        if (event.type === "INFO") momentum *= 0.58;
      });

      if (rng() < 0.08) {
        momentum += randomBetween(rng, -0.24, 0.24);
      }

      if (Math.abs(momentum) > 0.82 && rng() < 0.1) {
        maybePushNarrative(narrativeEvents, minute, momentum > 0 ? "home" : "away", "pressure", Math.abs(momentum), homeName, awayName, rng);
      }

      momentum = clamp(-1.45, 1.45, momentum);
      points.push({ minute, value: Number(momentum.toFixed(3)) });
      phaseLeft--;
    }

    mergeNarrativesIntoEvents(events, narrativeEvents);
    return smooth(smooth(points));
  }
};

function groupEvents(events) {
  const buckets = new Map();
  events.forEach(event => {
    const minute = Math.floor(event.replayMinute);
    const bucket = buckets.get(minute) || [];
    bucket.push(event);
    buckets.set(minute, bucket);
  });
  return buckets;
}

function nextPhaseSide(rng, momentum, currentSide) {
  if (momentum > 0.75) return rng() < 0.62 ? "away" : "home";
  if (momentum < -0.75) return rng() < 0.62 ? "home" : "away";
  if (Math.abs(momentum) < 0.18) return rng() > 0.5 ? "home" : "away";
  if (rng() < 0.55) return currentSide;
  return currentSide === "home" ? "away" : "home";
}

function pickPhaseKind(rng) {
  const phases = ["possession", "press", "counter", "wide", "setPiece", "pressure", "slowBuild"];
  return phases[Math.floor(rng() * phases.length)];
}

function getPhaseBonus(kind, strength, age) {
  const ramp = Math.min(1, age / 4);
  if (kind === "pressure") return strength * 0.5 * ramp;
  if (kind === "press") return strength * 0.38 * ramp;
  if (kind === "counter") return strength * 0.25;
  if (kind === "setPiece") return strength * 0.32;
  if (kind === "slowBuild") return strength * 0.18 * ramp;
  return strength * 0.12;
}

function maybePushNarrative(list, minute, side, kind, strength, homeName, awayName, rng) {
  if (minute < 3 || minute > 118) return;
  if (rng() > getNarrativeChance(kind, strength)) return;

  const team = side === "home" ? homeName : awayName;
  const text = createNarrativeText(formatDisplayMinute(minute), team, kind, strength, rng);

  list.push({
    minute: getDisplayMinuteNumber(minute),
    replayMinute: minute,
    type: "INFO",
    side,
    text
  });
}

function getNarrativeChance(kind, strength) {
  if (kind === "pressure") return 0.78;
  if (kind === "setPiece") return 0.55;
  if (kind === "counter") return 0.48;
  return clamp(0.25, 0.62, strength);
}

function createNarrativeText(displayMinute, team, kind, strength, rng) {
  const intense = strength > 0.55;
  const templates = {
    possession: [
      `${displayMinute} ${team} keep the ball and move the opposition from side to side.`,
      `${displayMinute} ${team} settle into a long spell of possession.`
    ],
    press: [
      `${displayMinute} ${team} press high and force another hurried clearance.`,
      `${displayMinute} ${team} win the ball back quickly and keep the pressure alive.`
    ],
    counter: [
      `${displayMinute} ${team} break forward quickly, but the final pass is cut out.`,
      `${displayMinute} ${team} look dangerous in transition.`
    ],
    wide: [
      `${displayMinute} ${team} attack down the wing and send bodies into the box.`,
      `${displayMinute} ${team} stretch the pitch and start finding space out wide.`
    ],
    setPiece: [
      `${displayMinute} ${team} force a corner after sustained pressure.`,
      `${displayMinute} ${team} have a dangerous free-kick in a promising area.`
    ],
    pressure: [
      intense
        ? `${displayMinute} ${team} are camped around the box now. The crowd can feel something coming.`
        : `${displayMinute} ${team} are starting to turn the screw.`,
      `${displayMinute} ${team} keep pinning the opponent back.`
    ],
    slowBuild: [
      `${displayMinute} ${team} build patiently from the back.`,
      `${displayMinute} ${team} slow the tempo and try to control the rhythm.`
    ]
  };

  const options = templates[kind] || templates.possession;
  return options[Math.floor(rng() * options.length)];
}

function mergeNarrativesIntoEvents(events, narratives) {
  const usedMinutes = new Set(events.map(event => Math.floor(event.replayMinute)));
  narratives.forEach(event => {
    const minute = Math.floor(event.replayMinute);
    if (usedMinutes.has(minute)) return;
    events.push(event);
    usedMinutes.add(minute);
  });
  events.sort((a, b) => a.replayMinute - b.replayMinute || eventSortValue(a.type) - eventSortValue(b.type));
}

function eventSortValue(type) {
  if (type === "GOAL") return 0;
  if (type === "CHANCE") return 1;
  if (type === "SAVE") return 2;
  return 3;
}

function formatDisplayMinute(replayMinute) {
  return `${getDisplayMinuteNumber(replayMinute)}'`;
}

function getDisplayMinuteNumber(replayMinute) {
  const secondHalfStart = 45 + 2;
  const normalEnd = secondHalfStart + 45;
  const finalEnd = normalEnd + 4;
  if (replayMinute <= 45) return Math.floor(replayMinute);
  if (replayMinute <= secondHalfStart) return 45;
  if (replayMinute <= normalEnd) return Math.floor(45 + replayMinute - secondHalfStart);
  if (replayMinute <= finalEnd) return 90;
  return Math.floor(Math.min(120, 90 + replayMinute - finalEnd));
}

function eventImpact(event) {
  if (!event.side) return 0;
  if (event.type === "GOAL") return 0.82;
  if (event.text.includes("Huge chance")) return 0.54;
  if (event.text.includes("sharp save")) return 0.38;
  if (event.text.includes("half chance")) return 0.2;
  if (event.type === "SAVE") return 0.32;
  if (event.type === "CHANCE") return 0.24;
  return 0;
}

function isAddedTime(minute) {
  return (minute >= 46 && minute <= 47) || (minute >= 93 && minute <= 96);
}

function smooth(points) {
  return points.map((point, index) => {
    const a = points[Math.max(0, index - 2)].value;
    const b = points[Math.max(0, index - 1)].value;
    const c = point.value;
    const d = points[Math.min(points.length - 1, index + 1)].value;
    const e = points[Math.min(points.length - 1, index + 2)].value;
    return {
      minute: point.minute,
      value: Number(((a + b * 2 + c * 3 + d * 2 + e) / 9).toFixed(3))
    };
  });
}

function seededRandom(seedText) {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) {
    seed = (seed * 31 + seedText.charCodeAt(i)) % 2147483647;
  }
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function randomBetween(rng, min, max) {
  return min + rng() * (max - min);
}

function clamp(min, max, value) {
  return Math.min(max, Math.max(min, value));
}
