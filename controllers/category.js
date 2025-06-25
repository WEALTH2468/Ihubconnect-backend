const Category = require("../models/category");

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      companyDomain: req.auth.companyDomain,
    });
    return res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.getCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const category = await Category.findOne({
      _id: id,
      companyDomain: req.auth.companyDomain,
    });
    return res.status(200).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.addCategory = async (req, res, next) => {
  try {
    const category = new Category({
      ...req.body,
      createdAt: new Date().getTime(),
      companyDomain: req.auth.companyDomain,
    });
    await category.save();
    return res.status(200).json({
      message: "Category Added Sucessfully",
      category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;

    const updatedCategory = await Category.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      categoryData,
      {
        new: true,
      }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      updatedCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res, next) => {
  const ids = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({
      message: "Invalid input; expected an array of IDs.",
    });
  }

  try {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const deletedCategory = await Category.findOneAndDelete({
            _id: id,
            companyDomain: req.auth.companyDomain,
          });
          if (!deletedCategory) {
            return { id, status: "not found" };
          }
          return { id, status: "deleted", deletedCategory };
        } catch (error) {
          return { id, status: "error", error: error.message };
        }
      })
    );

    const summary = {
      deleted: results.filter((result) => result.status === "deleted").length,
      notFound: results.filter((result) => result.status === "not found")
        .length,
      errors: results.filter((result) => result.status === "error").length,
    };

    res.status(200).json({
      message: "Deletion operation completed",
      summary,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred during the deletion operation",
      error: error.message,
    });
  }
};
