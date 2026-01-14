// API Base URL
const API_BASE = "/api/auth";

// Show error message
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
}

// Hide error message
function hideError(elementId) {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.style.display = "none";
  }
}

// Show loading state
function setLoading(buttonId, loading) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.disabled = loading;
    if (loading) {
      // Store original content if not already stored
      if (!button.dataset.originalContent) {
        button.dataset.originalContent = button.innerHTML;
      }
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    } else {
      // Restore original content
      if (button.dataset.originalContent) {
        button.innerHTML = button.dataset.originalContent;
        delete button.dataset.originalContent;
      } else {
        // Fallback for login/register buttons
        if (buttonId === "loginBtn") {
          button.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In';
        } else if (buttonId === "registerBtn") {
          button.innerHTML = '<i class="bi bi-person-plus me-2"></i>Create Account';
        }
      }
    }
  }
}

// Register function
async function register() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Hide previous errors
  hideError("registerError");

  // Validation
  if (!name || !email || !password) {
    showError("registerError", "Please fill in all fields");
    return;
  }

  if (password.length < 6) {
    showError("registerError", "Password must be at least 6 characters");
    return;
  }

  if (!email.includes("@")) {
    showError("registerError", "Please enter a valid email address");
    return;
  }

  setLoading("registerBtn", true);

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showError("registerError", data.msg || "Registration failed");
      setLoading("registerBtn", false);
      return;
    }

    // Store token
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user || {}));
    }

    // Show success message
    showError("registerError");
    document.getElementById("registerSuccess").textContent = "Registration successful! Redirecting...";
    document.getElementById("registerSuccess").style.display = "block";
    document.getElementById("registerSuccess").className = "alert alert-success mt-3";

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  } catch (error) {
    console.error("Registration error:", error);
    showError("registerError", "Network error. Please try again.");
    setLoading("registerBtn", false);
  }
}

// Login function
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Hide previous errors
  hideError("loginError");

  // Validation
  if (!email || !password) {
    showError("loginError", "Please fill in all fields");
    return;
  }

  setLoading("loginBtn", true);

  const loginUrl = `${API_BASE}/login`;
  console.log("🔐 Attempting login to:", loginUrl);
  console.log("📧 Email:", email);

  try {
    const res = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    console.log("📡 Login response status:", res.status);

    const data = await res.json();

    console.log("📦 Login response data:", data);

    if (!res.ok) {
      showError("loginError", data.msg || "Login failed");
      setLoading("loginBtn", false);
      return;
    }

    // Store token
    if (data.token) {
      console.log("✅ Login successful!");
      console.log("🔑 Token received:", data.token);
      console.log("👤 User data:", data.user);
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user || {}));
      
      console.log("💾 Token saved to localStorage");
      window.location.href = "/dashboard";
    } else {
      showError("loginError", "Invalid response from server");
      setLoading("loginBtn", false);
    }
  } catch (error) {
    console.error("Login error:", error);
    showError("loginError", "Network error. Please try again.");
    setLoading("loginBtn", false);
  }
}

// Check if user is authenticated (for protected pages)
function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/";
    return false;
  }
  return true;
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

// Allow Enter key to submit forms
document.addEventListener("DOMContentLoaded", function() {
  // Register form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", function(e) {
      e.preventDefault();
      register();
    });
  }

  // Login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      login();
    });
  }
});
