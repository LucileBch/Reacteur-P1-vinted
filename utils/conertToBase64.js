// ---------- CONVERT TO BASE64 Utils ----------
// Function : convert file to format base64
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// Export function
module.exports = convertToBase64;
