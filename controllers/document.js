const Document = require("../models/document");
const User = require("../models/user");
const fs = require("fs");

const isFilenameExist = async (folderId, filename) => {
  let document = [];

  if (folderId) {
    document = await Document.find({
      folders: { $in: folderId },
      name: { $regex: new RegExp(`^${filename}$`, "i") },
    }).lean();
  } else {
    document = await Document.find({
      companyDomain,
      folders: [],
      name: { $regex: new RegExp(`^${filename}$`, "i") },
    }).lean();
  }

  return document.length > 0;
};

exports.getFolders = async (req, res, next) => {
  
  try {
    const companyDomain = req.headers.origin.split('//')[1];

    const items = await Document.find({companyDomain, type: "folder" }).lean();

    return res.status(200).json(items);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
exports.getFoldersAndFiles = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split('//')[1];

    const items = await Document.find({companyDomain}).lean();

    return res.status(200).json(items);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
exports.getDocuments = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split('//')[1];

    let folderId = req.params.folderId;
    const path = [];
    let items = [];

    if (folderId == "undefined") {
      folderId = null;
      items = await Document.find({ companyDomain, folders: [] }).lean();
    } else {
      items = await Document.find({ companyDomain, folders: { $in: folderId } }).lean();
    }

    let currentFolder = null;
    if (folderId) {
      let items = await Document.find({ companyDomain });
      currentFolder = items.find((item) => item.id === folderId);
      path.push(currentFolder);
    }

    while (
      currentFolder?.folders[0] != undefined &&
      currentFolder?.folders[0] != null
    ) {
      // eslint-disable-next-line no-loop-func
      let items = await Document.find({ companyDomain });

      currentFolder = items.find(
        (item) => item.id === currentFolder?.folders[0]
      );
      if (currentFolder) {
        path.unshift(currentFolder);
      }
    }

    return res.status(200).json({ items, path });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.addDocument = async (req, res, next) => {
  const { file } = req.files;

  try {
    const companyDomain = req.headers.origin.split('//')[1];

    //Retrieving all post fields
    const {
      type,
      folderId,
      files,
      links,
      folders,
      docNo,
      name,
      dateCreated,
      dateRevised,
      createdBy,
      classification,
      description,
      units,
      users,
    } = JSON.parse(req.body.data);

    //Check if the filename already exist
    const result = await
    isFilenameExist(folderId, name).then((result) => { 
      return result;
    });
    
    if(result) {
      return res.status(400).json({ message: "Can't Save Filename already exist" });
    }


    //Setting the document type to folder or to the last uploaded file
    const getType = () => {
      let type = "";
      if (file && file[0].filename != "") {
        const lastFileName = file[file.length - 1].originalname;
        type = lastFileName.split(".").at(-1).toUpperCase();
      }

      return type;
    };

    const newType = type == "folder" ? type : getType();

    // Process the files and form data as needed

    //reWrite the files location
    let newfiles = [];
    if (file && file[0].filename != "") {
      for (let i = 0; i < file.length; i++)
        newfiles.push({
          file: "/document-library/" + file[i].filename,
          revision_description:
            files.length == 0 ? "" : files[i].revision_description,
        });
    }
    //save the document
    //TODO : Delete this logs when done

    // Create a new document instance using the Document model
    const newDocument = new Document({
      companyDomain,
      files: newfiles,
      links,
      folders,
      docNo,
      name,
      type: newType,
      createdBy,
      dateCreated,
      dateRevised,
      classification,
      description,
      units,
      users,
    });

    // Save the new document to the database
    const savedDocument = await newDocument.save();

    return res.status(200).json({
      savedDocument,
      message: "Document Saved successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateDocument = async (req, res, next) => {
  try {
    const documentId = req.params.id;
    const {
      folderId,
      type,
      files,
      links,
      folders,
      docNo,
      name,
      dateCreated,
      dateRevised,
      lastModifiedBy,
      classification,
      description,
      units,
      users,
    } = JSON.parse(req.body.data);

    //Check if the filename already exist

    const result = await isFilenameExist(folderId, name).then((result) => {
      return result;
    });  

    if(result) {
      return res.status(400).json({ message: "Can't Update Filename already exist" });
    }

    if (type == "folder") {
      const updatedDocument = await Document.findByIdAndUpdate(
        documentId,
        {
          docNo,
          name,
          dateCreated,
          dateRevised,
          description,
          lastModifiedBy,
        },
        { new: true }
      );
      if (!updatedDocument) {
        return res.status(404).json({ error: "Document not found" });
      }

      return res.status(200).json({
        updatedDocument,
        message: "Document Updated successfully!",
      });
    }

    const { file } = req.files;

    // Process the files and form data as needed
    deletedFile = req.body.deletedFile;

    if (deletedFile) {
      const fileName = deletedFile.split("/document-library/")[1];
      fs.unlink("document-library/" + fileName, () => {});
    }

    let newfiles = [];
    if (file && file[0].filename != "") {
      for (let i = 0; i < file.length; i++)
        newfiles.push({
          file: "/document-library/" + file[i].filename,
          revision_description:
            files.length == 0 ? "" : files[i].revision_description,
        });
    }

    const oldfiles = files.filter((val) => val.file != "");

    const allFiles = [...oldfiles, ...newfiles];

    let newType =
      allFiles.length == 0
        ? ""
        : allFiles[allFiles.length - 1].file
            .split("document-library")[1]
            .split(".")
            .at(-1)
            .toUpperCase();

    if (file && file[0].filename != "") {
      const lastFileName = file[file.length - 1].originalname;
      newType = lastFileName.split(".").at(-1).toUpperCase();
    }

    // Create a new document instance using the Document model
    const newDocument = {
      files: allFiles,
      links,
      folders,
      docNo,
      name,
      type: newType,
      lastModifiedBy,
      dateCreated,
      dateRevised,
      classification,
      description,
      units,
      users,
    };

    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      newDocument,
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.status(200).json({
      updatedDocument,
      message: "Document Updated successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteDocument = async (req, res, next) => {
  const documentId = req.params.id;
  try {
    const document = await Document.findById({ _id: documentId });

    if (document && document.files.length != 0) {
      document.files.forEach((val) => {
        const fileName = val.file.split("/document-library/")[1];
        fs.unlink("document-library/" + fileName, () => {});
      });

      const deletedDocument = await Document.findOneAndDelete({
        _id: documentId,
      });
      if (!deletedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      return res.status(200).json({ message: "Document deleted successfully" });
    } else {
      const deletedDocument = await Document.findOneAndDelete({
        _id: documentId,
      });
      if (!deletedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      return res.status(200).json({ message: "Document deleted successfully" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
