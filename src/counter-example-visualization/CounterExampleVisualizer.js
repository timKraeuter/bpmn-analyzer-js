import {
  RESTART_COUNTER_EXAMPLE_VISUALIZATION,
  START_COUNTER_EXAMPLE_VISUALIZATION_EVENT,
  TOGGLE_MODE_EVENT,
  TRACE_EVENT,
} from "./util/EventHelper";

export default function CounterExampleVisualizer(
  animation,
  eventBus,
  elementRegistry,
  tokenCount,
  notifications,
) {
  animation.setAnimationSpeed(2);
  this._notifications = notifications;

  // We have to store the visualization functions in an object to be able to remove them later
  const clickFunctions = {};
  let lastProperty;

  eventBus.on(RESTART_COUNTER_EXAMPLE_VISUALIZATION, () => {
    if (lastProperty) {
      clearAndVisualize(lastProperty);
    }
  });

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
      property.addEventListener(
        "click",
        clearAndVisualize.bind(this, propertyResult),
      );
      clickFunctions[propertyResult.property] = clearAndVisualize.bind(
        this,
        propertyResult,
      );
    }
  }

  /**
   * @param {PropertyResult} propertyResult
   */
  function clearAndVisualize(propertyResult) {
    lastProperty = propertyResult;

    animation.clearAnimations();
    tokenCount.clearTokenCounts();

    eventBus.fire(TOGGLE_MODE_EVENT, {
      active: true,
    });
    eventBus.fire(START_COUNTER_EXAMPLE_VISUALIZATION_EVENT, {});

    notifications.showNotification({
      text: "Visualizing counter example started.",
    });

    visualizeCounterExample(propertyResult);
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
    const snapshot = getSingleSnapshot(
      propertyResult.counter_example.start_state,
    );
    visualizeSnapshotDelta(
      propertyResult.property,
      { tokens: {} },
      snapshot,
      propertyResult.counter_example.transitions,
      -1,
    );
  }

  /**
   * @param {string} property
   * @param {Snapshot} previousSnapshot
   * @param {Transition[]} transitions
   * @param {number} index
   */
  function visualizeNextState(property, previousSnapshot, transitions, index) {
    if (index >= transitions.length) {
      notifications.showNotification({
        text: "Visualizing counter example finished.",
      });
      return;
    }
    const transition = transitions[index];
    eventBus.fire(TRACE_EVENT, {
      element: elementRegistry.get(transition.label),
      property,
    });
    const snapshot = getSingleSnapshot(transition.next_state);
    visualizeSnapshotDelta(
      property,
      previousSnapshot,
      snapshot,
      transitions,
      index,
    );
  }

  /**
   * @param {string} property
   * @param {Snapshot} previousSnapshot
   * @param {Snapshot} snapshot
   * @param {Transition[]} transitions
   * @param {number} index
   */
  function visualizeSnapshotDelta(
    property,
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
            visualizeNextState(property, snapshot, transitions, index + 1);
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
