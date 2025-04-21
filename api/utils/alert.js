const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service : 'Gmail',
    secure : false,
    auth : {
        user : process.env.GMAIL_USER,
        pass : process.env.GMAIL_PASSWORD
    }
});

const sendAlerts = (emailId, data) => {
    try {
        const currentDate = new Date().toLocaleString();
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: emailId,
            subject: 'Website Status Alert',
            text: `
Dear ${data.firstName},
            
We regret to inform you that your website monitored by UpTimeDock is currently down.

Monitor Id : ${data.monitorID}
Service URL : ${data.monitorURL}
Status Code : ${data.statusCode}
Time        : ${currentDate}

After ${data.attempts} attempt(s), we were unable to connect to your service.

You'll be notified when the service is back online.

Thank you,
Team UpTimeDock`
        };
    
        transporter.sendMail(mailOptions)
        .then(() => {
            console.log('Alert email sent to : ', data.firstName);
        })
        .catch(error => {
            console.error("Email sending failed:", error.message);
            if (error.code === 'EENVELOPE' && error.responseCode === 550) {
                console.error("Gmail daily sending limit exceeded. Consider upgrading your Gmail plan or switching to a dedicated email service.");
            }
        });
    } catch (error) {
        console.log('Error sending email: ', error);
    }
};

module.exports = sendAlerts;