const API_BASE_URL = "http://localhost:8081/server"; // Base URL for API requests

async function apiRequest(endpoint, method = "GET", data = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status >= 400 && response.status < 500) {
                return { success: false, message: errorData.message };
            }
            throw new Error(errorData.message || "Something went wrong");
        }

        return { success: true, data: await response.json() };
    } catch (error) {
        console.error("API Error:", error.message);
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            window.location.href = "/src/client/pages/error.html";
        }
        return { success: false, message: error.message };
    }
}

export { apiRequest };
