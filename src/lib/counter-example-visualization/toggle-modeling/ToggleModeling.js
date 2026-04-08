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

  this._canvasParent = canvas.getContainer().parentNode;

  this._init();
}

ToggleModeling.prototype._init = function () {
  this._paletteEntry = domify(`
    <div class="bts-entry" title="Back to modeling">
      ${MODELING_MARKUP}
    </div>
  `);

  domEvent.bind(this._paletteEntry, "click", this.toggle.bind(this));

  this._tokenSimulationPalette.addEntry(this._paletteEntry, 0);
};

ToggleModeling.prototype.toggle = function () {
  this._eventBus.fire(TOGGLE_MODE_EVENT, { active: false });
};

ToggleModeling.$inject = ["eventBus", "tokenSimulationPalette", "canvas"];
