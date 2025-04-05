import { apiRequest } from "../api.js";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = form.name.value.trim();
        const dollar_bills = form.dollar_bills.value.trim();

        const userData = { username: name, dollar_bills: dollar_bills };
        const result_1 = await apiRequest("/setting/update_balance", "POST", userData);

        if (result_1.success) {
            alert("Account balance updated successfully...");
        } else {
            // Instead of redirecting, show a message
            alert(`Update balance failed: ${result_1.message}`);
        }
    });
});