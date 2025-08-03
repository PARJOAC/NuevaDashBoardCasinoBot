// 📌 authController.js
// Controlador para autenticación con Discord

module.exports = {
    login: (req, res) => {
        res.redirect('/auth/login');
    },

    callback: (req, res) => {
        req.session.user = req.user;
        res.redirect('/dashboard');
    },

    logout: (req, res) => {
        req.session.destroy(() => res.redirect('/'));
    }
};
