const mySqlPool = require('../config/database');
const { getSessionUser } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/passwords');

async function changePassword(req, res) {
	const sessionUser = getSessionUser(req);

	if (!sessionUser || !sessionUser.staff_id) {
		return res.status(401).json({ message: 'Authentication required.' });
	}

	const oldPassword = String(req.body.oldPassword || '');
	const newPassword = String(req.body.newPassword || '');
	const confirmPassword = String(req.body.confirmPassword || '');

	if (!oldPassword || !newPassword || !confirmPassword) {
		return res.status(400).json({ message: 'All password fields are required.' });
	}

	if (newPassword.length < 6) {
		return res.status(400).json({ message: 'New password must be at least 6 characters.' });
	}

	if (newPassword !== confirmPassword) {
		return res.status(400).json({ message: 'New passwords do not match.' });
	}

	if (oldPassword === newPassword) {
		return res.status(400).json({ message: 'New password must be different from your current password.' });
	}

	try {
		const [rows] = await mySqlPool.query(
			'SELECT password FROM staff WHERE staff_id = ? LIMIT 1',
			[sessionUser.staff_id]
		);

		if (rows.length === 0) {
			return res.status(404).json({ message: 'User account not found.' });
		}

		const currentPassword = rows[0].password;
		const passwordMatch = verifyPassword(oldPassword, currentPassword);

		if (!passwordMatch) {
			return res.status(401).json({ message: 'Current password is incorrect.' });
		}

		const hashedPassword = hashPassword(newPassword);

		await mySqlPool.query(
			'UPDATE staff SET password = ? WHERE staff_id = ?',
			[hashedPassword, sessionUser.staff_id]
		);

		return res.json({ message: 'Password updated successfully.' });
	} catch (err) {
		console.error('Change password error:', err);
		return res.status(500).json({ message: 'Failed to update password.' });
	}
}

module.exports = {
	changePassword
};
