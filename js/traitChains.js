export const TRAIT_CHAINS = [
  {
    id: "crossing-chain",
    name: "Crossing Chain",
    summary: "Die klassische Flanken-Kette.",
    levels: [
      { size: 2, traits: ["Cross Specialist", "Target Man"], effect: "Mehr Kopfballchancen", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Crossing Fullback", "Cross Specialist", "Target Man"], effect: "Mehr Flanken aus tiefer und hoher Position", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Tempo Controller", "Crossing Fullback", "Cross Specialist", "Target Man"], effect: "Kontrolliertes Flügelspiel mit vielen Flanken", winChance: "+5 bis +7 %" }
    ]
  },
  {
    id: "overlap-crossing-chain",
    name: "Overlap Crossing Chain",
    summary: "Alternative Flanken-Kette mit offensivem Außenverteidiger.",
    levels: [
      { size: 2, traits: ["Overlapping Runner", "Cross Specialist"], effect: "Mehr Raum für Flanken", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Overlapping Runner", "Cross Specialist", "Target Man"], effect: "Starke Flügel-Zielspieler-Kette", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Connector", "Overlapping Runner", "Cross Specialist", "Target Man"], effect: "Besser eingebundene Flügelangriffe", winChance: "+5 bis +7 %" }
    ]
  },
  {
    id: "low-cross-chain",
    name: "Low Cross Chain",
    summary: "Flache Hereingaben auf Strafraumläufer.",
    levels: [
      { size: 2, traits: ["Low Cross Specialist", "Poacher"], effect: "Mehr Abschlüsse im Strafraum", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Wide Creator", "Low Cross Specialist", "Poacher"], effect: "Bessere flache Hereingaben", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Advanced Playmaker", "Wide Creator", "Low Cross Specialist", "Poacher"], effect: "Viele klare Chancen über außen", winChance: "+5 bis +7 %" }
    ]
  },
  {
    id: "cut-inside-chain",
    name: "Cut Inside Chain",
    summary: "Flügel zieht nach innen, Außenverteidiger schafft Raum.",
    levels: [
      { size: 2, traits: ["Overlapping Runner", "Inside Forward"], effect: "Mehr Raum für den Flügelspieler", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Overlapping Runner", "Inside Forward", "Clinical Finisher"], effect: "Mehr Abschlüsse aus Halbpositionen", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Connector", "Overlapping Runner", "Inside Forward", "Clinical Finisher"], effect: "Starke Seite mit Abschlussfokus", winChance: "+5 bis +7 %" }
    ]
  },
  {
    id: "false-9-chain",
    name: "False 9 Chain",
    summary: "Kombinationsfußball mit einrückenden Flügeln.",
    levels: [
      { size: 2, traits: ["False 9", "Inside Forward"], effect: "Räume für einrückende Flügel", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Advanced Playmaker", "False 9", "Inside Forward"], effect: "Mehr Kombinationen im letzten Drittel", winChance: "+4 bis +6 %" },
      { size: 4, traits: ["Creative Genius", "Advanced Playmaker", "False 9", "Inside Forward"], effect: "Extrem kreative Fluid-Offensive", winChance: "+6 bis +8 %" }
    ]
  },
  {
    id: "genius-attack-chain",
    name: "Genius Attack Chain",
    summary: "Creative Genius als wertvoller Angriffsauslöser.",
    levels: [
      { size: 2, traits: ["Creative Genius", "Clinical Finisher"], effect: "Mehr besondere Toraktionen", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Creative Genius", "Advanced Playmaker", "Clinical Finisher"], effect: "Mehr Großchancen durch Kreativität", winChance: "+4 bis +6 %" },
      { size: 4, traits: ["Tempo Controller", "Creative Genius", "Advanced Playmaker", "Clinical Finisher"], effect: "Kontrollierte, kreative Chancenmaschine", winChance: "+6 bis +8 %" }
    ]
  },
  {
    id: "through-ball-chain",
    name: "Through Ball Chain",
    summary: "Steckpässe auf schnelle Spieler.",
    levels: [
      { size: 2, traits: ["Vision Playmaker", "Speedster"], effect: "Mehr Läufe hinter die Abwehr", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Vision Playmaker", "Speedster", "Poacher"], effect: "Mehr 1-gegen-1- und Strafraumchancen", winChance: "+4 bis +6 %" },
      { size: 4, traits: ["Ball Winner", "Vision Playmaker", "Speedster", "Poacher"], effect: "Ballgewinn, Steckpass, Abschluss", winChance: "+6 bis +8 %" }
    ]
  },
  {
    id: "direct-play-chain",
    name: "Direct Play Chain",
    summary: "Schneller Angriff aus der Tiefe.",
    levels: [
      { size: 2, traits: ["Deep Playmaker", "Speedster"], effect: "Schnellere Angriffe", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Deep Playmaker", "Speedster", "Clinical Finisher"], effect: "Direkte Angriffe mit Abschlussqualität", winChance: "+4 bis +6 %" },
      { size: 4, traits: ["Distribution Keeper", "Deep Playmaker", "Speedster", "Clinical Finisher"], effect: "Konter vom Torwart bis zum Abschluss", winChance: "+6 bis +8 %" }
    ]
  },
  {
    id: "build-up-chain",
    name: "Build-Up Chain",
    summary: "Spielaufbau von hinten.",
    levels: [
      { size: 2, traits: ["Ball Playing Defender", "Regista"], effect: "Besserer Spielaufbau", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Ball Playing Defender", "Regista", "Tempo Controller"], effect: "Mehr Ballbesitz, weniger Ballverluste", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Distribution Keeper", "Ball Playing Defender", "Regista", "Tempo Controller"], effect: "Kontrollierter Aufbau von hinten", winChance: "+5 bis +7 %" }
    ]
  },
  {
    id: "possession-chain",
    name: "Possession Chain",
    summary: "Kontrollierter Ballbesitz.",
    levels: [
      { size: 2, traits: ["Regista", "Tempo Controller"], effect: "Bessere Passkontrolle", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Regista", "Tempo Controller", "Advanced Playmaker"], effect: "Kontrolle plus Chancen", winChance: "+4 bis +6 %" },
      { size: 4, traits: ["Ball Playing Defender", "Regista", "Tempo Controller", "Advanced Playmaker"], effect: "Dominante Ballbesitzstruktur", winChance: "+6 bis +8 %" }
    ]
  },
  {
    id: "connector-chain",
    name: "Connector Chain",
    summary: "Connector als wertvoller Puzzle-Trait.",
    levels: [
      { size: 2, traits: ["Connector", "Advanced Playmaker"], effect: "Bessere Verbindung zwischen Zentrum und Offensive", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Connector", "Advanced Playmaker", "Clinical Finisher"], effect: "Mehr saubere Chancen", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Regista", "Connector", "Advanced Playmaker", "Clinical Finisher"], effect: "Zentrum verbindet Aufbau und Abschluss perfekt", winChance: "+5 bis +7 %" }
    ]
  },
  {
    id: "pressing-attack-chain",
    name: "Pressing Attack Chain",
    summary: "Pressing bis in die Spitze.",
    levels: [
      { size: 2, traits: ["Press Machine", "Pressing Forward"], effect: "Mehr Ballgewinne vorne", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Ball Winner", "Press Machine", "Pressing Forward"], effect: "Starkes Gegenpressing", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Pressing Fullback", "Ball Winner", "Press Machine", "Pressing Forward"], effect: "Druck über Seite und Zentrum", winChance: "+5 bis +7 %" }
    ]
  },
  {
    id: "destroyer-chain",
    name: "Destroyer Chain",
    summary: "Aggressives Zentrum, zweite Bälle, Gegner zerstören.",
    levels: [
      { size: 2, traits: ["Destroyer", "Ball Winner"], effect: "Mehr gewonnene Zweikämpfe im Zentrum", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Destroyer", "Ball Winner", "Box-to-Box"], effect: "Kontrolle über zweite Bälle", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Stopper", "Destroyer", "Ball Winner", "Box-to-Box"], effect: "Aggressive zentrale Dominanz", winChance: "+5 bis +7 %" }
    ]
  },
  {
    id: "engine-chain",
    name: "Engine Chain",
    summary: "Laufstärke und Intensität.",
    levels: [
      { size: 2, traits: ["Engine", "Box-to-Box"], effect: "Mehr Intensität", winChance: "+1 %" },
      { size: 3, traits: ["Engine", "Box-to-Box", "Ball Winner"], effect: "Bessere zweite Bälle", winChance: "+3 bis +4 %" },
      { size: 4, traits: ["Engine", "Box-to-Box", "Ball Winner", "Pressing Forward"], effect: "Laufstarkes Pressingteam", winChance: "+5 bis +6 %" }
    ]
  },
  {
    id: "long-shot-chain",
    name: "Long Shot Chain",
    summary: "Rückraum- und Distanzschüsse.",
    levels: [
      { size: 2, traits: ["Long Shot Specialist", "False 9"], effect: "Ablagen für Distanzschüsse", winChance: "+1 %" },
      { size: 3, traits: ["Wide Creator", "False 9", "Long Shot Specialist"], effect: "Rückraumchancen nach Flügelangriffen", winChance: "+3 bis +4 %" },
      { size: 4, traits: ["Creative Genius", "Wide Creator", "False 9", "Long Shot Specialist"], effect: "Unberechenbare Rückraumangriffe", winChance: "+5 bis +6 %" }
    ]
  },
  {
    id: "defensive-wall",
    name: "Defensive Wall",
    summary: "Klassische Innenverteidiger-Torwart-Kette.",
    levels: [
      { size: 2, traits: ["Stopper", "Sweeper"], effect: "Weniger klare Chancen gegen dich", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Stopper", "Sweeper", "Commanding Keeper"], effect: "Starke Strafraumverteidigung", winChance: "+4 bis +5 %" },
      { size: 4, traits: ["Anchor", "Stopper", "Sweeper", "Commanding Keeper"], effect: "Sehr stabile Defensive", winChance: "+6 bis +8 %" }
    ]
  },
  {
    id: "low-block-chain",
    name: "Low Block Chain",
    summary: "Tiefe, kompakte Defensive.",
    levels: [
      { size: 2, traits: ["Defensive Fullback", "Stopper"], effect: "Stabile Seite", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Defensive Fullback", "Stopper", "Anchor"], effect: "Kompakte Defensive", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Defensive Fullback", "Stopper", "Anchor", "Shot Stopper"], effect: "Schwer zu durchbrechen", winChance: "+5 bis +7 %" }
    ]
  },
  {
    id: "high-line-chain",
    name: "High Line Chain",
    summary: "Hohe Abwehr mit Absicherung.",
    levels: [
      { size: 2, traits: ["Fast Defender", "Sweeper Keeper"], effect: "Weniger Kontergefahr", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Ball Playing Defender", "Fast Defender", "Sweeper Keeper"], effect: "Hohe Linie mit Absicherung", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Press Machine", "Ball Playing Defender", "Fast Defender", "Sweeper Keeper"], effect: "Aggressive hohe Defensive", winChance: "+5 bis +7 %" }
    ]
  },
  {
    id: "aerial-control-chain",
    name: "Aerial Control Chain",
    summary: "Luftkontrolle defensiv und offensiv.",
    levels: [
      { size: 2, traits: ["Aerial Monster", "Commanding Keeper"], effect: "Weniger Gefahr durch Flanken", winChance: "+1 %" },
      { size: 3, traits: ["Defensive Fullback", "Aerial Monster", "Commanding Keeper"], effect: "Starke Flankenverteidigung", winChance: "+3 bis +4 %" },
      { size: 4, traits: ["Crossing Fullback", "Aerial Monster", "Commanding Keeper", "Target Man"], effect: "Stark bei Flanken defensiv und offensiv", winChance: "+5 bis +6 %" }
    ]
  },
  {
    id: "set-piece-chain",
    name: "Set Piece Chain",
    summary: "Standardsituationen.",
    levels: [
      { size: 2, traits: ["Set Piece Specialist", "Target Man"], effect: "Mehr Torgefahr nach Standards", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Set Piece Specialist", "Target Man", "Aerial Monster"], effect: "Ecken werden sehr gefährlich", winChance: "+3 bis +5 %" },
      { size: 4, traits: ["Set Piece Specialist", "Target Man", "Aerial Monster", "Commanding Keeper"], effect: "Standards offensiv und defensiv stark", winChance: "+5 bis +6 %" }
    ]
  },
  {
    id: "penalty-knockout-chain",
    name: "Penalty / Knockout Chain",
    summary: "Wertvoll in engen Spielen und KO-Runden.",
    levels: [
      { size: 2, traits: ["Penalty Specialist", "Clinical Finisher"], effect: "Bessere Elfmeter und späte Abschlüsse", winChance: "Gruppe: +0 bis +1 % | KO: +2 bis +3 %" },
      { size: 3, traits: ["Penalty Specialist", "Clinical Finisher", "Creative Genius"], effect: "Mehr späte Entscheidungsaktionen", winChance: "Gruppe: +1 bis +2 % | KO: +4 bis +6 %" },
      { size: 4, traits: ["Penalty Specialist", "Clinical Finisher", "Creative Genius", "Advanced Playmaker"], effect: "Sehr stark in engen KO-Spielen", winChance: "Gruppe: +2 bis +3 % | KO: +6 bis +8 %" }
    ]
  },
  {
    id: "inverted-side-chain",
    name: "Inverted Side Chain",
    summary: "Einrückender Außenverteidiger und Halbraumspiel.",
    levels: [
      { size: 2, traits: ["Inverted Fullback", "Tempo Controller"], effect: "Zentrum wird stärker", winChance: "+1 bis +2 %" },
      { size: 3, traits: ["Inverted Fullback", "Tempo Controller", "Inside Forward"], effect: "Überladung im Halbraum", winChance: "+4 bis +5 %" },
      { size: 4, traits: ["Inverted Fullback", "Tempo Controller", "Inside Forward", "False 9"], effect: "Starkes Kombinationsspiel im Zentrum", winChance: "+6 bis +8 %" }
    ]
  }
];
