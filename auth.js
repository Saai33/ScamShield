/* =========================================================
   SCAMSHIELD — AUTHENTICATION MANAGER
   Handles user sign in, sign up, logout, and navbar updates
========================================================= */

const ScamShieldAuth = {
    STORAGE_KEY: "scamshield_user",
    REPORTS_KEY: "scamshield_user_reports",

    // Get current logged-in user
    getUser() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error("Auth storage error:", e);
            return null;
        }
    },

    // Check if authenticated
    isAuthenticated() {
        return !!this.getUser();
    },

    // Login user
    login(email, password, role = "Student") {
        if (!email || !password) {
            return { success: false, message: "Email and password are required." };
        }

        // Generate user object (demo login / standard login)
        const nameFromEmail = email.split("@")[0];
        const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

        const user = {
            id: "USR-" + Math.floor(1000 + Math.random() * 9000),
            name: formattedName,
            email: email,
            role: role || "Student",
            avatar: role === "Recruiter" ? "💼" : "👨‍🎓",
            joinedAt: new Date().toISOString()
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        this.updateNav();
        return { success: true, user };
    },

    // Signup user
    signup(name, email, password, role = "Student") {
        if (!name || !email || !password) {
            return { success: false, message: "All fields are required." };
        }

        const user = {
            id: "USR-" + Math.floor(1000 + Math.random() * 9000),
            name: name.trim(),
            email: email.trim(),
            role: role || "Student",
            avatar: role === "Recruiter" ? "💼" : "👨‍🎓",
            joinedAt: new Date().toISOString()
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        this.updateNav();
        return { success: true, user };
    },

    // Logout
    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateNav();
        window.location.href = "index.html";
    },

    // Update Header Navigation across pages
    updateNav() {
        const user = this.getUser();
        const navContainers = document.querySelectorAll(".nav-glass, .result-nav");

        navContainers.forEach(container => {
            let authSlot = container.querySelector(".auth-slot");

            if (!authSlot) {
                authSlot = document.createElement("div");
                authSlot.className = "auth-slot flex items-center gap-3";
                container.appendChild(authSlot);
            }

            if (user) {
                authSlot.innerHTML = `
                    <div class="user-badge flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-300">
                        <span class="text-sm">${user.avatar || '👤'}</span>
                        <span class="max-w-[100px] truncate">${user.name}</span>
                        <span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-200 font-bold">${user.role}</span>
                    </div>
                    <a href="report-status.html" class="text-xs text-slate-300 hover:text-cyan-400 transition hidden sm:inline-block">My Reports</a>
                    <button type="button" onclick="ScamShieldAuth.logout()" class="px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-xs font-bold hover:bg-red-500/20 transition">
                        Sign Out
                    </button>
                `;
            } else {
                authSlot.innerHTML = `
                    <a href="login.html" class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 transition">
                        Sign In / Sign Up
                    </a>
                `;
            }
        });
    }
};

// Auto update nav on page load
document.addEventListener("DOMContentLoaded", () => {
    ScamShieldAuth.updateNav();
});
