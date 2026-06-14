const STORAGE_KEY = "dailyStickyBoard.v1";
const CHANNEL_NAME = "daily-sticky-board-sync";

const board = document.getElementById("board");
const dayViewBtn = document.getElementById("dayViewBtn");
const weekViewBtn = document.getElementById("weekViewBtn");
const monthViewBtn = document.getElementById("monthViewBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const datePicker = document.getElementById("datePicker");
const todayLabel = document.getElementById("todayLabel");
const periodLabel = document.getElementById("periodLabel");
const todayOpenHeading = document.getElementById("todayOpenHeading");
const tomorrowOpenHeading = document.getElementById("tomorrowOpenHeading");
const todayOpenList = document.getElementById("todayOpenList");
const tomorrowOpenList = document.getElementById("tomorrowOpenList");
const dayCardTemplate = document.getElementById("dayCardTemplate");
const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition || null;

function getDefaultDate() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // If Saturday (6) or Sunday (0), get next Monday
  if (dayOfWeek === 0) {
    today.setDate(today.getDate() + 1);
  } else if (dayOfWeek === 6) {
    today.setDate(today.getDate() + 2);
  }
  
  return getDateKey(today);
}

const initialState = {
  view: "week",
  selectedDate: null, // Will be set in loadState()
  notesByDate: {}
};

let state = loadState();
let syncChannel = null;
let githubReady = false;
let dragContext = null;

async function init() {
  todayLabel.textContent = `Today: ${formatLongDate(new Date())}`;
  
  // Initialize GitHub if available
  if (typeof initializeGitHub !== 'undefined') {
    githubReady = await initializeGitHub();
  }
  
  bindUi();
  initRealtimeSync();
  render();
}

function bindUi() {
  dayViewBtn.addEventListener("click", () => {
    state.view = "day";
    persistAndRender();
  });

  weekViewBtn.addEventListener("click", () => {
    state.view = "week";
    persistAndRender();
  });

  monthViewBtn.addEventListener("click", () => {
    state.view = "month";
    persistAndRender();
  });

  prevBtn.addEventListener("click", () => {
    const current = fromDateKey(state.selectedDate);
    if (state.view === "month") {
      current.setMonth(current.getMonth() - 1, 1);
    } else {
      const delta = state.view === "day" ? -1 : -7;
      current.setDate(current.getDate() + delta);
    }
    state.selectedDate = getDateKey(current);
    persistAndRender();
  });

  nextBtn.addEventListener("click", () => {
    const current = fromDateKey(state.selectedDate);
    if (state.view === "month") {
      current.setMonth(current.getMonth() + 1, 1);
    } else {
      const delta = state.view === "day" ? 1 : 7;
      current.setDate(current.getDate() + delta);
    }
    state.selectedDate = getDateKey(current);
    persistAndRender();
  });

  datePicker.addEventListener("change", (event) => {
    const value = event.target.value;
    if (!value) return;
    state.selectedDate = value;
    persistAndRender();
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      state = sanitizeState(JSON.parse(event.newValue));
      render();
    } catch {
      // Ignore malformed state from other tabs.
    }
  });
}

function initRealtimeSync() {
  if (!window.BroadcastChannel) return;
  syncChannel = new BroadcastChannel(CHANNEL_NAME);
  syncChannel.addEventListener("message", (event) => {
    if (event.data?.type !== "state-update") return;
    state = sanitizeState(event.data.payload);
    render();
  });
}

async function persistAndRender() {
  saveState();
  
  // Save preferences to GitHub if ready
  if (githubReady && typeof saveUserPreferencesToGitHub !== 'undefined') {
    await saveUserPreferencesToGitHub(state.view, state.selectedDate);
  }
  
  if (syncChannel) {
    syncChannel.postMessage({
      type: "state-update",
      payload: state
    });
  }
  render();
}

function render() {
  board.innerHTML = "";
  datePicker.value = state.selectedDate;

  dayViewBtn.classList.toggle("active", state.view === "day");
  weekViewBtn.classList.toggle("active", state.view === "week");
  monthViewBtn.classList.toggle("active", state.view === "month");
  board.classList.remove("week", "month");

  if (state.view === "day") {
    periodLabel.textContent = "Focused single-day sticky board";
    renderDayCard(state.selectedDate);
  } else if (state.view === "week") {
    periodLabel.textContent = "Work week board: Monday to Friday";
    board.classList.add("week");
    renderWeekCards(state.selectedDate);
  } else {
    periodLabel.textContent = formatMonthHeading(fromDateKey(state.selectedDate));
    board.classList.add("month");
    renderMonthGrid(state.selectedDate);
  }

  renderOpenTaskSummary();
}

