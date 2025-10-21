// dashboard.js - Real-time dashboard updates
function updateDashboard() {
  const stats = dataStorage.getDashboardStats();

  // Update cards
  document.getElementById("total-siswa").textContent = stats.totalSiswa;
  document.getElementById("total-guru").textContent = stats.totalGuru;
  document.getElementById("total-kelas").textContent = stats.totalKelas;
  document.getElementById("total-pengumuman").textContent =
    stats.pengumumanAktif;

  // Update quick stats
  updateQuickStats();
  updateRecentActivity();
  updateStudentDistribution();
}

function updateQuickStats() {
  const siswaData = JSON.parse(localStorage.getItem("siswaData") || "{}");
  const guruData = dataStorage.getGuru();

  // Update kelas counts
  const kelasCounts = {
    "Kelas 1-3": ["kelas1", "kelas2", "kelas3"].reduce(
      (acc, kelas) => acc + (siswaData[kelas]?.length || 0),
      0
    ),
    "Kelas 4-6": ["kelas4", "kelas5", "kelas6"].reduce(
      (acc, kelas) => acc + (siswaData[kelas]?.length || 0),
      0
    ),
  };

  document.querySelectorAll(".quick-stats").forEach((element) => {
    const title = element.querySelector(".card-title").textContent;
    if (title === "Kelas 1-3") {
      element.querySelector(".stat-count").textContent =
        kelasCounts["Kelas 1-3"];
    } else if (title === "Kelas 4-6") {
      element.querySelector(".stat-count").textContent =
        kelasCounts["Kelas 4-6"];
    } else if (title === "Data Guru") {
      element.querySelector(".stat-count").textContent = guruData.length;
    }
  });
}

function updateRecentActivity() {
  const activities = JSON.parse(
    localStorage.getItem("recentActivities") || "[]"
  );
  const activityList = document.querySelector(".list-group");

  if (activityList) {
    activityList.innerHTML =
      activities
        .map(
          (activity) => `
            <li class="list-group-item">
                <small class="text-muted">${activity.time}</small><br>
                ${activity.message}
            </li>
        `
        )
        .join("") ||
      `
            <li class="list-group-item">
                <small class="text-muted">Hari ini, 10:30</small><br>
                Data siswa baru ditambahkan - Kelas 1
            </li>
        `;
  }
}

function updateStudentDistribution() {
  const siswaData = JSON.parse(localStorage.getItem("siswaData") || "{}");
  const distribution = {};

  for (let i = 1; i <= 6; i++) {
    distribution[`K${i}`] = siswaData[`kelas${i}`]?.length || 0;
  }

  // Update distribution badges
  const badgesContainer = document.querySelector(".badge-container");
  if (badgesContainer) {
    badgesContainer.innerHTML = Object.entries(distribution)
      .map(
        ([kelas, count]) => `
            <span class="badge bg-primary">${kelas}: ${count}</span>
        `
      )
      .join("");
  }
}

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", function () {
  if (window.location.pathname.includes("admin.html")) {
    updateDashboard();

    // Update every 5 seconds for real-time feel
    setInterval(updateDashboard, 5000);
  }
});
