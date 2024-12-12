document.addEventListener("DOMContentLoaded", () => {
  // Check if the user is already logged in
  const userId = localStorage.getItem("userId");
  if (userId && window.location.pathname === "/login.html") {
    // Redirect logged-in user to the dashboard
    window.location.href = "/dashboard.html";
    return;
  }

  // Login Form Submission Handler
  const loginForm = document.getElementById("login-form");
   if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const errorMessage = document.getElementById("error-message");

      // Clear previous error message
      errorMessage.textContent = "";

      try {
        // Send login request to the server
        const response = await fetch("/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Save user ID in localStorage and redirect to dashboard
          localStorage.setItem("userId", data.userId);
          window.location.href = "/dashboard.html";
        } else {
          // Show error message for failed login
          errorMessage.textContent = data.message || "Invalid credentials";
        }
      } catch (error) {
        // Handle server or network errors
        console.error("Error during login:", error);
        errorMessage.textContent = "An error occurred. Please try again later.";
      }
    });
  }

  // Register Form Submission Handler
  const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();
    const confirmPassword = document.getElementById("register-confirm-password").value.trim();
    const errorMessage = document.getElementById("register-error-message");

    errorMessage.textContent = "";

    // Validate passwords match
    if (password !== confirmPassword) {
      errorMessage.textContent = "Passwords do not match.";
      return;
    }

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Registration successful! Please log in.");
        registerForm.reset();
        document.getElementById("register-modal").classList.add("hidden");
      } else {
        errorMessage.textContent = data.message || "An error occurred during registration.";
      }
    } catch (error) {
      console.error("Error during registration:", error);
      errorMessage.textContent = "An error occurred. Please try again later.";
    }
  });
}


  // Open Register Modal
  const openRegisterModalButton = document.getElementById("open-register-modal");
  if (openRegisterModalButton) {
    openRegisterModalButton.addEventListener("click", () => {
      const modal = document.getElementById("register-modal");
      modal.classList.remove("hidden");
      modal.style.display = "flex";
    });
  }

  // Close Register Modal
  const closeRegisterModalButton = document.getElementById("close-register-modal");
  if (closeRegisterModalButton) {
    closeRegisterModalButton.addEventListener("click", () => {
      const modal = document.getElementById("register-modal");
      modal.classList.add("hidden");
      modal.style.display = "none";
    });
  }
});
