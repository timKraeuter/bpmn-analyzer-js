import { domify } from "min-dom";

import { is, isAny } from "bpmn-js/lib/util/ModelUtil";
import { hasEventDefinition } from "bpmn-js/lib/util/DiUtil";

import {
  RESTART_COUNTER_EXAMPLE_VISUALIZATION,
  TOGGLE_MODE_EVENT,
  TRACE_EVENT,
} from "../util/EventHelper";
const LOW_PRIORITY = 500;

const OFFSET_BOTTOM = 10;
const OFFSET_LEFT = -15;

const TOKEN_COUNT_OVERLAY_TYPE = "token-count";

export default function TokenCount(eventBus, overlays, tokenColors) {
  this._overlays = overlays;
  this._overlayIdsAndCount = {};

  eventBus.on(RESTART_COUNTER_EXAMPLE_VISUALIZATION, () => {
    this.clearTokenCounts();
  });

  eventBus.on(TOGGLE_MODE_EVENT, LOW_PRIORITY, (event) => {
    if (!event.active) {
      this.clearTokenCounts();
    }
  });

  // Add specific token count behavior for some elements.
  eventBus.on(TRACE_EVENT, (data) => {
    const element = data.element;
    if (isAny(element, ["bpmn:EndEvent", "bpmn:EventBasedGateway"])) {
      this.decreaseTokenCount(element, tokenColors.getColorForElement(element));
    }
    if (is(element, "bpmn:ParallelGateway")) {
      // We decrease the token count for all incoming sequence flows - 1 since it has already been decreased by one.
      this.decreaseTokenCountBy(
        element,
        element.incoming.length - 1,
        tokenColors.getColorForElement(element),
      );
    }
    if (hasEventDefinition(element, "bpmn:TerminateEventDefinition")) {
      // Note: May need adjustment for multiple snapshots in the same process.
      // Remove all tokens from the same snapshot.
      element.parent.children.forEach((child) => this.removeAllTokens(child));
    }
  });
}

TokenCount.prototype.addTokenCountOverlay = function (
  element,
  tokenCount,
  colors,
) {
  const html = domify(`
    <div class="bts-token-count-parent">
      ${this._getTokenHTML(element, tokenCount, colors)}
    </div>
  `);

  const position = { bottom: OFFSET_BOTTOM, left: OFFSET_LEFT };

  return this._overlays.add(element, TOKEN_COUNT_OVERLAY_TYPE, {
    position,
    html,
    show: {
      minZoom: 0.5,
    },
  });
};

TokenCount.prototype.increaseTokenCount = function (element, colors) {
  let tokenCount = 1;
  const existingOverlayIDAndCount = this._overlayIdsAndCount[element.id];
  if (existingOverlayIDAndCount) {
    this._overlays.remove(existingOverlayIDAndCount.id);
    tokenCount = existingOverlayIDAndCount.count + 1;
  }

  const overlayID = this.addTokenCountOverlay(element, tokenCount, colors);
  this._overlayIdsAndCount[element.id] = {
    id: overlayID,
    count: tokenCount,
  };
};

TokenCount.prototype.clearTokenCounts = function () {
  this._overlays.remove({
    type: TOKEN_COUNT_OVERLAY_TYPE,
  });
  this._overlayIdsAndCount = {};
};

TokenCount.prototype.removeAllTokens = function (element) {
  const overlayIdAndCount = this._overlayIdsAndCount[element.id];

  if (!overlayIdAndCount) {
    return;
  }
  this._overlays.remove(overlayIdAndCount.id);
  delete this._overlayIdsAndCount[element.id];
};

TokenCount.prototype.decreaseTokenCountBy = function (element, amount, colors) {
  const overlayIdAndCount = this._overlayIdsAndCount[element.id];

  if (!overlayIdAndCount) {
    return;
  }
  this._overlays.remove(overlayIdAndCount.id);
  if (overlayIdAndCount.count > amount) {
    const decreasedCount = overlayIdAndCount.count - amount;
    const overlayID = this.addTokenCountOverlay(
      element,
      decreasedCount,
      colors,
    );
    this._overlayIdsAndCount[element.id] = {
      id: overlayID,
      count: decreasedCount,
    };
  } else {
    delete this._overlayIdsAndCount[element.id];
  }
};

TokenCount.prototype.decreaseTokenCount = function (element, colors) {
  this.decreaseTokenCountBy(element, 1, colors);
};

TokenCount.prototype._getTokenHTML = function (element, tokenCount, colors) {
  return `
    <div class="bts-token-count waiting"
         style="color: ${colors.auxiliary}; background: ${colors.primary}">
      ${tokenCount}
    </div>
  `;
};

TokenCount.$inject = ["eventBus", "overlays", "tokenColors"];
