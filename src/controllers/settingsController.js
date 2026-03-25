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

async function exportInsertsSql(req, res) {
	const sessionUser = getSessionUser(req);

	if (!sessionUser || !sessionUser.staff_id) {
		return res.status(401).json({ message: 'Authentication required.' });
	}

	const tablesInInsertOrder = [
		'staff',
		'customers',
		'products',
		'product_batches',
		'reported_products',
		'transactions',
		'transaction_orders',
		'debts',
		'debt_transactions',
		'payments',
		'payment_proofs'
	];

	const truncateOrder = [
		'debt_transactions',
		'payments',
		'transaction_orders',
		'debts',
		'transactions',
		'reported_products',
		'product_batches',
		'payment_proofs',
		'products',
		'customers',
		'staff'
	];

	const connection = await mySqlPool.getConnection();

	try {
		const [dbRows] = await connection.query('SELECT DATABASE() AS db');
		const dbName = dbRows[0] && dbRows[0].db ? dbRows[0].db : 'micropos_db';

		const lines = [];
		lines.push(`USE \`${dbName}\`;`, '');
		lines.push('-- Auto-generated from live database contents', `-- Generated at: ${new Date().toISOString()}`, '');
		lines.push('SET FOREIGN_KEY_CHECKS = 0;');

		for (const table of truncateOrder) {
			lines.push(`TRUNCATE TABLE \`${table}\`;`);
		}

		lines.push('SET FOREIGN_KEY_CHECKS = 1;', '');

		for (const table of tablesInInsertOrder) {
			const [cols] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
			const columnNames = cols.map((col) => col.Field);
			const [rows] = await connection.query(`SELECT * FROM \`${table}\``);

			lines.push(`-- ${table.toUpperCase()}`);

			if (!rows.length) {
				lines.push(`-- No rows in \`${table}\``, '');
				continue;
			}

			const columnSql = columnNames.map((name) => `\`${name}\``).join(', ');
			const valueRows = rows.map((row) => {
				const values = columnNames.map((name) => {
					const value = row[name];
					return value === null || value === undefined ? 'NULL' : connection.escape(value);
				}).join(', ');

				return `(${values})`;
			});

			lines.push(`INSERT INTO \`${table}\` (${columnSql}) VALUES`);
			lines.push(`${valueRows.join(',\n')};`, '');
		}

		const content = lines.join('\n');
		const fileName = `inserts-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.sql`;

		res.setHeader('Content-Type', 'application/sql; charset=utf-8');
		res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
		return res.status(200).send(content);
	} catch (err) {
		console.error('exportInsertsSql error:', err);
		return res.status(500).json({ message: 'Failed to export inserts SQL.' });
	} finally {
		connection.release();
	}
}

module.exports = {
	changePassword,
	exportInsertsSql
};
