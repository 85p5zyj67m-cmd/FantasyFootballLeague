export const TRAIT_CHAINS = [
  {
    id: "crossing-chain",
    name: "Crossing Chain",
    summary: "The classic crossing chain.",
    levels: [
      { size: 2, traits: ["Cross Specialist", "Target Man"], effect: "More headed chances", winChance: "+1 to +2%" },
      { size: 3, traits: ["Crossing Fullback", "Cross Specialist", "Target Man"], effect: "More crosses from deep and advanced wide areas", winChance: "+3 to +5%" },
      { size: 4, traits: ["Engine", "Crossing Fullback", "Cross Specialist", "Target Man"], effect: "High-energy wing play with frequent crosses", winChance: "+5 to +7%" }
    ]
  },
  {
    id: "overlap-crossing-chain",
    name: "Overlap Crossing Chain",
    summary: "A crossing chain built around an attacking fullback.",
    levels: [
      { size: 2, traits: ["Overlapping Runner", "Cross Specialist"], effect: "Overlap creates wide progression", winChance: "+1 to +2%" },
      { size: 3, traits: ["Overlapping Runner", "Cross Specialist", "Target Man"], effect: "Better crossing lanes from overlapping runs", winChance: "+3 to +5%" },
      { size: 4, traits: ["Crossing Fullback", "Overlapping Runner", "Cross Specialist", "Target Man"], effect: "Fullback-driven wing attacks into a box target", winChance: "+5 to +7%" }
    ]
  },
  {
    id: "low-cross-chain",
    name: "Low Cross Chain",
    summary: "Low deliveries into runners inside the box.",
    levels: [
      { size: 2, traits: ["Low Cross Specialist", "Poacher"], effect: "More shots inside the box", winChance: "+1 to +2%" },
      { size: 3, traits: ["Wide Creator", "Low Cross Specialist", "Poacher"], effect: "Better low deliveries", winChance: "+3 to +5%" },
      { size: 4, traits: ["Connector", "Wide Creator", "Low Cross Specialist", "Poacher"], effect: "Many clear chances from wide areas", winChance: "+5 to +7%" }
    ]
  },
  {
    id: "cut-inside-chain",
    name: "Cut Inside Chain",
    summary: "A winger cuts inside while the fullback creates space.",
    levels: [
      { size: 2, traits: ["Overlapping Runner", "Inside Forward"], effect: "More space for the winger", winChance: "+1 to +2%" },
      { size: 3, traits: ["Overlapping Runner", "Inside Forward", "Clinical Finisher"], effect: "More shots from half-spaces", winChance: "+3 to +5%" },
      { size: 4, traits: ["Inverted Fullback", "Overlapping Runner", "Inside Forward", "Clinical Finisher"], effect: "Half-space overload with finishing focus", winChance: "+5 to +7%" }
    ]
  },
  {
    id: "false-9-chain",
    name: "False 9 Chain",
    summary: "Combination football with inverted wide forwards.",
    levels: [
      { size: 2, traits: ["False 9", "Inside Forward"], effect: "Space for inside forwards", winChance: "+1 to +2%" },
      { size: 3, traits: ["Connector", "False 9", "Inside Forward"], effect: "More combinations in the final third", winChance: "+4 to +6%" },
      { size: 4, traits: ["Vision Playmaker", "Connector", "False 9", "Inside Forward"], effect: "Fluid attack with an extra final-pass threat", winChance: "+6 to +8%" }
    ]
  },
  {
    id: "genius-attack-chain",
    name: "Genius Attack Chain",
    summary: "Creative Genius as the main attacking trigger.",
    levels: [
      { size: 2, traits: ["Creative Genius", "Clinical Finisher"], effect: "More special goal actions", winChance: "+1 to +2%" },
      { size: 3, traits: ["Advanced Playmaker", "Creative Genius", "Clinical Finisher"], effect: "More big chances through controlled creativity", winChance: "+4 to +6%" },
      { size: 4, traits: ["Box-to-Box", "Advanced Playmaker", "Creative Genius", "Clinical Finisher"], effect: "Dynamic creative chance machine", winChance: "+6 to +8%" }
    ]
  },
  {
    id: "through-ball-chain",
    name: "Through Ball Chain",
    summary: "Through balls into fast runners.",
    levels: [
      { size: 2, traits: ["Vision Playmaker", "Speedster"], effect: "More runs behind the defense", winChance: "+1 to +2%" },
      { size: 3, traits: ["Vision Playmaker", "Speedster", "Poacher"], effect: "More one-on-one and box chances", winChance: "+4 to +6%" },
      { size: 4, traits: ["Deep Playmaker", "Vision Playmaker", "Speedster", "Poacher"], effect: "Deep release passes into constant runs behind", winChance: "+6 to +8%" }
    ]
  },
  {
    id: "direct-play-chain",
    name: "Direct Play Chain",
    summary: "Fast attacks from deep positions.",
    levels: [
      { size: 2, traits: ["Deep Playmaker", "Speedster"], effect: "Faster attacks", winChance: "+1 to +2%" },
      { size: 3, traits: ["Deep Playmaker", "Speedster", "Clinical Finisher"], effect: "Direct attacks with finishing quality", winChance: "+4 to +6%" },
      { size: 4, traits: ["Ball Winner", "Deep Playmaker", "Speedster", "Clinical Finisher"], effect: "Direct attacks after midfield ball wins", winChance: "+6 to +8%" }
    ]
  },
  {
    id: "build-up-chain",
    name: "Build-Up Chain",
    summary: "Build-up play from the back.",
    levels: [
      { size: 2, traits: ["Ball Playing Defender", "Regista"], effect: "Better build-up play", winChance: "+1 to +2%" },
      { size: 3, traits: ["Distribution Keeper", "Ball Playing Defender", "Regista"], effect: "Cleaner first phase under pressure", winChance: "+3 to +5%" },
      { size: 4, traits: ["Distribution Keeper", "Ball Playing Defender", "Regista", "Tempo Controller"], effect: "Controlled build-up from the back", winChance: "+5 to +7%" }
    ]
  },
  {
    id: "possession-chain",
    name: "Possession Chain",
    summary: "Controlled possession structure.",
    levels: [
      { size: 2, traits: ["Regista", "Tempo Controller"], effect: "Better passing control", winChance: "+1 to +2%" },
      { size: 3, traits: ["Regista", "Tempo Controller", "Advanced Playmaker"], effect: "Control plus chance creation", winChance: "+4 to +6%" },
      { size: 4, traits: ["Ball Playing Defender", "Regista", "Tempo Controller", "Advanced Playmaker"], effect: "Dominant possession structure", winChance: "+6 to +8%" }
    ]
  },
  {
    id: "connector-chain",
    name: "Connector Chain",
    summary: "Connector as a valuable puzzle trait.",
    levels: [
      { size: 2, traits: ["Box-to-Box", "Connector"], effect: "Better link between midfield lines", winChance: "+1 to +2%" },
      { size: 3, traits: ["Box-to-Box", "Connector", "Advanced Playmaker"], effect: "More clean midfield-to-attack progression", winChance: "+3 to +5%" },
      { size: 4, traits: ["Engine", "Box-to-Box", "Connector", "Advanced Playmaker"], effect: "Relentless midfield connection and progression", winChance: "+5 to +7%" }
    ]
  },
  {
    id: "pressing-attack-chain",
    name: "Pressing Attack Chain",
    summary: "Pressing all the way to the striker.",
    levels: [
      { size: 2, traits: ["Press Machine", "Pressing Forward"], effect: "More high ball recoveries", winChance: "+1 to +2%" },
      { size: 3, traits: ["Ball Winner", "Press Machine", "Pressing Forward"], effect: "Strong counter-pressing", winChance: "+3 to +5%" },
      { size: 4, traits: ["Pressing Fullback", "Ball Winner", "Press Machine", "Pressing Forward"], effect: "Pressure through both flank and center", winChance: "+5 to +7%" }
    ]
  },
  {
    id: "destroyer-chain",
    name: "Destroyer Chain",
    summary: "Aggressive midfield, second balls, disrupting opponents.",
    levels: [
      { size: 2, traits: ["Destroyer", "Ball Winner"], effect: "More duels won in midfield", winChance: "+1 to +2%" },
      { size: 3, traits: ["Destroyer", "Ball Winner", "Box-to-Box"], effect: "Better control of second balls", winChance: "+3 to +5%" },
      { size: 4, traits: ["Stopper", "Destroyer", "Ball Winner", "Box-to-Box"], effect: "Aggressive central dominance", winChance: "+5 to +7%" }
    ]
  },
  {
    id: "engine-chain",
    name: "Engine Chain",
    summary: "Work rate and intensity.",
    levels: [
      { size: 2, traits: ["Engine", "Box-to-Box"], effect: "More intensity", winChance: "+1%" },
      { size: 3, traits: ["Engine", "Box-to-Box", "Press Machine"], effect: "Better sustained pressure", winChance: "+3 to +4%" },
      { size: 4, traits: ["Engine", "Box-to-Box", "Press Machine", "Pressing Forward"], effect: "High-energy pressing team", winChance: "+5 to +6%" }
    ]
  },
  {
    id: "long-shot-chain",
    name: "Long Shot Chain",
    summary: "Cutbacks and long-range shots.",
    levels: [
      { size: 2, traits: ["Wide Creator", "Long Shot Specialist"], effect: "Layoffs and edge-of-box shots", winChance: "+1%" },
      { size: 3, traits: ["Wide Creator", "Long Shot Specialist", "Creative Genius"], effect: "Edge-of-box shots from creative attacks", winChance: "+3 to +4%" },
      { size: 4, traits: ["Wide Creator", "Long Shot Specialist", "Creative Genius", "False 9"], effect: "Unpredictable layoffs and long-range attacks", winChance: "+5 to +6%" }
    ]
  },
  {
    id: "defensive-wall",
    name: "Defensive Wall",
    summary: "Classic center-back and goalkeeper chain.",
    levels: [
      { size: 2, traits: ["Stopper", "Sweeper"], effect: "Fewer clear chances against you", winChance: "+1 to +2%" },
      { size: 3, traits: ["Stopper", "Sweeper", "Commanding Keeper"], effect: "Strong box defense", winChance: "+4 to +5%" },
      { size: 4, traits: ["Anchor", "Stopper", "Sweeper", "Commanding Keeper"], effect: "Very stable defensive unit", winChance: "+6 to +8%" }
    ]
  },
  {
    id: "low-block-chain",
    name: "Low Block Chain",
    summary: "Deep compact defense.",
    levels: [
      { size: 2, traits: ["Defensive Fullback", "Anchor"], effect: "Stable defensive side", winChance: "+1 to +2%" },
      { size: 3, traits: ["Defensive Fullback", "Anchor", "Destroyer"], effect: "Compact defensive structure with midfield bite", winChance: "+3 to +5%" },
      { size: 4, traits: ["Defensive Fullback", "Anchor", "Destroyer", "Shot Stopper"], effect: "Compact block protected by a shot-stopping keeper", winChance: "+5 to +7%" }
    ]
  },
  {
    id: "high-line-chain",
    name: "High Line Chain",
    summary: "High defensive line with cover behind it.",
    levels: [
      { size: 2, traits: ["Fast Defender", "Sweeper Keeper"], effect: "Lower counterattack risk", winChance: "+1 to +2%" },
      { size: 3, traits: ["Sweeper Keeper", "Fast Defender", "Ball Playing Defender"], effect: "High line with safety cover", winChance: "+3 to +5%" },
      { size: 4, traits: ["Sweeper Keeper", "Fast Defender", "Ball Playing Defender", "Press Machine"], effect: "Aggressive high defensive block", winChance: "+5 to +7%" }
    ]
  },
  {
    id: "aerial-control-chain",
    name: "Aerial Control Chain",
    summary: "Aerial control in defense.",
    levels: [
      { size: 2, traits: ["Aerial Monster", "Commanding Keeper"], effect: "Less danger from crosses", winChance: "+1%" },
      { size: 3, traits: ["Stopper", "Aerial Monster", "Commanding Keeper"], effect: "Strong cross defense", winChance: "+3 to +4%" },
      { size: 4, traits: ["Defensive Fullback", "Stopper", "Aerial Monster", "Commanding Keeper"], effect: "Dominant aerial defensive unit", winChance: "+5 to +6%" }
    ]
  },
  {
    id: "set-piece-chain",
    name: "Set Piece Chain",
    summary: "Set-piece situations.",
    levels: [
      { size: 2, traits: ["Set Piece Specialist", "Target Man"], effect: "More goal threat from set pieces", winChance: "+1 to +2%" },
      { size: 3, traits: ["Set Piece Specialist", "Target Man", "Aerial Monster"], effect: "Corners become very dangerous", winChance: "+3 to +5%" },
      { size: 4, traits: ["Set Piece Specialist", "Target Man", "Aerial Monster", "Poacher"], effect: "Very dangerous set-piece and second-ball attacks", winChance: "+5 to +6%" }
    ]
  },
  {
    id: "penalty-knockout-chain",
    name: "Penalty / Knockout Chain",
    summary: "Valuable in tight games and knockout rounds.",
    levels: [
      { size: 2, traits: ["Penalty Specialist", "Clinical Finisher"], effect: "Better penalties and late finishes", winChance: "Group: +0 to +1% | KO: +2 to +3%" },
      { size: 3, traits: ["Penalty Specialist", "Clinical Finisher", "Creative Genius"], effect: "Better late moments and decisive attacking actions", winChance: "Group: +1 to +2% | KO: +4 to +6%" },
      { size: 4, traits: ["Penalty Specialist", "Clinical Finisher", "Creative Genius", "Advanced Playmaker"], effect: "Very strong in tight knockout games", winChance: "Group: +2 to +3% | KO: +6 to +8%" }
    ]
  },
  {
    id: "inverted-side-chain",
    name: "Inverted Side Chain",
    summary: "Inverted fullback and half-space combinations.",
    levels: [
      { size: 2, traits: ["Inverted Fullback", "Tempo Controller"], effect: "Stronger central control", winChance: "+1 to +2%" },
      { size: 3, traits: ["Inverted Fullback", "Tempo Controller", "Inside Forward"], effect: "Half-space overload", winChance: "+4 to +5%" },
      { size: 4, traits: ["Inverted Fullback", "Tempo Controller", "Inside Forward", "False 9"], effect: "Strong central combination play", winChance: "+6 to +8%" }
    ]
  }
];
