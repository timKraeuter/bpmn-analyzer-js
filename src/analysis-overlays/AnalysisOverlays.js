const ANALYSIS_NOTE_TYPE = "analysis-note";

export default function AnalysisOverlays(eventBus, overlays) {
  eventBus.on("analysis.done", handleAnalysis);

  function handleAnalysis(result) {
    overlays.remove({
      type: ANALYSIS_NOTE_TYPE,
    });
    if (!result) {
      console.error("Should reset all properties");
      return;
    }

    for (const propertyResult of result.property_results) {
      setPropertyColorAndIcon(propertyResult);

      if (propertyResult.property === "Safeness" && !propertyResult.fulfilled) {
        addOverlaysForUnsafe(propertyResult, overlays);
      }
      if (
        propertyResult.property === "ProperCompletion" &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForProperCompletion(propertyResult, overlays);
      }
      if (
        propertyResult.property === "NoDeadActivities" &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForNoDeadActivities(propertyResult, overlays);
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
      elementById.classList.remove("red");
      elementById.classList.add("green");

      elementIconById.classList.remove("icon-question", "icon-xmark", "red");
      elementIconById.classList.add("icon-check", "green");
    } else {
      elementById.classList.remove("green");
      elementById.classList.add("red");

      elementIconById.classList.remove("icon-question", "icon-check", "green");
      elementIconById.classList.add("icon-xmark", "red");
    }
  }

  function addOverlaysForUnsafe(propertyResult, overlays) {
    for (const problematicElement of propertyResult.problematic_elements) {
      overlays.add(problematicElement, ANALYSIS_NOTE_TYPE, {
        position: {
          bottom: -5,
          left: 0,
        },
        html: '<div class="small-note property-note">Unsafe</div>',
      });
    }
  }

  function addOverlaysForProperCompletion(propertyResult, overlays) {
    for (const problematicElement of propertyResult.problematic_elements) {
      overlays.add(problematicElement, ANALYSIS_NOTE_TYPE, {
        position: {
          bottom: 50,
          right: -5,
        },
        html: '<div class="big-note property-note">Consumes two or more tokens</div>',
      });
    }
  }

  function addOverlaysForNoDeadActivities(propertyResult, overlays) {
    for (const problematicElement of propertyResult.problematic_elements) {
      overlays.add(problematicElement, ANALYSIS_NOTE_TYPE, {
        position: {
          bottom: -5,
          left: 17.5,
        },
        html: '<div class="big-note property-note">Dead Activity</div>',
      });
    }
  }
}

AnalysisOverlays.$inject = ["eventBus", "overlays"];
