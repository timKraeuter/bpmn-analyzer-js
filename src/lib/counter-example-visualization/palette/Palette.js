import { domify, classes as domClasses, query as domQuery } from "min-dom";

import { TOGGLE_MODE_EVENT } from "../util/EventHelper";

export default function Palette(eventBus, canvas) {
  const self = this;

  this._canvas = canvas;

  this._entries = [];

  this._init();

  eventBus.on("diagram.init", () => {
    this._canvasParent = this._canvas.getContainer().parentNode;
    this._palette = domQuery(".djs-palette", this._canvas.getContainer());
  });

  eventBus.on(TOGGLE_MODE_EVENT, function (context) {
    if (!self._canvasParent || !self._palette) {
      return;
    }
    const active = context.active;

    if (active) {
      domClasses(self._container).remove("hidden");
      domClasses(self._canvasParent).add("simulation");
      domClasses(self._palette).add("hidden");
    } else {
      domClasses(self._container).add("hidden");
      domClasses(self._canvasParent).remove("simulation");
      domClasses(self._palette).remove("hidden");
    }
  });
}

Palette.prototype._init = function () {
  this._container = domify('<div class="bts-palette hidden"></div>');

  this._canvas.getContainer().appendChild(this._container);
};

Palette.prototype.addEntry = function (entry, index) {
  let childIndex = 0;

  this._entries.forEach(function (entry) {
    if (index >= entry.index) {
      childIndex++;
    }
  });

  this._container.insertBefore(entry, this._container.childNodes[childIndex]);

  this._entries.push({
    entry: entry,
    index: index,
  });
};

Palette.$inject = ["eventBus", "canvas"];