function renderOpenTaskSummary() {
  const workingDay = getWorkingDate(new Date());
  const nextWorkingDay = getNextWorkingDate(workingDay);

  renderSummaryList(todayOpenHeading, todayOpenList, workingDay, getOpenTasksForDate(workingDay));
  renderSummaryList(tomorrowOpenHeading, tomorrowOpenList, nextWorkingDay, getOpenTasksForDate(nextWorkingDay));

  const workingKicker = todayOpenHeading.closest(".summary-card")?.querySelector(".summary-kicker");
  const nextWorkingKicker = tomorrowOpenHeading.closest(".summary-card")?.querySelector(".summary-kicker");
  if (workingKicker) workingKicker.textContent = "Working Day";
  if (nextWorkingKicker) nextWorkingKicker.textContent = "Next Working Day";

  applySummaryCardTone(todayOpenHeading, workingDay);
  applySummaryCardTone(tomorrowOpenHeading, nextWorkingDay);
}

function getWorkingDate(date) {
  const d = new Date(date);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function getNextWorkingDate(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return getWorkingDate(d);
}

function applySummaryCardTone(headingElement, dateObj) {
  const card = headingElement.closest(".summary-card");
  if (!card) return;

  for (let i = 1; i <= 5; i += 1) {
    card.classList.remove(`summary-tone-${i}`);
  }
  card.classList.add(`summary-tone-${getNoteToneIndex(dateObj)}`);
}

function renderSummaryList(headingEl, listEl, date, tasks) {
  headingEl.textContent = formatLongDate(date);
  listEl.innerHTML = "";
  listEl.classList.toggle("empty", tasks.length === 0);

  if (tasks.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No open tasks.";
    listEl.appendChild(item);
    return;
  }

  tasks.slice(0, 5).forEach((task) => {
    const item = document.createElement("li");
    item.textContent = task.text;
    listEl.appendChild(item);
  });

  if (tasks.length > 5) {
    const more = document.createElement("li");
    more.textContent = `+${tasks.length - 5} more open task${tasks.length - 5 === 1 ? "" : "s"}`;
    listEl.appendChild(more);
  }
}

function getOpenTasksForDate(date) {
  return getTasks(getDateKey(date)).filter((task) => !task.done);
}

function renderWeekCards(selectedDateKey) {
  const selectedDate = fromDateKey(selectedDateKey);
  const monday = getMonday(selectedDate);

  for (let i = 0; i < 5; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    renderDayCard(getDateKey(d));
  }
}

function renderDayCard(dateKey) {
  const card = dayCardTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.date = dateKey;
  const dateObj = fromDateKey(dateKey);
  card.classList.add(`note-tone-${getNoteToneIndex(dateObj)}`);

  const h2 = card.querySelector("h2");
  const taskCount = card.querySelector(".task-count");
  const input = card.querySelector(".task-input");
  const addBtn = card.querySelector(".add-task-btn");
  const voiceBtn = card.querySelector(".voice-btn");
  const voiceStatus = card.querySelector(".voice-status");
  const taskList = card.querySelector(".task-list");

  const tasks = getTasks(dateKey);
  h2.textContent = formatCardDate(dateObj);
  const openCount = tasks.filter((task) => !task.done).length;
  const doneCount = tasks.length - openCount;
  taskCount.textContent = `${openCount} open / ${doneCount} done`;

  const addTask = (text) => {
    const value = text.trim();
    if (!value) return;
    tasks.push({ id: createTaskId(), text: value, done: false });
    setTasks(dateKey, tasks);
    persistAndRender();
  };

  addBtn.addEventListener("click", () => {
    addTask(input.value);
    input.value = "";
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addBtn.click();
    }
  });

  if (!SpeechRecognitionApi) {
    voiceBtn.disabled = true;
    voiceStatus.textContent = "Voice input unavailable in this browser.";
  } else {
    bindVoiceInput({ input, voiceBtn, voiceStatus, addTask });
  }

  const getDragAfterElement = (container, y) => {
    const draggableElements = [
      ...container.querySelectorAll(".task-item[data-task-id]:not(.dragging)")
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
  };

  taskList.addEventListener("dragover", (event) => {
    event.preventDefault();
    const dragging = board.querySelector(".task-item.dragging");
    if (!dragging) return;

    const afterElement = getDragAfterElement(taskList, event.clientY);
    if (afterElement == null) {
      taskList.appendChild(dragging);
    } else {
      taskList.insertBefore(dragging, afterElement);
    }
    if (dragContext) dragContext.moved = true;
  });

  taskList.addEventListener("drop", (event) => {
    event.preventDefault();
  });

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.draggable = true;
    li.dataset.taskId = task.id;
    if (isLongTaskText(task.text)) li.classList.add("is-long");
    if (task.done) li.classList.add("done");

    li.addEventListener("dragstart", (event) => {
      li.classList.add("dragging");
      dragContext = {
        taskId: task.id,
        sourceDateKey: dateKey,
        moved: false
      };
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", task.id);
      }
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      const moved = dragContext?.moved;
      dragContext = null;
      if (!moved) return;
      syncVisibleCardTaskOrderAndPersist();
    });

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text;

    const completeBtn = document.createElement("button");
    completeBtn.type = "button";
    completeBtn.className = "complete-btn";
    completeBtn.textContent = task.done ? "☑" : "☐";
    completeBtn.title = task.done ? "Mark as not complete" : "Mark as complete";
    completeBtn.setAttribute("aria-label", task.done ? "Mark as not complete" : "Mark as complete");
    completeBtn.addEventListener("click", () => {
      task.done = !task.done;
      setTasks(dateKey, tasks);
      persistAndRender();
    });

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.textContent = "🗑";
    del.title = "Delete task";
    del.setAttribute("aria-label", "Delete task");
    del.addEventListener("click", () => {
      const updated = tasks.filter((item) => item.id !== task.id);
      setTasks(dateKey, updated);
      persistAndRender();
    });

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(completeBtn, del);

    li.append(span, actions);
    taskList.appendChild(li);
  });

  board.appendChild(card);
}

