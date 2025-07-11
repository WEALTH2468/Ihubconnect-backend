const fs = require("fs");
const Customer = require("../models/customer");

exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({
      companyDomain: req.auth.companyDomain,
    });
    return res.status(200).json(customers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.getCustomer = async (req, res, next) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findOne({
      _id: id,
      companyDomain: req.auth.companyDomain,
    });
    return res.status(200).json(customer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.addCustomer = async (req, res, next) => {
  try {
    const customer = new Customer({
      ...req.body,
      companyDomain: req.auth.companyDomain,
    });
    await customer.save();
    return res.status(200).json({
      message: "Customer Added Sucessfully",
      customer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateCustomer = async (req, res, next) => {
  const { id } = req.params;
  const customerData = JSON.parse(req.body.data);

  if (req.files) {
    Object.keys(req.files).forEach((key, index) => {
      if (customerData[key]) {
        const fileName = customerData[key].split("/images/")[1];
        fs.unlink(`images/${fileName}`, () => {
          customerData[key] = `/images/${req.files[key][0].filename}`;
        });
      }

      customerData[key] = `/images/${req.files[key][0].filename}`;
    });
  }

  try {
    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      customerData,
      {
        new: true,
      }
    );
    if (!updatedCustomer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }
    return res.status(200).json({
      message: "Customer updated successfully",
      updatedCustomer,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Update a specific contact within a customer
exports.updateCustomerContact = async (req, res) => {
  const { customerId, contactId } = req.params;
  const updatedContactData = req.body;

  console.log(updatedContactData);

  if (!customerId || !contactId) {
    console.error("Invalid request parameters");
    return res.status(400).json({ message: "Invalid request parameters" });
  }

  try {
    const customer = await Customer.findById({
      _id: customerId,
      companyDomain: req.auth.companyDomain,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    console.log(customer);

    const contactIndex = customer.contacts.findIndex(
      (contact) =>
        contact.companyDomain === req.auth.companyDomain ||
        contact._id.toString() === contactId
    );

    console.log(contactIndex);

    if (contactIndex === -1) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Update the contact data
    customer.contacts[contactIndex] = {
      ...customer.contacts[contactIndex].toObject(),
      ...updatedContactData,
    };

    await customer.save();

    res.status(200).json({ message: "Contact updated successfully", customer });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ message: "Server error while updating contact" });
  }
};

exports.deleteCustomer = async (req, res, next) => {
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
          const deletedCustomer = await Customer.findOneAndDelete({
            _id: id,
            companyDomain: req.auth.companyDomain,
          });
          if (!deletedCustomer) {
            return { id, status: "not found" };
          }
          return { id, status: "deleted", deletedCustomer };
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

exports.deleteContacts = async (req, res, next) => {
  const ids = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({
      message: "Invalid input; expected an array of IDs.",
    });
  }

  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      companyDomain: req.auth.companyDomain,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not fond",
      });
    }

    customer.contacts = customer.contacts.filter(
      (contact) => !ids.includes(contact._id.toString())
    );

    await customer.save();

    res.status(200).json({
      message: "Deletion operation completed",
      updatedCustomer: customer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred during the deletion operation",
      error: error.message,
    });
  }
};
