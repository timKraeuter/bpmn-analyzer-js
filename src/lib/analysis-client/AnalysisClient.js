import init, { check_bpmn } from "../../pkg";

export default function AnalysisClient(eventBus) {
  eventBus.on("analysis.start", (diagramXML) => {
    startAnalysis(diagramXML, eventBus);
  });
}

AnalysisClient.$inject = ["eventBus"];

function startAnalysis(diagramXML, eventBus) {
  init().then(() => {
    check_bpmn(diagramXML.xml);
    // TODO: Get return and check performance
    // eventBus.fire("analysis.done", json);
  });
}
