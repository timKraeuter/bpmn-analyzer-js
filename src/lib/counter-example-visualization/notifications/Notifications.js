import { domify } from "min-dom";

import {
  TOGGLE_MODE_EVENT,
  RESTART_COUNTER_EXAMPLE_VISUALIZATION,
} from "../util/EventHelper";

import { InfoIcon } from "../icons";

const NOTIFICATION_TIME_TO_LIVE = 2000; // ms

const INFO_ICON = InfoIcon();

export default function Notifications(eventBus, canvas) {
  this._eventBus = eventBus;
  this._canvas = canvas;

  this._init();

  eventBus.on(
    [TOGGLE_MODE_EVENT, RESTART_COUNTER_EXAMPLE_VISUALIZATION],
    () => {
      this.clear();
    },
  );
}

Notifications.prototype._init = function () {
  this.container = domify('<div class="bts-notifications"></div>');

  this._canvas.getContainer().appendChild(this.container);
};

Notifications.prototype.showNotification = function (options) {
  const {
    text,
    type = "info",
    icon = INFO_ICON,
    scope,
    ttl = NOTIFICATION_TIME_TO_LIVE,
  } = options;

  const iconMarkup = icon.startsWith("<") ? icon : `<i class="${icon}"></i>`;

  const colors = scope && scope.colors;

  const colorMarkup = colors
    ? `style="color: ${colors.auxiliary}; background: ${colors.primary}"`
    : "";

  const notification = domify(`
    <div class="bts-notification ${type}">
      <span class="bts-icon">${iconMarkup}</span>
      <span class="bts-text" title="${text}">${text}</span>
      ${scope ? `<span class="bts-scope" ${colorMarkup}>${scope.id}</span>` : ""}
    </div>
  `);

  this.container.appendChild(notification);

  // prevent more than 5 notifications at once
  while (this.container.children.length > 5) {
    this.container.children[0].remove();
  }

  setTimeout(function () {
    notification.remove();
  }, ttl);
};

Notifications.prototype.clear = function () {
  while (this.container.children.length) {
    this.container.children[0].remove();
  }
};

Notifications.$inject = ["eventBus", "canvas"];
