// 📌 Middleware para comprobar si el usuario está autenticado
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    return res.redirect('/auth/login');
}

module.exports = { isAuthenticated };
