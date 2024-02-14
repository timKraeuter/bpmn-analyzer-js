import { domify, classes as domClasses, query as domQuery } from "min-dom";

import { TOGGLE_MODE_EVENT } from "../util/EventHelper";

export default function Palette(eventBus, canvas) {
  const self = this;

  this._canvas = canvas;

  this.entries = [];

  this._init();

  eventBus.on("diagram.init", () => {
    this._canvasParent = this._canvas.getContainer().parentNode;
    this._palette = domQuery(".djs-palette", this._canvas.getContainer());
  });

  eventBus.on(TOGGLE_MODE_EVENT, function (context) {
    const active = context.active;

    if (active) {
      domClasses(self.container).remove("hidden");
      domClasses(self._canvasParent).add("simulation");
      domClasses(self._palette).add("hidden");
    } else {
      domClasses(self.container).add("hidden");
      domClasses(self._canvasParent).remove("simulation");
      domClasses(self._palette).remove("hidden");
    }
  });
}

Palette.prototype._init = function () {
  this.container = domify('<div class="bts-palette hidden"></div>');

  this._canvas.getContainer().appendChild(this.container);
};

Palette.prototype.addEntry = function (entry, index) {
  let childIndex = 0;

  this.entries.forEach(function (entry) {
    if (index >= entry.index) {
      childIndex++;
    }
  });

  this.container.insertBefore(entry, this.container.childNodes[childIndex]);

  this.entries.push({
    entry: entry,
    index: index,
  });
};

Palette.$inject = ["eventBus", "canvas"];
