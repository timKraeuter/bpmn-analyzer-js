import { domify } from "min-dom";

import { is } from "../util/ElementHelper";
import {
  RESTART_COUNTER_EXAMPLE_VISUALIZATION,
  TOGGLE_MODE_EVENT,
} from "../util/EventHelper";

const OFFSET_BOTTOM = 10;
const OFFSET_LEFT = -15;

const DEFAULT_PRIMARY_COLOR = "--token-simulation-green-base-44";
const DEFAULT_AUXILIARY_COLOR = "--token-simulation-white";

const TOKEN_COUNT_OVERLAY_TYPE = "token-count";

export default function TokenCount(eventBus, overlays) {
  this._overlays = overlays;
  this.overlayIdsAndCount = {};

  eventBus.on(RESTART_COUNTER_EXAMPLE_VISUALIZATION, () => {
    this.clearTokenCounts();
  });

  eventBus.on(TOGGLE_MODE_EVENT, (event) => {
    if (!event.active) {
      this.clearTokenCounts();
    }
  });
}

TokenCount.prototype.addTokenCountOverlay = function (element, tokenCount) {
  const html = domify(`
    <div class="bts-token-count-parent">
      ${this._getTokenHTML(element, tokenCount)}
    </div>
  `);

  const position = { bottom: OFFSET_BOTTOM, left: OFFSET_LEFT };

  return this._overlays.add(element, TOKEN_COUNT_OVERLAY_TYPE, {
    position: position,
    html: html,
    show: {
      minZoom: 0.5,
    },
  });
};

TokenCount.prototype.increaseTokenCount = function (element) {
  let tokenCount = 1;
  const existingOverlayIDAndCount = this.overlayIdsAndCount[element.id];
  if (existingOverlayIDAndCount) {
    this._overlays.remove(existingOverlayIDAndCount.id);
    tokenCount = existingOverlayIDAndCount.count + 1;
  }

  const overlayID = this.addTokenCountOverlay(element, tokenCount);
  this.overlayIdsAndCount[element.id] = {
    id: overlayID,
    count: tokenCount,
  };
};

TokenCount.prototype.clearTokenCounts = function () {
  this._overlays.remove({
    type: TOKEN_COUNT_OVERLAY_TYPE,
  });
  this.overlayIdsAndCount = {};
};

TokenCount.prototype.decreaseTokenCount = function (element) {
  const overlayIdAndCount = this.overlayIdsAndCount[element.id];

  if (!overlayIdAndCount) {
    return;
  }
  this._overlays.remove(overlayIdAndCount.id);
  if (overlayIdAndCount.count > 1) {
    const decreasedCount = overlayIdAndCount.count - 1;
    const overlayID = this.addTokenCountOverlay(element, decreasedCount);
    this.overlayIdsAndCount[element.id] = {
      id: overlayID,
      count: decreasedCount,
    };
  } else {
    delete this.overlayIdsAndCount[element.id];
  }
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
