// routes/stripeWebhook.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Guild = require("../models/Guild");
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

        try {
            // ✅ Actualizar base de datos
            await Guild.findOneAndUpdate(
                { guildId },
                { $set: { vipServer: true } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            console.log(`✅ Premium activado para ${guildId}`);
        } catch (err) {
            console.error("❌ Error guardando en DB:", err.message);
        }

        // ✅ Enviar embed al canal de Discord
        try {
            const embed = new EmbedBuilder()
                .setTitle("🛍️ PURCHASE SUCCESS")
                .setColor(0x2b2d31)
                .addFields(
                    { name: "Server Name:", value: `${session.metadata.guildName} (${guildId})` },
                    { name: "User:", value: `${session.metadata.userName} (${session.metadata.userId})` },
                    { name: "Purchase:", value: "Premium" },
                    { name: "Quantity:", value: "1", inline: true },
                    { name: "Date:", value: new Date(session.created * 1000).toUTCString(), inline: true },
                    { name: "Total Price:", value: `${(session.amount_total / 100).toFixed(2)}€`, inline: true },
                    { name: "Currency:", value: session.currency, inline: true },
                    { name: "Purchase ID:", value: session.id }
                )
                .setThumbnail(session.metadata.userAvatar)
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
