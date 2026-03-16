const vscode = acquireVsCodeApi();

const form = document.getElementById("solver-form");
const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const spinnerEl = document.getElementById("spinner");
const errorEl = document.getElementById("error");
const modelSelect = document.getElementById("model");

const plannerOutput = document.getElementById("plannerOutput");
const frontendOutput = document.getElementById("frontendOutput");
const backendOutput = document.getElementById("backendOutput");
const reviewerOutput = document.getElementById("reviewerOutput");
const readmeOutput = document.getElementById("readmeOutput");

// Request available models on load
window.addEventListener("load", () => {
  vscode.postMessage({ type: "request-models" });
});

function setRunningState(running) {
  generateBtn.disabled = running;
  modelSelect.disabled = running;
  spinnerEl.classList.toggle("hidden", !running);
  spinnerEl.classList.toggle("flex", running);
}

function clearOutputs() {
  plannerOutput.textContent = "";
  frontendOutput.textContent = "";
  backendOutput.textContent = "";
  reviewerOutput.textContent = "";
  readmeOutput.textContent = "";
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function appendChunk(agent, chunk) {
  if (!chunk) {
    return;
  }

  switch (agent) {
    case "planner":
      plannerOutput.textContent += chunk;
      break;
    case "frontend":
      frontendOutput.textContent += chunk;
      break;
    case "backend":
      backendOutput.textContent += chunk;
      break;
    case "reviewer":
      reviewerOutput.textContent += chunk;
      break;
    default:
      break;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorEl.classList.add("hidden");

  // Validate problem statement
  const problemStatement = document.getElementById("problemStatement").value.trim();
  if (!problemStatement) {
    errorEl.textContent = "Please enter a hackathon problem statement.";
    errorEl.classList.remove("hidden");
    return;
  }

  // Validate model selection
  const selectedModel = modelSelect.value;
  if (!selectedModel) {
    errorEl.textContent = "Please select an AI model from the dropdown.";
    errorEl.classList.remove("hidden");
    return;
  }

  // Validate tech stack
  const techStack = document.getElementById("techStack").value;
  if (!techStack) {
    errorEl.textContent = "Please select a tech stack.";
    errorEl.classList.remove("hidden");
    return;
  }

  // Validate theme
  const theme = document.getElementById("theme").value;
  if (!theme) {
    errorEl.textContent = "Please select a theme.";
    errorEl.classList.remove("hidden");
    return;
  }

  // Validate time mode
  const timeMode = document.getElementById("timeMode").value;
  if (!timeMode) {
    errorEl.textContent = "Please select a time mode.";
    errorEl.classList.remove("hidden");
    return;
  }

  const payload = {
    problemStatement: problemStatement,
    techStack: techStack,
    theme: theme,
    timeMode: timeMode,
    model: selectedModel
  };

  vscode.postMessage({ type: "generate", payload });
});

window.addEventListener("message", (event) => {
  const message = event.data;

  switch (message.type) {
    case "available-models":
      modelSelect.innerHTML = "";
      if (message.models && message.models.length > 0) {
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Select a model --";
        defaultOption.disabled = true;
        modelSelect.appendChild(defaultOption);

        message.models.forEach((model) => {
          const option = document.createElement("option");
          option.value = model.id;
          option.textContent = model.label;
          modelSelect.appendChild(option);
        });

        // Auto-select first model if available
        if (modelSelect.options.length > 1) {
          modelSelect.selectedIndex = 1;
        }
      } else {
        const errorOption = document.createElement("option");
        errorOption.textContent = "No models available - Install GitHub Copilot Chat";
        errorOption.disabled = true;
        modelSelect.appendChild(errorOption);
        
        errorEl.textContent = "No AI models available. Please install GitHub Copilot Chat extension.";
        errorEl.classList.remove("hidden");
      }
      break;
    case "reset-output":
      clearOutputs();
      statusEl.textContent = "Generating solution...";
      break;
    case "generation-started":
      setRunningState(true);
      break;
    case "generation-finished":
      setRunningState(false);
      break;
    case "status":
      statusEl.textContent = message.text || "Processing...";
      break;
    case "agent-chunk":
      appendChunk(message.agent, message.chunk);
      break;
    case "readme":
      readmeOutput.textContent = message.text || "";
      break;
    case "error":
      errorEl.textContent = message.text || "An unexpected error occurred.";
      errorEl.classList.remove("hidden");
      statusEl.textContent = "Error occurred - see details below";
      break;
    default:
      break;
  }
});

document.querySelectorAll(".copy-btn").forEach((button) => {
  button.addEventListener("click", async () => {
    const targetId = button.getAttribute("data-copy-target");
    const target = targetId ? document.getElementById(targetId) : null;

    if (!target) {
      return;
    }

    const content = target.textContent || "";
    if (!content.trim()) {
      button.textContent = "Nothing to copy";
      setTimeout(() => {
        button.textContent = "Copy";
      }, 1200);
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      const previousText = button.textContent;
      button.textContent = "✓ Copied!";
      setTimeout(() => {
        button.textContent = previousText;
      }, 1500);
    } catch (err) {
      const previousText = button.textContent;
      button.textContent = "✗ Copy failed";
      setTimeout(() => {
        button.textContent = previousText;
      }, 1500);
    }
  });
});
