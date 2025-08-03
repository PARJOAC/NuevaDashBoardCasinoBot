const Guild = require("../models/Guild");
const client = require("../config/botClient");
const { getUserGuilds } = require("../utils/discordOAuth");
const languagesConfig = require("../config/languages.json");
const betLevelsConfig = require("../config/betLevels.json");

const userCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

function isValidMultiplier(value) {
  return /^\d+(\.\d{1,2})?$/.test(value);
}

// Lista de idiomas válidos
const allowedLanguages = languagesConfig.languages.map((lang) => lang.code);

module.exports.getServers = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.accessToken) {
      return res.status(401).json({ servers: [] });
    }

    const guilds = await getUserGuilds(req.session.user.accessToken);
    req.session.user.guilds = guilds.filter(
      (g) => g.owner || (BigInt(g.permissions || "0") & 0x8n) === 0x8n
    );

    const servers = await Promise.all(
      req.session.user.guilds.map(async (g) => {
        const guildDB = await Guild.findOne({ guildId: g.id });
        return {
          id: g.id,
          name: g.name,
          icon: g.icon,
          owner: g.owner,
          isBotInServer: !!client.guilds.cache.get(g.id),
          premium: guildDB ? guildDB.premium : false,
        };
      })
    );

    res.json({ servers, clientId: process.env.DISCORD_CLIENT_ID });
  } catch (err) {
    console.error("❌ Error getting servers:", err.message);
    res.status(500).json({ servers: [] });
  }
};

module.exports.getServerSettings = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.accessToken) {
      return res.redirect("/auth/login");
    }

    const guild = req.session.user.guilds.find((g) => g.id === req.params.id);
    if (!guild) return res.redirect("/dashboard");

    const botGuild = client.guilds.cache.get(guild.id);
    if (!botGuild) return res.redirect("/dashboard");

    const channels = botGuild.channels.cache
      .filter((c) => c.type === 0)
      .map((c) => ({ id: c.id, name: c.name }));

    let guildDB = await Guild.findOne({ guildId: guild.id });
    if (!guildDB) guildDB = await Guild.create({ guildId: guild.id });

    res.render("server-settings", {
      guild: { ...guildDB.toObject(), lang: guildDB.lang || "en" },
      serverName: guild.name,
      clientId: process.env.DISCORD_CLIENT_ID,
      channels,
      csrfToken: req.csrfToken(),
      languages: languagesConfig.languages,
      betLevels: betLevelsConfig.levels,
    });
  } catch (err) {
    console.error("❌ Error loading settings:", err.message);
    res.redirect("/dashboard");
  }
};

module.exports.updateServerSettings = async (req, res) => {
  try {
    const guildId = req.params.id;
    const botGuild = client.guilds.cache.get(guildId);

    if (!botGuild) {
      return res.json({
        success: false,
        message: "❌ The bot is not in this server.",
      });
    }

    const userGuild = req.session.user.guilds.find((g) => g.id === guildId);
    if (!userGuild || !(userGuild.owner || (BigInt(userGuild.permissions) & 0x8n) === 0x8n)) {
      return res.json({
        success: false,
        message: "❌ You don't have permission to edit this server.",
      });
    }

    // ✅ Validar idioma
    if (!req.body.lang || !allowedLanguages.includes(req.body.lang)) {
      return res.json({ success: false, message: "❌ Invalid language selected." });
    }

    // ✅ Validar campos numéricos básicos
    const intFields = [
      "initBalance", "maxBet", "minBet", "xpLevel",
      "initBalloon", "initMobile", "initBike", "initCar", "initCastle", "initLevel",
      "rewardWork", "rewardDaily", "rewardWeekly"
    ];

    for (const field of intFields) {
      const value = Number(req.body[field]);
      if (!Number.isInteger(value) || value < 0) {
        return res.json({
          success: false,
          message: `❌ Field "${field}" must be a positive integer.`,
        });
      }
    }

    const maxBet = Number(req.body.maxBet);
    const minBet = Number(req.body.minBet);

    if (minBet > maxBet) {
      return res.json({
        success: false,
        message: "❌ Min Bet cannot be greater than Max Bet.",
      });
    }

    // ✅ Validar multiplicador
    if (!isValidMultiplier(req.body.initMultiplier) || Number(req.body.initMultiplier) < 0) {
      return res.json({
        success: false,
        message: "❌ Multiplier must be a non-negative number with up to 2 decimals.",
      });
    }

    // ✅ Validar apuestas máximas por nivel
    for (let i = 0; i < betLevelsConfig.levels.length; i++) {
      const field = betLevelsConfig.levels[i].field;
      const value = Number(req.body[field]);

      if (!Number.isInteger(value) || value < 0) {
        return res.json({
          success: false,
          message: `❌ Field "${field}" must be a positive integer.`,
        });
      }

      // 🔹 No puede superar la apuesta máxima general
      if (value > maxBet) {
        return res.json({
          success: false,
          message: `❌ Max Bet for Level ${betLevelsConfig.levels[i].level} cannot exceed Max Bet.`,
        });
      }

      // 🔹 Debe ser >= al nivel anterior
      if (i > 0) {
        const prevField = betLevelsConfig.levels[i - 1].field;
        if (value < Number(req.body[prevField])) {
          return res.json({
            success: false,
            message: `❌ Max Bet for Level ${betLevelsConfig.levels[i].level} must be >= Level ${betLevelsConfig.levels[i - 1].level}.`,
          });
        }
      }
    }

    // ✅ MinBet no puede ser mayor que ninguna MaxBet de nivel
    const maxBets = betLevelsConfig.levels.map((lvl) => Number(req.body[lvl.field]));
    if (maxBets.some((max) => minBet > max)) {
      return res.json({
        success: false,
        message: "❌ Min Bet cannot be greater than any Max Bet level.",
      });
    }

    // ✅ Guardar en la base de datos
    const updatedGuild = await Guild.findOneAndUpdate(
      { guildId },
      {
        $set: {
          lang: req.body.lang,
          economyType: req.body.economyType === "on",
          commandChannel: req.body.commandChannel || null,
          logChannel: req.body.logChannel || null,
          initBalance: Number(req.body.initBalance),
          maxBet,
          minBet,
          xpLevel: Number(req.body.xpLevel),
          initBalloon: Number(req.body.initBalloon),
          initMobile: Number(req.body.initMobile),
          initBike: Number(req.body.initBike),
          initCar: Number(req.body.initCar),
          initCastle: Number(req.body.initCastle),
          initMultiplier: Number(req.body.initMultiplier),
          initLevel: Number(req.body.initLevel),
          rewardWork: Number(req.body.rewardWork),
          rewardDaily: Number(req.body.rewardDaily),
          rewardWeekly: Number(req.body.rewardWeekly),
          levelStatus: req.body.levelStatus === "on",
          itemStatus: req.body.itemStatus === "on",
          // 🔹 Guardar dinámicamente todas las apuestas máximas
          ...Object.fromEntries(betLevelsConfig.levels.map((lvl) => [lvl.field, Number(req.body[lvl.field])])),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: "✅ Settings saved successfully!",
      guild: updatedGuild,
    });
  } catch (err) {
    console.error("❌ Error updating settings:", err.message);
    return res.json({
      success: false,
      message: "❌ An unexpected error occurred while saving.",
    });
  }
};

const { playerGuild } = require("../models/Players");
const fetch = require("node-fetch");

async function getDiscordUser(userId) {
  const cached = userCache.get(userId);

  // ✅ Si está en caché y no ha caducado, lo usamos
  if (cached && Date.now() - cached.lastFetch < CACHE_TTL) {
    return cached;
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    });

    if (!res.ok) throw new Error(`Discord API error: ${res.status}`);
    const userData = await res.json();

    const userInfo = {
      username: userData.username || `Unknown (${userId})`,
      avatar: userData.avatar
        ? `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`,
      lastFetch: Date.now(),
    };

    userCache.set(userId, userInfo);
    return userInfo;
  } catch (err) {
    console.error(`❌ Error fetching user ${userId}:`, err.message);
    return {
      username: `Unknown (${userId})`,
      avatar: `https://cdn.discordapp.com/embed/avatars/0.png`,
      lastFetch: Date.now(),
    };
  }
}

