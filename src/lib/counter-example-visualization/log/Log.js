import {
  classes as domClasses,
  domify,
  event as domEvent,
  query as domQuery,
} from "min-dom";

import { escapeHTML } from "diagram-js/lib/util/EscapeUtil";

import {
  COUNTER_EXAMPLE_VISUALIZATION_STARTED,
  RESTART_COUNTER_EXAMPLE_VISUALIZATION,
  TOGGLE_MODE_EVENT,
  TRACE_EVENT,
} from "../util/EventHelper";

import { InfoIcon, LogIcon, TimesIcon } from "../icons";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

const ICON_INFO = InfoIcon();

function getElementName(element) {
  const name = element.di.bpmnElement.name;
  if (name) {
    return escapeHTML(name);
  }
  return "";
}

export default function Log(
  eventBus,
  notifications,
  canvas,
  tokenSimulationPalette,
  tokenColors,
) {
  this._notifications = notifications;
  this._canvas = canvas;
  this._tokenSimulationPalette = tokenSimulationPalette;

  this._init();

  function getScopeID(element) {
    if (element.parent.businessObject.name) {
      return element.parent.businessObject.name.substring(0, 20);
    }
    return element.parent.id.substring(0, 7);
  }

  eventBus.on(TRACE_EVENT, (data) => {
    const { element } = data;
    const elementName = getElementName(element);
    const scope = {
      id: getScopeID(element),
      colors: tokenColors.getColorForElement(element),
    };
    if (is(element, "bpmn:BusinessRuleTask")) {
      this.log({
        text: elementName || "Business Rule Task",
        icon: "bpmn-icon-business-rule",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:SendTask")) {
      this.log({
        text: elementName || "Send Task",
        icon: "bpmn-icon-send-task",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:SubProcess")) {
      this.log({
        text: elementName || "Sub-process",
        icon: "bpmn-icon-subprocess-collapsed",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:ReceiveTask")) {
      this.log({
        text: elementName || "Receive Task",
        icon: "bpmn-icon-receive-task",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:IntermediateThrowEvent")) {
      this.log({
        text: elementName || "Intermediate Throw Event",
        icon: getIconForIntermediateEvent(element, "throw"),
        scope,
      });
      return;
    }
    if (is(element, "bpmn:IntermediateCatchEvent")) {
      this.log({
        text: elementName || "Intermediate Catch Event",
        icon: getIconForIntermediateEvent(element, "catch"),
        scope,
      });
      return;
    }
    if (is(element, "bpmn:BoundaryEvent")) {
      this.log({
        text: elementName || "Boundary Event",
        icon: "bpmn-icon-intermediate-event-none",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:ManualTask")) {
      this.log({
        text: elementName || "Manual Task",
        icon: "bpmn-icon-manual",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:ScriptTask")) {
      this.log({
        text: elementName || "Script Task",
        icon: "bpmn-icon-script",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:ServiceTask")) {
      this.log({
        text: elementName || "Service Task",
        icon: "bpmn-icon-service",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:UserTask")) {
      this.log({
        text: elementName || "User Task",
        icon: "bpmn-icon-user",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:Task")) {
      this.log({
        text: elementName || "Task",
        icon: "bpmn-icon-task",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:ExclusiveGateway")) {
      this.log({
        text: elementName || "Exclusive Gateway",
        icon: "bpmn-icon-gateway-xor",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:ParallelGateway")) {
      this.log({
        text: elementName || "Parallel Gateway",
        icon: "bpmn-icon-gateway-parallel",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:EventBasedGateway")) {
      this.log({
        text: elementName || "Event-based Gateway",
        icon: "bpmn-icon-gateway-eventbased",
        scope,
      });
      return;
    }
    if (is(element, "bpmn:StartEvent")) {
      this.log({
        text: elementName || "Start Event",
        icon: `bpmn-icon-start-event-${getEventTypeString(element)}`,
        scope,
      });
      return;
    }
    if (is(element, "bpmn:EndEvent")) {
      this.log({
        text: elementName || "End Event",
        icon: `bpmn-icon-end-event-${getEventTypeString(element)}`,
        scope,
      });
    }
  });

  eventBus.on(TOGGLE_MODE_EVENT, (event) => {
    if (event.active) {
      this.clear();
    } else {
      this.toggle(false);
    }
  });

  eventBus.on(RESTART_COUNTER_EXAMPLE_VISUALIZATION, () => {
    this.clear();
  });

  eventBus.on(COUNTER_EXAMPLE_VISUALIZATION_STARTED, (data) => {
    this.clear();
    this.toggle(true);
    const property = domify(
      `<p class="bts-entry placeholder">${mapProperty(
        data.propertyResult.property,
      )}</p>`,
    );
    this._content.prepend(property);
  });
}

function mapProperty(propertyName) {
  switch (propertyName) {
    case "ProperCompletion":
      return "Unique end event execution";
    case "Safeness":
      return "Synchronization";
    case "OptionToComplete":
      return "Guaranteed termination";
  }
  return "";
}

function getIconForIntermediateEvent(element, throwOrCatch) {
  const eventTypeString = getEventTypeString(element);
  if (eventTypeString === "none") {
    return `bpmn-icon-intermediate-event-none`;
  }
  return `bpmn-icon-intermediate-event-${throwOrCatch}-${eventTypeString}`;
}

function getEventTypeString(element) {
  const bo = getBusinessObject(element);
  if (bo.eventDefinitions.length === 0) {
    return "none";
  }
  const eventDefinition = bo.eventDefinitions[0];

  if (is(eventDefinition, "bpmn:MessageEventDefinition")) {
    return "message";
  }
  if (is(eventDefinition, "bpmn:TimerEventDefinition")) {
    return "timer";
  }
  if (is(eventDefinition, "bpmn:SignalEventDefinition")) {
    return "signal";
  }
  if (is(eventDefinition, "bpmn:ErrorEventDefinition")) {
    return "error";
  }
  if (is(eventDefinition, "bpmn:EscalationEventDefinition")) {
    return "escalation";
  }
  if (is(eventDefinition, "bpmn:CompensateEventDefinition")) {
    return "compensation";
  }
  if (is(eventDefinition, "bpmn:ConditionalEventDefinition")) {
    return "condition";
  }
  if (is(eventDefinition, "bpmn:LinkEventDefinition")) {
    return "link";
  }
  if (is(eventDefinition, "bpmn:CancelEventDefinition")) {
    return "cancel";
  }
  if (is(eventDefinition, "bpmn:TerminateEventDefinition")) {
    return "terminate";
  }
  return "none";
}

Log.prototype._init = function () {
  this._container = domify(`
    <div class="bts-log hidden djs-scrollable">
      <div class="bts-header">
        ${LogIcon("bts-log-icon")}
        Execution Log
        <button class="bts-close">
          ${TimesIcon()}
        </button>
      </div>
      <div class="bts-content">
        <p class="bts-entry placeholder">No Entries</p>
      </div>
    </div>
  `);

  this._placeholder = domQuery(".bts-placeholder", this._container);

  this._content = domQuery(".bts-content", this._container);

  domEvent.bind(this._content, "mousedown", (event) => {
    event.stopPropagation();
  });

  this._close = domQuery(".bts-close", this._container);

  domEvent.bind(this._close, "click", () => {
    this.toggle(false);
  });

  this._icon = domQuery(".bts-log-icon", this._container);

  domEvent.bind(this._icon, "click", () => {
    this.toggle();
  });

  this._canvas.getContainer().appendChild(this._container);

  this.paletteEntry = domify(`
    <div class="bts-entry" title="Toggle Execution Log">
      ${LogIcon()}
    </div>
  `);

  domEvent.bind(this.paletteEntry, "click", () => {
    this.toggle();
  });

  this._tokenSimulationPalette.addEntry(this.paletteEntry, 3);
};

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
  const { text, type = "info", icon = ICON_INFO, scope } = options;
  const content = this._content;

  domClasses(this._placeholder).add("hidden");

  if (!this.isShown()) {
    this._notifications.showNotification(options);
  }

  const iconMarkup = icon.startsWith("<") ? icon : `<i class="${icon}"></i>`;

  const colors = scope && scope.colors;

  const colorMarkup = colors
    ? `style="background: ${colors.primary}; color: ${colors.auxiliary}"`
    : "";

  const logEntry = domify(`
    <p class="bts-entry ${type}" ${scope ? `data-scope-id="${scope.id}"` : ""}>
      <span class="bts-icon">${iconMarkup}</span>
      <span class="bts-text" title="${text}">${text}</span>
      ${
        scope
          ? `<span class="bts-scope" data-scope-id="${scope.id}" ${colorMarkup}>${scope.id}</span>`
          : ""
      }
    </p>
  `);

  // determine if the container should scroll,
  // because it is currently scrolled to the very bottom
  const shouldScroll =
    Math.abs(content.clientHeight + content.scrollTop - content.scrollHeight) <
    2;

  content.appendChild(logEntry);

  if (shouldScroll) {
    content.scrollTop = content.scrollHeight;
  }
};

Log.prototype.clear = function () {
  while (this._content.firstChild) {
    this._content.removeChild(this._content.firstChild);
  }

  this._placeholder = domify('<p class="bts-entry placeholder">No Entries</p>');

  this._content.appendChild(this._placeholder);
};

Log.$inject = [
  "eventBus",
  "notifications",
  "canvas",
  "tokenSimulationPalette",
  "tokenColors",
];
