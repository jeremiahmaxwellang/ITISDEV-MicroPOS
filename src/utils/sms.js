const sendSMS = async (phone_number, message) => {
    // Format: changes 09171234567 into 639171234567
    const formatted = phone_number.replace(/^0/, '63').replace(/\s+/g, '');
    const logPrefix = '[SMS API]';
    console.log(`${logPrefix} Sending SMS to: ${phone_number} (formatted: ${formatted})`);
    console.log(`${logPrefix} Message: ${message}`);

    const params = new URLSearchParams({
        api_token:    process.env.IPROG_API_TOKEN,
        message:      message,
        phone_number: formatted
    });

    let response, data;
    try {
        response = await fetch('https://www.iprogsms.com/api/v1/sms_messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        data = await response.json();
        if (!response.ok) {
            console.error(`${logPrefix} Error sending SMS:`, data);
            throw new Error(data.message || 'SMS sending failed');
        }
        console.log(`${logPrefix} SMS sent successfully. API response:`, data);
    } catch (err) {
        console.error(`${logPrefix} Exception during SMS send:`, err);
        throw err;
    }
    return data;
};

module.exports = { sendSMS };