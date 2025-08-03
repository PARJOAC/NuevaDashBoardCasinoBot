// 📌 dashboardController.js
// Renderiza la página principal del dashboard

module.exports = {
    getDashboard: (req, res) => {
        // Renderiza la vista de dashboard con el usuario en sesión
        res.render('dashboard', { user: req.session.user, servers: [] });
    }
};
