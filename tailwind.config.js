/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",           // Scans HTML files in the root (e.g., chatRooms.html)
    "./pages/*.html"      // Scans HTML files in the /pages directory (e.g., login.html, profilesetup.html)
  ],
  theme: {
    extend: {
      // Optional: Add custom theme extensions here
      colors: {
        "whatsapp-green": "#25D366" // Matches your custom .whatsapp-green class
      }
    }
  },
  plugins: []
};