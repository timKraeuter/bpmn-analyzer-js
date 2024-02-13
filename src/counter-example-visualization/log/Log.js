import { domify, classes as domClasses, query as domQuery } from "min-dom";

import { isTypedEvent } from "../util/ElementHelper";

import { escapeHTML } from "diagram-js/lib/util/EscapeUtil";

import {
  TOGGLE_MODE_EVENT,
  RESET_SIMULATION_EVENT,
  TRACE_EVENT,
} from "../util/EventHelper";

import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
const STYLE = getComputedStyle(document.documentElement);

const DEFAULT_PRIMARY_COLOR = STYLE.getPropertyValue(
  "--token-simulation-green-base-44",
);
const DEFAULT_AUXILIARY_COLOR = STYLE.getPropertyValue(
  "--token-simulation-white",
);

function getElementName(element) {
  const name = element.di.bpmnElement.name;
  if (name) {
    return escapeHTML(name);
  }
  return "";
}

export default function Log(eventBus, notifications, canvas) {
  this._notifications = notifications;
  this._canvas = canvas;

  this._content = domQuery(".bts-content", this._container);
  this._placeholder = domQuery(".bts-placeholder", this._container);

  eventBus.on(TRACE_EVENT, (data) => {
    const { property, element } = data;
    const elementName = getElementName(element);
    const scope = {
      id: property,
      colors: {
        primary: DEFAULT_PRIMARY_COLOR,
        auxiliary: DEFAULT_AUXILIARY_COLOR,
      },
    };

    if (is(element, "bpmn:BusinessRuleTask")) {
      this.log({
        text: elementName || "Business Rule Task",
        icon: "bpmn-icon-business-rule",
        scope,
      });
    } else if (
      is(element, "bpmn:IntermediateCatchEvent") ||
      is(element, "bpmn:IntermediateThrowEvent")
    ) {
      this.log({
        text: elementName || "Intermediate Event",
        icon: "bpmn-icon-intermediate-element-none",
        scope,
      });
    }
    if (is(element, "bpmn:BoundaryEvent")) {
      this.log({
        text: elementName || "Boundary Event",
        icon: "bpmn-icon-intermediate-element-none",
        scope,
      });
    } else if (is(element, "bpmn:ManualTask")) {
      this.log({
        text: elementName || "Manual Task",
        icon: "bpmn-icon-manual",
        scope,
      });
    } else if (is(element, "bpmn:ScriptTask")) {
      this.log({
        text: elementName || "Script Task",
        icon: "bpmn-icon-script",
        scope,
      });
    } else if (is(element, "bpmn:ServiceTask")) {
      this.log({
        text: elementName || "Service Task",
        icon: "bpmn-icon-service",
        scope,
      });
    } else if (is(element, "bpmn:Task")) {
      this.log({
        text: elementName || "Task",
        icon: "bpmn-icon-task",
        scope,
      });
    } else if (is(element, "bpmn:UserTask")) {
      this.log({
        text: elementName || "User Task",
        icon: "bpmn-icon-user",
        scope,
      });
    } else if (is(element, "bpmn:ExclusiveGateway")) {
      this.log({
        text: elementName || "Exclusive Gateway",
        icon: "bpmn-icon-gateway-xor",
        scope,
      });
    } else if (is(element, "bpmn:ParallelGateway")) {
      this.log({
        text: elementName || "Parallel Gateway",
        icon: "bpmn-icon-gateway-parallel",
        scope,
      });
    } else if (is(element, "bpmn:EndEvent")) {
      if (
        isTypedEvent(
          getBusinessObject(element),
          "bpmn:TerminateEventDefinition",
        )
      ) {
        this.log({
          text: elementName || "Terminate End Event",
          icon: "bpmn-icon-end-element-terminate",
          scope,
        });
      } else {
        this.log({
          text: elementName || "End Event",
          icon: "bpmn-icon-end-event-none",
          scope,
        });
      }
    }
  });

  eventBus.on([TOGGLE_MODE_EVENT, RESET_SIMULATION_EVENT], (event) => {
    this.clear();
    this.toggle(false);
  });
}

Log.prototype.isShown = function () {
  const container = this._container;

  return !domClasses(container).has("hidden");
};

Log.prototype.toggle = function (shown = !this.isShown()) {
  const container = this._container;

  if (shown) {
    domClasses(container).remove("hidden");
  } else {
    domClasses(container).add("hidden");
  }
};

Log.prototype.log = function (options) {
  this._notifications.showNotification(options);
};

Log.prototype.clear = function () {
  while (this._content.firstChild) {
    this._content.removeChild(this._content.firstChild);
  }

  this._placeholder = domify('<p class="bts-entry placeholder">No Entries</p>');

  this._content.appendChild(this._placeholder);
};

Log.$inject = ["eventBus", "notifications", "canvas"];
