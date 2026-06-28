window.FantasyMomentumEngine = {
  build(events, timelineEnd, homeName, awayName) {
    const rng = seededRandom(`${homeName}-${awayName}-${events.map(event => event.text).join("|")}`);
    const buckets = groupEvents(events);
    const points = [];
    let momentum = randomBetween(rng, -0.08, 0.08);
    let phaseSide = rng() > 0.5 ? "home" : "away";
    let phaseStrength = randomBetween(rng, 0.12, 0.42);
    let phaseLeft = Math.floor(randomBetween(rng, 4, 11));

    for (let minute = 0; minute <= timelineEnd; minute++) {
      if (phaseLeft <= 0 || rng() < 0.12) {
        phaseSide = nextPhaseSide(rng, momentum, phaseSide);
        phaseStrength = randomBetween(rng, 0.12, 0.65);
        phaseLeft = Math.floor(randomBetween(rng, 3, 10));
      }

      const direction = phaseSide === "home" ? 1 : -1;
      const pulse = Math.sin(minute / randomBetween(rng, 3.8, 6.8)) * 0.07;
      const chaos = randomBetween(rng, -0.12, 0.12);
      const lateSwing = minute > 76 ? randomBetween(rng, -0.07, 0.07) : 0;
      const addedSwing = isAddedTime(minute) ? randomBetween(rng, -0.18, 0.18) : 0;

      momentum = momentum * 0.78 + direction * phaseStrength * 0.22 + pulse + chaos + lateSwing + addedSwing;

      (buckets.get(Math.floor(minute)) || []).forEach(event => {
        const impact = eventImpact(event);
        if (event.side === "home") momentum += impact;
        if (event.side === "away") momentum -= impact;
        if (event.type === "INFO") momentum *= 0.58;
      });

      if (rng() < 0.08) {
        momentum += randomBetween(rng, -0.24, 0.24);
      }

      momentum = clamp(-1.45, 1.45, momentum);
      points.push({ minute, value: Number(momentum.toFixed(3)) });
      phaseLeft--;
    }

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
