import { is as __is } from "bpmn-js/lib/util/ModelUtil";

export function is(element, types) {
  if (element.type === "label") {
    return false;
  }

  if (!Array.isArray(types)) {
    types = [types];
  }

  return types.some(function (type) {
    return __is(element, type);
  });
}
