import { domify } from "min-dom";

import {
  RESTART_COUNTER_EXAMPLE_VISUALIZATION,
  TOGGLE_MODE_EVENT,
} from "../util/EventHelper";

const LOW_PRIORITY = 500;

const OFFSET_TOP = -10;
const OFFSET_RIGHT = -5;

const MESSAGE_COUNT_OVERLAY_TYPE = "message-count";

/**
 * Manages message count overlays for BPMN message flows.
 * Messages are shown persistently until they disappear in the state.
 */
export default function MessageCount(eventBus, overlays) {
  this._overlays = overlays;
  this.overlayIdsAndCount = {};

  eventBus.on(RESTART_COUNTER_EXAMPLE_VISUALIZATION, () => {
    this.clearMessageCounts();
  });

  eventBus.on(TOGGLE_MODE_EVENT, LOW_PRIORITY, (event) => {
    if (!event.active) {
      this.clearMessageCounts();
    }
  });
}

MessageCount.prototype.addMessageCountOverlay = function (
  element,
  messageCount,
  colors,
) {
  const html = domify(`
    <div class="bts-message-count-parent">
      ${this._getMessageHTML(element, messageCount, colors)}
    </div>
  `);

  const position = { top: OFFSET_TOP, right: OFFSET_RIGHT };

  return this._overlays.add(element, MESSAGE_COUNT_OVERLAY_TYPE, {
    position: position,
    html: html,
    show: {
      minZoom: 0.5,
    },
  });
};

MessageCount.prototype.increaseMessageCount = function (element, colors) {
  if (!element) {
    return;
  }

  let messageCount = 1;
  const existingOverlayIDAndCount = this.overlayIdsAndCount[element.id];
  if (existingOverlayIDAndCount) {
    this._overlays.remove(existingOverlayIDAndCount.id);
    messageCount = existingOverlayIDAndCount.count + 1;
  }

  const overlayID = this.addMessageCountOverlay(element, messageCount, colors);

  this.overlayIdsAndCount[element.id] = {
    id: overlayID,
    count: messageCount,
  };
};

MessageCount.prototype.clearMessageCounts = function () {
  this._overlays.remove({
    type: MESSAGE_COUNT_OVERLAY_TYPE,
  });
  this.overlayIdsAndCount = {};
};

MessageCount.prototype.decreaseMessageCountBy = function (
  element,
  amount,
  colors,
) {
  const overlayIdAndCount = this.overlayIdsAndCount[element.id];

  if (!overlayIdAndCount) {
    return;
  }
  this._overlays.remove(overlayIdAndCount.id);
  if (overlayIdAndCount.count > amount) {
    const decreasedCount = overlayIdAndCount.count - amount;
    const overlayID = this.addMessageCountOverlay(
      element,
      decreasedCount,
      colors,
    );
    this.overlayIdsAndCount[element.id] = {
      id: overlayID,
      count: decreasedCount,
    };
  } else {
    delete this.overlayIdsAndCount[element.id];
  }
};

MessageCount.prototype.decreaseMessageCount = function (element, colors) {
  this.decreaseMessageCountBy(element, 1, colors);
};

/**
 * Set the message count for an element directly.
 * If count is 0, removes the overlay.
 */
MessageCount.prototype.setMessageCount = function (element, count, colors) {
  if (!element) {
    return;
  }

  // Remove existing overlay if any
  const existingOverlayIDAndCount = this.overlayIdsAndCount[element.id];
  if (existingOverlayIDAndCount) {
    this._overlays.remove(existingOverlayIDAndCount.id);
    delete this.overlayIdsAndCount[element.id];
  }

  // Add new overlay if count > 0
  if (count > 0) {
    const overlayID = this.addMessageCountOverlay(element, count, colors);
    this.overlayIdsAndCount[element.id] = {
      id: overlayID,
      count: count,
    };
  }
};

MessageCount.prototype._getMessageHTML = function (
  element,
  messageCount,
  colors,
) {
  colors = colors || this._getDefaultColors();

  return `
    <div class="bts-message-count waiting"
         style="color: ${colors.auxiliary}; background: ${colors.primary}">
      ${messageCount}
      <svg class="bts-count-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1 4v9h14V4H1zm1.5 1h11L8 8.5 2.5 5zm-.5 7V5.5l6 4 6-4V12H2z"/>
      </svg>
    </div>
  `;
};

MessageCount.prototype._getDefaultColors = function () {
  return {
    primary: "#999",
    auxiliary: "#FFF",
  };
};

MessageCount.$inject = ["eventBus", "overlays"];
