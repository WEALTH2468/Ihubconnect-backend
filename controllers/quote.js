const fs = require("fs");
const path = require("path");

const Quote = require("../models/quote");
const Item = require("../models/item");

exports.getQuotes = async (req, res, next) => {
  try {
    const quotes = await Quote.find({
      companyDomain: req.auth.companyDomain,
    }).populate("customerId");
    const result = await Promise.all(
      quotes.map(async (quote) => {
        const itemsData = await Promise.all(
          quote.items.map(async (item) => {
            const itemData = await Item.findOne({ _id: item.service });
            return {
              ...item.toObject(),
              price: item.price ? item.price : itemData.price,
              total: item.price
                ? item.price * item.quantity
                : itemData.price * item.quantity,
              serviceName: itemData.name,
            };
          })
        );

        // Calculate the subtotal
        const subTotal = itemsData.reduce((acc, item) => acc + item.total, 0);
        // Calculate discount
        const discountRate = quote.discount ? quote.discount / 100 : 0;
        const discount = subTotal * discountRate;
        // Calculate VAT
        const vatRate = quote.vat ? quote.vat / 100 : 0;
        const vat = (subTotal - discount) * vatRate;
        // Calculate total
        const total = subTotal - discount + vat;
        return {
          ...quote.toObject(),
          customer: quote.customerId,
          customerId: undefined,
          items: itemsData,
          subTotal,
          total,
        };
      })
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.getQuote = async (req, res, next) => {
  const { id } = req.params;
  try {
    const quote = await Quote.findOne({
      _id: id,
      companyDomain: req.auth.companyDomain,
    });
    return res.status(200).json(quote);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.addQuote = async (req, res, next) => {
  try {
    const quote = new Quote({
      ...req.body,
      companyDomain: req.auth.companyDomain,
    });
    const addedQuote = await quote.save();
    const quoteWithCustomer = await Quote.findOne({
      _id: addedQuote._id,
    }).populate("customerId");

    return res.status(200).json({
      message: "Quote Added Sucessfully",
      quote: {
        ...quoteWithCustomer._doc,
        customer: quoteWithCustomer._doc.customerId,
        customerId: undefined,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateQuote = async (req, res, next) => {
  const { id } = req.params;
  const quoteData = req.body;
  try {
    const updatedQuoteWithCustomer = await Quote.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      quoteData,
      {
        new: true,
      }
    ).populate("customerId");
    if (!updatedQuoteWithCustomer) {
      return res.status(404).json({
        error: "Quote not found",
      });
    }
    const itemsData = await Promise.all(
      updatedQuoteWithCustomer.items.map(async (item) => {
        const itemData = await Item.findOne({ _id: item.service });
        return {
          ...item.toObject(),
          price: item.price ? item.price : itemData.price,
          total: item.price
            ? item.price * item.quantity
            : itemData.price * item.quantity,
          serviceName: itemData.name,
        };
      })
    );
    // Calculate the subtotal
    const subTotal = itemsData.reduce((acc, item) => acc + item.total, 0);
    // Calculate discount
    const discountRate = quoteData.discount ? quoteData.discount / 100 : 0;
    const discount = subTotal * discountRate;
    // Calculate VAT
    const vatRate = quoteData.vat ? quoteData.vat / 100 : 0;
    const vat = (subTotal - discount) * vatRate;
    // Calculate total
    const total = subTotal - discount + vat;
    return res.status(200).json({
      message: "Quote updated successfully",
      updatedQuote: {
        ...updatedQuoteWithCustomer._doc,
        items: itemsData,
        customer: updatedQuoteWithCustomer._doc.customerId,
        customerId: undefined,
        total,
        subTotal,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.deleteQuote = async (req, res, next) => {
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
          const deletedQuote = await Quote.findOneAndDelete({
            _id: id,
            companyDomain: req.auth.companyDomain,
          });
          if (!deletedQuote) {
            return { id, status: "not found" };
          }
          return { id, status: "deleted", deletedQuote };
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
