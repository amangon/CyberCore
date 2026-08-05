require("dotenv").config();

const apis = [
  "VIRUSTOTAL_API_KEY",
  "ABUSEIPDB_API_KEY",
  "GOOGLE_SAFE_BROWSING_API_KEY",
  "OTX_API_KEY",
  "SHODAN_API_KEY",
  "URLSCAN_API_KEY",
  "NVD_API_KEY",
  "IPINFO_API_KEY",
  "ABUSECH_API_KEY",
  "GREYNOISE_API_KEY",
  "PULSEDIVE_API_KEY",
  "CRIMINALIP_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

apis.forEach((key) => {
  if (process.env[key]) {
    console.log(`✅ ${key}`);
  } else {
    console.log(`❌ ${key} MISSING`);
  }
});