export default function AnalysisClient(eventBus) {
  let checker_port = getCheckerPort();

  eventBus.on("analysis.start", (diagramXML) => {
    startAnalysis(checker_port, diagramXML, eventBus);
  });
}

AnalysisClient.$inject = ["eventBus"];

function getCheckerPort() {
  const port = window.location.port;
  if (port === "3000") {
    return parseInt(port) + 2;
  }
  // We assume the checker function is served at the same server with port + 1.
  return parseInt(port) + 1;
}

function startAnalysis(checker_port, diagramXML, eventBus) {
  fetch(`http://localhost:${checker_port}/check_bpmn`, {
    method: "POST",
    body: JSON.stringify({
      bpmn_file_content: diagramXML.xml,
      properties_to_be_checked: [
        "Safeness",
        "OptionToComplete",
        "ProperCompletion",
        "NoDeadActivities",
      ],
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then((response) => response.json())
    .then((json) => {
      eventBus.fire("analysis.done", json);
    });
}
