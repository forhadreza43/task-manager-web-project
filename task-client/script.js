const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const desc = document.getElementById("task-desc");
const date = document.getElementById("task-date");
const list = document.getElementById("task-list");
const completedList = document.getElementById("completed-tasks");
const sortBtn = document.getElementById("sort-btn");

const pendingCountEl = document.getElementById("pending-count");
const completedCountEl = document.getElementById("completed-count");

let tasksCache = []; // Store fetched tasks

async function loadTasks(filter = "all") {
  const res = await fetch("http://localhost:3000/api/tasks");
  const tasks = await res.json();
  tasksCache = tasks;

  let filtered = tasks;
  if (filter === "completed") {
    filtered = tasks.filter((task) => task.completed);
  } else if (filter === "pending") {
    filtered = tasks.filter((task) => !task.completed);
  }

  renderTasks(filtered, filter);
}

function renderTasks(tasks, filter = "all") {
  list.innerHTML = "";
  completedList.innerHTML = "";

  let pendingCount = 0;
  let completedCount = 0;

  tasks.forEach((task) => {
    if (task.completed) {
      completedCount++;
      if (filter !== "pending") addTaskToDOM(task, completedList);
    } else {
      pendingCount++;
      if (filter !== "completed") addTaskToDOM(task, list);
    }
  });

  pendingCountEl.textContent = `Pending: ${pendingCount}`;
  completedCountEl.textContent = `Completed: ${completedCount}`;
  enableDragAndDrop();
}

function addTaskToDOM(task, parentList) {
  const li = document.createElement("li");
  li.setAttribute("draggable", !task.completed); // Only allow dragging if not completed
  li.dataset.id = task._id;
  li.className = task.completed ? "completed" : "";

  const dueDate = task.dueDate
    ? ` <small>Due: ${new Date(
        task.dueDate
      ).toLocaleDateString()}</small>`
    : "";
  const description = task.description
    ? `<br><small>${task.description}</small>`
    : "";

  li.innerHTML = `
  <div class="task"> 
  <div class="task-details">
  <div class="task-head">
  <span class="task-title">${task.title}</span>
  <span>${dueDate}</span>
  </div>
<span class="task-description"> ${description}</span>
  </div>

    <div class="btns">
      <button class="action-btn" onclick="toggleTask('${task._id}')">✔️</button>
      <button class="action-btn" onclick="editTask('${task._id}', \`${
    task.title
  }\`, \`${task.description || ""}\`, \`${task.dueDate || ""}\`)">✏️</button>
      <button class="action-btn" onclick="deleteTask('${task._id}')">❌</button>
    </div>
  </div>
  
  `;

  parentList.appendChild(li);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = input.value.trim();
  const description = desc.value.trim();
  const dueDate = date.value;

  if (!title) return;

  await fetch("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, dueDate }),
  });

  input.value = "";
  desc.value = "";
  date.value = "";

  loadTasks();
});

async function deleteTask(id) {
  await fetch(`http://localhost:3000/api/tasks/${id}`, { method: "DELETE" });
  loadTasks();
}

async function toggleTask(id) {
  await fetch(`http://localhost:3000/api/tasks/${id}`, { method: "PATCH" });
  loadTasks();
}

function editTask(id, currentTitle, currentDesc, currentDate) {
  const newTitle = prompt("Edit title:", currentTitle);
  const newDesc = prompt("Edit description:", currentDesc);
  const newDate = prompt(
    "Edit due date (YYYY-MM-DD):",
    currentDate.slice(0, 10)
  );

  if (newTitle !== null) {
    fetch(`http://localhost:3000/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        description: newDesc,
        dueDate: newDate,
      }),
    }).then(loadTasks);
  }
}

// Sort button handler
sortBtn.addEventListener("click", () => {
  const sorted = tasksCache
    .filter((task) => !task.completed)
    .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
  const completed = tasksCache.filter((t) => t.completed);
  renderTasks([...sorted, ...completed]);
});

// Drag and Drop Logic
function enableDragAndDrop() {
  let dragged;

  list.querySelectorAll("li").forEach((li) => {
    li.addEventListener("dragstart", (e) => {
      dragged = li;
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      dragged.classList.remove("dragging");
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        list.appendChild(dragged);
      } else {
        list.insertBefore(dragged, afterElement);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll("li:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

function setActiveNav(id) {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

document.getElementById("nav-home").addEventListener("click", (e) => {
  e.preventDefault();
  loadTasks("all");
  setActiveNav("nav-home");
});

document.getElementById("nav-all").addEventListener("click", (e) => {
  e.preventDefault();
  loadTasks("all");
  setActiveNav("nav-all");
});

document.getElementById("nav-completed").addEventListener("click", (e) => {
  e.preventDefault();
  loadTasks("completed");
  setActiveNav("nav-completed");
});

loadTasks();
