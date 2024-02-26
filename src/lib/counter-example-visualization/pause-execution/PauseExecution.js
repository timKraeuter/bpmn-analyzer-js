import { domify, classes as domClasses, event as domEvent } from "min-dom";

import {
  PLAY_EXECUTION_EVENT,
  PAUSE_EXECUTION_EVENT,
  RESTART_COUNTER_EXAMPLE_VISUALIZATION,
} from "../util/EventHelper";

import { PlayIcon, PauseIcon } from "../icons";

const PLAY_MARKUP = PlayIcon();
const PAUSE_MARKUP = PauseIcon();

export default function PauseExecution(
  eventBus,
  tokenSimulationPalette,
  notifications,
  canvas,
) {
  this._eventBus = eventBus;
  this._tokenSimulationPalette = tokenSimulationPalette;
  this._notifications = notifications;

  this.canvasParent = canvas.getContainer().parentNode;

  this.isPaused = false;

  this._init();
}

PauseExecution.prototype._init = function () {
  this.paletteEntry = domify(`
    <div class="bts-entry" title="Play/Pause Execution">
      ${PAUSE_MARKUP}
    </div>
  `);

  domEvent.bind(this.paletteEntry, "click", this.toggle.bind(this));

  this._tokenSimulationPalette.addEntry(this.paletteEntry, 1);

  this._eventBus.on(RESTART_COUNTER_EXAMPLE_VISUALIZATION, () => {
    // Similar to unpause
    domClasses(this.paletteEntry).remove("active");
    domClasses(this.canvasParent).remove("paused");
    this.paletteEntry.innerHTML = PAUSE_MARKUP;
    this.isPaused = false;
  });
};

PauseExecution.prototype.toggle = function () {
  if (this.isPaused) {
    this.unpause();
  } else {
    this.pause();
  }
};

PauseExecution.prototype.pause = function () {
  domClasses(this.paletteEntry).add("active");
  domClasses(this.canvasParent).add("paused");

  this.paletteEntry.innerHTML = PLAY_MARKUP;

  this._eventBus.fire(PAUSE_EXECUTION_EVENT);

  this._notifications.showNotification({
    text: "Pause Execution",
  });

  this.isPaused = true;
};

PauseExecution.prototype.unpause = function () {
  if (!this.isPaused) {
    return;
  }

  domClasses(this.paletteEntry).remove("active");
  domClasses(this.canvasParent).remove("paused");

  this.paletteEntry.innerHTML = PAUSE_MARKUP;

  this._eventBus.fire(PLAY_EXECUTION_EVENT);

  this._notifications.showNotification({
    text: "Play Execution",
  });

  this.isPaused = false;
};

PauseExecution.$inject = [
  "eventBus",
  "tokenSimulationPalette",
  "notifications",
  "canvas",
];
