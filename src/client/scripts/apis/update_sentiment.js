import { apiRequest } from "../api.js";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = form.username.value.trim();
        const updated_risk_tolerance = form.updated_risk_tolerance.value.trim();
        const updated_experience = form.updated_experience.value.trim();
        const updated_goals = form.updated_goals.value.trim();

        const userData = { username: username, updated_risk_tolerance: updated_risk_tolerance, updated_experience: updated_experience, updated_goals: updated_goals };
        const result_1 = await apiRequest("/setting/update_sentiment", "POST", userData);

        if (result_1.success) {
            alert("Sentiment updated successfully...");
        } else {
            // Instead of redirecting, show a message
            alert(`Update balance failed: ${result_1.message}`);
        }
    });
});