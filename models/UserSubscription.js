const mongoose = require("mongoose");

const SubscriptionEntrySchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, default: null }, // fecha de próxima facturación
    cancelAtPeriodEnd: { type: Boolean, default: false },
    status: { type: String, default: "active" }, // active, canceled, unpaid...
});

const UserSubscriptionSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    subscriptions: { type: [SubscriptionEntrySchema], default: [] },
});

module.exports = mongoose.model("UserSubscription", UserSubscriptionSchema);