// ✅ Obtener jugadores del servidor
module.exports.getServerPlayers = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.accessToken) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // ✅ Comprobar permisos de admin
    const guild = req.session.user.guilds.find((g) => g.id === req.params.id);
    if (!guild || !(guild.owner || (BigInt(guild.permissions) & 0x8n) === 0x8n)) {
      return res.status(403).json({ success: false, message: "No permission" });
    }

    const PlayerGuild = await playerGuild(req.params.id);
    const search = req.query.search?.toLowerCase() || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // 🔹 Primero obtenemos TODOS los jugadores (paginados)
    const totalPlayers = await PlayerGuild.countDocuments();
    const players = await PlayerGuild.find().skip(skip).limit(limit);

    // 🔹 Enriquecer con username y avatar
    const enrichedPlayers = await Promise.all(
      players.map(async (p) => {
        const userInfo = await getDiscordUser(p.userId);
        return {
          ...p.toObject(),
          username: userInfo.username,
          avatar: userInfo.avatar,
        };
      })
    );

    // 🔹 Filtrar por nombre o ID
    const filteredPlayers = search
      ? enrichedPlayers.filter(
          (p) =>
            p.userId.includes(search) ||
            p.username.toLowerCase().includes(search)
        )
      : enrichedPlayers;

    res.json({
      page,
      totalPages: Math.ceil(totalPlayers / limit),
      totalPlayers,
      players: filteredPlayers,
    });
  } catch (err) {
    console.error("❌ Error getting players:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Actualizar jugador del servidor
module.exports.updateServerPlayer = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.accessToken) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const guild = req.session.user.guilds.find((g) => g.id === req.params.id);
    if (!guild || !(guild.owner || (BigInt(guild.permissions) & 0x8n) === 0x8n)) {
      return res.status(403).json({ success: false, message: "No permission" });
    }

    const PlayerGuild = await playerGuild(req.params.id);
    const player = await PlayerGuild.findOne({ userId: req.params.userId });

    if (!player) {
      return res.status(404).json({ success: false, message: "Player not found" });
    }

    const blockedFields = ["battlePass"];
    const updatedData = {};

    for (const [key, value] of Object.entries(req.body)) {
      if (key.startsWith("last")) continue;
      if (blockedFields.some(f => key.startsWith(f))) continue;

      if (key.includes(".")) {
        const [parent, child] = key.split(".");
        updatedData[parent] = { ...(updatedData[parent] || {}), [child]: value };
      } else {
        updatedData[key] = value;
      }
    }

    await PlayerGuild.updateOne({ userId: req.params.userId }, { $set: updatedData });

    res.json({ success: true, message: "✅ Player updated successfully" });
  } catch (err) {
    console.error("❌ Error updating player:", err.message);
    res.status(500).json({ success: false, message: "Error updating player" });
  }
};
