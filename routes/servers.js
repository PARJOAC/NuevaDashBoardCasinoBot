const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/auth");
const serverController = require("../controllers/serverController");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// 📌 List of servers where the user is an admin
router.get("/", isAuthenticated, serverController.getServers);

// 📌 Server settings page
router.get("/:id/settings", isAuthenticated, serverController.getServerSettings);

// 📌 Save configuration changes
router.post("/:id/settings", isAuthenticated, serverController.updateServerSettings);

// 📌 Start Premium purchase with Stripe
router.get("/:id/buy-premium", isAuthenticated, async (req, res) => {
    try {
        const guild = req.session.user.guilds.find((g) => g.id === req.params.id);
        const guildName = guild ? guild.name : "Unknown Server";
        const avatarUrl = req.user.avatar
            ? `https://cdn.discordapp.com/avatars/${req.user.discordId}/${req.user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: "CasinoBot Premium",
                            description: "Gives you access to ALL commands to take your experience to the next level!"
                        },
                        unit_amount: 399, // Price in cents (€3.99)
                        recurring: "subscription"
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

// 📌 Premium success page (solo muestra página, no activa premium)
router.get("/:id/premium-success", isAuthenticated, async (req, res) => {
    const sessionId = req.query.session_id;

    try {
        if (!sessionId) return res.redirect("/dashboard");

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (
            session.payment_status === "paid" &&
            session.metadata.guildId === req.params.id
        ) {
            return res.render("premium-success", { guildId: req.params.id });
        }

        res.redirect("/dashboard");
    } catch (err) {
        console.error("❌ Error checking payment:", err.message);
        res.redirect("/dashboard");
    }
});

// 📌 Get players from a server
router.get("/:id/players", isAuthenticated, serverController.getServerPlayers);

// 📌 Update a player
router.patch("/:id/players/:userId", isAuthenticated, serverController.updateServerPlayer);

module.exports = router;
