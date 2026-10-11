/* =========================================================
   CAMPUSCART - REGISTER SCRIPT (CONNECTED TO API)
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("registerEmail").value.trim();
            const college = document.getElementById("college").value.trim();
            const course = document.getElementById("course").value;
            const year = document.getElementById("year").value;
            const password = document.getElementById("registerPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const terms = document.getElementById("terms").checked;

            if (name.length < 3) {
                showRegisterMessage("Please enter your full name.", "error");
                return;
            }
            if (!email || !college || !course || !year) {
                showRegisterMessage("Please fill in all required student details.", "error");
                return;
            }
            if (password.length < 6) {
                showRegisterMessage("Password must be at least 6 characters.", "error");
                return;
            }
            if (password !== confirmPassword) {
                showRegisterMessage("Passwords do not match.", "error");
                return;
            }
            if (!terms) {
                showRegisterMessage("Please accept the terms and conditions.", "error");
                return;
            }

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, college, department: course, year })
                });

                const data = await res.json();
                if (data.success && data.user) {
                    window.CampusCart.setUser({ ...data.user, isLoggedIn: true });
                    showRegisterMessage("Account created successfully in MongoDB! Redirecting...", "success");
                    setTimeout(() => { window.location.href = "home.html"; }, 1000);
                } else {
                    showRegisterMessage(data.error || "Registration failed.", "error");
                }
            } catch (err) {
                showRegisterMessage("Server connection error.", "error");
            }
        });
    }
});

function showRegisterMessage(text, type) {
    let msgBox = document.getElementById("registerMessage");
    if (!msgBox) {
        msgBox = document.createElement("div");
        msgBox.id = "registerMessage";
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