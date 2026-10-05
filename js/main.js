/* =========================================================
   CAMPUSCART
   Main JavaScript
   ========================================================= */


/* =========================
   1. PAGE LOAD
   ========================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("CampusCart loaded successfully!");

    setupSmoothNavigation();
    setupProductHearts();

});


/* =========================
   2. SMOOTH NAVIGATION
   ========================= */

function setupSmoothNavigation() {

    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = this.getAttribute("href");

            if (targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth"
                });

            }

        });

    });

}


/* =========================
   3. PRODUCT HEARTS
   ========================= */

function setupProductHearts() {

    const hearts = document.querySelectorAll(".product-bottom span");

    hearts.forEach(function (heart) {

        heart.style.cursor = "pointer";

        heart.addEventListener("click", function () {

            if (this.textContent === "❤️") {

                this.textContent = "💙";

                showMessage("Added to favorites!");

            } else {

                this.textContent = "❤️";

                showMessage("Removed from favorites!");

            }

        });

    });

}


/* =========================
   4. MESSAGE / TOAST
   ========================= */

function showMessage(message) {

    const existingMessage = document.querySelector(".campuscart-toast");

    if (existingMessage) {
        existingMessage.remove();
    }


    const toast = document.createElement("div");

    toast.className = "campuscart-toast";

    toast.textContent = message;


    toast.style.position = "fixed";
    toast.style.bottom = "25px";
    toast.style.right = "25px";

    toast.style.padding = "13px 20px";

    toast.style.background = "#172033";
    toast.style.color = "#ffffff";

    toast.style.borderRadius = "10px";

    toast.style.fontSize = "14px";
    toast.style.fontWeight = "600";

    toast.style.boxShadow =
        "0 10px 30px rgba(0, 0, 0, 0.15)";

    toast.style.zIndex = "9999";

    toast.style.opacity = "0";
    toast.style.transform = "translateY(15px)";

    toast.style.transition =
        "opacity 0.25s ease, transform 0.25s ease";


    document.body.appendChild(toast);


    setTimeout(function () {

        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";

    }, 10);


    setTimeout(function () {

        toast.style.opacity = "0";
        toast.style.transform = "translateY(15px)";

        setTimeout(function () {
            toast.remove();
        }, 250);

    }, 2000);

}