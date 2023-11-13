const websocket_url = "ws://localhost:8071/debug";
export default function AnalysisClient(eventBus) {
  eventBus.on("analysis.start", (diagramXML) => {
    fetch("http://localhost:3001/check_bpmn", {
      method: "POST",
      body: JSON.stringify({
        bpmn_file_content: diagramXML.xml,
        properties_to_be_checked: [
          "Safeness",
          "OptionToComplete",
          "ProperCompletion",
          "NoDeadActivities"
        ]
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
    .then((response) => response.json())
    .then((json) => {
      eventBus.fire("analysis.done", json)
    });

  });
}

AnalysisClient.prototype.$inject = ["eventBus"];