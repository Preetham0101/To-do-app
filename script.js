const taskInput = document.getElementById("task-input");
const dueDateInput = document.getElementById("due-date");
const dueTimeInput = document.getElementById("due-time");
const addBtn = document.getElementById("add-btn");
const taskList = document.getElementById("task-list");
const filterButtons = document.querySelectorAll(".filter-btn");
const clearCompletedBtn = document.getElementById("clear-completed");
const themeToggleBtn = document.getElementById("theme-toggle");
const soundToggleBtn = document.getElementById("sound-toggle");
const toast = document.getElementById("toast");

const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const toggleDark = document.getElementById("toggle-dark");
const toggleSound = document.getElementById("toggle-sound");
const clearAllBtn = document.getElementById("clear-all-btn");
const exportBtn = document.getElementById("export-btn");
const themeSelect = document.getElementById("color-theme");

const addSound = document.getElementById("add-sound");
const checkSound = document.getElementById("check-sound");
const reminderSound = document.getElementById("reminder-sound");

let isSoundOn = localStorage.getItem("soundOn") !== "false";

function updateSoundUI() {
  soundToggleBtn.textContent = isSoundOn ? "🔊 Sound On" : "🔇 Sound Off";
  toggleSound.checked = isSoundOn;
  if (!isSoundOn) {
    [addSound, checkSound, reminderSound].forEach(s => {
      s.pause();
      s.currentTime = 0;
    });
  }
}

function updateEmptyMessage() {
  const empty = taskList.querySelectorAll("li").length === 0;
  document.getElementById("empty-message").style.display = empty ? "block" : "none";
}

function addTask(text, dueDate = "", dueTime = "", completed = false, notified = false) {
  const li = document.createElement("li");
  li.classList.add("task-added");
  if (completed) li.classList.add("completed");

  const span = document.createElement("span");
  span.textContent = text;

  const small = document.createElement("small");

  if (dueDate) {
    const validTime = /^\d{2}:\d{2}$/.test(dueTime) ? dueTime : "23:59";
    const dueDT = new Date(`${dueDate}T${validTime}`);
    if (!isNaN(dueDT.getTime())) {
      updateCountdown(small, dueDT);
      small.setAttribute("data-due", dueDT.toISOString());
      if (notified) {
        li.setAttribute("data-notified", "true");
        li.classList.add("task-reminder");
      }
    } else {
      small.textContent = `📅 Due: ${dueDate}${dueTime ? " " + dueTime : ""}`;
    }
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "❌";
  deleteBtn.addEventListener("click", e => {
    e.stopPropagation();
    if (li.getAttribute("data-notified") === "true") {
      reminderSound.pause();
      reminderSound.currentTime = 0;
    }
    li.classList.add("task-remove");
    setTimeout(() => {
      li.remove();
      saveTasks();
      updateEmptyMessage();
      showToast("Task deleted 🗑️");
    }, 250);
  });

  li.append(span);
  if (dueDate) li.append(small);
  li.append(deleteBtn);

  li.addEventListener("click", () => {
    li.classList.toggle("completed");
    saveTasks();
    if (isSoundOn) {
      checkSound.currentTime = 0;
      checkSound.play();
    }
  });

  taskList.append(li);
  setTimeout(() => li.classList.remove("task-added"), 300);
  saveTasks();
  updateEmptyMessage();
}

addBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (!text) return;
  addTask(text, dueDateInput.value, dueTimeInput.value);
  taskInput.value = "";
  dueDateInput.value = "";
  dueTimeInput.value = "";
  if (isSoundOn) {
    addSound.currentTime = 0;
    addSound.play();
  }
  showToast("Task added ✅");
});

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filterTasks();
  });
});

