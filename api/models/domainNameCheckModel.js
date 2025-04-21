const mongoose = require('mongoose');
const { Schema } = mongoose;

const domainNameCheckSchema = new Schema({
    monitor: {
        type: Schema.Types.ObjectId,
        ref: "Monitor",
        required: true
    },
    expiryDate: {
        type: Date,
    },
    notifyExpiration: {
        type: String
    } // notification days before expiry
})

const domainNames = mongoose.model("domainName", domainNameCheckSchema);

module.exports = domainNames;