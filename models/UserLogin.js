const mongoose = require('mongoose');

const userLoginSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    avatar: { type: String },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true }
});

module.exports = mongoose.model('UserLogin', userLoginSchema);
