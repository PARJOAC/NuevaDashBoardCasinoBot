const DiscordStrategy = require("passport-discord").Strategy;
const UserLogin = require("../models/UserLogin");

module.exports = (passport) => {
    passport.use(
        new DiscordStrategy(
            {
                clientID: process.env.DISCORD_CLIENT_ID,
                clientSecret: process.env.DISCORD_CLIENT_SECRET,
                callbackURL: process.env.DISCORD_CALLBACK_URL,
                scope: ["identify", "guilds"],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Buscar usuario en la base de datos
                    let user = await UserLogin.findOne({ discordId: profile.id });

                    if (!user) {
                        user = await UserLogin.create({
                            discordId: profile.id,
                            username: profile.username,
                            avatar: profile.avatar,
                            accessToken,
                            refreshToken,
                        });
                    } else {
                        // Actualizar datos del usuario si ya existe
                        user.accessToken = accessToken;
                        user.refreshToken = refreshToken;
                        user.username = profile.username;
                        user.avatar = profile.avatar;
                        await user.save();
                    }

                    // ✅ Guardamos solo el ID del usuario en sesión
                    return done(null, user.id);
                } catch (err) {
                    console.error("❌ Error en estrategia Discord:", err);
                    return done(err, null);
                }
            }
        )
    );

    // ✅ Guardar solo el ID en la sesión
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    // ✅ Recuperar el usuario completo de la base de datos
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await UserLogin.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
