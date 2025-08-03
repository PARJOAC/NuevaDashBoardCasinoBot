const express = require("express");
const passport = require("passport");
const router = express.Router();
const { getUserGuilds } = require("../utils/discordOAuth");
const UserLogin = require("../models/UserLogin");

// 🔹 Start login with Discord
router.get("/auth/login", passport.authenticate("discord"));

// 🔹 Callback after login
router.get(
    "/auth/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    async (req, res) => {
        try {
            // ✅ Find user in the database
            const user = await UserLogin.findById(req.user);

            if (!user) {
                console.error("❌ User not found after login.");
                return res.redirect("/");
            }

            // ✅ Save user and token in session
            req.session.user = user.toObject();
            req.session.user.accessToken = user.accessToken;

            // ✅ Get the list of user guilds
            const allGuilds = await getUserGuilds(user.accessToken);

            // ✅ Filter only guilds where user is admin or owner
            const adminGuilds = allGuilds.filter(
                (g) => g.owner || (BigInt(g.permissions || "0") & 0x8n) === 0x8n
            );

            // ✅ Save filtered guilds in the session
            req.session.user.guilds = adminGuilds;

            console.log("✅ Authenticated user:", req.session.user.username);
            res.redirect("/dashboard");
        } catch (err) {
            console.error("❌ Error in callback:", err.message);
            res.redirect("/");
        }
    }
);

// 🔹 Logout
router.get("/auth/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
