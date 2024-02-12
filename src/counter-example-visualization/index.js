import CounterExampleVisualizer from "./CounterExampleVisualizer";
import AnimationModule from "./animation";

export default {
  __depends__: [AnimationModule],
  __init__: ["counterExampleVisualizer"],
  counterExampleVisualizer: ["type", CounterExampleVisualizer],
};
