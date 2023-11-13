const websocket_url = "ws://localhost:8071/debug";
export default function AnalysisClient(eventBus) {
  eventBus.on("analysis.required", (diagramXML) => {
    console.log("Analysis should be run for:");
    console.log(diagramXML.xml);
  });
}

AnalysisClient.prototype.$inject = ["eventBus"];