function syncVisibleCardTaskOrderAndPersist() {
  const cards = Array.from(board.querySelectorAll(".sticky-card[data-date]"));
  if (cards.length === 0) return;

  const visibleDateKeys = cards.map((card) => card.dataset.date).filter(Boolean);
  const taskPool = new Map();

  visibleDateKeys.forEach((dateKey) => {
    getTasks(dateKey).forEach((task) => {
      taskPool.set(task.id, task);
    });
  });

  let changed = false;

  cards.forEach((card) => {
    const dateKey = card.dataset.date;
    const orderedIds = Array.from(card.querySelectorAll(".task-item[data-task-id]"))
      .map((item) => item.dataset.taskId)
      .filter(Boolean);

    const oldTasks = getTasks(dateKey);
    const oldIds = oldTasks.map((task) => task.id);
    const newTasks = orderedIds.map((id) => taskPool.get(id)).filter(Boolean);

    if (newTasks.length !== oldTasks.length) {
      changed = true;
      setTasks(dateKey, newTasks);
      return;
    }

    const sameOrder = oldIds.every((id, index) => id === orderedIds[index]);
    if (!sameOrder) {
      changed = true;
      setTasks(dateKey, newTasks);
    }
  });

  if (changed) {
    persistAndRender();
  }
}

function isLongTaskText(text) {
  return text.length > 48 || text.includes("\n");
}

function getNoteToneIndex(dateObj) {
  // Color depends on absolute calendar day, not card position.
  const dayNumber = Math.floor(
    Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) / 86400000
  );
  return ((dayNumber % 5) + 5) % 5 + 1;
}

