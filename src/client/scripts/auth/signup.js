import { apiRequest } from "../api.js";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const fullName = form.full_name.value.trim();
        const email = form.email.value.trim();
        const username = form.username.value.trim();
        const password = form.password.value.trim();
        const confirmPassword = form.confirm_password.value.trim();

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const userData = { full_name: fullName, email, username, password };

        const result = await apiRequest("/auth/signup", "POST", userData);

        if (result.success) {
            alert("Account created successfully! Redirecting to login...");
            window.location.href = "login.html";
        } else {
            // Instead of redirecting, show a message
            alert(`Signup failed: ${result.message}`);
        }
    });
});
