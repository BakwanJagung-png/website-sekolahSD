function login() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;

  if (user === "nandika" && pass === "12345") {
    window.location.href = "admin.html";
  } else {
    alert("Username atau Password salah!");
  }
  return false;
}

// di script.js - tambah validasi lebih ketat
function validateLogin(user, pass) {
  if(user.trim() === '' || pass.trim() === '') {
    showError('Username dan password harus diisi');
    return false;
  }
  
  // Prevent basic SQL injection
  const dangerousChars = /['"\\;]/;
  if(dangerousChars.test(user) || dangerousChars.test(pass)) {
    showError('Input mengandung karakter tidak diperbolehkan');
    return false;
  }
  
  return true;
}

function showError(message) {
  // Tambahkan modal atau alert yang lebih user friendly
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger alert-dismissible fade show';
  errorDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector('.login-box').prepend(errorDiv);
}