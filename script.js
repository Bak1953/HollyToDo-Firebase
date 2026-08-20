// DOM Elements
const todoInput = document.getElementById('todoInput');
const categorySelect = document.getElementById('categorySelect');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const resourcesInput = document.getElementById('resourcesInput');
const peopleInput = document.getElementById('peopleInput');
const sortSelect = document.getElementById('sortSelect');
const addTodoBtn = document.getElementById('addTodo');
const todoList = document.getElementById('todoList');
const completedList = document.getElementById('completedList');
const archivedList = document.getElementById('archivedList');
const showCompletedBtn = document.getElementById('showCompletedBtn');
const showArchivedBtn = document.getElementById('showArchivedBtn');
const completedSection = document.getElementById('completedSection');
const archivedSection = document.getElementById('archivedSection');
const completedCount = document.getElementById('completedCount');
const archivedCount = document.getElementById('archivedCount');
const printButton = document.getElementById('printButton');
const userStatus = document.getElementById('userStatus');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');

// In-memory arrays (synced from Firestore)
let todos = [];
let completedTodos = [];
let archivedTodos = [];
let currentUserId = null;
let unsubscribers = [];

// Set min date for the date picker to today
dueDateInput.min = new Date().toISOString().split('T')[0];

// Update task counts
const updateTaskCounts = () => {
    completedCount.textContent = completedTodos.length;
    archivedCount.textContent = archivedTodos.length;
};

// Toggle section visibility with animation
const toggleSection = (section, button) => {
    const isHidden = section.classList.contains('hidden');

    if (isHidden) {
        section.classList.remove('hidden');
        section.classList.add('section-enter');
        button.classList.add('active');
        requestAnimationFrame(() => {
            section.classList.remove('section-enter');
            section.classList.add('section-enter-active');
        });
        setTimeout(() => {
            section.classList.remove('section-enter-active');
        }, 300);
    } else {
        section.classList.add('section-exit');
        button.classList.remove('active');
        requestAnimationFrame(() => {
            section.classList.add('section-exit-active');
        });
        setTimeout(() => {
            section.classList.add('hidden');
            section.classList.remove('section-exit', 'section-exit-active');
        }, 300);
    }
};

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Check if due date is approaching (within 2 days)
const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
};

// Create todo item element
function createTodoItem(todo, listType = 'active') {
    const todoItem = document.createElement('div');
    todoItem.className = 'todo-item';
    todoItem.setAttribute('data-category', todo.category);
    todoItem.setAttribute('data-id', todo.id);

    const todoContent = document.createElement('div');
    todoContent.className = 'todo-content';

    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    const textSpan = document.createElement('span');
    textSpan.textContent = todo.text;
    mainContent.appendChild(textSpan);

    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    const cssVarName = todo.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    categoryBadge.style.backgroundColor = `var(--category-${cssVarName})`;
    categoryBadge.textContent = todo.category;
    mainContent.appendChild(categoryBadge);

    if (todo.priority) {
        const priorityBadge = document.createElement('span');
        priorityBadge.className = `priority-badge priority-${todo.priority}`;
        priorityBadge.textContent = `${todo.priority} Priority`;
        mainContent.appendChild(priorityBadge);
    }

    todoContent.appendChild(mainContent);

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'todo-details';

    if (todo.dueDate) {
        const dueDateElement = document.createElement('div');
        dueDateElement.className = 'due-date';
        if (isDueSoon(todo.dueDate)) {
            dueDateElement.classList.add('due-date-warning');
        }
        dueDateElement.innerHTML = `📅 Due: ${formatDate(todo.dueDate)}`;
        detailsDiv.appendChild(dueDateElement);
    }

    if (todo.resources) {
        const resourcesElement = document.createElement('div');
        resourcesElement.className = 'resources';
        resourcesElement.innerHTML = `📦 Resources: ${todo.resources}`;
        detailsDiv.appendChild(resourcesElement);
    }

    if (todo.people) {
        const peopleElement = document.createElement('div');
        peopleElement.className = 'people';
        peopleElement.innerHTML = `👥 People: ${todo.people}`;
        detailsDiv.appendChild(peopleElement);
    }

    todoContent.appendChild(detailsDiv);
    todoItem.appendChild(todoContent);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    switch(listType) {
        case 'archived':
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '🗑️';
            deleteButton.className = 'delete-button';
            deleteButton.title = 'Delete Permanently';
            deleteButton.onclick = () => {
                if (confirm('Are you sure you want to permanently delete this task?')) {
                    deleteTodo(todo.id);
                }
            };
            buttonContainer.appendChild(deleteButton);
            break;

        case 'completed':
            const archiveButton = document.createElement('button');
            archiveButton.textContent = '📁';
            archiveButton.className = 'archive-button';
            archiveButton.title = 'Archive Task';
            archiveButton.onclick = () => moveTodo(todo, 'completed', 'archived');
            buttonContainer.appendChild(archiveButton);
            break;

        default:
            const completeButton = document.createElement('button');
            completeButton.textContent = '✓';
            completeButton.className = 'complete-button';
            completeButton.title = 'Mark as Complete';
            completeButton.onclick = () => moveTodo(todo, 'todos', 'completed');

            const activeArchiveButton = document.createElement('button');
            activeArchiveButton.textContent = '📁';
            activeArchiveButton.className = 'archive-button';
            activeArchiveButton.title = 'Archive Task';
            activeArchiveButton.onclick = () => moveTodo(todo, 'todos', 'archived');

            buttonContainer.appendChild(completeButton);
            buttonContainer.appendChild(activeArchiveButton);
    }

    todoItem.appendChild(buttonContainer);
    return todoItem;
}

