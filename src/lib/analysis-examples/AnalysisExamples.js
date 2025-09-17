import { domify } from "min-dom";
import taskSplitUrl from "../../../resources/implicit-task-split.bpmn?url";
import taskMergeUrl from "../../../resources/implicit-task-merge.bpmn?url";
import showcaseUrl from "../../../resources/showcase.bpmn?url";
import unsafeGatewaysUrl from "../../../resources/unsafe-gateways.bpmn?url";
import reusedEndEventUrl from "../../../resources/reused-end-event.bpmn?url";
import stuckUrl from "../../../resources/stuck.bpmn?url";
import deadActivityUrl from "../../../resources/dead-activity.bpmn?url";
import poolsWithMessageFlowsUrl from "../../../resources/pools-with-message-flows.bpmn?url";
import cyclesUrl from "../../../resources/cyclic.bpmn?url";
import deadReceiveTaskUrl from "../../../resources/dead-receive-task.bpmn?url";
import deadMiceUrl from "../../../resources/dead-mice.bpmn?url";
import starvationUrl from "../../../resources/starvation.bpmn?url";
import livelockUrl from "../../../resources/livelock.bpmn?url";
import deadTasksConnectedUrl from "../../../resources/dead_tasks_connected.bpmn?url";
import orderHandlingUrl from "../../../resources/order_handling.bpmn?url";
import orderHandlingSynchronizationUrl from "../../../resources/order_handling_synchronization.bpmn?url";

const example_boards = {
  taskSplitUrl,
  taskMergeUrl,
  showcaseUrl,
  unsafeGatewaysUrl,
  reusedEndEventUrl,
  stuckUrl,
  deadActivityUrl,
  poolsWithMessageFlowsUrl,
  cyclesUrl,
  deadReceiveTaskUrl,
  deadMiceUrl,
  starvationUrl,
  livelockUrl,
  deadTasksConnectedUrl,
  orderHandlingUrl,
  orderHandlingSynchronizationUrl,
};

export default function AnalysisExamples(eventBus, canvas) {
  this._canvas = canvas;
  this._eventBus = eventBus;

  this._init();
}

AnalysisExamples.prototype._init = function () {
  const label = domify(`
    <label for="example-select">Change example:</label>
  `);
  const select = domify(`
    <select id="example-select" class="example-select">
      <option value="taskSplit">Implicit parallel gateway (Synchronization)</option>
      <option value="unsafeGateways" selected="selected">
        Exclusive gateway (Synchronization)
      </option>
      <option value="taskMerge">Implicit exclusive gateway (Synchronization)</option>
      <option value="deadActivity">Dead Activity</option>
      <option value="deadTasksConnected">Connected Dead Activities</option>
      <option value="deadReceiveTask">Dead Receive Task</option>
      <option value="stuck">Blocking PG (Termination)</option>
      <option value="deadMice">Blocking MICE (Termination)</option>
      <option value="starvation">Message Starvation (Termination)</option>
      <option value="livelock">Livelock (Termination)</option>
      <option value="reusedEndEvent">Reused end event (Unique End Events)</option>
      <option value="showcase">Complex scenario</option>
      <option value="poolsWithMessageFlows">Counterexample with messages</option>
      <option value="cycles">Quick fixes with cycles</option>
      <option value="orderHandling">Order handling example (No Termination)</option>
      <option value="orderHandlingSynchronization">Order handling example (No Synchronization)</option>
    </select>
  `);

  const buttons = document.getElementById("io-editing-tools-buttons");
  buttons.prepend(select);
  buttons.prepend(label);

  document
    .getElementById("example-select")
    .addEventListener("change", async (event) => {
      const value = event.currentTarget.value;
      const xmlUrl = example_boards[value + "Url"];
      if (xmlUrl) {
        try {
          const response = await fetch(xmlUrl);
          const xml = await response.text();
          this._eventBus.fire("example.import", { xml });
        } catch (err) {
          console.error("Failed to load BPMN example:", err);
        }
      }
    });

  // Respond to the init event using
  const modelValue = new URLSearchParams(window.location.search).get("model");
  if (modelValue && example_boards[modelValue + "Url"]) {
    this._eventBus.on("example.init", async () => {
      const xmlUrl = example_boards[modelValue + "Url"];
      try {
        const response = await fetch(xmlUrl);
        const xml = await response.text();
        this._eventBus.fire("example.import", { xml });
        document.getElementById("example-select").value = modelValue;
      } catch (err) {
        console.error("Failed to load BPMN example:", err);
      }
    });
  } else {
    this._eventBus.on("example.init", async () => {
      const xmlUrl = example_boards.unsafeGatewaysUrl; // matches selected above
      try {
        const response = await fetch(xmlUrl);
        const xml = await response.text();
        this._eventBus.fire("example.import", { xml });
      } catch (err) {
        console.error("Failed to load BPMN example:", err);
      }
    });
  }
};

AnalysisExamples.$inject = ["eventBus", "canvas"];
