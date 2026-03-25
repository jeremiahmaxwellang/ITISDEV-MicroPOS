(function () {
	'use strict';

	const form = document.getElementById('changePasswordForm');
	const messageEl = document.getElementById('formMessage');
	const saveButton = document.getElementById('savePasswordBtn');
	const exportInsertsButton = document.getElementById('exportInsertsBtn');
	const oldPasswordInput = document.getElementById('oldPassword');
	const newPasswordInput = document.getElementById('newPassword');
	const confirmPasswordInput = document.getElementById('confirmPassword');

	let currentUser = null;

	function renderIcons() {
		if (window.lucide && typeof window.lucide.createIcons === 'function') {
			window.lucide.createIcons();
		}
	}

	function setMessage(text, type) {
		if (!messageEl) return;

		if (!text) {
			messageEl.hidden = true;
			messageEl.textContent = '';
			messageEl.className = 'settings-message';
			return;
		}

		messageEl.hidden = false;
		messageEl.textContent = text;
		messageEl.className = `settings-message ${type === 'success' ? 'success' : 'error'}`;
	}

	function setLoading(isLoading) {
		if (!saveButton) return;

		saveButton.disabled = isLoading;
		const label = saveButton.querySelector('span');
		if (label) {
			label.textContent = isLoading ? 'Updating...' : 'Update Password';
		}
	}

	function updateHeaderUser(user) {
		const nameEl = document.getElementById('headerUserName');
		const roleEl = document.getElementById('headerUserRole');
		const avatarEl = document.getElementById('headerUserAvatar');

		if (!nameEl || !roleEl || !avatarEl || !user) return;

		const firstName = String(user.first_name || '').trim();
		const lastName = String(user.last_name || '').trim();
		const fullName = `${firstName} ${lastName}`.trim() || user.email || 'Staff User';
		const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim() || fullName.slice(0, 2).toUpperCase();

		nameEl.textContent = fullName;
		roleEl.textContent = user.role || 'Employee';
		avatarEl.textContent = initials;
	}

	async function loadCurrentUser() {
		try {
			const response = await fetch('/session');
			const payload = await response.json().catch(() => ({ message: 'Invalid session response.' }));

			if (!response.ok) {
				window.location.href = '/';
				return null;
			}

			currentUser = payload.user || null;
			if (currentUser) {
				localStorage.setItem('user', JSON.stringify(currentUser));
				updateHeaderUser(currentUser);
			}

			return currentUser;
		} catch (err) {
			console.error('Failed to load session user:', err);
			window.location.href = '/';
			return null;
		}
	}

	function validateForm() {
		const oldPassword = String(oldPasswordInput.value || '');
		const newPassword = String(newPasswordInput.value || '');
		const confirmPassword = String(confirmPasswordInput.value || '');

		if (!oldPassword || !newPassword || !confirmPassword) {
			return 'All password fields are required.';
		}

		if (newPassword.length < 6) {
			return 'New password must be at least 6 characters.';
		}

		if (newPassword !== confirmPassword) {
			return 'New passwords do not match.';
		}

		if (oldPassword === newPassword) {
			return 'New password must be different from your current password.';
		}

		return '';
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setMessage('', 'error');

		const validationMessage = validateForm();
		if (validationMessage) {
			setMessage(validationMessage, 'error');
			return;
		}

		setLoading(true);

		try {
			const response = await fetch('/settings/api/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					oldPassword: oldPasswordInput.value,
					newPassword: newPasswordInput.value,
					confirmPassword: confirmPasswordInput.value
				})
			});

			const payload = await response.json().catch(() => ({ message: 'Unable to process server response.' }));

			if (!response.ok) {
				setMessage(payload.message || 'Failed to update password.', 'error');
				return;
			}

			form.reset();
			setMessage(payload.message || 'Password updated successfully.', 'success');
		} catch (err) {
			console.error('Password update failed:', err);
			setMessage('Unable to update password right now.', 'error');
		} finally {
			setLoading(false);
			renderIcons();
		}
	}

	async function handleExportInserts() {
		if (!exportInsertsButton) return;

		exportInsertsButton.disabled = true;
		const label = exportInsertsButton.querySelector('span');
		if (label) label.textContent = 'Exporting...';

		try {
			const response = await fetch('/settings/api/export-inserts');
			if (!response.ok) {
				const payload = await response.json().catch(() => ({ message: 'Failed to export inserts SQL.' }));
				throw new Error(payload.message || 'Failed to export inserts SQL.');
			}

			const blob = await response.blob();
			const disposition = response.headers.get('Content-Disposition') || '';
			const match = disposition.match(/filename="([^"]+)"/i);
			const fileName = match && match[1] ? match[1] : 'inserts.sql';

			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);

			setMessage('Inserts SQL exported successfully.', 'success');
		} catch (err) {
			console.error('Export inserts failed:', err);
			setMessage(err.message || 'Failed to export inserts SQL.', 'error');
		} finally {
			exportInsertsButton.disabled = false;
			if (label) label.textContent = 'Export Inserts SQL';
			renderIcons();
		}
	}

	async function init() {
		renderIcons();
		await loadCurrentUser();

		if (form) {
			form.addEventListener('submit', handleSubmit);
		}

		if (exportInsertsButton) {
			exportInsertsButton.addEventListener('click', handleExportInserts);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
