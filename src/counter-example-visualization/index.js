import CounterExampleVisualizer from "./CounterExampleVisualizer";
import AnimationModule from "./animation";
import TokenCountModule from "./token-count";

export default {
  __depends__: [AnimationModule, TokenCountModule],
  __init__: ["counterExampleVisualizer"],
  counterExampleVisualizer: ["type", CounterExampleVisualizer],
};
