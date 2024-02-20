import { some } from "min-dash";

import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

export function isTypedEvent(event, eventDefinitionType) {
  return some(getBusinessObject(event).eventDefinitions, (definition) => {
    return is(definition, eventDefinitionType);
  });
}
