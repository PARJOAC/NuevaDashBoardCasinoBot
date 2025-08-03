const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/auth");
const serverController = require("../controllers/serverController");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Guild = require("../models/Guild");

// ✅ List of servers where the user is an admin
router.get("/", isAuthenticated, serverController.getServers);

// ✅ Server settings page
router.get("/:id/settings", isAuthenticated, serverController.getServerSettings);

// ✅ Save configuration changes
router.post("/:id/settings", isAuthenticated, serverController.updateServerSettings);

// ✅ Start Premium purchase with Stripe
router.get("/:id/buy-premium", isAuthenticated, async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"], // "paypal" no es compatible con Stripe Checkout
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: "CasinoBot Premium - Acceso completo a todos los comandos",
                        },
                        unit_amount: 799, // Precio en céntimos (7,99 €)
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.BASE_URL}/servers/${req.params.id}/premium-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/dashboard`,
            metadata: {
                guildId: req.params.id, // Guardamos el ID del servidor para usarlo en el webhook
                userId: req.user.id, // Opcional: para saber quién ha pagado
            },
        });

        res.redirect(session.url);
    } catch (err) {
        console.error("❌ Error creando sesión de Stripe:", err.message);
        res.redirect("/dashboard");
    }
});

// ✅ Ruta para mostrar página de éxito tras el pago
// ⚠️ Esta ruta YA NO activa el premium, solo muestra la página si la sesión fue pagada
router.get("/:id/premium-success", isAuthenticated, async (req, res) => {
    const sessionId = req.query.session_id;

    try {
        if (!sessionId) return res.redirect("/dashboard");

        // Recuperamos la sesión desde Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Verificamos que la sesión esté pagada y corresponda al servidor correcto
        if (
            session.payment_status === "paid" &&
            session.metadata.guildId === req.params.id
        ) {
            return res.render("premium-success", { guildId: req.params.id });
        }

        // Si no está pagada o no coincide, redirigimos
        res.redirect("/dashboard");
    } catch (err) {
        console.error("❌ Error comprobando pago:", err.message);
        res.redirect("/dashboard");
    }
});

// ✅ Webhook para recibir confirmaciones de pago de Stripe
// ⚠️ Debe declararse ANTES que cualquier bodyParser.json() en tu app principal
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const sig = req.headers["stripe-signature"];
        let event;

        try {
            // Validamos que el evento provenga realmente de Stripe
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error("❌ Error verificando webhook:", err.message);
            return res.sendStatus(400);
        }

        // ✅ Si la sesión de checkout se completó con éxito
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const guildId = session.metadata.guildId;

            try {
                await Guild.findOneAndUpdate(
                    { guildId },
                    { $set: { vipServer: true } },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                console.log(`✅ Premium activado para el servidor ${guildId}`);
            } catch (err) {
                console.error("❌ Error activando premium en DB:", err.message);
            }
        }

        res.sendStatus(200);
    }
);

// 🔹 Obtener jugadores de un servidor
router.get("/:id/players", isAuthenticated, serverController.getServerPlayers);

// 🔹 Actualizar un jugador
router.patch("/:id/players/:userId", isAuthenticated, serverController.updateServerPlayer);

module.exports = router;
