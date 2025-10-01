function login() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;

  if (user === "admin" && pass === "12345") {
    window.location.href = "admin.html";
  } else {
    alert("Username atau Password salah!");
  }
  return false;
}