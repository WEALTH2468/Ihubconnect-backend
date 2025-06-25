const AttachmentType = require('../models/attachmentType');

exports.getAttachmentTypes = async (req, res, next) => {
  const companyDomain = req.headers.origin.split('//')[1];

  try {
    const  attachmentTypes = await AttachmentType.find({companyDomain})

    return res.status(200).json(attachmentTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.addAttachmentType = async (req, res, next) => {
  const companyDomain = req.headers.origin.split('//')[1];

  try {
    const { name } = req.body;
    let newAttachmentType = new AttachmentType({
      companyDomain,
      name,
    });
    const savedAttachmentType = await newAttachmentType.save();
    return res.status(200).json({
      attachmentType: savedAttachmentType,
      message: 'Created successfully!',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAttachmentType = async (req, res, next) => {

  try {
    const ids = JSON.parse(req.params.ids);

    await AttachmentType.deleteMany({
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

exports.updateAttachmentType = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { name } = req.body;
    const updatedAttachmentType = await AttachmentType.findByIdAndUpdate(
      id,
      {
        name,
      },
      { new: true } // updated data
    );
    return res.status(200).json({
      attachmentType: updatedAttachmentType,
      message: 'Updated successfully!',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
