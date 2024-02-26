import { START_COUNTER_EXAMPLE_VISUALIZATION } from "../counter-example-visualization/util/EventHelper";
import { domify } from "min-dom";

const ANALYSIS_NOTE_TYPE = "analysis-note";
const WARNING_BASE64 =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjQiPg0KICA8cGF0aCBkPSJtNDAtMTIwIDQ0MC03NjAgNDQwIDc2MEg0MFptMTM4LTgwaDYwNEw0ODAtNzIwIDE3OC0yMDBabTMwMi00MHExNyAwIDI4LjUtMTEuNVQ1MjAtMjgwcTAtMTctMTEuNS0yOC41VDQ4MC0zMjBxLTE3IDAtMjguNSAxMS41VDQ0MC0yODBxMCAxNyAxMS41IDI4LjVUNDgwLTI0MFptLTQwLTEyMGg4MHYtMjAwaC04MHYyMDBabTQwLTEwMFoiIHN0cm9rZT0id2hpdGUiIGZpbGw9IndoaXRlIi8+DQo8L3N2Zz4NCg==";

export default function AnalysisOverlays(
  eventBus,
  overlays,
  canvas,
  elementRegistry,
) {
  eventBus.on("analysis.done", handleAnalysis);
  this._canvas = canvas;

  this._init();

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
    const properties = [
      "Safeness",
      "OptionToComplete",
      "ProperCompletion",
      "NoDeadActivities",
    ];
    for (const property of properties) {
      const propertyElement = document.getElementById(property);
      propertyElement.classList.remove("violated", "fulfilled");

      const propertyIcon = document.getElementById(`${property}-icon`);
      propertyIcon.classList.add("icon-question");
      propertyIcon.classList.remove(
        "icon-check",
        "icon-xmark",
        "fulfilled",
        "violated",
      );
    }
  }

  function handleAnalysis(result) {
    overlays.remove({
      type: ANALYSIS_NOTE_TYPE,
    });
    if (!result) {
      console.error("Should reset all properties");
      return;
    }
    if (result.unsupported_elements && result.unsupported_elements.length > 0) {
      addWarningForUnsupportedElements(result);
      return;
    }

    for (const propertyResult of result.property_results) {
      setPropertyColorAndIcon(propertyResult);

      if (propertyResult.property === "Safeness" && !propertyResult.fulfilled) {
        addOverlaysForUnsafe(propertyResult);
      }
      if (
        propertyResult.property === "ProperCompletion" &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForProperCompletion(propertyResult);
      }
      if (
        propertyResult.property === "NoDeadActivities" &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForNoDeadActivities(propertyResult);
      }
    }
  }

  function setPropertyColorAndIcon(propertyResult) {
    // Set the property somehow with jquery
    let elementById = document.getElementById(`${propertyResult.property}`);
    let elementIconById = document.getElementById(
      `${propertyResult.property}-icon`,
    );
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

  function addOverlaysForUnsafe(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addPropertyOverlay(
        problematicElement,
        {
          bottom: -5,
          left: 5,
        },
        "Unsafe",
        "small-note clickable",
      );
      document
        .getElementById(problematicElement + "_counter")
        .addEventListener("click", () => {
          eventBus.fire(START_COUNTER_EXAMPLE_VISUALIZATION, {
            propertyResult,
          });
        });
    }
  }

  function addOverlaysForProperCompletion(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addPropertyOverlay(
        problematicElement,
        {
          bottom: 50,
          right: -5,
        },
        "Consumes two or more tokens",
        "big-note clickable",
      );
      document
        .getElementById(problematicElement + "_counter")
        .addEventListener("click", () => {
          eventBus.fire(START_COUNTER_EXAMPLE_VISUALIZATION, {
            propertyResult,
          });
        });
    }
  }

  function addOverlaysForNoDeadActivities(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addPropertyOverlay(
        problematicElement,
        {
          bottom: -5,
          left: 17.5,
        },
        "Dead Activity",
        "big-note",
      );
    }
  }

  function addPropertyOverlay(problematicElement, position, text, cssClasses) {
    overlays.add(problematicElement, ANALYSIS_NOTE_TYPE, {
      position,
      html: `<div id="${problematicElement}_counter" class="property-note tooltip ${cssClasses}">
               ${text}
               ${cssClasses.includes("clickable") ? '<span class="tooltipText">Click to show counter example.</span>' : ""}
             </div>`,
    });
  }
}

AnalysisOverlays.prototype._init = function () {
  const html = domify(`
    <div class="properties">
      <div id="Safeness">Safeness</div>
      <div id="Safeness-icon" class="icon-question general-icon"></div>
      <div id="OptionToComplete">Option to complete</div>
      <div id="OptionToComplete-icon" class="icon-question general-icon"></div>
      <div id="ProperCompletion">Proper completion</div>
      <div id="ProperCompletion-icon" class="icon-question general-icon"></div>
      <div id="NoDeadActivities">No dead activities</div>
      <div id="NoDeadActivities-icon" class="icon-question general-icon"></div>
    </div>
  `);

  this._canvas.getContainer().appendChild(html);
};

AnalysisOverlays.$inject = [
  "eventBus",
  "overlays",
  "canvas",
  "elementRegistry",
];
