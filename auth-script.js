// Authentication JavaScript
class AuthManager {
  constructor() {
    this.apiBaseUrl = "http://127.0.0.1:8000/api/auth";
    console.log(
      "AuthManager: Initializing with API base URL:",
      this.apiBaseUrl
    );
    this.init();
  }

  init() {
    console.log("AuthManager: Setting up event listeners and modals");
    this.setupEventListeners();
    this.setupModals();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    // Signup form
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", (e) => this.handleSignup(e));
    }

    // Phone form (for login OTP)
    const phoneForm = document.getElementById("phoneForm");
    if (phoneForm) {
      phoneForm.addEventListener("submit", (e) => this.handleSendOtp(e));
    }

    // OTP form
    const otpForm = document.getElementById("otpForm");
    if (otpForm) {
      otpForm.addEventListener("submit", (e) => this.handleVerifyOtp(e));
    }

    // Resend OTP button
    const resendOtpBtn = document.getElementById("resendOtp");
    if (resendOtpBtn) {
      resendOtpBtn.addEventListener("click", (e) => this.handleResendOtp(e));
    }

    // Forgot password form
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener("submit", (e) =>
        this.handleForgotPassword(e)
      );
    }

    // Reset password form
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    if (resetPasswordForm) {
      resetPasswordForm.addEventListener("submit", (e) =>
        this.handleResetPassword(e)
      );
    }

    // Resend reset OTP button
    const resendResetOtpBtn = document.getElementById("resendResetOtp");
    if (resendResetOtpBtn) {
      resendResetOtpBtn.addEventListener("click", (e) =>
        this.handleResendResetOtp(e)
      );
    }

    // Forgot username recover form
    const recoverUsernameForm = document.getElementById("recoverUsernameForm");
    if (recoverUsernameForm) {
      recoverUsernameForm.addEventListener("submit", (e) =>
        this.handleRecoverUsername(e)
      );
    }

    // LinkedIn login button
    const linkedinLoginBtn = document.getElementById("linkedinLoginBtn");
    if (linkedinLoginBtn) {
      linkedinLoginBtn.addEventListener("click", (e) =>
        this.handleLinkedInLogin(e)
      );
    }

    // Google login button
    const googleLoginBtn = document.getElementById("googleLoginBtn");
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener("click", (e) =>
        this.handleGoogleLogin(e)
      );
    } // Recover username form (OTP verification)
    const otpVerificationForm = document.getElementById("otpVerificationForm");
    if (otpVerificationForm) {
      otpVerificationForm.addEventListener("submit", (e) =>
        this.handleRecoverUsername(e)
      );
    }

    // Resend recovery OTP button
    const resendRecoveryOtpBtn = document.getElementById("resendRecoveryOtp");
    if (resendRecoveryOtpBtn) {
      resendRecoveryOtpBtn.addEventListener("click", (e) =>
        this.handleResendRecoveryOTP(e)
      );
    }
  }

  setupModals() {
    const modal = document.getElementById("otpModal");
    const closeBtn = document.querySelector(".close");

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });

      window.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.style.display = "none";
        }
      });
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const loginData = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    this.setLoading(submitBtn, true);

    try {
      const response = await this.apiRequest("/login/", "POST", loginData);

      if (response.token) {
        localStorage.setItem("authToken", response.token);
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: response.user_id,
            username: response.username || "",
            email: response.email || "",
            phone_verified: response.phone_verified || false,
            login_method: "email",
          })
        );

        this.showMessage("Login successful!", "success");

        // Check if phone is verified
        if (!response.phone_verified) {
          this.showOtpModal();
        } else {
          // Redirect to main home page
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1500);
        }
      }
    } catch (error) {
      this.showMessage(error.message || "Login failed", "error");
    } finally {
      this.setLoading(submitBtn, false);
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    console.log("AuthManager: Handling signup form submission");

    const formData = new FormData(e.target);
    let phoneNumber = formData.get("phoneNumber");

    // Format phone number to include country code if missing
    if (phoneNumber && !phoneNumber.startsWith("+")) {
      phoneNumber = "+91" + phoneNumber; // Default to India country code
    }

    const signupData = {
      username: formData.get("username"),
      email: formData.get("email"),
      phone_number: phoneNumber,
      password: formData.get("password"),
      confirm_password: formData.get("confirmPassword"),
    };

    console.log("AuthManager: Signup data:", {
      ...signupData,
      password: "[HIDDEN]",
      confirm_password: "[HIDDEN]",
    });

    // Client-side validation
    if (signupData.password !== signupData.confirm_password) {
      this.showMessage("Passwords do not match", "error");
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    this.setLoading(submitBtn, true);

    try {
      const response = await this.apiRequest("/register/", "POST", signupData);

      if (response.token) {
        localStorage.setItem("authToken", response.token);
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: response.user_id,
            username: response.username || "",
            email: response.email || "",
            phone_verified: response.phone_verified || false,
            login_method: "email",
          })
        );

        this.showMessage("Account created successfully!", "success");

        // Show OTP modal for phone verification
        setTimeout(() => {
          this.showOtpModal();
          this.sendOtpForSignup(signupData.phone_number);
        }, 1000);
      }
    } catch (error) {
      this.showMessage(error.message || "Registration failed", "error");
    } finally {
      this.setLoading(submitBtn, false);
    }
  }

  async handleSendOtp(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const phoneNumber = formData.get("phoneNumber");

    const submitBtn = e.target.querySelector('button[type="submit"]');
    this.setLoading(submitBtn, true);

    try {
      await this.apiRequest("/send-otp/", "POST", {
        phone_number: phoneNumber,
      });

      this.showMessage("OTP sent successfully!", "success");

      // Hide phone form and show OTP form
      document.getElementById("phoneForm").style.display = "none";
      document.getElementById("otpForm").style.display = "block";
    } catch (error) {
      this.showMessage(error.message || "Failed to send OTP", "error");
    } finally {
      this.setLoading(submitBtn, false);
    }
  }

  async sendOtpForSignup(phoneNumber) {
    try {
      await this.apiRequest("/send-otp/", "POST", {
        phone_number: phoneNumber,
      });
      this.showMessage("OTP sent to your phone number", "success");
    } catch (error) {
      this.showMessage("Failed to send OTP: " + error.message, "error");
    }
  }

  async handleVerifyOtp(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const otpCode = formData.get("otpCode");

    // Get phone number from signup form or phone form
    let phoneNumber = "";
    const signupPhoneInput = document.querySelector(
      '#signupForm input[name="phoneNumber"]'
    );
    const phoneFormInput = document.querySelector(
      '#phoneForm input[name="phoneNumber"]'
    );

    if (signupPhoneInput) {
      phoneNumber = signupPhoneInput.value;
    } else if (phoneFormInput) {
      phoneNumber = phoneFormInput.value;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    this.setLoading(submitBtn, true);

    try {
      const response = await this.apiRequest("/verify-otp/", "POST", {
        phone_number: phoneNumber,
        otp: otpCode,
      });

      this.showMessage("Phone number verified successfully!", "success");

      // Close modal and redirect
      setTimeout(() => {
        document.getElementById("otpModal").style.display = "none";
        window.location.href = "index.html";
      }, 1500);
    } catch (error) {
      this.showMessage(error.message || "Invalid OTP", "error");
    } finally {
      this.setLoading(submitBtn, false);
    }
  }

  async handleResendOtp(e) {
    e.preventDefault();

    const phoneNumber =
      document.querySelector('#phoneForm input[name="phoneNumber"]')?.value ||
      document.querySelector('#signupForm input[name="phoneNumber"]')?.value;

    if (!phoneNumber) {
      this.showMessage("Phone number not found", "error");
      return;
    }

    const resendBtn = e.target;
    this.setLoading(resendBtn, true);

    try {
      await this.apiRequest("/send-otp/", "POST", {
        phone_number: phoneNumber,
      });
      this.showMessage("OTP resent successfully!", "success");
    } catch (error) {
      this.showMessage(error.message || "Failed to resend OTP", "error");
    } finally {
      this.setLoading(resendBtn, false);
    }
  }

  showOtpModal() {
    const modal = document.getElementById("otpModal");
    if (modal) {
      modal.style.display = "block";

      // If this is for login, show phone form first
      if (window.location.pathname.includes("login")) {
        document.getElementById("phoneForm").style.display = "block";
        document.getElementById("otpForm").style.display = "none";
      } else {
        // For signup, directly show OTP form
        document.getElementById("phoneForm").style.display = "none";
        document.getElementById("otpForm").style.display = "block";
      }
    }
  }

  async apiRequest(endpoint, method = "GET", data = null) {
    const url = this.apiBaseUrl + endpoint;
    const token = localStorage.getItem("authToken");

    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      config.headers["Authorization"] = `Token ${token}`;
    }

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      console.log("Making API request to:", url);
      const response = await fetch(url, config);

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        throw new Error("Invalid response from server");
      }

      console.log("API response status:", response.status);
      console.log("API response data:", responseData);

      if (!response.ok) {
        // Handle different error formats from Django
        let errorMessage = "Request failed";

        if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if (responseData.non_field_errors) {
          errorMessage = responseData.non_field_errors[0];
        } else if (typeof responseData === "object") {
          // Handle field-specific errors
          const fieldErrors = [];
          for (const [field, errors] of Object.entries(responseData)) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors[0]}`);
            } else {
              fieldErrors.push(`${field}: ${errors}`);
            }
          }
          errorMessage = fieldErrors.join(", ");
        }

        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      console.error("API request error:", error);
      if (error.name === "TypeError") {
        throw new Error(
          "Network error. Cannot connect to server. Please check if the backend is running."
        );
      }
      throw error;
    }
  }

  showMessage(text, type = "info") {
    const messageElement = document.getElementById("message");
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      messageElement.style.display = "block";

      // Hide message after 5 seconds
      setTimeout(() => {
        messageElement.style.display = "none";
      }, 5000);
    }
  }

  setLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.classList.add("loading");
      button.originalText = button.textContent;
      button.textContent = "Loading...";
    } else {
      button.disabled = false;
      button.classList.remove("loading");
      button.textContent =
        button.originalText || button.textContent.replace("Loading...", "");
    }
  }

  async handleForgotPassword(e) {
    e.preventDefault();
    console.log("AuthManager: Handling forgot password form submission");

    const formData = new FormData(e.target);
    let phoneNumber = formData.get("phoneNumber");

    // Format phone number to include country code if missing
    if (phoneNumber && !phoneNumber.startsWith("+")) {
      phoneNumber = "+91" + phoneNumber; // Default to India country code
    }

    const forgotPasswordData = {
      phone_number: phoneNumber,
    };

    console.log("AuthManager: Forgot password data:", forgotPasswordData);

    // Client-side validation
    if (!phoneNumber) {
      this.showMessage("Please enter a phone number", "error");
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    this.setLoading(submitBtn, true);

    try {
      const response = await this.apiRequest(
        "/forgot-password/",
        "POST",
        forgotPasswordData
      );

      if (response.message) {
        this.showMessage(
          "Reset OTP sent successfully! Please check your phone.",
          "success"
        );

        // Store phone number for reset password step
        localStorage.setItem("resetPhoneNumber", phoneNumber);

        // Hide forgot password form and show reset password form
        setTimeout(() => {
          document.getElementById("forgotPasswordForm").style.display = "none";
          document.getElementById("resetPasswordForm").style.display = "block";

          // Update header text
          const header = document.querySelector(".auth-header h1");
          const subtext = document.querySelector(".auth-header p");
          if (header) header.textContent = "Reset Password";
          if (subtext)
            subtext.textContent = "Enter the OTP and your new password";
        }, 1500);
      }
    } catch (error) {
      this.showMessage(error.message || "Failed to send reset OTP", "error");
    } finally {
      this.setLoading(submitBtn, false);
    }
  }

  async handleResetPassword(e) {
    e.preventDefault();
    console.log("AuthManager: Handling reset password form submission");

    const formData = new FormData(e.target);
    const phoneNumber = localStorage.getItem("resetPhoneNumber");
    const otpCode = formData.get("otpCode");
    const newPassword = formData.get("newPassword");
    const confirmNewPassword = formData.get("confirmNewPassword");

    const resetPasswordData = {
      phone_number: phoneNumber,
      otp: otpCode,
      new_password: newPassword,
      confirm_password: confirmNewPassword,
    };

    console.log("AuthManager: Reset password data:", {
      ...resetPasswordData,
      new_password: "[HIDDEN]",
      confirm_password: "[HIDDEN]",
    });

    // Client-side validation
    if (!otpCode || otpCode.length !== 6) {
      this.showMessage("Please enter a valid 6-digit OTP", "error");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      this.showMessage("Passwords do not match", "error");
      return;
    }

    if (newPassword.length < 8) {
      this.showMessage("Password must be at least 8 characters long", "error");
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    this.setLoading(submitBtn, true);

    try {
      const response = await this.apiRequest(
        "/reset-password/",
        "POST",
        resetPasswordData
      );

      if (response.message) {
        this.showMessage(
          "Password reset successfully! Redirecting to login...",
          "success"
        );

        // Clear stored phone number
        localStorage.removeItem("resetPhoneNumber");

        // Redirect to login page
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      }
    } catch (error) {
      this.showMessage(error.message || "Failed to reset password", "error");
    } finally {
      this.setLoading(submitBtn, false);
    }
  }

  async handleResendResetOtp(e) {
    e.preventDefault();
    console.log("AuthManager: Resending reset OTP");

    const phoneNumber = localStorage.getItem("resetPhoneNumber");

    if (!phoneNumber) {
      this.showMessage("Phone number not found. Please start over.", "error");
      return;
    }

    const submitBtn = e.target;
    this.setLoading(submitBtn, true);

    try {
      await this.apiRequest("/forgot-password/", "POST", {
        phone_number: phoneNumber,
      });
      this.showMessage(
        "Reset OTP sent again! Please check your phone.",
        "success"
      );
    } catch (error) {
      this.showMessage(error.message || "Failed to resend OTP", "error");
    } finally {
      this.setLoading(submitBtn, false);
    }
  }

  // Forgot Username Methods
  async handleForgotUsername(event) {
    event.preventDefault();
    const form = event.target;
    const phoneInput = form.querySelector('input[name="phone_number"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    const phoneNumber = phoneInput.value.trim();

    if (!phoneNumber) {
      this.showMessage("Please enter your phone number", "error");
      return;
    }

    this.setLoading(submitBtn, true);

    try {
      await this.apiRequest("/forgot-username/", "POST", {
        phone_number: phoneNumber,
      });
      this.showMessage(
        "Username recovery OTP sent! Please check your phone.",
        "success"
      );

      // Show OTP verification step
      document.getElementById("forgotUsernameForm").style.display = "none";
      document.getElementById("otpVerificationForm").style.display = "block";
    } catch (error) {
      this.showMessage(
        error.message || "Failed to send username recovery OTP",
        "error"
      );
    } finally {
      this.setLoading(submitBtn, false);
    }
  }

  async handleRecoverUsername(event) {
    event.preventDefault();
    const form = event.target;
    const otpInput = form.querySelector('input[name="otp_code"]');
    const phoneInput = document.querySelector('input[name="phone_number"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    const otpCode = otpInput.value.trim();
    const phoneNumber = phoneInput.value.trim();

    if (!otpCode) {
      this.showMessage("Please enter the OTP code", "error");
      return;
    }

    this.setLoading(submitBtn, true);

    try {
      const response = await this.apiRequest("/recover-username/", "POST", {
        phone_number: phoneNumber,
        otp: otpCode,
      });

      // Show username result
      document.getElementById("recoveredUsername").textContent =
        response.username;
      document.getElementById("recoveredEmail").textContent =
        response.email || "Not available";

      // Hide OTP form and show result
      document.getElementById("otpVerificationForm").style.display = "none";
      document.getElementById("usernameDisplay").style.display = "block";
    } catch (error) {
      this.showMessage(error.message || "Invalid OTP code", "error");
    } finally {
      this.setLoading(submitBtn, false);
    }
  }

  async handleResendRecoveryOTP(event) {
    event.preventDefault();
    const btn = event.target;
    const phoneInput = document.querySelector('input[name="phone_number"]');
    const phoneNumber = phoneInput.value.trim();

    if (!phoneNumber) {
      this.showMessage("Phone number not found", "error");
      return;
    }

    this.setLoading(btn, true);

    try {
      await this.apiRequest("/forgot-username/", "POST", {
        phone_number: phoneNumber,
      });
      this.showMessage(
        "Recovery OTP sent again! Please check your phone.",
        "success"
      );
    } catch (error) {
      this.showMessage(
        error.message || "Failed to resend recovery OTP",
        "error"
      );
    } finally {
      this.setLoading(btn, false);
    }
  }

  // Utility function to check if user is authenticated
  isAuthenticated() {
    return localStorage.getItem("authToken") !== null;
  }

  // LinkedIn login handler
  async handleLinkedInLogin(e) {
    e.preventDefault();
    const btn = e.target;

    try {
      this.setLoading(btn, true, "Redirecting to LinkedIn...");
      this.showMessage("Redirecting to LinkedIn...", "info");

      // Get LinkedIn authorization URL from backend
      const response = await fetch(`${this.apiBaseUrl}/linkedin/login-url/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get LinkedIn login URL");
      }

      const data = await response.json();

      // Store state for verification
      localStorage.setItem("linkedin_state", data.state);

      // Redirect to LinkedIn
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("LinkedIn login error:", error);
      this.showMessage(
        "Failed to initiate LinkedIn login. Please try again.",
        "error"
      );
      this.setLoading(btn, false);
    }
  }

  // Handle LinkedIn callback (call this on callback page)
  async handleLinkedInCallback(code, state) {
    try {
      this.showMessage("Processing LinkedIn login...", "loading");

      // Verify state matches
      const storedState = localStorage.getItem("linkedin_state");
      if (state !== storedState) {
        throw new Error("Security validation failed. Please try again.");
      }

      // Send code to backend for processing
      const response = await fetch(`${this.apiBaseUrl}/linkedin/callback/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          state: state,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication token
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        localStorage.setItem("userId", data.user.id);
        localStorage.removeItem("linkedin_state");

        this.showMessage(
          "LinkedIn login successful! Redirecting...",
          "success"
        );

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);

        return { success: true, data: data };
      } else {
        throw new Error(data.error || "LinkedIn authentication failed");
      }
    } catch (error) {
      console.error("LinkedIn callback error:", error);
      this.showMessage(`LinkedIn login failed: ${error.message}`, "error");
      localStorage.removeItem("linkedin_state");
      return { success: false, error: error.message };
    }
  }

  // Google login handler
  async handleGoogleLogin(e) {
    e.preventDefault();
    const btn = e.target;

    try {
      this.setLoading(btn, true, "Redirecting to Google...");
      this.showMessage("Redirecting to Google...", "info");

      // Get Google authorization URL from backend
      const response = await fetch(`${this.apiBaseUrl}/google/login-url/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get Google login URL");
      }

      const data = await response.json();

      // Store state for verification
      localStorage.setItem("google_state", data.state);

      // Redirect to Google
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Google login error:", error);
      this.showMessage(
        "Failed to initiate Google login. Please try again.",
        "error"
      );
      this.setLoading(btn, false);
    }
  }

  // Handle Google callback (call this on callback page)
  async handleGoogleCallback(code, state) {
    try {
      this.showMessage("Processing Google login...", "loading");

      // Verify state matches
      const storedState = localStorage.getItem("google_state");
      if (state !== storedState) {
        throw new Error("Security validation failed. Please try again.");
      }

      // Send code to backend for processing
      const response = await fetch(`${this.apiBaseUrl}/google/callback/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          state: state,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication token
        localStorage.setItem("authToken", data.token);
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: data.user.id,
            username: data.user.username || data.user.name,
            email: data.user.email,
            phone_verified: data.user.phone_verified || false,
            login_method: "google",
          })
        );
        localStorage.removeItem("google_state");

        this.showMessage("Google login successful! Redirecting...", "success");

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);

        return { success: true, data: data };
      } else {
        throw new Error(data.error || "Google authentication failed");
      }
    } catch (error) {
      console.error("Google callback error:", error);
      this.showMessage(`Google login failed: ${error.message}`, "error");
      localStorage.removeItem("google_state");
      return { success: false, error: error.message };
    }
  }

  // Utility function to logout
  logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("linkedin_state");
    localStorage.removeItem("google_state");
    window.location.href = "login.html";
  }
}

// Global function for redirecting to login (used in HTML onclick)
function goToLogin() {
  window.location.href = "login.html";
}

// Initialize the auth manager when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.authManager = new AuthManager();
});

// Export for use in other scripts
window.AuthManager = AuthManager;
