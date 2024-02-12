export default function CounterExampleVisualizer(
  animation,
  eventBus,
  elementRegistry,
  tokenCount,
) {
  animation.setAnimationSpeed(2);

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
   * @param {State} state
   * @returns {Snapshot}
   */
  function getSingleSnapshot(state) {
    if (state.snapshots.length !== 1) {
      console.error("State has more than one snapshot! (not allowed for now)");
    }
    return state.snapshots[0];
  }

  /**
   * Visualize the counter example on click.
   * @param {PropertyResult} propertyResult
   */
  function visualizeCounterExample(propertyResult) {
    const snapshot = getSingleSnapshot(
      propertyResult.counter_example.start_state,
    );
    Object.entries(snapshot.tokens).forEach(([key, value]) => {
      const element = elementRegistry.get(key);
      const scope = { element };
      animation.animate(element, scope, () => {
        visualizeNextState(propertyResult.counter_example.transitions, 0);
      });
    });

    /**
     * @param {Transition[]} transitions
     * @param {number} index
     */
    function visualizeNextState(transitions, index) {
      if (index >= transitions.length) {
        const lastTransition = transitions[transitions.length - 1];
        const snapshot = getSingleSnapshot(lastTransition.next_state);

        Object.entries(snapshot.tokens).forEach(([elementId, tokenAmound]) => {
          const element = elementRegistry.get(elementId);
          if (element.target) {
            tokenCount.addTokenCounts(element.target, tokenAmound);
          }
        });
        return;
      }
      const transition = transitions[index];
      const snapshot = getSingleSnapshot(transition.next_state);

      Object.entries(snapshot.tokens).forEach(([key, value]) => {
        const element = elementRegistry.get(key);
        const scope = { element };
        animation.animate(element, scope, () => {
          visualizeNextState(
            propertyResult.counter_example.transitions,
            index + 1,
          );
        });
      });
    }
  }
}

CounterExampleVisualizer.$inject = [
  "animation",
  "eventBus",
  "elementRegistry",
  "tokenCount",
];
