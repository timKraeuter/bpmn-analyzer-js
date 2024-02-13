export default function CounterExampleVisualizer(
  animation,
  eventBus,
  elementRegistry,
  tokenCount,
  notifications,
) {
  animation.setAnimationSpeed(1.25);

  // We have to store the visualization functions in an object to be able to remove them later
  const clickFunctions = {};

  eventBus.on("analysis.done", (result) => {
    result.property_results.forEach((propertyResult) => {
      addClickListenerIfNotFulfilled(propertyResult);
    });
  });

  function addClickListenerIfNotFulfilled(propertyResult) {
    const property = document.getElementById(propertyResult.property);

    property.removeEventListener(
      "click",
      clickFunctions[propertyResult.property],
    );
    property.classList.remove("clickable");

    if (!property.fulfilled && propertyResult.counter_example) {
      property.classList.add("clickable");
      property.addEventListener("click", visualize);
      clickFunctions[propertyResult.property] = visualize;
    }

    function visualize() {
      visualizeCounterExample(propertyResult);
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
   * Removes all ongoing animations and token counts and starts the animation.
   * @param {PropertyResult} propertyResult
   */
  function visualizeCounterExample(propertyResult) {
    notifications.showNotification({
      text: "Visualizing counter example started.",
    });
    animation.clearAnimations();
    tokenCount.clearTokenCounts();

    const snapshot = getSingleSnapshot(
      propertyResult.counter_example.start_state,
    );
    visualizeSnapshotDelta(
      { tokens: {} },
      snapshot,
      propertyResult.counter_example.transitions,
      -1,
    );
  }

  /**
   * @param {Snapshot} previousSnapshot
   * @param {Transition[]} transitions
   * @param {number} index
   */
  function visualizeNextState(previousSnapshot, transitions, index) {
    if (index >= transitions.length) {
      notifications.showNotification({
        text: "Visualizing counter example finished.",
      });
      return;
    }
    const transition = transitions[index];
    const snapshot = getSingleSnapshot(transition.next_state);
    visualizeSnapshotDelta(previousSnapshot, snapshot, transitions, index);
  }

  /**
   * @param {Snapshot} previousSnapshot
   * @param {Snapshot} snapshot
   * @param {Transition[]} transitions
   * @param {number} index
   */
  function visualizeSnapshotDelta(
    previousSnapshot,
    snapshot,
    transitions,
    index,
  ) {
    // works but can probably be optimized
    const newTokens = calcTokenDelta(snapshot, previousSnapshot);

    let semaphore = 0;
    Object.entries(newTokens).forEach(([key, tokenAmount]) => {
      const element = elementRegistry.get(key);
      const scope = { element };
      for (let i = 0; i < tokenAmount; i++) {
        semaphore++;
        tokenCount.decreaseTokenCount(element.source);
        animation.animate(element, scope, () => {
          semaphore--;
          tokenCount.increaseTokenCount(element.target);
          if (semaphore === 0) {
            visualizeNextState(snapshot, transitions, index + 1);
          }
        });
      }
    });
  }

  function calcTokenDelta(snapshot, previousSnapshot) {
    const newTokens = { ...snapshot.tokens };
    Object.entries(previousSnapshot.tokens).forEach(([key, tokenAmount]) => {
      const newAmount = snapshot.tokens[key] - tokenAmount;
      if (newAmount > 0) {
        newTokens[key] = newAmount;
      } else {
        delete newTokens[key];
      }
    });
    return newTokens;
  }
}

CounterExampleVisualizer.$inject = [
  "animation",
  "eventBus",
  "elementRegistry",
  "tokenCount",
  "notifications",
];
