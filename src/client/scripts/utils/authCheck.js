// authCheck.js - Ensures user is logged in on every page

// Function to check authentication status
function checkAuth() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        alert("Access denied! Please log in.");
    }
}

// Function to extract the username from the token (for displaying the user's name)
function getUsernameFromToken() {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        // Decode JWT payload (assuming it's in Base64 format)
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.username || null;
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
}

// Automatically check authentication on page load
document.addEventListener("DOMContentLoaded", checkAuth);

export { checkAuth, getUsernameFromToken };
