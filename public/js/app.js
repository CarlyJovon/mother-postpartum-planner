
const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Temporary in-memory task database
let tasks = [
  {
    id: crypto.randomUUID(),
    title: "Prepare a nourishing breakfast",
    category: "nourishment",
    dueDate: null,
    status: "pending",
    requiresHelp: false,
    priority: "normal",
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: "Ask my sister to bring dinner",
    category: "support",
    dueDate: null,
    status: "pending",
    requiresHelp: true,
    priority: "normal",
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: "Take a rest break",
    category: "rest",
    dueDate: null,
    status: "pending",
    requiresHelp: false,
    priority: "normal",
    createdAt: new Date().toISOString()
  }
];

// Get today's local date
function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// GET all tasks
app.get("/api/tasks", (req, res) => {
  res.json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// GET individual task
app.get("/api/tasks/:id", (req, res) => {
  const task = tasks.find(
    task => task.id === req.params.id
  );

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found"
    });
  }

  res.json({ success: true, task });
});

// POST single or batch tasks
app.post("/api/tasks", (req, res) => {
  const incoming = Array.isArray(req.body.tasks)
    ? req.body.tasks
    : [req.body];

  if (
    !incoming.length ||
    incoming.some(task =>
      !task ||
      typeof task.title !== "string" ||
      !task.title.trim()
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Every task must have a valid title."
    });
  }

  const newTasks = incoming.map(task => ({
    id: crypto.randomUUID(),
    title: task.title.trim(),
    category: task.category || "general",
    dueDate: task.dueDate || null,
    status: "pending",
    requiresHelp: task.requiresHelp === true,
    priority: task.priority || "normal",
    assignedTo: null,
    createdAt: new Date().toISOString()
  }));

  tasks.push(...newTasks);

  res.status(201).json({
    success: true,
    count: newTasks.length,
    tasks: newTasks
  });
});

// PUT update task
app.put("/api/tasks/:id", (req, res) => {
  const task = tasks.find(
    task => task.id === req.params.id
  );

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found"
    });
  }

  const allowedFields = [
    "title",
    "category",
    "dueDate",
    "status",
    "requiresHelp",
    "priority",
    "assignedTo"
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      task[field] = req.body[field];
    }
  }

  res.json({
    success: true,
    task
  });
});

// DELETE task
app.delete("/api/tasks/:id", (req, res) => {
  const originalLength = tasks.length;

  tasks = tasks.filter(
    task => task.id !== req.params.id
  );

  if (tasks.length === originalLength) {
    return res.status(404).json({
      success: false,
      message: "Task not found"
    });
  }

  res.json({
    success: true,
    message: "Task deleted successfully."
  });
});

// GET today's personalized recovery plan
app.get("/api/plan/today", (req, res) => {
  const today = getLocalDate();

  const todaysTasks = tasks.filter(task =>
    !task.dueDate || task.dueDate === today
  );

  const pendingTasks = todaysTasks.filter(
    task => task.status === "pending"
  );

  const completedTasks = todaysTasks.filter(
    task => task.status === "completed"
  );

  const priorities = pendingTasks.filter(
    task => task.priority === "important"
  );

  const delegated = pendingTasks.filter(
    task => task.requiresHelp
  );

  const protectedCategories = ["rest", "nourishment"];

  const protectedTasks = pendingTasks.filter(
    task => protectedCategories.includes(task.category)
  );

  const optionalTasks = pendingTasks.filter(
    task =>
      task.priority !== "important" &&
      !task.requiresHelp &&
      !protectedCategories.includes(task.category)
  );

  // Limit optional active goals to three
  const activeGoals = optionalTasks.slice(0, 3);

  const remainingTasks = optionalTasks.slice(3);

  res.json({
    success: true,
    date: today,

    plan: {
      priorities,
      protectedTasks,
      activeGoals,
      delegated,
      remainingTasks
    },

    progress: {
      total: todaysTasks.length,
      completed: completedTasks.length,
      percentage: todaysTasks.length
        ? Math.round(
            (completedTasks.length / todaysTasks.length) * 100
          )
        : 0
    }
  });
});

// Unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mother is running at http://localhost:${PORT}`);
});