function renderMonthGrid(selectedDateKey) {
  const selected = fromDateKey(selectedDateKey);
  const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const gridStart = getMonday(monthStart);
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  weekdays.forEach((name) => {
    const label = document.createElement("div");
    label.className = "month-weekday";
    label.textContent = name;
    board.appendChild(label);
  });

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const dateKey = getDateKey(date);
    const tasks = getTasks(dateKey);
    const openCount = tasks.filter((task) => !task.done).length;

    const cell = document.createElement("article");
    cell.className = "month-cell";
    if (date.getMonth() !== selected.getMonth()) cell.classList.add("outside");
    if (dateKey === selectedDateKey) cell.classList.add("selected");

    const head = document.createElement("header");
    head.className = "month-head";

    const dayNumber = document.createElement("span");
    dayNumber.className = "month-day-number";
    dayNumber.textContent = String(date.getDate());

    const meta = document.createElement("span");
    meta.className = "month-meta";
    meta.textContent = `${openCount} open`;

    head.append(dayNumber, meta);

    const list = document.createElement("ul");
    list.className = "month-mini-list";
    tasks.slice(0, 2).forEach((task) => {
      const li = document.createElement("li");
      li.textContent = task.done ? `Done: ${task.text}` : task.text;
      list.appendChild(li);
    });

    if (tasks.length > 2) {
      const more = document.createElement("li");
      more.textContent = `+${tasks.length - 2} more`;
      list.appendChild(more);
    }

    cell.addEventListener("click", () => {
      state.selectedDate = dateKey;
      state.view = "day";
      persistAndRender();
    });

    cell.append(head, list);
    board.appendChild(cell);
  }
}

function bindVoiceInput({ input, voiceBtn, voiceStatus, addTask }) {
  let recognition = null;
  let listening = false;

  const stopListeningUi = (message) => {
    listening = false;
    voiceBtn.classList.remove("listening");
    voiceBtn.textContent = "🎤";
    if (message) voiceStatus.textContent = message;
  };

  voiceBtn.addEventListener("click", () => {
    if (listening && recognition) {
      recognition.stop();
      stopListeningUi("Voice stopped.");
      return;
    }

    recognition = new SpeechRecognitionApi();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      listening = true;
      voiceBtn.classList.add("listening");
      voiceBtn.textContent = "◼";
      voiceStatus.textContent = "Listening. Speak your task now.";
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? "";
      if (!transcript) {
        voiceStatus.textContent = "No voice input captured. Try again.";
        return;
      }
      input.value = transcript;
      addTask(transcript);
      input.value = "";
      voiceStatus.textContent = `Added: ${transcript}`;
    };

    recognition.onerror = () => {
      stopListeningUi("Voice recognition failed. Please try again.");
    };

    recognition.onend = () => {
      stopListeningUi();
    };

    recognition.start();
  });
}

function getTasks(dateKey) {
  return state.notesByDate[dateKey] ?? [];
}

function setTasks(dateKey, tasks) {
  state.notesByDate[dateKey] = tasks;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        view: "week",
        selectedDate: getDefaultDate(),
        notesByDate: {}
      };
    }
    const parsed = JSON.parse(raw);
    const state = sanitizeState(parsed);
    // Always check if today is a weekend and adjust selected date
    state.selectedDate = getDefaultDate();
    return state;
  } catch {
    return {
      view: "week",
      selectedDate: getDefaultDate(),
      notesByDate: {}
    };
  }
}

function sanitizeState(raw) {
  const selectedDate =
    typeof raw?.selectedDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.selectedDate)
      ? raw.selectedDate
      : getDateKey(new Date());

  const view = ["day", "week", "month"].includes(raw?.view) ? raw.view : "day";
  const notesByDate = {};

  if (raw?.notesByDate && typeof raw.notesByDate === "object") {
    for (const [dateKey, tasks] of Object.entries(raw.notesByDate)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Array.isArray(tasks)) continue;
      notesByDate[dateKey] = tasks
        .filter(
          (task) =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.done === "boolean"
        )
        .map((task) => ({ ...task, text: task.text.slice(0, 120) }));
    }
  }

  return {
    selectedDate,
    view,
    notesByDate
  };
}

async function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  
  // Also save all tasks to GitHub if ready
  if (githubReady && typeof saveTasksToGitHub !== 'undefined') {
    for (const [dateKey, tasks] of Object.entries(state.notesByDate)) {
      await saveTasksToGitHub(dateKey, tasks);
    }
  }
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function getMonday(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + delta);
  return copy;
}

function createTaskId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `task-${Date.now()}-${Math.random()}`;
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function formatCardDate(date) {
  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: "long"
  }).format(date);
  const monthDay = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(date);
  return `${weekday}\n${monthDay}`;
}

function formatMonthHeading(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric"
  }).format(date);
}

init();
