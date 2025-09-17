import BpmnModeler from "bpmn-js/lib/Modeler";

import emptyBoardXML from "../resources/empty.bpmn?raw";

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

// Load empty BPMN content asynchronously
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

// Helper: format response time (ms) -> "XXXms" if <=1000 else "X.XXs"
function formatResponseTime(ms) {
  if (ms > 1000) {
    const seconds = ms / 1000;
    // Show up to 2 decimals, trim trailing zeros
    let str = seconds.toFixed(2);
    if (str.indexOf(".") !== -1) {
      str = str.replace(/\.0+$/, "").replace(/(\.[0-9]*?)0+$/, "$1");
    }
    return `${str}s`;
  }
  return `${ms}ms`;
}

// Chat Dialog Functions
function openChatDialog() {
  const chatDialog = document.getElementById("chat-dialog");
  chatDialog.classList.add("io-dialog-open");
}

function closeChatDialog() {
  const chatDialog = document.getElementById("chat-dialog");
  chatDialog.classList.remove("io-dialog-open");
}

// Draggable functionality for chat dialog
let isDragging = false;
let currentX = 0;
let currentY = 0;
let initialX = 0;
let initialY = 0;
let xOffset = 0;
let yOffset = 0;

function initializeDragAndDrop() {
  const chatHeader = document.querySelector(".chat-header");
  const chatDialog = document.querySelector(".chat-dialog-content");

  if (!chatHeader || !chatDialog) {
    return; // Elements not ready yet
  }

  chatHeader.addEventListener("mousedown", dragStart);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", dragEnd);

  function dragStart(e) {
    // Don't drag if clicking on the close button
    if (
      e.target.classList.contains("chat-close") ||
      e.target.closest(".chat-close")
    ) {
      return;
    }

    // Prevent default to avoid text selection
    e.preventDefault();

    // Get current computed style to see actual position
    const rect = chatDialog.getBoundingClientRect();
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    // Calculate current offset from center
    currentX = rect.left + rect.width / 2 - viewportCenterX;
    currentY = rect.top + rect.height / 2 - viewportCenterY;

    // Store initial mouse position relative to current dialog position
    initialX = e.clientX - currentX;
    initialY = e.clientY - currentY;

    xOffset = currentX;
    yOffset = currentY;

    if (e.target === chatHeader || chatHeader.contains(e.target)) {
      isDragging = true;
      // Ensure dialog has the correct initial transform
      chatDialog.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      // Apply boundary constraints to keep dialog visible
      const dialogWidth = chatDialog.offsetWidth;
      const dialogHeight = chatDialog.offsetHeight;
      const minVisibleArea = 50; // pixels that must remain visible

      const maxX = window.innerWidth / 2 - minVisibleArea;
      const minX = -(window.innerWidth / 2) + minVisibleArea;
      const maxY = window.innerHeight / 2 - minVisibleArea;
      const minY = -(window.innerHeight / 2) + minVisibleArea;

      currentX = Math.max(minX, Math.min(currentX, maxX));
      currentY = Math.max(minY, Math.min(currentY, maxY));

      chatDialog.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
    }
  }

  function dragEnd(e) {
    if (isDragging) {
      isDragging = false;

      // Store the final position
      xOffset = currentX;
      yOffset = currentY;
    }
  }
}

// Reset dialog position when opened
function resetDialogPosition() {
  const chatDialog = document.querySelector(".chat-dialog-content");
  if (chatDialog) {
    currentX = 0;
    currentY = 0;
    xOffset = 0;
    yOffset = 0;
    chatDialog.style.transform = "translate(-50%, -50%)";
  }
}

function addChatMessage(content, type, timing = null) {
  const messagesContainer = document.getElementById("chat-messages");

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${type}`;

  const labelDiv = document.createElement("div");
  labelDiv.className = "chat-message-label";
  labelDiv.textContent = type === "user" ? "Prompt" : "LLM Response";

  const contentDiv = document.createElement("div");
  contentDiv.className = "chat-message-content";

  // Format markdown content as HTML instead of plain text
  contentDiv.innerHTML = formatMarkdownContent(abbreviateXMLBlocks(content));

  messageDiv.appendChild(labelDiv);
  messageDiv.appendChild(contentDiv);

  if (timing) {
    const timingDiv = document.createElement("div");
    timingDiv.className = "chat-timing";
    timingDiv.textContent = timing;
    messageDiv.appendChild(timingDiv);
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatMarkdownContent(content) {
  // Convert markdown to HTML format
  return (
    content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Handle code blocks first (triple backticks)
      .replace(/`{3}xml\n?/, "<pre><code class='language-xml'>")
      .replace(/`{3}/g, "</code></pre>")
      // Handle inline code (single backticks) - avoid matching triple backticks
      .replace(/(?<!`)`([^`\n]+)`(?!`)/g, "<code>$1</code>")
      // Handle bold text (**text**)
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      // Convert line breaks to <br> tags
      .replace(/\n/g, "<br>")
  );
}

