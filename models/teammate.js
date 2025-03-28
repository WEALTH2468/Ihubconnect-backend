const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teammateSchema = new Schema(
  {
    companyDomain:{type: String},
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      unique: true,
    },
    team: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    workExperiences: [
      {
        company: String,
        jobTitle: String,
        from: { type: Date, default: null },
        to: { type: Date, default: null },
        comment: String,
      },
    ],
    educations: [
      {
        level: String,
        institute: String,
        specialization: String,
        score: Number,
        start: { type: Date, default: null },
        end: { type: Date, default: null },
      },
    ],
    attachments: [
      {
        attachmentType: String,
        file: String,
        path: String,
        description: String,
      },
    ],
    skills: [
      {
        skill: String,
        years: Number,
        comment: String,
      },
    ],
    contacts: [
      {
        name: String,
        relationship: String,
        gender: String,
        phone: String,
        email: String,
        address: String,
        birthday: { type: Date, default: null },
      },
    ],
  },
  { timestamps: true }
);
const Teammate = mongoose.model('Teammate', teammateSchema);

module.exports = Teammate;
