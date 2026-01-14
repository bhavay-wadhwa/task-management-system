// Check authentication on page load
if (!checkAuth()) {
  // Redirect handled by checkAuth
}

// Get user info
let token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");
if (user.name) {
  document.getElementById("userName").innerHTML = `<i class="bi bi-person-circle me-1"></i>${user.name}`;
}

// API configuration
// Use a unique constant name to avoid clashes with any other scripts.
// All task API calls should use TASKS_API_BASE instead of API_BASE.
const TASKS_API_BASE = "/api/tasks";

// Helper functions
function getAuthHeaders(includeContentType = false) {
  // Always get the latest token
  token = localStorage.getItem("token");
  const headers = {
    "Authorization": `Bearer ${token}`
  };
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = "block";
    setTimeout(() => {
      el.style.display = "none";
    }, 5000);
  }
}

function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = "block";
    setTimeout(() => {
      el.style.display = "none";
    }, 3000);
  }
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const date = new Date(dateString);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getPriorityBadgeClass(priority) {
  switch(priority) {
    case "High": return "bg-danger";
    case "Medium": return "bg-warning";
    case "Low": return "bg-info";
    default: return "bg-secondary";
  }
}

function getStatusBadgeClass(status) {
  switch(status) {
    case "Completed": return "bg-success";
    case "In Progress": return "bg-primary";
    case "Pending": return "bg-warning";
    default: return "bg-secondary";
  }
}