function abbreviateXMLBlocks(content) {
  // Replace XML markdown blocks with abbreviated versions
  return content.replace(/```xml\s*([\s\S]*?)\s*```/g, (match, xmlContent) => {
    const lines = xmlContent.trim().split("\n");

    if (lines.length <= 5) {
      // If XML is short, keep it as is
      return match;
    }

    // Show first 3 lines and last line with indication of truncation
    const firstLines = lines.slice(0, 3);
    const lastLine = lines[lines.length - 1];
    const truncatedLines = lines.length - 4; // 4 = 3 first + 1 last

    const abbreviatedXml = [
      ...firstLines,
      `... [${truncatedLines} lines truncated] ...`,
      lastLine,
    ].join("\n");

    return `\`\`\`xml\n${abbreviatedXml}\n\`\`\``;
  });
}

function clearChatMessages() {
  const messagesContainer = document.getElementById("chat-messages");
  messagesContainer.innerHTML = "";
}

// Add event listeners for chat dialog when DOM is loaded
function setupChatEventListeners() {
  document
    .getElementById("chat-close-btn")
    .addEventListener("click", closeChatDialog);

  // Close dialog when clicking on background
  document
    .getElementById("chat-dialog")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        closeChatDialog();
      }
    });

  // Initialize drag and drop
  initializeDragAndDrop();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupChatEventListeners);
} else {
  setupChatEventListeners();
}

async function queryLLM(prompt) {
  const options = {
    endpoint,
    apiKey,
    deployment,
    apiVersion,
    dangerouslyAllowBrowser: true,
  };

  const client = new AzureOpenAI(options);

  // Clear previous messages and open chat dialog
  clearChatMessages();
  resetDialogPosition(); // Reset position when opening
  openChatDialog();

  // Add the prompt to chat
  addChatMessage(prompt, "user");

  const startTime = performance.now();

  try {
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

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    const timing = `Response time: ${formatResponseTime(responseTime)} | Model: ${response.model}`;

    let responseContent = response.choices[0].message.content;

    // Add the response to chat
    addChatMessage(responseContent, "assistant", timing);

    return responseContent;
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    const timing = `Error after ${formatResponseTime(responseTime)}`;

    addChatMessage(`Error: ${error.message || error}`, "assistant", timing);
    throw error;
  }
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
  console.log(
    `Querying ${modelName} to fix ${mapPropertyName(propertyResult.property)}...`,
  );
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
    `\n\nPlease provide the entire fixed BPMN model in a markdown xml codeblock as an answer and keep your changes minimal. If there are multiple ways to fix it choose one of them.\n\n` +
    `Here is the BPMN model:\n` +
    `\`\`\`xml\n` +
    analysisResults.xml +
    "\n" +
    `\`\`\``;
  let problematicElement = propertyResult.problematic_elements.find(() => true);
  switch (propertyResult.property) {
    case "Safeness":
      return `Fix my BPMN model which has an error such that it contains multiple tokens at the element with id \`${problematicElement}\`.${commonSuffix}`;
    case "ProperCompletion":
      return `Fix my BPMN model which has an error such that the end event with id \`${problematicElement}\` consumes multiple tokens. Each end event should only consume one token.\n${commonSuffix}`;
    case "OptionToComplete":
      let counterExample = propertyResult.counter_example.transitions
        .map((transition) => transition.label)
        .join(" -> ");
      return `Fix my BPMN model which has an error such that it might deadlock due to the following order of actions \`${counterExample}\`.${commonSuffix}`;
    case "NoDeadActivities":
      return `Fix my BPMN model which has a dead activity with the id \`${problematicElement}\`.${commonSuffix}`;
  }
}

function mapPropertyName(propertyName) {
  switch (propertyName) {
    case "ProperCompletion":
      return "Unique end event execution";
    case "Safeness":
      return "Synchronization";
    case "OptionToComplete":
      return "Guaranteed termination";
    case "NoDeadActivities":
      return "No dead activities";
  }
  return propertyName;
}

// Pass analysis results to the variable for LLM later.
/** @type {CheckingResponseWithXml} */
let analysisResults;

modeler.on("analysis.done", (result) => {
  analysisResults = result;
});
