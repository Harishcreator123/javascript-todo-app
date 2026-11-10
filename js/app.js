
/**
 * TaskFlow - JavaScript Logic & State Management
 * CRUD, Filtering, Local Storage and Duplicate Prevention
 */

// -----------------------------------------------------------------------------
// 1. Constants & Application State
// -----------------------------------------------------------------------------

const STORAGE_KEY = 'taskflow-tasks';

let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;

// -----------------------------------------------------------------------------
// 2. DOM Elements
// -----------------------------------------------------------------------------

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');

const emptyStateTitle = emptyState
  ? emptyState.querySelector('.empty-state-title')
  : null;

const emptyStateText = emptyState
  ? emptyState.querySelector('.empty-state-text')
  : null;

const filterGroup = document.querySelector('.filter-group');
const filterButtons = document.querySelectorAll('.filter-btn');

const totalTasksCountEl = document.getElementById('total-tasks-count');
const completedTasksCountEl = document.getElementById('completed-tasks-count');

const countAllEl = document.getElementById('count-all');
const countActiveEl = document.getElementById('count-active');
const countCompletedEl = document.getElementById('count-completed');

// -----------------------------------------------------------------------------
// 3. Local Storage Operations
// -----------------------------------------------------------------------------

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

function loadTasks() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
      const parsedData = JSON.parse(savedData);

      if (Array.isArray(parsedData)) {
        // Validate every saved task before loading it.
        tasks = parsedData.filter((task) => {
          return (
            task &&
            typeof task.id === 'string' &&
            typeof task.title === 'string' &&
            task.title.trim().length > 0 &&
            typeof task.completed === 'boolean'
          );
        });

        return;
      }
    }
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }

  tasks = [];
}

// -----------------------------------------------------------------------------
// 4. Filtering Logic & Statistics
// -----------------------------------------------------------------------------

