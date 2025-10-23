/**
 * Simple Authentication System for NeoSharX
 * Handles login/logout state and token management
 */

class AuthSystem {
  constructor() {
    this.apiBaseUrl = "http://localhost:8001/api/auth";
    this.currentUser = this.getCurrentUser();
    this.authToken = this.getAuthToken();
  }

  getCurrentUser() {
    try {
      const userData = localStorage.getItem("currentUser");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("currentUser");
      return null;
    }
  }

  getAuthToken() {
    return localStorage.getItem("authToken");
  }

  setAuthData(user, token) {
    console.log("AuthSystem: Setting auth data", {
      user,
      token: token ? "exists" : "null",
    });
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("authToken", token);
    this.currentUser = user;
    this.authToken = token;
    this.updateUI();

    // Dispatch event to notify other components
    document.dispatchEvent(
      new CustomEvent("authStateChanged", {
        detail: { user, authenticated: true },
      })
    );
  }

  clearAuthData() {
    console.log("AuthSystem: Clearing auth data");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    this.currentUser = null;
    this.authToken = null;
    this.updateUI();

    // Dispatch event to notify other components
    document.dispatchEvent(
      new CustomEvent("authStateChanged", {
        detail: { user: null, authenticated: false },
      })
    );
  }

  isAuthenticated() {
    const hasAuth = !!(this.currentUser && this.authToken);
    console.log("AuthSystem: Checking authentication", {
      hasUser: !!this.currentUser,
      hasToken: !!this.authToken,
      isAuth: hasAuth,
      userDetails: this.currentUser,
    });
    return hasAuth;
  }

  async login(username, password) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await response.json();

      // Create user object with proper format
      const user = {
        id: data.user_id,
        username: username,
        email: data.email || `${username}@neosharx.com`,
        phone_verified: data.phone_verified || false,
      };

      this.setAuthData(user, data.token);

      return { success: true, user: user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  }

  // LinkedIn login support
  async loginWithLinkedIn(code) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/auth/linkedin/callback/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "LinkedIn login failed");
      }

      const data = await response.json();

      const user = {
        id: data.user_id,
        username: data.username || data.name,
        email: data.email,
        phone_verified: data.phone_verified || false,
        login_method: "linkedin",
      };

      this.setAuthData(user, data.token);
      return { success: true, user: user };
    } catch (error) {
      console.error("LinkedIn login error:", error);
      return { success: false, error: error.message };
    }
  }

  // Google login support
  async loginWithGoogle(code) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/google/callback/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Google login failed");
      }

      const data = await response.json();

      const user = {
        id: data.user_id,
        username: data.username || data.name,
        email: data.email,
        phone_verified: data.phone_verified || false,
        login_method: "google",
      };

      this.setAuthData(user, data.token);
      return { success: true, user: user };
    } catch (error) {
      console.error("Google login error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get LinkedIn login URL
  async getLinkedInLoginUrl() {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/auth/linkedin/login-url/`
      );
      const data = await response.json();
      return data.login_url;
    } catch (error) {
      console.error("Error getting LinkedIn login URL:", error);
      return null;
    }
  }

  // Get Google login URL
  async getGoogleLoginUrl() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/google/login-url/`);
      const data = await response.json();
      return data.login_url;
    } catch (error) {
      console.error("Error getting Google login URL:", error);
      return null;
    }
  }

  logout() {
    this.clearAuthData();
    // Don't redirect - just update UI and reload comments
    if (window.commentSystem) {
      window.commentSystem.refreshAuth();
      window.commentSystem.loadComments();
    }
    // Dispatch custom event for other components to listen
    document.dispatchEvent(new CustomEvent("authStateChanged"));
  }

  updateUI() {
    // Update login/logout buttons across the site
    this.updateAuthButtons();
    this.updateUserDisplays();
  }

  updateAuthButtons() {
    const loginBtns = document.querySelectorAll('[data-auth="login-btn"]');
    const logoutBtns = document.querySelectorAll('[data-auth="logout-btn"]');
    const userBtns = document.querySelectorAll('[data-auth="user-btn"]');

    if (this.isAuthenticated()) {
      loginBtns.forEach((btn) => (btn.style.display = "none"));
      logoutBtns.forEach((btn) => (btn.style.display = "inline-block"));
      userBtns.forEach((btn) => (btn.style.display = "inline-block"));
    } else {
      loginBtns.forEach((btn) => (btn.style.display = "inline-block"));
      logoutBtns.forEach((btn) => (btn.style.display = "none"));
      userBtns.forEach((btn) => (btn.style.display = "none"));
    }
  }

  updateUserDisplays() {
    const userNameElements = document.querySelectorAll('[data-user="name"]');
    const userEmailElements = document.querySelectorAll('[data-user="email"]');

    if (this.currentUser) {
      userNameElements.forEach(
        (el) => (el.textContent = this.currentUser.username || "User")
      );
      userEmailElements.forEach(
        (el) => (el.textContent = this.currentUser.email || "")
      );
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Token ${this.authToken}`;
    }

    return headers;
  }

  // Validate authentication token with backend
  async validateAuth() {
    if (!this.authToken) {
      console.log("AuthSystem: No token to validate");
      this.clearAuthData();
      return false;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/profile/`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.log("AuthSystem: Token validation failed");
        this.clearAuthData();
        return false;
      }

      const userData = await response.json();
      console.log("AuthSystem: Token validated successfully", userData);

      // Update user data if needed
      if (!this.currentUser || this.currentUser.id !== userData.user_id) {
        const user = {
          id: userData.user_id,
          username: userData.username || userData.name,
          email: userData.email,
          phone_verified: userData.phone_verified || false,
          login_method: this.currentUser?.login_method || "validated",
        };
        this.setAuthData(user, this.authToken);
      }

      return true;
    } catch (error) {
      console.error("AuthSystem: Error validating token:", error);
      this.clearAuthData();
      return false;
    }
  }

  // Quick login function for testing
  async quickLogin(username = "testuser", password = "testpass123") {
    const result = await this.login(username, password);
    if (result.success) {
      console.log("Logged in successfully:", result.user);
      return true;
    } else {
      console.error("Login failed:", result.error);
      return false;
    }
  }
}

// Create global auth instance
window.authSystem = new AuthSystem();

// Initialize auth UI when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  window.authSystem.updateUI();

  // Bind logout functionality
  document.addEventListener("click", function (e) {
    if (
      e.target.hasAttribute("data-auth") &&
      e.target.getAttribute("data-auth") === "logout-btn"
    ) {
      e.preventDefault();
      window.authSystem.logout();
    }
  });
});

// Quick login function for testing - remove in production
window.quickLogin = async function () {
  // Create a test user for demonstration
  const result = await window.authSystem.quickLogin();
  if (result) {
    location.reload(); // Reload to update all comment systems
  }
};

window.quickLogout = function () {
  window.authSystem.logout();
};
