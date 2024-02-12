import { domify } from "min-dom";

import { is } from "../util/ElementHelper";

const OFFSET_BOTTOM = 10;
const OFFSET_LEFT = -15;

const DEFAULT_PRIMARY_COLOR = "--token-simulation-green-base-44";
const DEFAULT_AUXILIARY_COLOR = "--token-simulation-white";

export default function TokenCount(eventBus, overlays) {
  this._overlays = overlays;
  this.overlayIds = {};
}

TokenCount.prototype.addTokenCounts = function (element, tokenCount) {
  if (is(element, "bpmn:MessageFlow") || is(element, "bpmn:SequenceFlow")) {
    return;
  }
  this.removeTokenCounts(element);

  this.addTokenCount(element, tokenCount);
};

TokenCount.prototype.addTokenCount = function (element, tokenCount) {
  const html = domify(`
    <div class="bts-token-count-parent">
      ${this._getTokenHTML(element, tokenCount)}
    </div>
  `);

  const position = { bottom: OFFSET_BOTTOM, left: OFFSET_LEFT };

  this.overlayIds[element.id] = this._overlays.add(element, "token-count", {
    position: position,
    html: html,
    show: {
      minZoom: 0.5,
    },
  });
};

TokenCount.prototype.removeTokenCounts = function (element) {
  this.removeTokenCount(element);
};

TokenCount.prototype.removeTokenCount = function (element) {
  const overlayId = this.overlayIds[element.id];

  if (!overlayId) {
    return;
  }

  this._overlays.remove(overlayId);

  delete this.overlayIds[element.id];
};

TokenCount.prototype._getTokenHTML = function (element, tokenCount) {
  const colors = this._getDefaultColors();

  return `
    <div class="bts-token-count waiting"
         style="color: ${colors.auxiliary}; background: ${colors.primary}">
      ${tokenCount}
    </div>
  `;
};

TokenCount.prototype._getDefaultColors = function () {
  return {
    primary: DEFAULT_PRIMARY_COLOR,
    auxiliary: DEFAULT_AUXILIARY_COLOR,
  };
};

TokenCount.$inject = ["eventBus", "overlays"];
