export const ROUTE_CATALOG = [
  { id: "page01", label: "Start Draft", phase: "draft" },
  { id: "page02", label: "Draft Position", phase: "draft" },
  { id: "page03", label: "Your System", phase: "draft" },
  { id: "page04", label: "Live Draft", phase: "draft" },
  { id: "page05", label: "Tactics", phase: "season-setup" },
  { id: "page06", label: "Season Stats", phase: "season" },
  { id: "page07", label: "Match 1", phase: "group-stage" },
  { id: "page08", label: "Match 2", phase: "group-stage" },
  { id: "page09", label: "Match 3", phase: "group-stage" },
  { id: "page10", label: "Match 4", phase: "group-stage" },
  { id: "page11", label: "First Half Overview", phase: "overview" },
  { id: "page12", label: "Match 5", phase: "group-stage" },
  { id: "page13", label: "Match 6", phase: "group-stage" },
  { id: "page14", label: "Match 7", phase: "group-stage" },
  { id: "page15", label: "Match 8", phase: "group-stage" },
  { id: "page16", label: "Second Half Overview", phase: "overview" },
  { id: "page17", label: "Round of 16", phase: "knockout" },
  { id: "page18", label: "Quarterfinal", phase: "knockout" },
  { id: "page19", label: "Semifinal", phase: "knockout" },
  { id: "page20", label: "Final", phase: "knockout" },
  { id: "seasonEnd", label: "Season End", phase: "result" }
];

export function getRouteMeta(routeId) {
  return ROUTE_CATALOG.find(route => route.id === routeId) || null;
}