// Load statistics
async function loadStats() {
  try {
    const res = await fetch(`${TASKS_API_BASE}/stats`, {
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    if (!res.ok) {
      console.error("Failed to load stats");
      return;
    }

    const data = await res.json();
    document.getElementById("statTotal").textContent = data.total || 0;
    document.getElementById("statPending").textContent = data.pending || 0;
    document.getElementById("statProgress").textContent = data.progress || 0;
    document.getElementById("statCompleted").textContent = data.completed || 0;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Load tasks with filters
async function loadTasks() {
  const loadingEl = document.getElementById("loadingTasks");
  const containerEl = document.getElementById("tasksContainer");
  const noTasksEl = document.getElementById("noTasks");

  loadingEl.style.display = "block";
  containerEl.innerHTML = "";
  noTasksEl.style.display = "none";

  try {
    const search = document.getElementById("searchInput").value.trim();
    const status = document.getElementById("statusFilter").value;
    const priority = document.getElementById("priorityFilter").value;
    const category = document.getElementById("categoryFilter").value.trim();

    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    if (priority) params.push(`priority=${encodeURIComponent(priority)}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    
    const url = params.length > 0 ? `${TASKS_API_BASE}?${params.join("&")}` : TASKS_API_BASE;

    const res = await fetch(url, {
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    if (!res.ok) {
      throw new Error("Failed to load tasks");
    }

    const tasks = await res.json();
    loadingEl.style.display = "none";

    if (tasks.length === 0) {
      noTasksEl.style.display = "block";
      return;
    }

    tasks.forEach(task => {
      const taskCard = createTaskCard(task);
      containerEl.innerHTML += taskCard;
    });
  } catch (error) {
    console.error("Error loading tasks:", error);
    loadingEl.style.display = "none";
    containerEl.innerHTML = '<div class="alert alert-danger">Failed to load tasks. Please try again.</div>';
  }
}

// Create task card HTML
function createTaskCard(task) {
  const priorityClass = getPriorityBadgeClass(task.priority);
  const statusBadgeClass = getStatusBadgeClass(task.status);
  const dueDate = task.dueDate ? formatDate(task.dueDate) : "No due date";
  const description = task.description || "No description";
  const category = task.category || "Uncategorized";

  // Determine task card status class for border color
  let taskStatusClass = '';
  if (task.status === 'Completed') {
    taskStatusClass = 'task-completed';
  } else if (task.status === 'Pending') {
    taskStatusClass = 'task-pending';
  } else if (task.status === 'In Progress') {
    taskStatusClass = 'task-in-progress';
  }

  return `
    <div class="card task-card mb-3 ${taskStatusClass}" data-task-id="${task._id}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="flex-grow-1">
            <h5 class="card-title mb-1">${escapeHtml(task.title)}</h5>
            <p class="text-muted small mb-2">
              <i class="bi bi-tag me-1"></i>${escapeHtml(category)}
              <span class="ms-3"><i class="bi bi-calendar-event me-1"></i>${dueDate}</span>
            </p>
            <p class="card-text text-muted">${escapeHtml(description)}</p>
          </div>
          <div class="ms-3">
            <span class="badge ${priorityClass} me-1">${task.priority}</span>
            <span class="badge ${statusBadgeClass}">${task.status}</span>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">
            Created: ${formatDate(task.createdAt)}
          </small>
          <div class="d-flex gap-2">
            ${task.status === 'Pending' ? `
              <button class="btn btn-sm btn-success" onclick="startTask('${task._id}')" title="Start Task">
                <i class="bi bi-play-circle"></i> Start Task
              </button>
            ` : ''}
            ${task.status !== 'Completed' ? `
              <button class="btn btn-sm btn-success" onclick="markAsCompleted('${task._id}')" title="Mark as Completed">
                <i class="bi bi-check-circle"></i> Mark as Completed
              </button>
            ` : ''}
            <button class="btn btn-sm btn-outline-primary" onclick="editTask('${task._id}')" title="Edit Task">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task._id}')" title="Delete Task">
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Add task
async function addTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const category = document.getElementById("taskCategory").value.trim();
  const priority = document.getElementById("taskPriority").value;
  const status = document.getElementById("taskStatus").value;
  const dueDate = document.getElementById("taskDueDate").value;

  if (!title) {
    showError("taskError", "Task title is required");
    return;
  }

  const addBtn = document.getElementById("addTaskBtn");
  const originalBtnContent = addBtn.innerHTML;
  addBtn.disabled = true;
  addBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';

  try {
    const requestBody = {
      title,
      description,
      category,
      priority,
      status,
      dueDate: dueDate || null
    };

    console.log("Adding task:", requestBody);
    console.log("Token:", token ? "Present" : "Missing");

    const res = await fetch(TASKS_API_BASE, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(requestBody)
    });

    console.log("Response status:", res.status);

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      showError("taskError", "Invalid response from server");
      addBtn.disabled = false;
      addBtn.innerHTML = originalBtnContent;
      return;
    }

    if (!res.ok) {
      console.error("Task creation failed:", data);
      showError("taskError", data.msg || "Failed to add task");
      addBtn.disabled = false;
      addBtn.innerHTML = originalBtnContent;
      return;
    }

    console.log("Task created successfully:", data);

    // Reset form
    document.getElementById("taskForm").reset();
    showSuccess("taskSuccess", "Task added successfully!");

    // Reload tasks and stats
    await loadTasks();
    await loadStats();
  } catch (error) {
    console.error("Error adding task:", error);
    showError("taskError", `Network error: ${error.message}. Please try again.`);
  } finally {
    addBtn.disabled = false;
    addBtn.innerHTML = originalBtnContent;
  }
}

// Edit task - open modal
async function editTask(taskId) {
  try {
    const res = await fetch(`${TASKS_API_BASE}/${taskId}`, {
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    if (!res.ok) {
      alert("Failed to load task details");
      return;
    }

    const task = await res.json();

    // Populate edit form
    document.getElementById("editTaskId").value = task._id;
    document.getElementById("editTaskTitle").value = task.title;
    document.getElementById("editTaskCategory").value = task.category || "";
    document.getElementById("editTaskDescription").value = task.description || "";
    document.getElementById("editTaskPriority").value = task.priority;
    document.getElementById("editTaskStatus").value = task.status;
    
    if (task.dueDate) {
      const date = new Date(task.dueDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      document.getElementById("editTaskDueDate").value = `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
      document.getElementById("editTaskDueDate").value = "";
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("editTaskModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading task:", error);
    alert("Failed to load task details");
  }
}

// Save task edit
async function saveTaskEdit() {
  const taskId = document.getElementById("editTaskId").value;
  const title = document.getElementById("editTaskTitle").value.trim();
  const description = document.getElementById("editTaskDescription").value.trim();
  const category = document.getElementById("editTaskCategory").value.trim();
  const priority = document.getElementById("editTaskPriority").value;
  const status = document.getElementById("editTaskStatus").value;
  const dueDate = document.getElementById("editTaskDueDate").value;

  if (!title) {
    showError("editTaskError", "Task title is required");
    return;
  }

  try {
    const res = await fetch(`${TASKS_API_BASE}/${taskId}`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        title,
        description,
        category,
        priority,
        status,
        dueDate: dueDate || null
      })
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      showError("editTaskError", data.msg || "Failed to update task");
      return;
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("editTaskModal"));
    modal.hide();

    // Reload tasks and stats
    loadTasks();
    loadStats();
  } catch (error) {
    console.error("Error updating task:", error);
    showError("editTaskError", "Network error. Please try again.");
  }
}

// Start task (change status to In Progress)
async function startTask(taskId) {
  try {
    const res = await fetch(`${TASKS_API_BASE}/${taskId}`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ status: "In Progress" })
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      alert(data.msg || "Failed to start task");
      return;
    }

    // Reload tasks and stats
    await loadTasks();
    await loadStats();
  } catch (error) {
    console.error("Error starting task:", error);
    alert("Network error. Please try again.");
  }
}

// Mark task as completed
async function markAsCompleted(taskId) {
  try {
    const res = await fetch(`${TASKS_API_BASE}/${taskId}`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ status: "Completed" })
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      alert(data.msg || "Failed to mark task as completed");
      return;
    }

    // Reload tasks and stats
    await loadTasks();
    await loadStats();
  } catch (error) {
    console.error("Error marking task as completed:", error);
    alert("Network error. Please try again.");
  }
}

// Delete task
async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  try {
    const res = await fetch(`${TASKS_API_BASE}/${taskId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    if (!res.ok) {
      alert("Failed to delete task");
      return;
    }

    // Reload tasks and stats
    loadTasks();
    loadStats();
  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Network error. Please try again.");
  }
}

// Filter by status when stat card is clicked
function filterByStatus(status) {
  // Clear other filters
  document.getElementById("searchInput").value = "";
  document.getElementById("priorityFilter").value = "";
  document.getElementById("categoryFilter").value = "";
  
  // Set the status filter
  document.getElementById("statusFilter").value = status;
  
  // Load tasks with the filter
  loadTasks();
  
  // Add visual feedback (optional - highlight the clicked card)
  highlightActiveFilter(status);
}

// Highlight the active filter card
function highlightActiveFilter(status) {
  // Remove active class from all cards
  document.querySelectorAll('.stat-card').forEach(card => {
    card.style.opacity = '1';
    card.style.transform = 'scale(1)';
  });
  
  // Highlight the clicked card
  let activeCard = null;
  if (status === '') {
    activeCard = document.querySelector('.stat-card-primary');
  } else if (status === 'Pending') {
    activeCard = document.querySelector('.stat-card-warning');
  } else if (status === 'In Progress') {
    activeCard = document.querySelector('.stat-card-info');
  } else if (status === 'Completed') {
    activeCard = document.querySelector('.stat-card-success');
  }
  
  if (activeCard) {
    activeCard.style.opacity = '0.9';
    activeCard.style.transform = 'scale(0.98)';
    activeCard.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.2)';
    
    // Reset after a moment for visual feedback
    setTimeout(() => {
      activeCard.style.opacity = '1';
      activeCard.style.transform = 'scale(1)';
    }, 200);
  }
}

// Apply filters
function applyFilters() {
  loadTasks();
}

// Clear filters
function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("statusFilter").value = "";
  document.getElementById("priorityFilter").value = "";
  document.getElementById("categoryFilter").value = "";
  loadTasks();
  
  // Reset card highlighting
  document.querySelectorAll('.stat-card').forEach(card => {
    card.style.opacity = '1';
    card.style.transform = 'scale(1)';
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", function() {
  // Task form submit
  document.getElementById("taskForm").addEventListener("submit", function(e) {
    e.preventDefault();
    addTask();
  });

  // Edit task form submit (when Enter is pressed)
  document.getElementById("editTaskForm").addEventListener("submit", function(e) {
    e.preventDefault();
    saveTaskEdit();
  });

  // Load initial data
  loadTasks();
  loadStats();

  // Verify token is valid on page load
  verifyAuth();
});

// Verify authentication
async function verifyAuth() {
  try {
    const res = await fetch("/api/auth/profile", {
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    if (res.ok) {
      const userData = await res.json();
      localStorage.setItem("user", JSON.stringify(userData));
      if (userData.name) {
        document.getElementById("userName").innerHTML = `<i class="bi bi-person-circle me-1"></i>${userData.name}`;
      }
    }
  } catch (error) {
    console.error("Auth verification error:", error);
  }
}
