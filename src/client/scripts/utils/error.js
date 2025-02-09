window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled error:", event.reason);
    window.location.href = "error.html";
});
