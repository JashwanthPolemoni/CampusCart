/* =========================================================
   CAMPUSCART - PROFILE PAGE LOGIC (DYNAMIC LOGGED-IN USER)
   ========================================================= */

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const loggedUser = window.CampusCart.getUser();
        if (!loggedUser || !loggedUser.isLoggedIn) {
            window.location.href = "login.html";
            return;
        }

        const email = loggedUser.email || '';
        let currentUser = loggedUser;

        if (email) {
            const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
            if (res.ok) {
                const fetched = await res.json();
                if (fetched && fetched.name) {
                    currentUser = fetched;
                }
            }
        }

        const avatarText = currentUser.avatar || (currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "CC");

        document.getElementById("profAvatar").textContent = avatarText;
        document.getElementById("profName").textContent = currentUser.name || "Student Name";
        document.getElementById("profEmail").textContent = currentUser.email || "-";
        document.getElementById("profCollege").textContent = currentUser.college || "College of Engineering";
        document.getElementById("profDept").textContent = currentUser.department || "Computer Science & Engineering";
        document.getElementById("profYear").textContent = currentUser.year || "3rd Year";
        document.getElementById("profPhone").textContent = currentUser.phone || "+91 98765 43210";

        const allProducts = await window.CampusCart.fetchProducts();
        document.getElementById("statListings").textContent = allProducts.length;

        const favData = await window.CampusCart.fetchFavorites();
        document.getElementById("statFavs").textContent = favData.favorites ? favData.favorites.length : 0;

        const threads = await window.CampusCart.fetchMessages();
        document.getElementById("statChats").textContent = threads ? threads.length : 0;
    } catch (err) {
        console.error("Profile load error:", err);
    }
});
