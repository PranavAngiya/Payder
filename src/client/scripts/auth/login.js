import {apiRequest} from "../api.js";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = form.username.value.trim();
        const password = form.password.value.trim();

        const userData = { username, password };

        const result = await apiRequest("/auth/login", "POST", userData);

        if (result.success && result.data.token) {
            localStorage.setItem("token", result.data.token);
            window.location.href = "userHome.html";
        } else if (result.message === "Incorrect password" || result.message === "User not found") {
            alert("Incorrect Username or Password!");
            return;
        } 
        else {
            alert(`Login failed: ${result.message}`);
        }
    });


});