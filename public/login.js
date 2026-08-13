const form = document.getElementById("form-login");
const errorBox = document.getElementById("login-error");

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  errorBox.classList.add("hidden");

  const username = document.getElementById("l-username").value.trim();
  const password = document.getElementById("l-password").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "No se pudo iniciar sesión");
    }

    window.location.href = "/";
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
});
