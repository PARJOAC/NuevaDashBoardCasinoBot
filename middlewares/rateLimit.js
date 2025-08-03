const rateLimit = require('express-rate-limit');

// 📌 Middleware para limitar el número de peticiones por IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 peticiones por IP
    message: 'Too many requests from this IP. Try again later.'
});

module.exports = limiter;
