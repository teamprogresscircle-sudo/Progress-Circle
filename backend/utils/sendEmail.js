const { BrevoClient } = require('@getbrevo/brevo');

const sendEmail = async (options) => {
    const brevo = new BrevoClient({
        apiKey: process.env.BREVO_API_KEY || process.env.EMAIL_PASS,
    });

    try {
        const result = await brevo.transactionalEmails.sendTransacEmail({
            subject: options.subject,
            htmlContent: options.html,
            sender: { name: "Progress Circle", email: process.env.EMAIL_USER },
            to: [{ email: options.email }]
        });
        console.log('API called successfully. Returned data: ' + JSON.stringify(result));
    } catch (error) {
        console.error('Error calling Brevo API:', error);
        throw error;
    }
};

module.exports = sendEmail;
