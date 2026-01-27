import CounterExampleVisualizer from "./CounterExampleVisualizer";
import AnimationModule from "./animation";
import TokenCountModule from "./token-count";
import MessageCountModule from "./message-count";
import TokenColorsModule from "./token-colors";
import NotificationsModule from "./notifications";
import LogModule from "./log";
import DisableModelingModule from "./disable-modeling";
import TokenSimulationPaletteModule from "./palette";
import RestartCounterExampleModule from "./restart-counter-example";
import PauseExecutionModule from "./pause-execution";
import ToggleModelingModule from "./toggle-modeling";
import SetAnimationSpeedModule from "./set-animation-speed";

export default {
  __depends__: [
    AnimationModule,
    TokenCountModule,
    MessageCountModule,
    TokenColorsModule,
    NotificationsModule,
    LogModule,
    DisableModelingModule,
    TokenSimulationPaletteModule,
    RestartCounterExampleModule,
    PauseExecutionModule,
    ToggleModelingModule,
    SetAnimationSpeedModule,
  ],
  __init__: ["counterExampleVisualizer"],
  counterExampleVisualizer: ["type", CounterExampleVisualizer],
};
