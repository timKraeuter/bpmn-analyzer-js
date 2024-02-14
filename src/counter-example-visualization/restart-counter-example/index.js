import RestartCounterExample from "./RestartCounterExample";

import NotificationsModule from "../notifications";

export default {
  __depends__: [NotificationsModule],
  __init__: ["restartCounterExample"],
  restartCounterExample: ["type", RestartCounterExample],
};
