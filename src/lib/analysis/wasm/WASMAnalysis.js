import init, { check_bpmn } from "./generated";

export default function WASMAnalysis(eventBus) {
  eventBus.on("analysis.start", (diagramXML) => {
    startAnalysis(diagramXML, eventBus);
  });
}

function startAnalysis(diagramXML, eventBus) {
  init()
    .then(() => {
      const startTime = performance.now();

      const result = check_bpmn(diagramXML.xml);

      const endTime = performance.now();

      const runtime = endTime - startTime;

      console.log("BPMN analysis runtime (wasm): " + runtime + " ms");

      eventBus.fire("analysis.done", result);
    })
    .catch((error) => {
      console.error("WASM initialization failed:", error);
    });
}

WASMAnalysis.$inject = ["eventBus"];
