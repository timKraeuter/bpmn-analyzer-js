import {
  RESTART_COUNTER_EXAMPLE_VISUALIZATION,
  COUNTER_EXAMPLE_VISUALIZATION_STARTED,
  TOGGLE_MODE_EVENT,
  TRACE_EVENT,
  START_COUNTER_EXAMPLE_VISUALIZATION,
} from "./util/EventHelper";

export default function CounterExampleVisualizer(
  animation,
  eventBus,
  elementRegistry,
  tokenCount,
  notifications,
) {
  this._notifications = notifications;

  eventBus.on(START_COUNTER_EXAMPLE_VISUALIZATION, (data) => {
    if (data.propertyResult) {
      clearAndVisualize(data.propertyResult);
    }
  });

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

      const handler = clearAndVisualize.bind(this, propertyResult);
      property.addEventListener("click", handler);
      clickFunctions[propertyResult.property] = handler;
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
    eventBus.fire(COUNTER_EXAMPLE_VISUALIZATION_STARTED, {});

    notifications.showNotification({
      text: "Visualizing counter example started.",
    });

    visualizeCounterExample(propertyResult);
  }

  /**
   * Visualize the counter example on click.
   * Removes all ongoing animations and token counts and starts the animation.
   * @param {PropertyResult} propertyResult
   */
  function visualizeCounterExample(propertyResult) {
    visualizeSnapshotDelta(
      propertyResult.property,
      [],
      propertyResult.counter_example.start_state.snapshots,
      propertyResult.counter_example.transitions,
      -1,
    );
  }

  /**
   * @param {string} property
   * @param {Snapshot[]} previousSnapshots
   * @param {Transition[]} transitions
   * @param {number} index
   */
  function visualizeNextState(property, previousSnapshots, transitions, index) {
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
    visualizeSnapshotDelta(
      property,
      previousSnapshots,
      transition.next_state.snapshots,
      transitions,
      index,
    );
  }

  /**
   * @param {string} property
   * @param {Snapshot[]} previousSnapshots
   * @param {Snapshot[]} snapshots
   * @param {Transition[]} transitions
   * @param {number} index
   */
  function visualizeSnapshotDelta(
    property,
    previousSnapshots,
    snapshots,
    transitions,
    index,
  ) {
    // works but can probably be optimized
    const snapshotsDelta = calcSnapshotDelta(snapshots, previousSnapshots);

    if (
      snapshotsDelta.every(
        (snapshot) => Object.keys(snapshot.tokens).length === 0,
      )
    ) {
      visualizeNextState(property, snapshots, transitions, index + 1);
      return;
    }

    let semaphore = 0;
    snapshotsDelta.forEach((snapshot) => {
      Object.entries(snapshot.tokens).forEach(([key, tokenAmount]) => {
        const element = elementRegistry.get(key);
        const scope = { element };
        for (let i = 0; i < tokenAmount; i++) {
          semaphore++;
          tokenCount.decreaseTokenCount(element.source);
          animation.animate(element, scope, () => {
            semaphore--;
            tokenCount.increaseTokenCount(element.target);
            if (semaphore === 0) {
              visualizeNextState(property, snapshots, transitions, index + 1);
            }
          });
        }
      });
    });
  }

  /**
   * @param {Snapshot[]} previousSnapshots
   * @param {Snapshot[]} snapshots
   * @returns {Snapshot[]}
   */
  function calcSnapshotDelta(snapshots, previousSnapshots) {
    // Make a copy we can edit.
    const snapshotDiff = snapshots.map((snapshot) => {
      return { tokens: Object.assign({}, snapshot.tokens), id: snapshot.id };
    });
    // Remove all tokens that are in the previous snapshots
    previousSnapshots.forEach((oldSnapshot) => {
      Object.entries(oldSnapshot.tokens).forEach(([key, tokenAmount]) => {
        const newSnapshot = snapshotDiff.find(
          (snapshot) => snapshot.id === oldSnapshot.id,
        );
        const newAmount = newSnapshot.tokens[key] - tokenAmount;
        if (newAmount > 0) {
          newSnapshot.tokens[key] = newAmount;
        } else {
          delete newSnapshot.tokens[key];
        }
      });
    });
    return snapshotDiff;
  }
}

CounterExampleVisualizer.$inject = [
  "animation",
  "eventBus",
  "elementRegistry",
  "tokenCount",
  "notifications",
];
