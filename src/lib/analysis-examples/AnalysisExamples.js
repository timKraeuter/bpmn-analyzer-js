import { domify } from "min-dom";
import taskSplit from "../../../resources/taskSplit.bpmn";
import taskMerge from "../../../resources/taskMerge.bpmn";
import showcase from "../../../resources/showcase.bpmn";
import unsafeGateways from "../../../resources/unsafe-gateways.bpmn";
import reusedEndEvent from "../../../resources/reusedEndEvent.bpmn";
import stuck from "../../../resources/stuck.bpmn";
import deadActivity from "../../../resources/deadActivity.bpmn";

const example_boards = {
  taskSplit,
  taskMerge,
  showcase,
  unsafeGateways,
  reusedEndEvent,
  stuck,
  deadActivity,
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
      <option value="taskSplit">Unsafe implicit parallel gateway</option>
      <option value="stuck">Cannot terminate</option>
      <option value="unsafeGateways" selected="selected">
        Unsafe exclusive gateway
      </option>
      <option value="taskMerge">Unsafe implicit exclusive gateway</option>
      <option value="reusedEndEvent">Reused end event</option>
      <option value="showcase">Showcase</option>
      <option value="deadActivity">Dead Activity</option>
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
