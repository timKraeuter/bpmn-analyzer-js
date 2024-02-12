export default function CounterExampleVisualizer(
  animation,
  eventBus,
  elementRegistry,
) {
  eventBus.on("analysis.done", (result) => {
    result.property_results.forEach((propertyResult) => {
      addClickListenerIfNotFulfilled(propertyResult);
    });
  });

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
    if (propertyResult.counter_example.start_state.snapshots.length !== 1) {
      console.error("Start state has more than one snapshot");
      return;
    }
    const snapshot = propertyResult.counter_example.start_state.snapshots[0];
    Object.entries(snapshot.tokens).forEach(([key, value]) => {
      const element = elementRegistry.get(key);
      const scope = { element };
      animation.animate(element, scope, () => {
        console.log("Animation done");
      });
    });

    // propertyResult.counter_example.transitions.forEach((transition) => {
    //   console.log("Animate each transition", transition);
    // });
  }
}

CounterExampleVisualizer.$inject = ["animation", "eventBus", "elementRegistry"];
