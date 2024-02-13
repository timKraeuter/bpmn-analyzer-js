import CounterExampleVisualizer from "./CounterExampleVisualizer";
import AnimationModule from "./animation";
import TokenCountModule from "./token-count";
import NotificationsModule from "./notifications";

export default {
  __depends__: [AnimationModule, TokenCountModule, NotificationsModule],
  __init__: ["counterExampleVisualizer"],
  counterExampleVisualizer: ["type", CounterExampleVisualizer],
};
