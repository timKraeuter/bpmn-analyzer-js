import BpmnModeler from "bpmn-js/lib/Modeler";

import emptyBoardXML from "../resources/empty.bpmn";

import BPMNAnalyzerModule from "./lib/modeler";
import AnalysisExamplesModule from "./lib/analysis-examples";

import { APP_CONFIG } from "./config.js";
import { AzureOpenAI } from "openai/azure";

// modeler instance
const modeler = new BpmnModeler({
  container: "#canvas",
  additionalModules: [BPMNAnalyzerModule, AnalysisExamplesModule],
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

// Test LLM

const apiKey = APP_CONFIG.AZURE_OPENAI_API_KEY;
const endpoint = APP_CONFIG.AZURE_OPENAI_ENDPOINT;

if (!apiKey || apiKey === "your_azure_openai_api_key_here") {
  throw new Error("Please set your actual API key in config.js");
}

if (!endpoint || endpoint === "your_azure_openai_endpoint_here") {
  throw new Error("Please set your endpoint in config.js");
}

const modelName = "gpt-5-chat";
const deployment = "gpt-5-chat";
const apiVersion = "2024-04-01-preview";

async function queryLLM(prompt) {
  const options = {
    endpoint,
    apiKey,
    deployment,
    apiVersion,
    dangerouslyAllowBrowser: true,
  };

  const client = new AzureOpenAI(options);
  console.time("Model response time");
  console.log("Prompt:\n", prompt);
  const response = await client.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 16384,
    temperature: 1,
    top_p: 1,
    model: modelName,
  });

  if (response?.error !== undefined && response.status !== "200") {
    throw response.error;
  }
  let responseContent = response.choices[0].message.content;
  console.log("Response:", responseContent);
  console.log("Model: ", response.model);
  console.timeEnd("Model response time");
  return responseContent;
}

document
  .getElementById("js-chatgpt")
  .addEventListener("click", fixWithLLMClicked);

async function fixWithLLMClicked() {
  if (analysisResults.unsupported_elements.length > 0) {
    console.log("Unsupported elements -> no LLM action available.");
    return;
  }
  let propertyResult = analysisResults.property_results.find(
    (property) => !property.fulfilled,
  );
  if (!propertyResult) {
    console.log("No properties violated -> no LLM action available.");
    return;
  }
  console.log(`Querying ${modelName} to fix ${propertyResult.property}...`);
  let prompt = buildPrompt(propertyResult);
  let response = await queryLLM(prompt);
  let xml = extractXMLFromLLMResponse(response);
  // console.log("Extracted XML:", xml);
  if (xml) {
    openBoard(xml);
  }
}

function extractXMLFromLLMResponse(response) {
  // Match markdown xml block
  const xmlMatch = response.match(/```xml\s*([\s\S]*?)\s*```/);
  if (xmlMatch) {
    return xmlMatch[1];
  }
  // If no XML code block found, try to find XML content directly
  const xmlDirectMatch = response.match(/<\?xml[\s\S]*<\/definitions>/);
  if (xmlDirectMatch) {
    return xmlDirectMatch[0];
  }
  console.warn("No XML found in LLM response");
  return undefined;
}

function buildPrompt(propertyResult) {
  const commonSuffix =
    `Please provide the entire fixed BPMN model in a markdown xml codeblock as an answer and keep your changes minimal. If there are multiple ways to fix it choose one of them.\n` +
    `Here is the BPMN model:\n` +
    analysisResults.xml;
  let problematicElement = propertyResult.problematic_elements.find(() => true);
  switch (propertyResult.property) {
    case "Safeness":
      return `Fix my BPMN model which has an error such that it contains multiple tokens at the element with id "${problematicElement}".\n${commonSuffix}`;
    case "ProperCompletion":
      return `Fix my BPMN model which has an error such that the end event with id "${problematicElement}" consumes multiple tokens. Each end event should only consume one token.\n${commonSuffix}`;
    case "OptionToComplete":
      let counterExample = propertyResult.counter_example.transitions
        .map((transition) => transition.label)
        .join(" -> ");
      return `Fix my BPMN model which has an error such that it might deadlock due to the following order of actions "${counterExample}".\n${commonSuffix}`;
    case "NoDeadActivities":
      return `Fix my BPMN model which has a dead activity with the id "${problematicElement}".\n${commonSuffix}`;
  }
}

// Pass analysis results to the variable for LLM later.
/** @type {CheckingResponseWithXml} */
let analysisResults;

modeler.on("analysis.done", (result) => {
  analysisResults = result;
});
