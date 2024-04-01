import { START_COUNTER_EXAMPLE_VISUALIZATION } from "../util/EventHelper";
import randomColor from "randomcolor";

const colors = randomColor({
  count: 60,
}).filter((c) => getContrastYIQ(c.substring(1)) < 200);

let colorsIdx = 0;
let snapshotColorMap = new Map();

function getContrastYIQ(hexcolor) {
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export default function TokenColors(eventBus) {
  eventBus.on(START_COUNTER_EXAMPLE_VISUALIZATION, () => {
    colorsIdx = 0;
    snapshotColorMap.clear();
  });
}

TokenColors.$inject = ["eventBus"];

TokenColors.prototype.getColor = function getColor(snapshotID) {
  let color = snapshotColorMap.get(snapshotID);
  if (color) {
    return color;
  }

  const primary = colors[colorsIdx++ % colors.length];
  const auxiliary = getContrastYIQ(primary) >= 128 ? "#111" : "#fff";

  color = { primary, auxiliary };
  snapshotColorMap.set(snapshotID, color);
  return color;
};

TokenColors.prototype.getColorForElement = function getColorForElement(
  element,
) {
  if (element.parent.businessObject.processRef) {
    return this.getColor(element.parent.businessObject.processRef.id);
  } else {
    return this.getColor(element.parent.id);
  }
};
