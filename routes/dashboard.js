const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/auth");
const client = require("../config/botClient");
const Guild = require("../models/Guild");

router.get("/", isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user.guilds) return res.redirect("/auth/login");

    const adminGuilds = req.session.user.guilds.filter(
      (g) => g.owner || (BigInt(g.permissions) & 0x8n) === 0x8n
    );

    const servers = await Promise.all(
      adminGuilds.map(async (g) => {
        const guildDB = await Guild.findOne({ guildId: g.id });
        return {
          id: g.id,
          name: g.name,
          icon: g.icon,
          isBotInServer: client.guilds.cache.has(g.id),
          premium: guildDB ? guildDB.vipServer : false,
        };
      })
    );

    res.render("dashboard", {
      servers,
      clientId: process.env.DISCORD_CLIENT_ID,
    });
  } catch (err) {
    console.error("❌ Error loading dashboard:", err.message);
    res.render("dashboard", {
      servers: [],
      clientId: process.env.DISCORD_CLIENT_ID,
    });
  }
});

module.exports = router;
