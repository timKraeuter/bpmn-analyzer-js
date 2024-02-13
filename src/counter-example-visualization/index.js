import CounterExampleVisualizer from "./CounterExampleVisualizer";
import AnimationModule from "./animation";
import TokenCountModule from "./token-count";
import NotificationsModule from "./notifications";
import LogModule from "./log";

export default {
  __depends__: [
    AnimationModule,
    TokenCountModule,
    NotificationsModule,
    LogModule,
  ],
  __init__: ["counterExampleVisualizer"],
  counterExampleVisualizer: ["type", CounterExampleVisualizer],
};
