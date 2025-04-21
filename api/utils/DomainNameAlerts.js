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

const sendDomainNameAlert = (emailId, data)=>{
    try{
        const expiryDate = new Date(data.expiryDate).toUTCString();
        const today = new Date();
        const isExpired = data.expiryDays <= 0;
        
        const subject = isExpired ? 'Domain Name has Expired!' : 'Domain Name Expiry approaching!';
        const statusMessage = isExpired 
            ? `The Domain Name for your service monitored by UpTimeDock has expired ${Math.abs(data.expiryDays)} days ago.`
            : `The Domain Name for your service monitored by UpTimeDock will expire in ${data.expiryDays} days.`;
        
        const info = transporter.sendMail({
            from : process.env.GMAIL_USER,
            to : emailId,
            subject : subject,
            text : `
Dear ${data.firstName},
${statusMessage}
The domain ${isExpired ? 'expired' : 'will expire'} on ${expiryDate}.
${isExpired ? 'Please renew your domain name immediately to restore service.' : 'Please renew your domain name to avoid any service disruption.'}

Monitor Id : ${data.monitorID}
Service URL : ${data.monitorURL}

Visit the incident tab on your UpTimeDock profile for more.

Thankyou...
Team UpTimeDock`
        }).catch(error => {
            console.error("Email sending failed:", error.message);
            if (error.code === 'EENVELOPE' && error.responseCode === 550) {
                console.error("Gmail daily sending limit exceeded. Consider upgrading your Gmail plan or switching to a dedicated email service.");
            }
        });
        console.log("Alert email sent to : ", data.firstName);
    }
    catch(error){
        console.log("Error sending email", error);
    }
};

module.exports = sendDomainNameAlert;