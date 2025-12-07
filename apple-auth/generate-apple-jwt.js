const fs = require("fs");
const jwt = require("jsonwebtoken");

// FILL THESE IN
const TEAM_ID = "85W9PB4NKX"; // Example: 85W9PB4NKX
const CLIENT_ID = "com.maxplus.soraaiwatermarkremoverandadder"; 
const KEY_ID = "L6GZ698BT7"; // Example: A1B2C3D4E5

// Load private key
const privateKey = fs.readFileSync(__dirname + "/AuthKey_" + KEY_ID + ".p8");

// Set expiration (6 months max)
const now = Math.floor(Date.now() / 1000);
const exp = now + 86400 * 180; // 180 days

// Create JWT
const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: now,
    exp: exp,
    aud: "https://appleid.apple.com",
    sub: CLIENT_ID,
  },
  privateKey,
  {
    algorithm: "ES256",
    keyid: KEY_ID
  }
);

console.log("\n===== APPLE JWT SECRET =====\n");
console.log(token);
console.log("\n============================\n");