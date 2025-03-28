const Category = require("../../models/iperformance/category");

// Create a category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Name and description are required." });
    }

    const category = new Category({
      name,
      description,
      companyDomain: req.auth.companyDomain,
      createdBy: req.auth.userId,
    });

    await category.save();

    res.status(201).json({
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      message: "An error occurred while creating the category.",
      error: error.message,
    });
  }
};

// Delete a category by ID
exports.deleteCategory = async (req, res, next) => {
  try {
    const selectedIds = req.body.ids || req.query.ids;

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ error: "No category IDs provided for bulk delete" });
    }

    const result = await Category.deleteMany({
      _id: { $in: selectedIds },
      companyDomain: req.auth.companyDomain,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "No goals found for the provided IDs" });
    }

    return res.status(200).json({
      message: `${result.deletedCount} goals deleted successfully`,
      deletedIds: selectedIds,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
// Update a category by ID
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      {
        ...req.body,
        updatedAt: Date.now(),
      },
      {
        new: true,
      }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message: "An error occurred while updating the category.",
      error: error.message,
    });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      companyDomain: req.auth.companyDomain,
    }).sort({ createdAt: -1 }); // Sort by newest first
    res.status(200).json({
      message: "Categories retrieved successfully.",
      categories,
    });
  } catch (error) {
    console.error("Error retrieving categories:", error);
    res.status(500).json({
      message: "An error occurred while retrieving the categories.",
      error: error.message,
    });
  }
};

// Get a single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      _id: id,
      companyDomain: req.auth.companyDomain,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.status(200).json({
      message: "Category retrieved successfully.",
      category,
    });
  } catch (error) {
    console.error("Error retrieving category:", error);
    res.status(500).json({
      message: "An error occurred while retrieving the category.",
      error: error.message,
    });
  }
};
