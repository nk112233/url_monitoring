const tls = require("tls");
// const https = require("https");
const Incident = require("../models/incidentModel");
const SSLCheck = require("../models/sslCheckModel");
const User = require('../models/userModel');
const sslAlerts = require('../utils/SSLalert');

// Function to fetch SSL certificate details
const fetchSSLDetails = (url) => {
    return new Promise((resolve, reject) => {
        try{
            const hostname = new URL(url).hostname;
            const port = 443;
      
            const options = { host: hostname, port, servername: hostname };
            const socket = tls.connect(options, () => {
                const certificate = socket.getPeerCertificate();
                socket.end();
        
                if(!certificate || Object.keys(certificate).length === 0){
                    return reject(new Error("No SSL certificate found for this domain"));
                }
                
                resolve({
                    issuer: certificate.issuer?.O || "Unknown Issuer",
                    validFrom: new Date(certificate.valid_from),
                    validTo: new Date(certificate.valid_to),
                    protocol: "TLS",
                });
            });
            socket.on("error", (err) => {
                reject(new Error(`SSL verification failed: ${err.message}`));
            });
        }
        catch (error) {
            reject(new Error(`Invalid URL or SSL verification failed: ${error.message}`));
        }
    });
};

//function to check SSL certificate expiry and create incident
const checkSSLDetails = async (url, notifyExpiration, monitorId, userId) => {
    try {
        const sslData = await fetchSSLDetails(url);

        // If monitorId is not provided, this is just a validation check
        if (!monitorId) {
            return sslData;
        }

        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const today = new Date();
        const differenceInMilliseconds = sslData.validTo - today;
        const differenceInDays = Math.floor(differenceInMilliseconds / millisecondsPerDay);

        await SSLCheck.create({
            ...sslData,
            monitor: monitorId,
            notifyExpiration: notifyExpiration,
        });

        if (differenceInDays <= parseInt(notifyExpiration)) {
            await Incident.create({
                monitor: monitorId,
                user: userId,
                cause: `SSL certificate expires in ${differenceInDays} days`,
            });

            const user = await User.findById(userId);
            const data = {
                firstName : user.firstName,
                monitorID : monitorId,
                monitorURL : url,
                expiryDays : differenceInDays,
                expiryDate: sslData.validTo
            }
            sslAlerts(user.email, data); //send alerts in email
        }
        return sslData;
    } 
    catch(error) {
        console.error('SSL Check Error:', error);
        throw error; // Re-throw the error to be handled by the controller
    }
};

module.exports = {
    checkSSLDetails,
};
