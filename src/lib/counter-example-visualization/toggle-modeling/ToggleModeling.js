import { domify, event as domEvent } from "min-dom";

import { TOGGLE_MODE_EVENT } from "../util/EventHelper";

import { CheckCircleIcon } from "../icons";

const MODELING_MARKUP = CheckCircleIcon();

export default function ToggleModeling(
  eventBus,
  tokenSimulationPalette,
  canvas,
) {
  this._eventBus = eventBus;
  this._tokenSimulationPalette = tokenSimulationPalette;

  this.canvasParent = canvas.getContainer().parentNode;

  this.isPaused = false;

  this._init();
}

ToggleModeling.prototype._init = function () {
  this.paletteEntry = domify(`
    <div class="bts-entry" title="Back to modeling">
      ${MODELING_MARKUP}
    </div>
  `);

  domEvent.bind(this.paletteEntry, "click", this.toggle.bind(this));

  this._tokenSimulationPalette.addEntry(this.paletteEntry, 0);
};

ToggleModeling.prototype.toggle = function () {
  this._eventBus.fire(TOGGLE_MODE_EVENT, { active: false });
};

ToggleModeling.$inject = ["eventBus", "tokenSimulationPalette", "canvas"];
