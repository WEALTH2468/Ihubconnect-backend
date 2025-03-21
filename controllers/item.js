const Item = require("../models/item");

exports.getItems = async (req, res, next) => {
  try {
    const item = await Item.find({ companyDomain: req.auth.companyDomain });
    return res.status(200).json(item);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.getItem = async (req, res, next) => {
  const { id } = req.params;

  try {
    const item = await Item.findOne({
      _id: id,
      companyDomain: req.auth.companyDomain,
    });
    return res.status(200).json(item);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const item = new Item({
      ...req.body,
      companyDomain: req.auth.companyDomain,
    });
    await item.save();
    return res.status(200).json({
      message: "Item Added Successfully",
      item,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateItem = async (req, res, next) => {
  const { id } = req.params;
  const itemData = req.body;

  try {
    const updatedItem = await Item.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      itemData,
      {
        new: true,
      }
    );

    if (!updatedItem) {
      return res.status(404).json({
        error: "Item Not Found",
      });
    }
    return res.status(200).json({
      message: "Item Updated Sucessfully",
      updatedItem,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};
exports.deleteItem = async (req, res, next) => {
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
          const deletedItem = await Item.findOneAndDelete({
            _id: id,
            companyDomain: req.auth.companyDomain,
          });
          if (!deletedItem) {
            return { id, status: "not found" };
          }
          return { id, status: "deleted", deletedItem };
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
    console.log(error);
    res.status(500).json({
      message: "An error occurred during the deletion operation",
      error: error.message,
    });
  }
};
