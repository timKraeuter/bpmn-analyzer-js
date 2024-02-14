import PauseExecution from "./PauseExecution";

import NotificationsModule from "../notifications";

export default {
  __depends__: [NotificationsModule],
  __init__: ["pauseExecution"],
  pauseExecution: ["type", PauseExecution],
};
