const sendSMS = async (phone_number, message) => {
    // Format: changes 09171234567 into 639171234567
    const formatted = phone_number.replace(/^0/, '63').replace(/\s+/g, '');
    console.log(`Phone num: ${phone_number}\nFormatted: ${formatted}`);

    const params = new URLSearchParams({
        api_token:    process.env.IPROG_API_TOKEN,
        message:      message,
        phone_number: formatted
    });

    const response = await fetch('https://www.iprogsms.com/api/v1/sms_messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'SMS sending failed');
    }

    return data;
};

module.exports = { sendSMS };