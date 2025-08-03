const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const csrf = require("csurf");
const dotenv = require("dotenv");
const path = require("path");
const passport = require("passport");

dotenv.config();
const app = express();

mongoose.connect(process.env.MONGODB_URI);

// Configuración de vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); // ✅ Necesario para leer datos de formularios
app.use(express.json()); // ✅ Necesario para leer JSON enviado con fetch

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
        cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
    })
);

require("./config/discord")(passport);
app.use(passport.initialize());
app.use(passport.session());

// ✅ CSRF DESPUÉS de session y parseadores
app.use(csrf());

// ✅ Valores disponibles en todas las vistas
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.locals.user = req.session.user || null;
    next();
});

// Rutas
app.use("/", require("./routes/auth"));
app.use("/dashboard", require("./routes/dashboard"));
app.use("/servers", require("./routes/servers"));
app.use("/privacy", require("./routes/privacy"));
app.use("/terms", require("./routes/terms"));

// Función utilitaria
function formatNumber(num) {
    if (num >= 1_000_000_000) return `+${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `+${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `+${(num / 1_000).toFixed(1)}K`;
    return `+${num}`;
}

// Página principal
const client = require("./config/botClient");
app.get("/", async (req, res) => {
    try {
        const guilds = client.guilds.cache;
        let totalPlayers = 0;

        const guildData = guilds.map((guild) => {
            const memberCount = guild.memberCount || 0;
            totalPlayers += memberCount;

            return {
                name: guild.name,
                icon:
                    guild.iconURL({ size: 64, extension: "png" }) ||
                    "https://cdn.discordapp.com/embed/avatars/0.png",
                players: memberCount,
            };
        });

        const topServers = guildData.sort((a, b) => b.players - a.players).slice(0, 3);

        res.render("index", {
            user: req.session.user || null,
            totalPlayers: formatNumber(totalPlayers),
            totalServers: formatNumber(guilds.size),
            topServers,
        });
    } catch (err) {
        console.error("❌ Error cargando estadísticas:", err.message);
        res.render("index", {
            user: req.session.user || null,
            totalPlayers: "+ 0",
            totalServers: "+ 0",
            topServers: [],
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`🚀 Dashboard iniciado en http://localhost:${PORT}`)
);
