const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/auth");
const serverController = require("../controllers/serverController");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Guild = require("../models/Guild");

const client = require("../config/botClient");
const { EmbedBuilder } = require("discord.js");

// ✅ List of servers where the user is an admin
router.get("/", isAuthenticated, serverController.getServers);

// ✅ Server settings page
router.get("/:id/settings", isAuthenticated, serverController.getServerSettings);

// ✅ Save configuration changes
router.post("/:id/settings", isAuthenticated, serverController.updateServerSettings);

// ✅ Start Premium purchase with Stripe
router.get("/:id/buy-premium", isAuthenticated, async (req, res) => {
    try {
        const guild = req.session.user.guilds.find((g) => g.id === req.params.id);
        const guildName = guild ? guild.name : "Unknown Server";
        const avatarUrl = req.user.avatar
            ? `https://cdn.discordapp.com/avatars/${req.user.discordId}/${req.user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"], // "paypal" is not supported by Stripe Checkout
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: "CasinoBot Premium - Gives you access to ALL commands to take your experience to the next level!",
                        },
                        unit_amount: 799, // Price in cents (€7.99)
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.BASE_URL}/servers/${req.params.id}/premium-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/dashboard`,
            metadata: {
                guildId: req.params.id,
                guildName,
                userId: req.user.id,
                userName: req.user.username,
                userAvatar: avatarUrl,
            },
        });

        res.redirect(session.url);
    } catch (err) {
        console.error("❌ Error creating Stripe session:", err.message);
        res.redirect("/dashboard");
    }
});

// ✅ Route to display the success page after payment
// ⚠️ This route NO LONGER activates premium, it only shows the page if the session was paid
router.get("/:id/premium-success", isAuthenticated, async (req, res) => {
    const sessionId = req.query.session_id;

    try {
        if (!sessionId) return res.redirect("/dashboard");

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Check if the session is paid and corresponds to the correct server
        if (
            session.payment_status === "paid" &&
            session.metadata.guildId === req.params.id
        ) {
            return res.render("premium-success", { guildId: req.params.id });
        }

        // If not paid or mismatched, redirect
        res.redirect("/dashboard");
    } catch (err) {
        console.error("❌ Error checking payment:", err.message);
        res.redirect("/dashboard");
    }
});

// ✅ Webhook to receive Stripe payment confirmations
// ⚠️ Must be declared BEFORE any bodyParser.json() in your main app
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const sig = req.headers["stripe-signature"];
        let event;

        try {
            // Validate that the event really came from Stripe
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error("❌ Error verifying webhook:", err.message);
            return res.sendStatus(400);
        }

        // ✅ If checkout session was successfully completed
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const guildId = session.metadata.guildId;

            try {
                await Guild.findOneAndUpdate(
                    { guildId },
                    { $set: { vipServer: true } },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                console.log(`✅ Premium activated for server ${guildId}`);
            } catch (err) {
                console.error("❌ Error activating premium in DB:", err.message);
            }

            // ✅ SEND EMBED WITH THE BOT
            try {
                const embed = new EmbedBuilder()
                    .setTitle("🛍️ PURCHASE SUCCESS")
                    .setColor(0x2b2d31)
                    .addFields(
                        {
                            name: "Server Name:",
                            value: `${session.metadata.guildName} (${session.metadata.guildId})`,
                        },
                        {
                            name: "User:",
                            value: `${session.metadata.userName} (${session.metadata.userId})`,
                        },
                        { name: "Purchase:", value: "Premium" },
                        { name: "Quantity:", value: "1", inline: true },
                        {
                            name: "Date:",
                            value: new Date(session.created * 1000).toUTCString(),
                            inline: true,
                        },
                        {
                            name: "Total Price:",
                            value: `${(session.amount_total / 100).toFixed(2)}€`,
                            inline: true,
                        },
                        { name: "Currency:", value: session.currency, inline: true },
                        { name: "Purchase ID:", value: session.id }
                    )
                    .setThumbnail(session.metadata.userAvatar) // 🔹 Buyer's actual avatar
                    .setFooter({
                        text: client.user.username,
                        iconURL: client.user.displayAvatarURL(),
                    })
                    .setTimestamp();

                // ID of the channel where you want to send it
                const channelId = process.env.DISCORD_LOG_CHANNEL;
                const channel = await client.channels.fetch(channelId);

                if (channel && channel.isTextBased()) {
                    await channel.send({ embeds: [embed] });
                    console.log("✅ Embed sent to the bot channel");
                } else {
                    console.error("❌ Could not find the channel or it's not text-based");
                }
            } catch (err) {
                console.error("❌ Error sending embed with the bot:", err);
            }
        }

        res.sendStatus(200);
    }
);

// 🔹 Get players from a server
router.get("/:id/players", isAuthenticated, serverController.getServerPlayers);

// 🔹 Update a player
router.patch(
    "/:id/players/:userId",
    isAuthenticated,
    serverController.updateServerPlayer
);

module.exports = router;
