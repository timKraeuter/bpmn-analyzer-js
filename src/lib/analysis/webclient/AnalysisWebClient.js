export default function AnalysisWebClient(eventBus) {
  let checker_port = getCheckerPort();

  eventBus.on("analysis.start", (diagramXML) => {
    doAnalysis(checker_port, diagramXML.xml, eventBus);
  });
}

AnalysisWebClient.$inject = ["eventBus"];

function getCheckerPort() {
  const port = window.location.port;
  // Dev is served at + 1.
  if (port === "3000") {
    return ":" + (parseInt(port) + 1);
  }
  if (port === "") {
    return "";
  }
  // We assume the checker function is served at the same port.
  return ":" + port;
}

/**
 *  @param {State} state
 */
function jsonObjectToMapForState(state) {
  state.messages = new Map(Object.entries(state.messages));
  state.snapshots.forEach((snapshot) => {
    snapshot.tokens = new Map(Object.entries(snapshot.tokens));
  });
}

/**
 * @param {CheckingResponse} response
 */
function jsonObjectToMap(response) {
  response.property_results.forEach((result) => {
    if (result.counter_example) {
      jsonObjectToMapForState(result.counter_example.start_state);

      result.counter_example.transitions.forEach((transition) => {
        jsonObjectToMapForState(transition.next_state);
      });
    }
  });
}

/**
 * @param {string} checker_port
 * @param {string} diagramXML
 * @param eventBus
 */
async function doAnalysis(checker_port, diagramXML, eventBus) {
  const startTime = performance.now();

  const response = await requestAnalysis(checker_port, diagramXML);
  jsonObjectToMap(response);

  const endTime = performance.now();
  const runtime = endTime - startTime;

  console.log("BPMN analysis runtime (webservice): " + runtime + " ms");

  eventBus.fire("analysis.done", response);
}

/**
 *
 * @param {string} checker_port
 * @param {string} diagramXML
 * @return {Promise<CheckingResponse>}
 */
async function requestAnalysis(checker_port, diagramXML) {
  try {
    const response = await fetch(
      `${window.location.protocol}//${window.location.hostname}${checker_port}/check_bpmn`,
      {
        method: "POST",
        body: JSON.stringify({
          bpmn_file_content: diagramXML,
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
      },
    );
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}
