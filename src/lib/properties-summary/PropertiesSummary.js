import { domify } from "min-dom";
import { ANALYSIS_NOTE_TYPE } from "../analysis-overlays/AnalysisOverlays";
import { ALL_PROPERTIES } from "../analysis/PropertyConstants";

const WARNING_BASE64 =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjQiPg0KICA8cGF0aCBkPSJtNDAtMTIwIDQ0MC03NjAgNDQwIDc2MEg0MFptMTM4LTgwaDYwNEw0ODAtNzIwIDE3OC0yMDBabTMwMi00MHExNyAwIDI4LjUtMTEuNVQ1MjAtMjgwcTAtMTctMTEuNS0yOC41VDQ4MC0zMjBxLTE3IDAtMjguNSAxMS41VDQ0MC0yODBxMCAxNyAxMS41IDI4LjVUNDgwLTI0MFptLTQwLTEyMGg4MHYtMjAwaC04MHYyMDBabTQwLTEwMFoiIHN0cm9rZT0id2hpdGUiIGZpbGw9IndoaXRlIi8+DQo8L3N2Zz4NCg==";

export default function PropertiesSummary(
  eventBus,
  overlays,
  canvas,
  elementRegistry,
) {
  eventBus.on("analysis.done", handleAnalysis);
  this._canvas = canvas;

  this._init();

  function handleAnalysis(result) {
    if (result.unsupported_elements && result.unsupported_elements.length > 0) {
      addWarningForUnsupportedElements(result);
      return;
    }

    if (result.property_results.length !== ALL_PROPERTIES.length) {
      resetPropertiesSummary();
    }

    for (const propertyResult of result.property_results) {
      setPropertyColorAndIcon(propertyResult);
    }
  }

  function addWarningForUnsupportedElements(result) {
    for (const unsupported_id of result.unsupported_elements) {
      const element = elementRegistry.get(unsupported_id);
      overlays.add(unsupported_id, ANALYSIS_NOTE_TYPE, {
        position: {
          top: -45,
          left: element.width / 2 - 17,
        },
        html: `<div class="small-note tooltip warning-note">
                 <img alt="quick-fix" src="data:image/svg+xml;base64,${WARNING_BASE64}"/>
                 <span class="tooltipText">This element is currently unsupported by the analyzer.</span>
               </div>`,
      });
    }

    resetPropertiesSummary();
  }

  function resetPropertiesSummary() {
    for (const property of ALL_PROPERTIES) {
      const propertyElement = document.getElementById(property);
      if (!propertyElement) {
        continue;
      }
      propertyElement.classList.remove("violated", "fulfilled");

      const propertyIcon = document.getElementById(`${property}-icon`);
      if (!propertyIcon) {
        continue;
      }
      propertyIcon.classList.add("icon-question");
      propertyIcon.classList.remove(
        "icon-check",
        "icon-xmark",
        "fulfilled",
        "violated",
      );
    }
  }

  function setPropertyColorAndIcon(propertyResult) {
    const elementById = document.getElementById(`${propertyResult.property}`);
    const elementIconById = document.getElementById(
      `${propertyResult.property}-icon`,
    );
    if (!elementById || !elementIconById) {
      return;
    }
    if (propertyResult.fulfilled) {
      elementById.classList.remove("violated");
      elementById.classList.add("fulfilled");

      elementIconById.classList.remove(
        "icon-question",
        "icon-xmark",
        "violated",
      );
      elementIconById.classList.add("icon-check", "fulfilled");
    } else {
      elementById.classList.remove("fulfilled");
      elementById.classList.add("violated");

      elementIconById.classList.remove(
        "icon-question",
        "icon-check",
        "fulfilled",
      );
      elementIconById.classList.add("icon-xmark", "violated");
    }
  }
}

PropertiesSummary.prototype._init = function () {
  const html = domify(`
    <div class="properties">
      <div id="Safeness">Synchronization</div>
      <div id="Safeness-icon" class="icon-question general-icon"></div>
      <div id="OptionToComplete">Guaranteed termination</div>
      <div id="OptionToComplete-icon" class="icon-question general-icon"></div>
      <div id="ProperCompletion">Unique end event execution</div>
      <div id="ProperCompletion-icon" class="icon-question general-icon"></div>
      <div id="NoDeadActivities">No dead activities</div>
      <div id="NoDeadActivities-icon" class="icon-question general-icon"></div>
    </div>
  `);

  this._canvas.getContainer().appendChild(html);
};

PropertiesSummary.$inject = [
  "eventBus",
  "overlays",
  "canvas",
  "elementRegistry",
];
