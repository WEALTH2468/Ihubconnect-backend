const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Just skleton
const documentSchema = new Schema(
    {
        companyDomain:{type: String},
        files: [
            {
                file: String,
                revision_description: String,
            },
        ],
        links: [
            {
                link: String,
                revision_description: String,
            },
        ],
        type: { type: String },
        folders: [String],
        docNo: { type: String },
        folderId: { type: String },
        name: { type: String },
        type: { type: String },
        dateCreated: { type: String },
        dateRevised: { type: String },
        description: { type: String },
        contents: { type: String },
        createdBy: { type: String },
        lastModifiedBy: { type: String },
        classification: { type: String },
        units: [String],
        users: [String],
    },
    { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
