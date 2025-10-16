document.addEventListener('DOMContentLoaded', () => {
// --- DOM Elements ---
const todoForm = document.getElementById('todo-form');
const taskInput = document.getElementById('task-input');
const dateInput = document.getElementById('date-input');
const todoList = document.getElementById('todo-list');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const deleteAllBtn = document.getElementById('delete-all-btn');
const noTasksRow = document.getElementById('no-tasks-row');

// Pagination elements
const paginationControls = document.getElementById('pagination-controls');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageInfo = document.getElementById('page-info');

// Edit Modal elements
const editModal = document.getElementById('edit-modal');
const closeBtn = document.querySelector('.close-btn');
const editForm = document.getElementById('edit-form');
const editTaskId = document.getElementById('edit-task-id');
const editTaskInput = document.getElementById('edit-task-input');
const editDateInput = document.getElementById('edit-date-input');

// --- Application State ---
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentPage = 1;
const tasksPerPage = 5; // Task limit per page

// --- Helper Functions ---

// Saves tasks to Local Storage
const saveTasks = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Updates the display of the 'No tasks found.' message
const updateNoTasksMessage = () => {
    const visibleRows = todoList.querySelectorAll('tr:not(#no-tasks-row)');

    if (noTasksRow) {
        if (visibleRows.length > 0) {
            noTasksRow.style.display = 'none';
        } else {
            noTasksRow.style.display = 'table-row';
        }
    }
};

// Builds a single task row (<tr>)
const createTaskRow = (task) => {
    const row = document.createElement('tr');
    row.dataset.id = task.id;
    row.className = task.completed ? 'completed-task' : '';

    row.innerHTML = `
        <td>${task.text}</td>
        <td>${task.date}</td>
        <td>
            <button class="status-btn ${task.completed ? 'completed' : 'pending'}" data-completed="${task.completed}">
                ${task.completed ? 'Completed' : 'Pending'}
            </button>
        </td>
        <td class="action-buttons">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;

    row.querySelector('.status-btn').addEventListener('click', toggleStatus);
    row.querySelector('.edit-btn').addEventListener('click', openEditModal);
    row.querySelector('.delete-btn').addEventListener('click', deleteTask);
    
    return row;
};

// Renders the task list to the DOM
const renderTasks = () => {
    todoList.innerHTML = '';

    // 1. Filter Tasks
    let filteredTasks = tasks.filter(task => {
        const statusFilter = filterSelect.value;
        const searchTerm = searchInput.value.toLowerCase();
        
        const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'completed' && task.completed) ||
        (statusFilter === 'pending' && !task.completed);
        
        const matchesSearch = task.text.toLowerCase().includes(searchTerm);
        
        return matchesStatus && matchesSearch;
    });

    // 2. Pagination
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    currentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
    
    const start = (currentPage - 1) * tasksPerPage;
    const end = start + tasksPerPage;
    const tasksToRender = filteredTasks.slice(start, end);

    // 3. Render Task Rows
    if (tasksToRender.length > 0) {
        tasksToRender.forEach(task => {
            todoList.appendChild(createTaskRow(task));
        });
    }
    
    // 4. Update Message Status & Pagination UI
    updatePaginationUI(totalPages, filteredTasks.length);
    
    if (tasksToRender.length === 0 && filteredTasks.length === 0) {
        if (noTasksRow) {
            todoList.appendChild(noTasksRow);
            noTasksRow.style.display = 'table-row';
        }
    }
    
    updateNoTasksMessage();
};

// Updates the Pagination UI
const updatePaginationUI = (totalPages, totalTasks) => {
    if (totalTasks > tasksPerPage) {
        paginationControls.style.display = 'flex';
        pageInfo.textContent = `${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    } else {
        paginationControls.style.display = 'none';
    }
};

// --- Event Handlers ---

// Adds a Task
const addTask = (e) => {
    e.preventDefault();
    
    const text = taskInput.value.trim();
    const date = dateInput.value;
    
    if (text && date) {
        const newTask = {
            id: Date.now().toString(),
            text,
            date,
            completed: false
        };
        tasks.push(newTask);
        saveTasks();
        
        // Reset to page 1 after adding a task
        currentPage = 1; 
        renderTasks();
        
        taskInput.value = '';
        dateInput.value = '';
    }
};

// Deletes a Task
const deleteTask = (e) => {
    const row = e.target.closest('tr');
    const id = row.dataset.id;
    
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
};

// Toggles Status (Pending/Completed)
const toggleStatus = (e) => {
    const button = e.target;
    const row = button.closest('tr');
    const id = row.dataset.id;
    
    const task = tasks.find(t => t.id === id);
    
    if (task) {
        task.completed = !task.completed; 
        saveTasks();
        
        // Update the status display in the DOM
        row.className = task.completed ? 'completed-task' : '';
        button.className = `status-btn ${task.completed ? 'completed' : 'pending'}`;
        button.textContent = task.completed ? 'Completed' : 'Pending';
    }
    renderTasks(); 
};

// Deletes All Tasks
const handleDeleteAll = () => {
    if (confirm('Are you sure you want to delete all tasks?')) {
        tasks = [];
        saveTasks();
        currentPage = 1;
        renderTasks();
    }
};

// Edit Modal Logic
const openEditModal = (e) => {
    const row = e.target.closest('tr');
    const id = row.dataset.id;
    const task = tasks.find(t => t.id === id);
    
    if (task) {
        editTaskId.value = task.id;
        editTaskInput.value = task.text;
        editDateInput.value = task.date;
        editModal.style.display = 'block';
    }
};

const closeEditModal = () => {
    editModal.style.display = 'none';
};

const handleEditFormSubmit = (e) => {
    e.preventDefault();
    
    const id = editTaskId.value;
    const updatedText = editTaskInput.value.trim();
    const updatedDate = editDateInput.value;
    
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex > -1 && updatedText && updatedDate) {
        tasks[taskIndex].text = updatedText;
        tasks[taskIndex].date = updatedDate;
        saveTasks();
        renderTasks();
        closeEditModal();
    }
};

// Pagination Event Listeners
prevPageBtn.addEventListener('click', () => { // **DIPERBAIKI: const DIHAPUS**
    if (currentPage > 1) {
        currentPage--;
        renderTasks();
    }
});

nextPageBtn.addEventListener('click', () => { // **DIPERBAIKI: const DIHAPUS**
    const totalPages = Math.ceil(tasks.length / tasksPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTasks();
    }
});

// --- Main Event Listeners ---
todoForm.addEventListener('submit', addTask);
deleteAllBtn.addEventListener('click', handleDeleteAll);
searchInput.addEventListener('input', () => {
    currentPage = 1;
    renderTasks();
});
filterSelect.addEventListener('change', () => {
    currentPage = 1;
    renderTasks();
});

// Modal Events
closeBtn.addEventListener('click', closeEditModal);
editForm.addEventListener('submit', handleEditFormSubmit);
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// --- Initialization ---
renderTasks();
});