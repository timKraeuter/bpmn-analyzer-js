import { domify } from "min-dom";

import {
  RESTART_COUNTER_EXAMPLE_VISUALIZATION,
  TOGGLE_MODE_EVENT,
} from "../util/EventHelper";

const LOW_PRIORITY = 500;

const OFFSET_TOP = -10;
const OFFSET_RIGHT = -5;

const MESSAGE_COUNT_OVERLAY_TYPE = "message-count";

const MESSAGE_ICON_SVG = `<svg class="bts-count-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
  <path d="M1 4v9h14V4H1zm1.5 1h11L8 8.5 2.5 5zm-.5 7V5.5l6 4 6-4V12H2z"/>
</svg>`;

const DEFAULT_PRIMARY_COLOR = "--token-simulation-grey-lighten-56";
const DEFAULT_AUXILIARY_COLOR = "--token-simulation-white";

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
      ${this._getMessageHTML(messageCount, colors)}
    </div>
  `);

  const position = { top: OFFSET_TOP, right: OFFSET_RIGHT };

  return this._overlays.add(element, MESSAGE_COUNT_OVERLAY_TYPE, {
    position,
    html,
    show: {
      minZoom: 0.5,
    },
  });
};

MessageCount.prototype.increaseMessageCount = function (element, colors) {
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

MessageCount.prototype._getMessageHTML = function (messageCount, colors) {
  colors = colors || this._getDefaultColors();

  return `
    <div class="bts-message-count waiting"
         style="color: ${colors.auxiliary}; background: ${colors.primary}">
      ${messageCount}
      ${MESSAGE_ICON_SVG}
    </div>
  `;
};

MessageCount.prototype._getDefaultColors = function () {
  return {
    primary: `var(${DEFAULT_PRIMARY_COLOR})`,
    auxiliary: `var(${DEFAULT_AUXILIARY_COLOR})`,
  };
};

MessageCount.$inject = ["eventBus", "overlays"];
