import $ from "jquery";

import BpmnModeler from "bpmn-js/lib/Modeler";

import emptyBoardXML from "../resources/initial.bpmn";
import sampleBoardXML from "../resources/initial.bpmn";

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from "bpmn-js-properties-panel";

import AnalysisClientModule from "./analysis";

// modeler instance
const modeler = new BpmnModeler({
  container: "#canvas",
  keyboard: {
    bindTo: window,
  },
  additionalModules: [BpmnPropertiesPanelModule, BpmnPropertiesProviderModule,
    AnalysisClientModule],
});

/* screen interaction */
function enterFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

const state = {
  fullScreen: false,
  keyboardHelp: false,
};
document
.getElementById("js-toggle-fullscreen")
.addEventListener("click", function () {
  state.fullScreen = !state.fullScreen;
  if (state.fullScreen) {
    enterFullscreen(document.documentElement);
  } else {
    exitFullscreen();
  }
});
document
.getElementById("js-toggle-keyboard-help")
.addEventListener("click", function () {
  state.keyboardHelp = !state.keyboardHelp;
  let displayProp = "none";
  if (state.keyboardHelp) {
    displayProp = "block";
  }
  document.getElementById("io-dialog-main").style.display = displayProp;
});
document
.getElementById("io-dialog-main")
.addEventListener("click", function () {
  state.keyboardHelp = !state.keyboardHelp;
  let displayProp = "none";
  if (!state.keyboardHelp) {
    document.getElementById("io-dialog-main").style.display = displayProp;
  }
});

/* file functions */
function openFile(file, callback) {
  // check file api availability
  if (!window.FileReader) {
    return window.alert(
        "Looks like you use an older browser that does not support drag and drop. "
        +
        "Try using a modern browser such as Chrome, Firefox or Internet Explorer > 10.",
    );
  }

  // no file chosen
  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const xml = e.target.result;

    callback(xml);
  };

  reader.readAsText(file);
}

const fileInput = $('<input type="file" />')
.appendTo(document.body)
.css({
  width: 1,
  height: 1,
  display: "none",
  overflow: "hidden",
})
.on("change", function (e) {
  openFile(e.target.files[0], openBoard);
});

function openBoard(xml) {
  // import board
  modeler.importXML(xml).catch(function (err) {
    if (err) {
      return console.error("could not import od board", err);
    }
  });
}

function saveSVG() {
  return modeler.saveSVG();
}

function saveBoard() {
  return modeler.saveXML({format: true});
}

// bootstrap board functions
$(function () {
  const downloadLink = $("#js-download-board");
  const downloadSvgLink = $("#js-download-svg");

  const openNew = $("#js-open-new");
  const openExistingBoard = $("#js-open-board");

  $(".buttons a").click(function (e) {
    if (!$(this).is(".active")) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    const encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass("active").attr({
        href: "data:application/xml;charset=UTF-8," + encodedData,
        download: name,
      });
    } else {
      link.removeClass("active");
    }
  }

  const exportArtifacts = debounce(function () {
    saveSVG().then(function (result) {
      setEncoded(downloadSvgLink, "bpmn.svg", result.svg);
    });

    saveBoard().then(function (result) {
      setEncoded(downloadLink, "bpmn.xml", result.xml);
      modeler._emit("analysis.start", result);
    });
  }, 500);

  modeler.on("commandStack.changed", exportArtifacts);
  modeler.on("import.done", exportArtifacts);

  modeler.on("analysis.done", handleAnalysis)

  openNew.on("click", function () {
    openBoard(emptyBoardXML);
  });

  openExistingBoard.on("click", function () {
    const input = $(fileInput);

    // clear input so that previously selected file can be reopened
    input.val("");
    input.trigger("click");
  });
});

openBoard(sampleBoardXML);

function handleAnalysis(result) {
  const overlays = modeler.get('overlays');
  overlays.clear();
  if (!result) {
    console.log("Should reset everything");
    return;
  }

  for (const propertyResult of result.property_results) {
    var {elementById, elementIconById} = setPropertyColorAndIcon(propertyResult);

    if (propertyResult.property === "Safeness" && !propertyResult.fulfilled) {
      addOverlaysForUnsafe(propertyResult, overlays);
    }
    if (propertyResult.property === "ProperCompletion"
        && !propertyResult.fulfilled) {
      addOverlaysForProperCompletion(propertyResult, overlays);
    }
    if (propertyResult.property === "NoDeadActivities"
        && !propertyResult.fulfilled) {
      addOverlaysForNoDeadActivities(propertyResult, overlays);
    }
  }
}

function setPropertyColorAndIcon(propertyResult) {
  // Set the property somehow with jquery
  var elementById = $(`#${propertyResult.property}`);
  var elementIconById = $(`#${propertyResult.property}-icon`);
  if (propertyResult.fulfilled) {
    elementById.removeClass("red");
    elementById.addClass("green");

    elementIconById.removeClass("icon-question icon-xmark red");
    elementIconById.addClass("icon-check green");
  } else {
    elementById.removeClass("green");
    elementById.addClass("red");

    elementIconById.removeClass("icon-question icon-check green");
    elementIconById.addClass("icon-xmark red");
  }
  return {elementById, elementIconById};
}

function addOverlaysForUnsafe(propertyResult, overlays) {
  for (const problematicElement of propertyResult.problematic_elements) {
    overlays.add(problematicElement, 'note', {
      position: {
        bottom: -5,
        left: 0
      },
      html: '<div class="small-note">Unsafe</div>'
    })
  }
}

function addOverlaysForProperCompletion(propertyResult, overlays) {
  for (const problematicElement of propertyResult.problematic_elements) {
    overlays.add(problematicElement, 'note', {
      position: {
        bottom: 50,
        right: -5
      },
      html: '<div class="big-note">Consumes two or more end events</div>'
    })
  }
}

function addOverlaysForNoDeadActivities(propertyResult, overlays) {
  for (const problematicElement of propertyResult.problematic_elements) {
    overlays.add(problematicElement, 'note', {
      position: {
        bottom: -5,
        left: 17.5,
      },
      html: '<div class="big-note">Dead Activity</div>'
    })
  }
}

// helpers //////////////////////

function debounce(fn, timeout) {
  let timer;

  return function () {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, timeout);
  };
}
