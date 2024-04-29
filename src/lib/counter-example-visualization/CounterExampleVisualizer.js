import {
  COUNTER_EXAMPLE_VISUALIZATION_STARTED,
  RESTART_COUNTER_EXAMPLE_VISUALIZATION,
  START_COUNTER_EXAMPLE_VISUALIZATION,
  TOGGLE_MODE_EVENT,
  TRACE_EVENT,
} from "./util/EventHelper";

export default function CounterExampleVisualizer(
  animation,
  eventBus,
  elementRegistry,
  tokenCount,
  notifications,
  tokenColors,
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

    if (!propertyResult.fulfilled && propertyResult.counter_example) {
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
    eventBus.fire(COUNTER_EXAMPLE_VISUALIZATION_STARTED, { propertyResult });

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
    visualizeStateChanges(
      propertyResult.property,
      [],
      propertyResult.counter_example.start_state,
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

    visualizeStateChanges(
      property,
      previousSnapshots,
      transition.next_state,
      transitions,
      index,
    );
  }

  /**
   * @param {string} property
   * @param {Snapshot[]} previousSnapshots
   * @param {State} state
   * @param {Transition[]} transitions
   * @param {number} index
   */
  function visualizeStateChanges(
    property,
    previousSnapshots,
    state,
    transitions,
    index,
  ) {
    // works but can probably be optimized
    const snapshotsDelta = calcSnapshotTokenAdditions(
      state.snapshots,
      previousSnapshots,
    );

    if (
      state.messages.size === 0 &&
      snapshotsDelta.every((snapshot) => snapshot.tokens.size === 0)
    ) {
      visualizeNextState(property, state.snapshots, transitions, index + 1);
      return;
    }

    let semaphore = 0;
    // Visualize messages
    state.messages.forEach((messageAmount, key) => {
      const element = elementRegistry.get(key);
      const scope = {
        element,
        colors: {
          primary: "#999",
          auxiliary: "#FFF",
        },
      };
      for (let i = 0; i < messageAmount; i++) {
        semaphore++;
        animation.animate(element, scope, () => {
          semaphore--;
          if (semaphore === 0) {
            visualizeNextState(
              property,
              state.snapshots,
              transitions,
              index + 1,
            );
          }
        });
      }
    });

    // Visualize tokens
    snapshotsDelta.forEach((snapshot) => {
      snapshot.tokens.forEach((tokenAmount, key) => {
        const element = elementRegistry.get(key);
        const scope = { element, colors: tokenColors.getColor(snapshot.id) };
        for (let i = 0; i < tokenAmount; i++) {
          semaphore++;
          tokenCount.decreaseTokenCount(element.source, scope.colors);
          animation.animate(element, scope, () => {
            semaphore--;
            tokenCount.increaseTokenCount(element.target, scope.colors);
            if (semaphore === 0) {
              visualizeNextState(
                property,
                state.snapshots,
                transitions,
                index + 1,
              );
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
  function calcSnapshotTokenAdditions(snapshots, previousSnapshots) {
    // Make a copy we can edit.
    const snapshotDiff = snapshots.map((snapshot) => {
      return {
        tokens: new Map(snapshot.tokens),
        id: snapshot.id,
      };
    });
    // Remove all tokens that are in the previous snapshots
    previousSnapshots.forEach((oldSnapshot) => {
      oldSnapshot.tokens.forEach((tokenAmount, key) => {
        const newSnapshot = snapshotDiff.find(
          (snapshot) => snapshot.id === oldSnapshot.id,
        );
        const newAmount = newSnapshot.tokens.get(key) - tokenAmount;
        if (newAmount > 0) {
          newSnapshot.tokens.set(key, newAmount);
        } else {
          newSnapshot.tokens.delete(key);
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
  "tokenColors",
];
