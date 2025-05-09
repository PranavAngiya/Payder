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

        const experience = form.experience.value.trim();
        const tolerance = form.risk.value.trim();
        const goals = form.goals.value.trim();

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const userData = { full_name: fullName, email, username, password };
        const result_1 = await apiRequest("/auth/signup", "POST", userData);

        const experience_data = { username: username, updated_experience: experience, updated_risk_tolerance: tolerance, updated_goals: goals };
        const result_2 = await apiRequest("/auth/set_sentiment", "POST", experience_data);

        if (result_1.success && result_2.success) {
            alert("Account created successfully! Redirecting to login...");
            window.location.href = "login.html";
        } else {
            // Instead of redirecting, show a message
            alert(`Signup failed => msg_1: ${result_1.message} => msg_2 ${result_2.message}`);
        }
    });
});