// Firestore helpers
function getUserRef() {
    if (!currentUserId) return null;
    return db.collection('users').doc(currentUserId);
}

function subscribeToCollection(collectionName, targetArray) {
    const userRef = getUserRef();
    if (!userRef) return;

    const unsub = userRef.collection(collectionName)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            const items = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });

            if (collectionName === 'todos') todos = items;
            if (collectionName === 'completedTodos') completedTodos = items;
            if (collectionName === 'archivedTodos') archivedTodos = items;

            renderTodos();
        }, (error) => {
            console.error(`Error listening to ${collectionName}:`, error);
        });

    unsubscribers.push(unsub);
}

function clearSubscriptions() {
    unsubscribers.forEach((unsub) => unsub());
    unsubscribers = [];
    todos = [];
    completedTodos = [];
    archivedTodos = [];
    renderTodos();
}

// Render todos
function renderTodos() {
    todoList.innerHTML = '';
    completedList.innerHTML = '';
    archivedList.innerHTML = '';

    const sortedActive = sortTodos(todos);
    const sortedCompleted = sortTodos(completedTodos);
    const sortedArchived = sortTodos(archivedTodos);

    sortedActive.forEach((todo) => todoList.appendChild(createTodoItem(todo, 'active')));
    sortedCompleted.forEach((todo) => completedList.appendChild(createTodoItem(todo, 'completed')));
    sortedArchived.forEach((todo) => archivedList.appendChild(createTodoItem(todo, 'archived')));

    updateTaskCounts();
}

// Sort todos
function sortTodos(todoArray) {
    const sortBy = sortSelect.value;
    return [...todoArray].sort((a, b) => {
        switch (sortBy) {
            case 'dueDate':
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'category':
            default:
                return a.category.localeCompare(b.category);
        }
    });
}

