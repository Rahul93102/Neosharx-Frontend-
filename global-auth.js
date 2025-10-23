// Global Authentication Manager
if (!window.GlobalAuthManager) {
  class GlobalAuthManager {
    constructor() {
      this.init();
    }

    init() {
      // Check auth state on page load
      this.updateAuthUI();

      // Listen for auth state changes
      document.addEventListener("authStateChanged", (e) => {
        console.log("GlobalAuthManager: Auth state changed", e.detail);
        this.updateAuthUI();
      });

      // Listen for storage changes (from other tabs)
      window.addEventListener("storage", (e) => {
        if (e.key === "authToken" || e.key === "currentUser") {
          console.log("GlobalAuthManager: Storage changed from other tab");
          this.updateAuthUI();
        }
      });
    }

    isLoggedIn() {
      const token = localStorage.getItem("authToken");
      const user = localStorage.getItem("currentUser");
      return !!(token && user);
    }

    getCurrentUser() {
      try {
        const userStr = localStorage.getItem("currentUser");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.error("Error parsing currentUser:", e);
        return null;
        return null;
      }
    }

    getAuthToken() {
      return localStorage.getItem("authToken");
    }

    updateAuthUI() {
      const isLoggedIn = this.isLoggedIn();
      const user = this.getCurrentUser();

      console.log("GlobalAuthManager: Updating UI", {
        isLoggedIn,
        user: user
          ? { id: user.id, username: user.username, email: user.email }
          : null,
      });

      // Update desktop navigation
      this.updateDesktopNav(isLoggedIn, user);

      // Update mobile navigation
      this.updateMobileNav(isLoggedIn, user);

      // Dispatch event for other components
      document.dispatchEvent(
        new CustomEvent("authUIUpdated", {
          detail: { isLoggedIn, user },
        })
      );
    }

    updateDesktopNav(isLoggedIn, user) {
      // Find the existing login button
      const existingBtn = document.getElementById("desktop-login-btn");

      if (existingBtn) {
        // Replace the existing button
        const authBtn = document.createElement("a");
        authBtn.id = "desktop-login-btn"; // Keep the same ID
        authBtn.className =
          "ml-3 px-4 py-1.5 font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105";

        if (isLoggedIn) {
          // Logged in - show logout button
          authBtn.href = "#";
          authBtn.className +=
            " bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700";
          authBtn.innerHTML = `
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Logout
          </span>
        `;
          authBtn.addEventListener("click", (e) => {
            e.preventDefault();
            this.logout();
          });
        } else {
          // Logged out - show login button
          authBtn.href = "signup.html";
          authBtn.className +=
            " bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800";
          authBtn.innerHTML = `
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
            </svg>
            Login
          </span>
        `;
        }

        // Replace the existing button
        existingBtn.parentNode.replaceChild(authBtn, existingBtn);
      }
    }

    updateMobileNav(isLoggedIn, user) {
      // Find the existing mobile login button
      const existingBtn = document.getElementById("mobile-login-btn");

      if (existingBtn) {
        if (isLoggedIn) {
          // Replace with user info and logout button
          const authContainer = document.createElement("div");
          authContainer.className = "border-t border-gray-200 pt-4 mt-2";
          authContainer.innerHTML = `
          <div class="px-4 py-2 text-sm text-gray-600">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                ${user.username ? user.username[0].toUpperCase() : "U"}
              </div>
              <div>
                <div class="font-medium text-gray-800">${
                  user.username || "User"
                }</div>
                <div class="text-xs text-gray-500">${user.email || ""}</div>
              </div>
            </div>
          </div>
          <button class="mobile-logout-btn w-full text-left px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-all duration-300 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Logout
          </button>
        `;

          // Add logout handler
          authContainer
            .querySelector(".mobile-logout-btn")
            .addEventListener("click", () => {
              this.logout();
            });

          // Replace the button with the container
          existingBtn.parentNode.replaceChild(authContainer, existingBtn);
        } else {
          // Replace with login button
          const loginBtn = document.createElement("a");
          loginBtn.id = "mobile-login-btn";
          loginBtn.href = "signup.html";
          loginBtn.className =
            "mt-4 mx-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full shadow-lg text-center hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 block";
          loginBtn.innerHTML = `
          <span class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
            </svg>
            Login / Sign Up
          </span>
        `;

          // Replace the existing button
          existingBtn.parentNode.replaceChild(loginBtn, existingBtn);
        }
      }
    }

    logout() {
      console.log("GlobalAuthManager: Logging out");

      // Clear auth data
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("google_state");
      localStorage.removeItem("linkedin_state");

      // Dispatch logout event
      document.dispatchEvent(
        new CustomEvent("authStateChanged", {
          detail: { action: "logout" },
        })
      );

      // Redirect to home page
      window.location.href = "index.html";
    }

    login(token, user) {
      console.log("GlobalAuthManager: Logging in", { user });

      // Store auth data
      localStorage.setItem("authToken", token);
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Dispatch login event
      document.dispatchEvent(
        new CustomEvent("authStateChanged", {
          detail: { action: "login", user },
        })
      );
    }
  }

  // Initialize global auth manager when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.globalAuthManager = new GlobalAuthManager();
    });
  } else {
    window.globalAuthManager = new GlobalAuthManager();
  }

  // Make the class globally available
  window.GlobalAuthManager = GlobalAuthManager;
}
