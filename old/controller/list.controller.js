const ListItem = require("../models/list/list.model");

// Create a new list item
const createListItem = async (req, res) => {
  try {
    const { name, fields } = req.body;

    if (!name || !Array.isArray(fields)) {
      return res.status(400).json({ message: "Name and fields are required." });
    }

    const newItem = await ListItem.create({ name, fields });

    return res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating list item:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an existing list item
const updateListItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fields } = req.body;

    const item = await ListItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: "List item not found." });
    }

    item.name = name ?? item.name;
    item.fields = Array.isArray(fields) ? fields : item.fields;

    await item.save();

    return res.status(200).json(item);
  } catch (error) {
    console.error("Error updating list item:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Soft delete a list item
const deleteListItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ListItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: "List item not found." });
    }

    await item.destroy(); // Soft delete due to paranoid:true

    return res.status(200).json({ message: "List item deleted successfully." });
  } catch (error) {
    console.error("Error deleting list item:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all list items
const getAllListItems = async (req, res) => {
  try {
    const items = await ListItem.findAll();
    return res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching list items:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get a single list item by ID
const getListItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ListItem.findByPk(id);

    if (!item) {
      return res.status(404).json({ message: "List item not found." });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error("Error fetching list item:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createListItem,
  updateListItem,
  deleteListItem,
  getAllListItems,
  getListItemById,
};
