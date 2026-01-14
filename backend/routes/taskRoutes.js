const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, pending, progress, completed, high, medium, low] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: "Pending" }),
      Task.countDocuments({ userId, status: "In Progress" }),
      Task.countDocuments({ userId, status: "Completed" }),
      Task.countDocuments({ userId, priority: "High" }),
      Task.countDocuments({ userId, priority: "Medium" }),
      Task.countDocuments({ userId, priority: "Low" })
    ]);

    res.json({
      total,
      pending,
      progress,
      completed,
      high,
      medium,
      low
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ msg: "Server error fetching stats" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;
    let q = { userId: req.user.id };

    if (status) q.status = status;
    if (priority) q.priority = priority;
    if (category) q.category = { $regex: category, $options: "i" };
    
    if (search) {
      q.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const tasks = await Task.find(q).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, description, category, priority, status, dueDate } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ msg: "Title is required" });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || "",
      category: category || "",
      priority: priority || "Medium",
      status: status || "Pending",
      dueDate: dueDate || null,
      userId: req.user.id
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ msg: "Server error creating task" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { title, description, category, priority, status, dueDate } = req.body;

    if (title !== undefined && title.trim() === "") {
      return res.status(400).json({ msg: "Title cannot be empty" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ msg: "Server error updating task" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await Task.deleteOne({ _id: req.params.id, userId: req.user.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: "Task not found" });
    }

    res.json({ msg: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ msg: "Server error deleting task" });
  }
});

module.exports = router;
