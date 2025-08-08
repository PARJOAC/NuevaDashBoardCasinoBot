// routes/stripeWebhook.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Guild = require("../models/Guild");
const UserSubscription = require("../models/UserSubscription");
const client = require("../config/botClient");
const { EmbedBuilder } = require("discord.js");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log("📩 Webhook recibido:", event.type);
    } catch (err) {
        console.error("❌ Error verificando webhook:", err.message);
        return res.sendStatus(400);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const guildId = session.metadata.guildId;
        const userId = session.metadata.userId;
        const userName = session.metadata.userName;
        const userAvatar = session.metadata.userAvatar;

        try {
            // Actualizar vipServer en Guild
            await Guild.findOneAndUpdate(
                { guildId },
                { $set: { vipServer: true } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // Crear o actualizar suscripción en UserSubscription
            const subEntry = {
                guildId,
                stripeSubscriptionId: session.subscription || "unknown_subscription_id",
                stripeCustomerId: session.customer || "unknown_customer_id",
                createdAt: new Date(),
                currentPeriodEnd: session.subscription && session.subscription.current_period_end
                    ? new Date(session.subscription.current_period_end * 1000)
                    : null,
                cancelAtPeriodEnd: false,
                status: "active",
            };

            let userSub = await UserSubscription.findOne({ userId: userId });
            if (!userSub) {
                userSub = new UserSubscription({ userId, subscriptions: [subEntry] });
            } else {
                const existingIndex = userSub.subscriptions.findIndex(s => s.guildId === guildId);
                if (existingIndex !== -1) {
                    userSub.subscriptions[existingIndex] = subEntry;
                } else {
                    userSub.subscriptions.push(subEntry);
                }
            }
            await userSub.save();

            console.log(`✅ Premium activado para guild ${guildId} y guardado para usuario ${userId}`);
        } catch (err) {
            console.error("❌ Error guardando en DB:", err.message);
        }

        // Enviar embed al canal de Discord
        try {
            const embed = new EmbedBuilder()
                .setTitle("🛍️ PURCHASE SUCCESS")
                .setColor(0x2b2d31)
                .addFields(
                    { name: "Server Name:", value: `${session.metadata.guildName} (${guildId})` },
                    { name: "User:", value: `${userName} (${userId})` },
                    { name: "Purchase:", value: "Premium" },
                    { name: "Quantity:", value: "1", inline: true },
                    { name: "Date:", value: new Date(session.created * 1000).toUTCString(), inline: true },
                    { name: "Total Price:", value: `${(session.amount_total / 100).toFixed(2)}€`, inline: true },
                    { name: "Currency:", value: session.currency, inline: true },
                    { name: "Purchase ID:", value: session.id }
                )
                .setThumbnail(userAvatar)
                .setFooter({
                    text: client.user?.username || "CasinoBot",
                    iconURL: client.user?.displayAvatarURL() || null
                })
                .setTimestamp();

            const channelId = process.env.DISCORD_LOG_CHANNEL;
            const channel = await client.channels.fetch(channelId);

            if (channel && channel.isTextBased()) {
                await channel.send({ embeds: [embed] });
                console.log("✅ Embed enviado al canal del bot");
            } else {
                console.error("❌ Canal no encontrado o no es de texto");
            }
        } catch (err) {
            console.error("❌ Error enviando embed:", err);
        }
    }

    res.sendStatus(200);
});

module.exports = router;