clearCompletedBtn.addEventListener("click", () => {
  document.querySelectorAll("#task-list li.completed").forEach(li => li.remove());
  saveTasks();
  updateEmptyMessage();
  showToast("Completed cleared 🧹");
});

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function saveTasks() {
  const tasks = [];
  taskList.querySelectorAll("li").forEach(li => {
    tasks.push({
      text: li.querySelector("span").textContent,
      dueDate: li.querySelector("small")?.getAttribute("data-due")?.slice(0, 10) || "",
      dueTime: li.querySelector("small")?.getAttribute("data-due")?.slice(11, 16) || "",
      completed: li.classList.contains("completed"),
      notified: li.getAttribute("data-notified") === "true"
    });
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
  updateEmptyMessage();
}

function loadTasks() {
  const stored = JSON.parse(localStorage.getItem("tasks") || "[]");
  stored.forEach(t => addTask(t.text, t.dueDate, t.dueTime, t.completed, t.notified));
  updateEmptyMessage();
}
loadTasks();

function filterTasks() {
  const type = document.querySelector(".filter-btn.active").dataset.filter;
  taskList.querySelectorAll("li").forEach(li => {
    const done = li.classList.contains("completed");
    li.style.display = type === "all" || (type === "active" && !done) || (type === "completed" && done)
      ? "flex" : "none";
  });
}

function updateCountdown(el, dueDate) {
  const now = new Date();
  const msDiff = dueDate - now;
  const isPast = msDiff < 0;
  const absDiff = Math.abs(msDiff);

  const minutes = Math.floor(absDiff / (1000 * 60)) % 60;
  const hours = Math.floor(absDiff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const timeStr = `${days}d ${hours}h ${minutes}m`;

  const readableDate = dueDate.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short'
  });

  if (isPast) {
    el.textContent = `📅 Due: ${readableDate} | ❗ Overdue by: ${timeStr}`;
    el.style.color = "#dc3545";
  } else {
    el.textContent = `📅 Due: ${readableDate} | ⏰ Due in: ${timeStr}`;
    el.style.color = days < 1 ? "#ffc107" : "";
  }
}

setInterval(() => {
  document.querySelectorAll("li small[data-due]").forEach(el => {
    const due = new Date(el.getAttribute("data-due"));
    const now = new Date();
    const li = el.closest("li");

    if (!li.getAttribute("data-notified") && due <= now) {
      if (isSoundOn) {
        reminderSound.currentTime = 0;
        reminderSound.play();
      }
      li.setAttribute("data-notified", "true");
      li.classList.add("task-reminder");
      saveTasks();
    }

    updateCountdown(el, due);
  });
}, 60000);

// Theme & Sound UI

themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  themeToggleBtn.textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";
  toggleDark.checked = dark;
  localStorage.setItem("theme", dark ? "dark" : "light");
});

toggleDark.addEventListener("change", () => {
  const enabled = toggleDark.checked;
  document.body.classList.toggle("dark", enabled);
  themeToggleBtn.textContent = enabled ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("theme", enabled ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark" || window.matchMedia("(prefers-color-scheme:dark)").matches) {
  document.body.classList.add("dark");
  themeToggleBtn.textContent = "☀️ Light Mode";
}
toggleDark.checked = document.body.classList.contains("dark");

soundToggleBtn.addEventListener("click", () => {
  isSoundOn = !isSoundOn;
  localStorage.setItem("soundOn", isSoundOn);
  updateSoundUI();
});
toggleSound.addEventListener("change", () => {
  isSoundOn = toggleSound.checked;
  localStorage.setItem("soundOn", isSoundOn);
  updateSoundUI();
});
updateSoundUI();

// PDF Export
exportBtn.addEventListener("click", () => {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  if (tasks.length === 0) return showToast("No tasks to export");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("To-Do List Export", 20, 20);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);

  let y = 35;
  tasks.forEach((task, index) => {
    const status = task.completed ? "Status: Completed" : "Status: Pending";
    const due = task.dueDate ? `Due: ${task.dueDate} ${task.dueTime || ""}` : "No Due Date";
    const lines = [
      `${index + 1}. ${task.text}`,
      `   ${due}`,
      `   ${status}`
    ];

    lines.forEach(line => {
      doc.text(line, 20, y);
      y += 7;
    });

    y += 4;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("todo-tasks.pdf");
  showToast("Exported to PDF 📄");
});

// Settings
settingsBtn.addEventListener("click", () => {
  settingsPanel.style.display = settingsPanel.style.display === "flex" ? "none" : "flex";
});

clearAllBtn.addEventListener("click", () => {
  taskList.innerHTML = "";
  saveTasks();
  updateEmptyMessage();
  showToast("All tasks cleared 🧹");
});

themeSelect.addEventListener("change", () => {
  const theme = themeSelect.value;
  document.body.classList.remove("theme-ocean", "theme-sunset", "theme-forest", "theme-midnight");
  if (theme !== "default") document.body.classList.add(`theme-${theme}`);
  localStorage.setItem("colorTheme", theme);
});
const savedTheme = localStorage.getItem("colorTheme");
if (savedTheme) {
  themeSelect.value = savedTheme;
  if (savedTheme !== "default") document.body.classList.add(`theme-${savedTheme}`);
}
