const STAFF_ROLES = new Set(["Store Owner", "Employee"]);

function getSessionUser(req) {
	return req.session && req.session.user ? req.session.user : null;
}

function isStaffUser(user) {
	return Boolean(user && user.staff_id && STAFF_ROLES.has(user.role));
}

function requireStaffSession(req, res, next) {
	const user = getSessionUser(req);
	if (isStaffUser(user)) {
		return next();
	}

	if (req.path.startsWith("/api/") || req.path === "/session") {
		return res.status(401).json({ message: "Authentication required." });
	}

	return res.redirect("/");
}

module.exports = {
	getSessionUser,
	isStaffUser,
	requireStaffSession
};