function getFilteredTasks() {
  if (currentFilter === 'active') {
    return tasks.filter((task) => !task.completed);
  }

  if (currentFilter === 'completed') {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function setFilter(filter) {
  if (currentFilter === filter) return;

  currentFilter = filter;
  updateFilterButtons();
  renderTasks();
}

function updateFilterButtons() {
  filterButtons.forEach((btn) => {
    const isActive = btn.dataset.filter === currentFilter;

    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;

  if (totalTasksCountEl) {
    totalTasksCountEl.textContent = total;
  }

  if (completedTasksCountEl) {
    completedTasksCountEl.textContent = completed;
  }

  if (countAllEl) {
    countAllEl.textContent = total;
  }

  if (countActiveEl) {
    countActiveEl.textContent = active;
  }

  if (countCompletedEl) {
    countCompletedEl.textContent = completed;
  }
}

function updateEmptyStateMessage() {
  if (!emptyStateTitle || !emptyStateText) return;

  if (tasks.length === 0) {
    emptyStateTitle.textContent = 'No tasks found';
    emptyStateText.textContent =
      'Add a task above to get started organizing your day!';
  } else if (currentFilter === 'active') {
    emptyStateTitle.textContent = 'No active tasks';
    emptyStateText.textContent =
      'All tasks are completed! Awesome job staying productive.';
  } else if (currentFilter === 'completed') {
    emptyStateTitle.textContent = 'No completed tasks yet';
    emptyStateText.textContent =
      'Mark tasks as completed when you finish them.';
  } else {
    emptyStateTitle.textContent = 'No tasks found';
    emptyStateText.textContent =
      'Add a task above to get started organizing your day!';
  }
}

// -----------------------------------------------------------------------------
// 5. CRUD Operations
// -----------------------------------------------------------------------------

function generateId() {
  return Date.now().toString() +
    Math.random().toString(36).substring(2, 7);
}

// CREATE: Add a new task with duplicate prevention.

function addTask(title) {
  const trimmedTitle = title.trim().replace(/\s+/g, ' ');

  // Prevent empty tasks.
  if (!trimmedTitle) {
    return false;
  }

  // Normalize the title before checking for duplicates.
  const normalizedTitle = trimmedTitle.toLowerCase();

  const isDuplicate = tasks.some((task) => {
    return (
      typeof task.title === 'string' &&
      task.title.trim().replace(/\s+/g, ' ').toLowerCase() ===
        normalizedTitle
    );
  });

  // Reject duplicate tasks.
  if (isDuplicate) {
    alert('This task already exists!');
    return false;
  }

  const newTask = {
    id: generateId(),
    title: trimmedTitle,
    completed: false,
  };

  tasks.push(newTask);

  saveTasks();
  renderTasks();

  return true;
}

// READ: Display tasks according to the selected filter.

function renderTasks() {
  if (!taskList || !emptyState) return;

  const filteredTasks = getFilteredTasks();

  taskList.innerHTML = '';

  if (filteredTasks.length === 0) {
    updateEmptyStateMessage();
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';

    filteredTasks.forEach((task) => {
      const taskItemEl = createTaskElement(task);
      taskList.appendChild(taskItemEl);
    });
  }

  updateStats();

  // Focus the edit input when editing a task.
  if (editingTaskId) {
    const editInput = taskList.querySelector(
      `.task-edit-input[data-id="${editingTaskId}"]`
    );

    if (editInput) {
      editInput.focus();
      editInput.select();
    }
  }
}

// Create a task element dynamically.

function createTaskElement(task) {
  const isEditing = editingTaskId === task.id;

  const li = document.createElement('li');

  li.className = task.completed
    ? 'task-item completed'
    : 'task-item';

  li.dataset.id = task.id;

  if (isEditing) {
    // EDITING MODE

    const contentDiv = document.createElement('div');
    contentDiv.className = 'task-content';

    const editInput = document.createElement('input');

    editInput.type = 'text';
    editInput.className = 'task-edit-input';
    editInput.value = task.title;
    editInput.dataset.id = task.id;

    editInput.setAttribute('aria-label', 'Edit task title');

    contentDiv.appendChild(editInput);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    const saveBtn = document.createElement('button');

    saveBtn.type = 'button';
    saveBtn.className = 'task-action-btn edit-btn';
    saveBtn.dataset.action = 'save';
    saveBtn.dataset.id = task.id;
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');

    cancelBtn.type = 'button';
    cancelBtn.className = 'task-action-btn delete-btn';
    cancelBtn.dataset.action = 'cancel';
    cancelBtn.dataset.id = task.id;
    cancelBtn.textContent = 'Cancel';

    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);

    li.appendChild(contentDiv);
    li.appendChild(actionsDiv);

  } else {
    // NORMAL VIEW MODE

    const contentDiv = document.createElement('div');
    contentDiv.className = 'task-content';

    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;

    checkbox.dataset.action = 'toggle';
    checkbox.dataset.id = task.id;

    checkbox.setAttribute(
      'aria-label',
      `Mark "${task.title}" as ${
        task.completed ? 'incomplete' : 'complete'
      }`
    );

    const titleSpan = document.createElement('span');

    titleSpan.className = 'task-text';

    // Safe text rendering.
    titleSpan.textContent = task.title;

    contentDiv.appendChild(checkbox);
    contentDiv.appendChild(titleSpan);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    const editBtn = document.createElement('button');

    editBtn.type = 'button';
    editBtn.className = 'task-action-btn edit-btn';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = task.id;
    editBtn.textContent = 'Edit';

    editBtn.setAttribute(
      'aria-label',
      `Edit "${task.title}"`
    );

    const deleteBtn = document.createElement('button');

    deleteBtn.type = 'button';
    deleteBtn.className = 'task-action-btn delete-btn';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.id = task.id;
    deleteBtn.textContent = 'Delete';

    deleteBtn.setAttribute(
      'aria-label',
      `Delete "${task.title}"`
    );

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(contentDiv);
    li.appendChild(actionsDiv);
  }

  return li;
}

// UPDATE: Toggle task completion.

function toggleTaskComplete(id) {
  const task = tasks.find((item) => item.id === id);

  if (task) {
    task.completed = !task.completed;

    saveTasks();
    renderTasks();
  }
}

// UPDATE: Start editing a task.

function startEditing(id) {
  editingTaskId = id;
  renderTasks();
}

// UPDATE: Cancel editing.

function cancelEditing() {
  editingTaskId = null;
  renderTasks();
}

// UPDATE: Save an edited task title.

function updateTaskTitle(id, newTitle) {
  const trimmedTitle = newTitle.trim().replace(/\s+/g, ' ');

  if (!trimmedTitle) {
    alert('Task title cannot be empty.');
    return;
  }

  // Prevent editing a task into the title of another task.
  const isDuplicate = tasks.some((task) => {
    return (
      task.id !== id &&
      task.title.trim().replace(/\s+/g, ' ').toLowerCase() ===
        trimmedTitle.toLowerCase()
    );
  });

  if (isDuplicate) {
    alert('Another task with this title already exists!');
    return;
  }

  const task = tasks.find((item) => item.id === id);

  if (task) {
    task.title = trimmedTitle;
    editingTaskId = null;

    saveTasks();
    renderTasks();
  }
}

// DELETE: Remove a task.

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);

  if (editingTaskId === id) {
    editingTaskId = null;
  }

  saveTasks();
  renderTasks();
}

// -----------------------------------------------------------------------------
// 6. Event Listeners & Event Delegation
// -----------------------------------------------------------------------------

// Form submission: Add task.

if (taskForm && taskInput) {
  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = taskInput.value;
    const wasAdded = addTask(title);

    // Clear input only after successful addition.
    if (wasAdded) {
      taskInput.value = '';
      taskInput.focus();
    } else if (title.trim()) {
      taskInput.focus();
      taskInput.select();
    }
  });
}

// Event delegation for filters.

if (filterGroup) {
  filterGroup.addEventListener('click', (event) => {
    const filterBtn = event.target.closest('.filter-btn');

    if (!filterBtn) return;

    const filter = filterBtn.dataset.filter;

    if (
      filter === 'all' ||
      filter === 'active' ||
      filter === 'completed'
    ) {
      setFilter(filter);
    }
  });
}

// Event delegation for task actions.

if (taskList) {
  taskList.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');

    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    const id = actionTarget.dataset.id;

    if (action === 'toggle') {
      toggleTaskComplete(id);

    } else if (action === 'edit') {
      startEditing(id);

    } else if (action === 'cancel') {
      cancelEditing();

    } else if (action === 'save') {
      const editInput = taskList.querySelector(
        `.task-edit-input[data-id="${id}"]`
      );

      if (editInput) {
        updateTaskTitle(id, editInput.value);
      }

    } else if (action === 'delete') {
      deleteTask(id);
    }
  });

  // Keyboard support while editing:
  // Enter saves, Escape cancels.

  taskList.addEventListener('keydown', (event) => {
    if (!event.target.classList.contains('task-edit-input')) {
      return;
    }

    const id = event.target.dataset.id;

    if (event.key === 'Enter') {
      event.preventDefault();
      updateTaskTitle(id, event.target.value);

    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  });
}

// -----------------------------------------------------------------------------
// 7. Initial Application Setup
// -----------------------------------------------------------------------------

loadTasks();
updateFilterButtons();
renderTasks();
