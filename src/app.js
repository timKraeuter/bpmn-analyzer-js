import BpmnModeler from "bpmn-js/lib/Modeler";

import emptyBoardXML from "../resources/empty.bpmn";

import AnalysisModule from "./lib/analysis/wasm"; // Analysis using WASM
// import AnalysisModule from "./lib/analysis/webclient"; // Analysis using a webservice (requires a running server on port 3001)
import AnalysisOverlaysModule from "./lib/analysis-overlays";
import QuickFixesModule from "./lib/quick-fixes";
import CounterExampleVisualizationModule from "./lib/counter-example-visualization";
import AnalysisExamplesModule from "./lib/analysis-examples";
import PropertiesSummaryModule from "./lib/properties-summary";

// modeler instance
const modeler = new BpmnModeler({
  container: "#canvas",
  additionalModules: [
    AnalysisModule,
    AnalysisOverlaysModule,
    PropertiesSummaryModule,
    QuickFixesModule,
    AnalysisExamplesModule,
    CounterExampleVisualizationModule,
  ],
  keyboard: {
    bindTo: window,
  },
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
      "Looks like you use an older browser that does not support drag and drop. " +
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

const fileInput = document.createElement("input");
fileInput.setAttribute("type", "file");
fileInput.style.display = "none";
document.body.appendChild(fileInput);
fileInput.addEventListener("change", function (e) {
  openFile(e.target.files[0], openBoard);
});

function openBoard(xml) {
  // import board
  modeler.importXML(xml).catch(function (err) {
    if (err) {
      return console.error("could not import xml", err);
    }
  });
}

function saveSVG() {
  return modeler.saveSVG();
}

function saveBoard() {
  return modeler.saveXML({ format: true });
}

// bootstrap board functions
const downloadLink = document.getElementById("js-download-board");
const downloadSvgLink = document.getElementById("js-download-svg");

const openNew = document.getElementById("js-open-new");
const openExistingBoard = document.getElementById("js-open-board");

function setEncoded(link, name, data) {
  const encodedData = encodeURIComponent(data);

  if (data) {
    link.classList.add("active");
    link.setAttribute(
      "href",
      "data:application/xml;charset=UTF-8," + encodedData,
    );
    link.setAttribute("download", name);
  } else {
    link.classList.remove("active");
  }
}

const exportArtifacts = debounce(function () {
  saveSVG().then(function (result) {
    setEncoded(downloadSvgLink, "bpmn.svg", result.svg);
  });

  saveBoard().then(function (result) {
    setEncoded(downloadLink, "bpmn.bpmn", result.xml);
    modeler._emit("analysis.start", result);
  });
}, 500);

modeler.on("commandStack.changed", exportArtifacts);
modeler.on("import.done", exportArtifacts);
modeler.on("example.import", (data) => openBoard(data.xml));

openNew.addEventListener("click", function () {
  openBoard(emptyBoardXML);
});

openExistingBoard.addEventListener("click", function () {
  // clear input so that previously selected file can be reopened
  fileInput.value = "";
  fileInput.click();
});

modeler._emit("example.init", {});

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
