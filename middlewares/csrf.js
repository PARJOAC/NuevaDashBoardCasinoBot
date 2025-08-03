// 📌 Middleware para añadir token CSRF a las vistas
function csrfMiddleware(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
}

module.exports = csrfMiddleware;
