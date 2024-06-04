import { domify, event as domEvent } from "min-dom";

import { RESTART_COUNTER_EXAMPLE_VISUALIZATION } from "../util/EventHelper";

import { RestartIcon } from "../icons";

export default function RestartCounterExample(
  eventBus,
  tokenSimulationPalette,
) {
  this._eventBus = eventBus;
  this._tokenSimulationPalette = tokenSimulationPalette;

  this._init();
}

RestartCounterExample.prototype._init = function () {
  this._paletteEntry = domify(`
    <div class="bts-entry" title="Restart execution example">
      ${RestartIcon()}
    </div>
  `);

  domEvent.bind(this._paletteEntry, "click", () => {
    this.restartCounterExample();
  });

  this._tokenSimulationPalette.addEntry(this._paletteEntry, 2);
};

RestartCounterExample.prototype.restartCounterExample = function () {
  this._eventBus.fire(RESTART_COUNTER_EXAMPLE_VISUALIZATION);
};

RestartCounterExample.$inject = ["eventBus", "tokenSimulationPalette"];
