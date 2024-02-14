import CounterExampleVisualizer from "./CounterExampleVisualizer";
import AnimationModule from "./animation";
import TokenCountModule from "./token-count";
import NotificationsModule from "./notifications";
import LogModule from "./log";
import DisableModelingModule from "./disable-modeling";
import TokenSimulationPaletteModule from "./palette";
import RestartCounterExampleModule from "./restart-counter-example";
import PauseExecutionModule from "./pause-execution";

export default {
  __depends__: [
    AnimationModule,
    TokenCountModule,
    NotificationsModule,
    LogModule,
    DisableModelingModule,
    TokenSimulationPaletteModule,
    RestartCounterExampleModule,
    PauseExecutionModule,
  ],
  __init__: ["counterExampleVisualizer"],
  counterExampleVisualizer: ["type", CounterExampleVisualizer],
};
