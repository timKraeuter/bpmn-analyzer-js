export default function CounterExampleVisualizer(animation, eventBus) {
  this._animation = animation;
  this._eventBus = eventBus;

  this._eventBus.on("analysis.done", (result) => {
    result.property_results.forEach((propertyResult) => {
      addClickListenerIfNotFulfilled(propertyResult);
    });
  });
}

CounterExampleVisualizer.$inject = ["animation", "eventBus"];

function addClickListenerIfNotFulfilled(propertyResult) {
  const property = document.getElementById(propertyResult.property);
  if (!property.fulfilled && propertyResult.counter_example) {
    property.classList.add("clickable");
    property.addEventListener("click", function () {
      visualizeCounterExample(propertyResult);
    });
  } else {
    property.classList.remove("clickable");
  }
}

/**
 * Visualize the counter example on click.
 * @param {PropertyResult} propertyResult
 */
function visualizeCounterExample(propertyResult) {
  console.log("Start animation", propertyResult.counter_example.start_state);
  propertyResult.counter_example.transitions.forEach((transition) => {
    console.log("Animate each transition", transition);
  });
}
