/* =========================================================
   CAMPUSCART - LOGIN SCRIPT (CONNECTED TO API)
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const demoLogin = document.getElementById("demoLogin");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (!email || !password) {
                showLoginMessage("Please enter email and password.", "error");
                return;
            }

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (data.success && data.user) {
                    window.CampusCart.setUser({ ...data.user, isLoggedIn: true });
                    showLoginMessage("Login successful! Redirecting...", "success");
                    const redirectUrl = new URLSearchParams(window.location.search).get("redirect") || "home.html";
                    setTimeout(() => { window.location.href = redirectUrl; }, 1000);
                } else {
                    showLoginMessage(data.error || "Login failed.", "error");
                }
            } catch (err) {
                showLoginMessage("Server connection error.", "error");
            }
        });
    }

    if (demoLogin) {
        demoLogin.addEventListener("click", function () {
            const demoUser = {
                id: "usr_demo",
                name: "Jashwanth Kumar",
                email: "jashwanth@college.edu",
                college: "College of Engineering",
                department: "Computer Science & Engineering",
                year: "3rd Year",
                phone: "+91 98765 43210",
                avatar: "JK",
                isLoggedIn: true
            };
            window.CampusCart.setUser(demoUser);
            showLoginMessage("Logging in with Demo Account...", "success");
            const redirectUrl = new URLSearchParams(window.location.search).get("redirect") || "home.html";
            setTimeout(() => { window.location.href = redirectUrl; }, 1000);
        });
    }
});

function showLoginMessage(text, type) {
    let msgBox = document.getElementById("loginMessage");
    if (!msgBox) {
        msgBox = document.createElement("div");
        msgBox.id = "loginMessage";
        msgBox.style.marginTop = "16px";
        msgBox.style.padding = "10px";
        msgBox.style.borderRadius = "8px";
        msgBox.style.textAlign = "center";
        msgBox.style.fontWeight = "600";
        const card = document.querySelector(".auth-card");
        if (card) card.appendChild(msgBox);
    }
    msgBox.textContent = text;
    msgBox.style.background = type === "success" ? "#dcfce7" : "#fee2e2";
    msgBox.style.color = type === "success" ? "#166534" : "#991b1b";
}