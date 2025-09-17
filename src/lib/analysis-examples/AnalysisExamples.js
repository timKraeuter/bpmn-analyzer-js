import { domify } from "min-dom";
import taskSplitXml from "../../../resources/implicit-task-split.bpmn?raw";
import taskMergeXml from "../../../resources/implicit-task-merge.bpmn?raw";
import showcaseXml from "../../../resources/showcase.bpmn?raw";
import unsafeGatewaysXml from "../../../resources/unsafe-gateways.bpmn?raw";
import reusedEndEventXml from "../../../resources/reused-end-event.bpmn?raw";
import stuckXml from "../../../resources/stuck.bpmn?raw";
import deadActivityXml from "../../../resources/dead-activity.bpmn?raw";
import poolsWithMessageFlowsXml from "../../../resources/pools-with-message-flows.bpmn?raw";
import cyclesXml from "../../../resources/cyclic.bpmn?raw";
import deadReceiveTaskXml from "../../../resources/dead-receive-task.bpmn?raw";
import deadMiceXml from "../../../resources/dead-mice.bpmn?raw";
import starvationXml from "../../../resources/starvation.bpmn?raw";
import livelockXml from "../../../resources/livelock.bpmn?raw";
import deadTasksConnectedXml from "../../../resources/dead_tasks_connected.bpmn?raw";
import orderHandlingXml from "../../../resources/order_handling.bpmn?raw";
import orderHandlingSynchronizationXml from "../../../resources/order_handling_synchronization.bpmn?raw";

const example_boards = {
  taskSplit: taskSplitXml,
  taskMerge: taskMergeXml,
  showcase: showcaseXml,
  unsafeGateways: unsafeGatewaysXml,
  reusedEndEvent: reusedEndEventXml,
  stuck: stuckXml,
  deadActivity: deadActivityXml,
  poolsWithMessageFlows: poolsWithMessageFlowsXml,
  cycles: cyclesXml,
  deadReceiveTask: deadReceiveTaskXml,
  deadMice: deadMiceXml,
  starvation: starvationXml,
  livelock: livelockXml,
  deadTasksConnected: deadTasksConnectedXml,
  orderHandling: orderHandlingXml,
  orderHandlingSynchronization: orderHandlingSynchronizationXml,
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
    .addEventListener("change", (event) => {
      const value = event.currentTarget.value;
      const xml = example_boards[value];
      if (xml) {
        this._eventBus.fire("example.import", { xml });
      }
    });

  // Respond to the init event using
  const modelValue = new URLSearchParams(window.location.search).get("model");
  if (modelValue && example_boards[modelValue]) {
    this._eventBus.on("example.init", () => {
      const xml = example_boards[modelValue];
      this._eventBus.fire("example.import", { xml });
      document.getElementById("example-select").value = modelValue;
    });
  } else {
    this._eventBus.on("example.init", () => {
      const xml = example_boards.unsafeGateways; // matches selected above
      this._eventBus.fire("example.import", { xml });
    });
  }
};

AnalysisExamples.$inject = ["eventBus", "canvas"];
