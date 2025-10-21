// storage.js - Centralized data management
class DataStorage {
  constructor() {
    this.init();
  }

  init() {
    // Initialize data if not exists
    if (!localStorage.getItem("guruData")) {
      const defaultGuru = [
        {
          id: 1,
          nip: "001",
          nama: "Alifi Amalki",
          jabatan: "Wali Kelas 1",
          mataPelajaran: "Matematika, IPA",
          pendidikan: "S1 Pendidikan Guru Sekolah Dasar",
          email: "alifi.amalki@sdnusantara.sch.id",
          telepon: "0812-3456-7890",
          riwayat:
            "SD Nusantara (2020 - Sekarang)\nSD Harapan Bangsa (2018 - 2020)",
          foto: "/assets/images/alip.jpg",
        },
        {
          id: 2,
          nip: "002",
          nama: "Nandika Dwi A",
          jabatan: "Wali Kelas 2",
          mataPelajaran: "Informatika, Bahasa Inggris",
          pendidikan: "S1 Pendidikan Guru Sekolah Dasar",
          email: "nandika.dwi@sdnusantara.sch.id",
          telepon: "0812-3456-7890",
          riwayat:
            "SD Nusantara (2025 - Sekarang)\nSD Harapan Bangsa (2018 - 2020)",
          foto: "/assets/images/alip.jpg",
        },
      ];
      localStorage.setItem("guruData", JSON.stringify(defaultGuru));
    }

    if (!localStorage.getItem("siswaData")) {
      const defaultSiswa = {
        kelas1: [
          {
            id: 1,
            nis: "001",
            nama: "Andi",
            foto: "/assets/images/guruDiazz.jpg",
          },
          {
            id: 2,
            nis: "002",
            nama: "Siti",
            foto: "/assets/images/alipSD.jpg",
          },
          {
            id: 3,
            nis: "003",
            nama: "Alifi",
            foto: "/assets/images/gurudika.jpg",
          },
        ],
        kelas2: [],
        kelas3: [],
        kelas4: [],
        kelas5: [],
        kelas6: [],
      };
      localStorage.setItem("siswaData", JSON.stringify(defaultSiswa));
    }

    if (!localStorage.getItem("dashboardStats")) {
      const defaultStats = {
        totalSiswa: 156,
        totalGuru: 12,
        totalKelas: 6,
        pengumumanAktif: 5,
      };
      localStorage.setItem("dashboardStats", JSON.stringify(defaultStats));
    }
  }

  // Guru CRUD
  getGuru() {
    return JSON.parse(localStorage.getItem("guruData") || "[]");
  }

  saveGuru(data) {
    localStorage.setItem("guruData", JSON.stringify(data));
    this.updateDashboardStats();
  }

  // Siswa CRUD
  getSiswa(kelas) {
    const allSiswa = JSON.parse(localStorage.getItem("siswaData") || "{}");
    return allSiswa[kelas] || [];
  }

  saveSiswa(kelas, data) {
    const allSiswa = JSON.parse(localStorage.getItem("siswaData") || "{}");
    allSiswa[kelas] = data;
    localStorage.setItem("siswaData", JSON.stringify(allSiswa));
    this.updateDashboardStats();
  }

  // Dashboard Stats
  getDashboardStats() {
    return JSON.parse(localStorage.getItem("dashboardStats") || "{}");
  }

  updateDashboardStats() {
    const guruData = this.getGuru();
    const siswaData = JSON.parse(localStorage.getItem("siswaData") || "{}");

    let totalSiswa = 0;
    Object.values(siswaData).forEach((kelas) => {
      totalSiswa += kelas.length;
    });

    const stats = {
      totalSiswa: totalSiswa,
      totalGuru: guruData.length,
      totalKelas: 6,
      pengumumanAktif: 5,
    };

    localStorage.setItem("dashboardStats", JSON.stringify(stats));

    // Update dashboard if on admin page
    if (typeof updateDashboard === "function") {
      updateDashboard();
    }
  }
}

const dataStorage = new DataStorage();
