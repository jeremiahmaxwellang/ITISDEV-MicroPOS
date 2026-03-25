const STORE_OWNER_ROLE = "Store Owner";
const STAFF_ROLES = new Set(["Store Owner", "Employee"]);

function getSessionUser(req) {
	return req.session && req.session.user ? req.session.user : null;
}

function isStaffUser(user) {
	return Boolean(user && user.staff_id && STAFF_ROLES.has(user.role));
}

function isStoreOwner(user) {
	return Boolean(user && user.staff_id && user.role === STORE_OWNER_ROLE);
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

function requireStoreOwnerSession(req, res, next) {
	const user = getSessionUser(req);
	if (isStoreOwner(user)) {
		return next();
	}

	if (!isStaffUser(user)) {
		if (req.path.startsWith("/api/") || req.path === "/session") {
			return res.status(401).json({ message: "Authentication required." });
		}

		return res.redirect("/");
	}

	if (req.path.startsWith("/api/")) {
		return res.status(403).json({ message: "Store owner access required." });
	}

	return res.redirect("/pos");
}

module.exports = {
	getSessionUser,
	isStoreOwner,
	isStaffUser,
	requireStaffSession,
	requireStoreOwnerSession
};