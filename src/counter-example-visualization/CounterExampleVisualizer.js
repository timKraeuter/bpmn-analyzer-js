export default function CounterExampleVisualizer(animation, eventBus) {
  this._animation = animation;
  this._eventBus = eventBus;

  this._eventBus.on("counterexample", (event) => {
    console.log("counterexample", event);
  });
}

CounterExampleVisualizer.$inject = ["animation", "eventBus"];
