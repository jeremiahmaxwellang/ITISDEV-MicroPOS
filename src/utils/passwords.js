const crypto = require('crypto');

function hashPassword(password) {
    const salt = crypto.randomBytes(8).toString('hex');
    const hash = crypto.scryptSync(password, salt, 32).toString('hex');
    return `s$${salt}$${hash}`;
}

function verifyPassword(inputPassword, storedPassword) {
    if (!storedPassword) {
        return false;
    }

    if (storedPassword.startsWith('s$')) {
        const parts = storedPassword.split('$');
        if (parts.length !== 3) {
            return false;
        }

        const salt = parts[1];
        const originalHash = parts[2];
        const computedHash = crypto.scryptSync(inputPassword, salt, 32).toString('hex');

        return crypto.timingSafeEqual(
            Buffer.from(originalHash, 'hex'),
            Buffer.from(computedHash, 'hex')
        );
    }

    return inputPassword === storedPassword;
}

module.exports = {
    hashPassword,
    verifyPassword
};