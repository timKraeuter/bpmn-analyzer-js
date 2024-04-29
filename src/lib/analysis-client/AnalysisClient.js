import init, { check_bpmn } from "../../pkg";

export default function AnalysisClient(eventBus) {
  eventBus.on("analysis.start", (diagramXML) => {
    startAnalysis(diagramXML, eventBus);
  });
}

AnalysisClient.$inject = ["eventBus"];

function startAnalysis(diagramXML, eventBus) {
  init().then(() => {
    const startTime = performance.now();
    const result = check_bpmn(diagramXML.xml);
    const endTime = performance.now();

    const runtime = endTime - startTime;

    console.log("BPMN analysis runtime: " + runtime + " ms");

    eventBus.fire("analysis.done", result);
  });
}
