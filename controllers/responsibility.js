const Responsibility = require('../models/responsibility');

exports.getResponsibilities = async (req, res, next) => {
  try {
    const {roleId} = req.params
  if(roleId === 'undefined'){
    const responsibilities = await Responsibility.find();
    return res.status(200).json(responsibilities);
  }
  const responsibilities = await Responsibility.find({roleId});
  return res.status(200).json(responsibilities);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.addResponsibility = async (req, res, next) => {
  try {
    const responsibility = new Responsibility(req.body);
    await responsibility.save();
    return res.status(200).json({
      message: 'Responsibility added successfully!',
      responsibility,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateResponsibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedResponsibility = await Responsibility.findByIdAndUpdate(
      id,
      {
        ...req.body,
      },
      { new: true }
    );

    return res.status(200).json({
      responsibility: updatedResponsibility,
      message: 'Updated successfully!',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteResponsibility = async (req, res, next) => {
    try {
      const ids = JSON.parse(req.params.ids);

  
      await Responsibility.deleteMany({
        _id: {
          $in: ids,
        },
      });
  
      return res.status(200).json({
        ids,
        message: 'Deleted successfully!',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };
