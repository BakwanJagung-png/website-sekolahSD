AOS.init({ duration: 900, once: true });

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    document.getElementById("togglePassword").addEventListener("click", function () {
      const pwd = document.getElementById("password");
      pwd.type = pwd.type === "password" ? "text" : "password";
      this.textContent = pwd.type === "password" ? "👁️" : "🙈";
    });

    document.getElementById("registerLink").onclick = () => {
      loginForm.style.display = "none";
      registerForm.style.display = "block";
    };
    document.getElementById("backToLogin").onclick = () => {
      registerForm.style.display = "none";
      loginForm.style.display = "block";
    };

    // ===== REGISTRASI =====
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("regUsername").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value.trim();

      if (!username || !email || !password) {
        Swal.fire("Oops!", "Mohon isi semua data dengan lengkap.", "warning");
        return;
      }

      const users = JSON.parse(localStorage.getItem("users") || "[]");
      if (users.find((u) => u.username === username)) {
        Swal.fire("Gagal", "Username sudah terdaftar!", "error");
        return;
      }

      users.push({ username, email, password });
      localStorage.setItem("users", JSON.stringify(users));

      Swal.fire({
        title: "Akun Berhasil Dibuat 🎉",
        text: "Silakan login menggunakan akun baru kamu.",
        icon: "success",
        confirmButtonColor: "#c0392b"
      }).then(() => {
        registerForm.reset();
        registerForm.style.display = "none";
        loginForm.style.display = "block";
      });
    });

    // ===== LOGIN =====
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u) => u.username === username && u.password === password);

      if (user) {
        Swal.fire({
          title: "Berhasil Masuk ✅",
          text: "Selamat datang kembali di portal SD Nusantara!",
          icon: "success",
          confirmButtonColor: "#c0392b",
          timer: 1500,
          showConfirmButton: false
        });
        setTimeout(() => (window.location.href = "admin.html"), 1600);
      } else {
        Swal.fire("Gagal!", "Username atau password salah.", "error");
      }
    });