// Add new todo
function addTodo() {
    const todoText = todoInput.value.trim();
    const category = categorySelect.value;
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value;
    const resources = resourcesInput.value.trim();
    const people = peopleInput.value.trim();

    if (!todoText) {
        alert('Please enter a task description');
        return;
    }

    if (!category) {
        alert('Please select a category');
        return;
    }

    const userRef = getUserRef();
    if (!userRef) {
        alert('Please sign in first');
        return;
    }

    const newTodo = {
        text: todoText,
        category: category,
        priority: priority || 'Medium',
        dueDate: dueDate,
        resources: resources,
        people: people,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    userRef.collection('todos').add(newTodo)
        .then(() => {
            // Clear inputs
            todoInput.value = '';
            categorySelect.value = '';
            prioritySelect.value = '';
            dueDateInput.value = '';
            resourcesInput.value = '';
            peopleInput.value = '';
        })
        .catch((error) => {
            console.error('Error adding todo:', error);
            alert('Could not add task. Please try again.');
        });
}

// Move todo between collections
function moveTodo(todo, fromCollection, toCollection) {
    const userRef = getUserRef();
    if (!userRef) return;

    const movedTodo = { ...todo };
    delete movedTodo.id;
    movedTodo.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

    userRef.collection(fromCollection).doc(todo.id).delete()
        .then(() => userRef.collection(toCollection).add(movedTodo))
        .catch((error) => {
            console.error('Error moving todo:', error);
            alert('Could not move task. Please try again.');
        });
}

// Delete todo permanently
function deleteTodo(id) {
    const userRef = getUserRef();
    if (!userRef) return;

    userRef.collection('archivedTodos').doc(id).delete()
        .catch((error) => {
            console.error('Error deleting todo:', error);
            alert('Could not delete task. Please try again.');
        });
}

// Request notification permission and save FCM token
async function registerForReminders() {
    if (!('Notification' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    try {
        const token = await messaging.getToken({
            vapidKey: 'BLzlpJ_H4SZbvTw4ig08wNfxS1RLb2moDbSAoTMv0s-MQr8ukX_9ERXBylzvQKjXdf4sfZI-5axQLksANwL5kl0'
        });
        if (token && currentUserId) {
            await db.collection('users').doc(currentUserId).update({
                fcmTokens: firebase.firestore.FieldValue.arrayUnion(token)
            });
            console.log('FCM token saved:', token);
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
    }
}

// Update auth UI
function updateAuthUI(user) {
    if (user) {
        currentUserId = user.uid;
        userStatus.textContent = `Signed in as ${user.isAnonymous ? 'Guest' : (user.email || 'User')}`;
        signInBtn.classList.add('hidden');
        signOutBtn.classList.remove('hidden');
        subscribeToCollection('todos', todos);
        subscribeToCollection('completedTodos', completedTodos);
        subscribeToCollection('archivedTodos', archivedTodos);
        registerForReminders();
    } else {
        currentUserId = null;
        userStatus.textContent = 'Not signed in';
        signInBtn.classList.remove('hidden');
        signOutBtn.classList.add('hidden');
        clearSubscriptions();
    }
}

// Event listeners
addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});
sortSelect.addEventListener('change', renderTodos);
showCompletedBtn.addEventListener('click', () => toggleSection(completedSection, showCompletedBtn));
showArchivedBtn.addEventListener('click', () => toggleSection(archivedSection, showArchivedBtn));
printButton.addEventListener('click', () => window.print());

signInBtn.addEventListener('click', () => {
    auth.signInAnonymously().catch((error) => {
        console.error('Sign in error:', error);
        alert('Could not sign in. Please try again.');
    });
});

signOutBtn.addEventListener('click', () => {
    auth.signOut().catch((error) => {
        console.error('Sign out error:', error);
    });
});

// Auth state listener
auth.onAuthStateChanged((user) => {
    updateAuthUI(user);
    if (!user) {
        // Auto sign in as guest for first-time users
        auth.signInAnonymously().catch((error) => {
            console.error('Auto sign in error:', error);
        });
    }
});

// Register service worker for offline PWA support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('Service Worker registered'))
        .catch((error) => console.error('Service Worker registration failed:', error));
}

// Handle FCM messages while app is in foreground
if (messaging) {
    messaging.onMessage((payload) => {
        console.log('Message received:', payload);
        if (Notification.permission === 'granted') {
            new Notification(payload.notification.title, {
                body: payload.notification.body,
                icon: './icon-192.png'
            });
        }
    });
}
