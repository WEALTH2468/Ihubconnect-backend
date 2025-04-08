const mongoose = require('mongoose');
const Post = require('./post');
const Comment = require('./comment');
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');
const { type } = require('os');
const jobp = require("./jobPosition")

const userSchema = mongoose.Schema(
    {
        companyDomain:{type: String},
        lastLogin: { type: Date },
        background: { type: String },
        avatar: { type: String },
        displayName: { type: String },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        gender: { type: String },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
        departments: { type: Array, default: [] },
        units: { type: Array, default: [] },
        unitsMembers: { type: Array, default: [] },
        jobPosition: {type: mongoose.Schema.Types.ObjectId, ref: "JobPosition", default: null},
        email: { type: String, required: true },
        emails: { type: Array, default: [] },
        phoneNumbers: { type: Array, default: [] },
        address: { type: String },
        city: { type: String },
        birthday: { type: Date },
        aboutMe: { type: String },
        password: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
        permissions: { type: Array, default: [] },
        status: {
          type: String,
          enum: ["online", "away", "offline"],
          default: "offline",
        },
        isVerified: { type: Boolean, default: false },
        passwordResetToken: { type: String },
        passwordResetExpires: { type: Date },
        passwordChangeAt: { type: Date },
      },
      { timestamps: true }
);

userSchema.pre('findOneAndDelete', async function (next) {
    const user = await this.model.findOne(this.getFilter());

    await Promise.all([Post.deleteMany({ userId: user._id }), Comment.deleteMany({ userId: user._id })] )

    next();
});

userSchema.post('findOneAndUpdate', async function (result) {
    const user = result;
    const bulkOps = [
        {
            updateMany: {
                filter: { userId: user?._id },
                update: {
                    $set: {
                        user: { name: user?.displayName, avatar: user?.avatar },
                    },
                },
            },
        },
    ];
    await Promise.all([Post.bulkWrite(bulkOps), Comment.bulkWrite(bulkOps)])
});

userSchema.methods.generatePasswordResetToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
