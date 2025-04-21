const whois = require('whois');

async function checkDomainNameExpiry(url) {
    const domain = url.replace(/(https?:\/\/)?(www\.)?/, '').split('/')[0]; // Extract domain

    return new Promise((resolve, reject) => {
        const options = {
            server: 'whois.iana.org',  // Use IANA's WHOIS server as default
            follow: 3,                 // Follow up to 3 referrals
            timeout: 10000            // 10 second timeout
        };

        whois.lookup(domain, options, (err, data) => {
            if (err) {
                console.error("Error fetching WHOIS data:", err);
                reject(new Error(`Could not fetch domain information: ${err.message}`));
                return;
            }

            if (!data) {
                reject(new Error(`No WHOIS data found for domain: ${domain}`));
                return;
            }

            // Try multiple date formats and patterns
            const expiryMatch = data.match(/Expiry Date:\s*(.+)/i) || 
                              data.match(/Registrar Registration Expiration Date:\s*(.+)/i) ||
                              data.match(/Registry Expiry Date:\s*(.+)/i) ||
                              data.match(/Expiration Date:\s*(.+)/i) ||
                              data.match(/Expires:\s*(.+)/i);
            
            if (expiryMatch) {
                let dateStr = expiryMatch[1].trim();
                
                // Handle different date formats
                let expiryDate;
                
                // Try parsing ISO 8601 format first
                if (dateStr.includes('T')) {
                    expiryDate = new Date(dateStr);
                } else {
                    // Remove timezone abbreviations that Date.parse can't handle
                    dateStr = dateStr.replace(/\s*[A-Z]{3,4}\s*$/, '');
                    // Try parsing with explicit UTC
                    expiryDate = new Date(dateStr + ' UTC');
                }
                
                if (!isNaN(expiryDate.getTime())) {
                    console.log(`Domain ${domain} expiry date parsed:`, expiryDate.toISOString());
                    resolve(expiryDate);
                } else {
                    reject(new Error(`Invalid expiry date format for domain: ${domain}, date string: ${dateStr}`));
                }
            } else {
                reject(new Error(`Could not find expiry date in WHOIS data for domain: ${domain}`));
            }
        });
    });
}

module.exports = checkDomainNameExpiry;