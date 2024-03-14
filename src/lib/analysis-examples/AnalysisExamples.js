import { domify } from "min-dom";
import taskSplit from "../../../resources/implicit-task-split.bpmn";
import taskMerge from "../../../resources/implicit-task-merge.bpmn";
import showcase from "../../../resources/showcase.bpmn";
import unsafeGateways from "../../../resources/unsafe-gateways.bpmn";
import reusedEndEvent from "../../../resources/reused-end-event.bpmn";
import stuck from "../../../resources/stuck.bpmn";
import deadActivity from "../../../resources/dead-activity.bpmn";
import poolsWithMessageFlows from "../../../resources/pools-with-message-flows.bpmn";
import cycles from "../../../resources/cyclic.bpmn";
import deadReceiveTask from "../../../resources/dead_receive_task.bpmn";
import deadMice from "../../../resources/dead_mice.bpmn";

const example_boards = {
  taskSplit,
  taskMerge,
  showcase,
  unsafeGateways,
  reusedEndEvent,
  stuck,
  deadActivity,
  poolsWithMessageFlows,
  cycles,
  deadReceiveTask,
  deadMice,
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
      <option value="taskSplit">Implicit parallel gateway (Safeness)</option>
      <option value="stuck">Cannot terminate (Option To Complete)</option>
      <option value="unsafeGateways">
        Exclusive gateway (Safeness)
      </option>
      <option value="taskMerge">Implicit exclusive gateway (Safeness)</option>
      <option value="reusedEndEvent">Reused end event (Proper Completion)</option>
      <option value="deadActivity">Dead Activity (No Dead Activities)</option>
      <option value="showcase">Complex scenario</option>
      <option value="poolsWithMessageFlows">Counterexample with messages</option>
      <option value="cycles">Quick fixes with cycles</option>
      <option value="deadMice">Quick Fix missing message flow MICE</option>
      <option value="deadReceiveTask" selected="selected">Quick Fix missing message flow receive task</option>
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
      this._eventBus.fire("example.import", { xml });
    });
};

AnalysisExamples.$inject = ["eventBus", "canvas"];
