const mongoose = require('mongoose');
const { Schema } = mongoose;

const SSLCheckSchema = new Schema({
    monitor: {
        type: Schema.Types.ObjectId,
        ref: "Monitor",
        required: true
    },
    issuer: {
        type: String,
    },
    validFrom: {
        type: Date,
    },
    validTo: {
        type: Date,
    },
    protocol: {
        type: String,
    },
    notifyExpiration: {
        type: String
    }
})

const SSLCheck = mongoose.model("SSLCheck", SSLCheckSchema);

module.exports = SSLCheck;