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
  additionalModules: [BpmnPropertiesPanelModule, BpmnPropertiesProviderModule, AnalysisClientModule],
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
  return modeler.saveXML({ format: true });
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
    });
  }, 500);

  modeler.on("commandStack.changed", exportArtifacts);
  modeler.on("import.done", exportArtifacts);

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
