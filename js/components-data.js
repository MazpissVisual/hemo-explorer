/**
 * DATA MATERI & KONTEN EDUKASI SISTEM PEREDARAN DARAH KELAS VI SD
 * Kurikulum Merdeka / Tematik SD
 */

const CIRCULATORY_DATA = {
  // 1. KOMPONEN UTAMA
  components: {
    jantung: {
      id: "jantung",
      title: "Jantung (Pusat Pemompa Darah)",
      subtitle: "Organ berotot seukuran kepalan tangan yang bekerja memompa darah tanpa henti 24 jam sehari!",
      icon: "❤️",
      color: "#FF4D6D",
      summary: "Jantung manusia terletak di rongga dada sebelah kiri, dilindungi tulang rusuk, dan terbagi menjadi 4 ruang utama.",
      ruang: [
        {
          nama: "Serambi Kanan (Atrium Dekster)",
          lokasi: "Atas Kanan Jantung",
          fungsi: "Menerima darah kotor (kaya Karbon Dioksida / CO₂) dari seluruh tubuh melalui pembuluh Vena Cava.",
          sifatDarah: "Kaya CO₂ (Warna Biru pada diagram)",
          katup: "Katup Trikuspidalis (mencegah darah kembali ke serambi kanan)",
          colorBadge: "#3A86FF",
          image3d: "assets/images/serambi_kanan_3d.jpg",
          videoUrl: "https://youtu.be/04h_BeHKCCs"
        },
        {
          nama: "Bilik Kanan (Ventrikel Dekster)",
          lokasi: "Bawah Kanan Jantung",
          fungsi: "Memompa darah kotor (kaya CO₂) menuju ke paru-paru melalui Arteri Pulmonalis untuk dibersihkan.",
          sifatDarah: "Kaya CO₂ (Warna Biru pada diagram)",
          katup: "Katup Pulmonal",
          colorBadge: "#3A86FF",
          image3d: "assets/images/bilik_kanan_3d.jpg",
          videoUrl: "https://youtu.be/e0x8QQPREsw"
        },
        {
          nama: "Serambi Kiri (Atrium Sinister)",
          lokasi: "Atas Kiri Jantung",
          fungsi: "Menerima darah bersih (kaya Oksigen / O₂) yang baru selesai dibersihkan dari paru-paru melalui Vena Pulmonalis.",
          sifatDarah: "Kaya O₂ (Warna Merah Cerah)",
          katup: "Katup Bikuspidalis / Mitral",
          colorBadge: "#FF0054",
          image3d: "assets/images/serambi_kiri_3d.jpg",
          videoUrl: "https://youtu.be/S69vauBjg5c"
        },
        {
          nama: "Bilik Kiri (Ventrikel Sinister)",
          lokasi: "Bawah Kiri Jantung (Otot Paling Tebal)",
          fungsi: "Memompa darah bersih (kaya O₂) ke seluruh tubuh melalui pembuluh nadi utama (Aorta).",
          sifatDarah: "Kaya O₂ (Warna Merah Cerah)",
          katup: "Katup Aorta",
          colorBadge: "#FF0054",
          image3d: "assets/images/bilik_kiri_3d.jpg",
          videoUrl: "https://youtu.be/LpB-IjyLVpM"
        }
      ],
      funFacts: [
        "Jantungmu berdetak sekitar 70-80 kali per menit saat istirahat.",
        "Dinding bilik kiri lebih tebal daripada bilik kanan karena harus memompa darah ke seluruh tubuh yang jauh!",
        "Suara 'Lub-Dub' dihasilkan oleh menutupnya katup-katup jantung secara bergantian."
      ]
    },
    pembuluh: {
      id: "pembuluh",
      title: "Pembuluh Darah (Jalur Lalu Lintas Darah)",
      subtitle: "Pipa saluran fleksibel yang mengalirkan darah ke setiap mili sel tubuh kita.",
      icon: "🩸",
      color: "#8338EC",
      summary: "Terdapat 3 jenis pembuluh darah utama dengan struktur dan tugas yang berbeda:",
      types: [
        {
          nama: "Pembuluh Nadi (Arteri)",
          arah: "Meninggalkan (keluar dari) jantung",
          dinding: "Tebal, kuat, dan elastis (mampu menahan tekanan pompa jantung)",
          letak: "Agak dalam dari permukaan kulit",
          denyut: "Terasa kuat (dapat diraba di pergelangan tangan atau leher)",
          katup: "Hanya 1 di pangkal jantung (Aorta)",
          aliran: "Jika terluka, darah memancar deras",
          isiDarah: "Umumnya kaya Oksigen (O₂), KECUALI Arteri Pulmonalis yang kaya CO₂",
          badgeColor: "#E63946",
          image3d: "assets/images/arteri_3d.jpg",
          videoUrl: "https://www.youtube.com/watch?v=v43ej5lCeBo"
        },
        {
          nama: "Pembuluh Balik (Vena)",
          arah: "Menuju ke (masuk ke) jantung",
          dinding: "Tipis dan kurang elastis",
          letak: "Dekat permukaan kulit, tampak berwarna kebiru-biruan",
          denyut: "Tidak terasa",
          katup: "Banyak di sepanjang pembuluh (mencegah darah berbalik arah)",
          aliran: "Jika terluka, darah hanya menetes / mengalir perlahan",
          isiDarah: "Umumnya kaya Karbon Dioksida (CO₂), KECUALI Vena Pulmonalis yang kaya O₂",
          badgeColor: "#1D3557",
          image3d: "assets/images/vena_3d.jpg",
          videoUrl: "https://www.youtube.com/watch?v=v43ej5lCeBo"
        },
        {
          nama: "Pembuluh Kapiler",
          arah: "Menghubungkan ujung arteri terkecil dengan vena terkecil",
          dinding: "Sangat tipis (hanya selapis sel) dan berpori",
          letak: "Menembus ke seluruh jaringan & organ tubuh",
          denyut: "Tidak terasa",
          katup: "Tidak ada",
          aliran: "Sangat lambat untuk pertukaran zat",
          isiDarah: "Tempat pertukaran langsung antara O₂ dan sari makanan dengan CO₂ dan zat sisa",
          badgeColor: "#FB5607",
          image3d: "assets/images/kapiler_3d.jpg",
          videoUrl: "https://www.youtube.com/watch?v=v43ej5lCeBo"
        }
      ]
    },
    darah: {
      id: "darah",
      title: "Darah & Komposisinya",
      subtitle: "Cairan kehidupan yang mengangkut oksigen, sari makanan, hormon, dan melawan kuman penyakit!",
      icon: "🔬",
      color: "#FB5607",
      summary: "Darah manusia terdiri dari bagian cair (Plasma Darah 55%) dan sel-sel darah padat (45%).",
      components: [
        {
          id: "plasma",
          nama: "Plasma Darah (55%)",
          bentuk: "Cairan kekuningan yang 90% terdiri dari air, protein, dan garam mineral",
          fungsi: "Mengedarkan sari makanan, hormon, antibodi, dan mengangkut zat sisa metabolisme.",
          visualColor: "#FFD166",
          icon: "🧪",
          image3d: "assets/images/plasma_3d.jpg",
          videoUrl: "https://www.youtube.com/watch?v=CRh_dAzXuoU"
        },
        {
          id: "eritrosit",
          nama: "Sel Darah Merah / Eritrosit (44%)",
          bentuk: "Bulat pipih dengan cekungan di tengah (bikonkaf), tidak berinti sel",
          fungsi: "Mengandung Hemoglobin (Hb) yang bertugas mengikat Oksigen (O₂) dari paru-paru dan membawanya ke seluruh sel tubuh.",
          visualColor: "#EF476F",
          icon: "🔴",
          image3d: "assets/images/eritrosit_3d.jpg",
          videoUrl: "https://www.youtube.com/watch?v=CRh_dAzXuoU"
        },
        {
          id: "leukosit",
          nama: "Sel Darah Putih / Leukosit (<1%)",
          bentuk: "Bentuk tidak tetap (ameboid), memiliki inti sel, berukuran lebih besar dari eritrosit",
          fungsi: "Sebagai 'Tentara Tubuh' yang memakan kuman, bakteri, dan virus yang masuk ke tubuh.",
          visualColor: "#06D6A0",
          icon: "🛡️",
          image3d: "assets/images/leukosit_3d.jpg",
          videoUrl: "https://www.youtube.com/watch?v=CRh_dAzXuoU"
        },
        {
          id: "trombosit",
          nama: "Keping Darah / Trombosit (<1%)",
          bentuk: "Pecahan sel kecil tak beraturan tanpa inti sel",
          fungsi: "Membantu proses pembekuan darah dan menutup luka sehingga perdarahan cepat berhenti.",
          visualColor: "#118AB2",
          icon: "🩹",
          image3d: "assets/images/trombosit_3d.jpg",
          videoUrl: "https://www.youtube.com/watch?v=CRh_dAzXuoU"
        }
      ]
    }
  },

  // 2. JENIS PEREDARAN DARAH
  circulation: {
    kecil: {
      nama: "Peredaran Darah Kecil (Pulmonal)",
      slogan: "Jantung → Paru-Paru → Jantung",
      jalur: [
        "1. Bilik Kanan Jantung (Darah kaya CO₂)",
        "2. Arteri Pulmonalis",
        "3. Paru-Paru (Terjadi pertukaran CO₂ menjadi O₂ di Alveolus)",
        "4. Vena Pulmonalis (Darah kini kaya O₂)",
        "5. Serambi Kiri Jantung"
      ],
      tujuan: "Membersihkan darah dari gas Karbon Dioksida dan mengisi kembali darah dengan Oksigen segar.",
      color: "#00B4D8"
    },
    besar: {
      nama: "Peredaran Darah Besar (Sistemik)",
      slogan: "Jantung → Seluruh Tubuh → Jantung",
      jalur: [
        "1. Bilik Kiri Jantung (Darah kaya O₂ segar)",
        "2. Aorta (Pembuluh Nadi Utama Terbesar)",
        "3. Seluruh Tubuh (Kepala, Tangan, Organ Perut, Kaki)",
        "4. Pembuluh Kapiler Jaringan (O₂ ditukar dengan CO₂)",
        "5. Vena Cava (Vena Utama)",
        "6. Serambi Kanan Jantung"
      ],
      tujuan: "Mengedarkan oksigen dan sari-sari makanan ke seluruh sel tubuh untuk menghasilkan energi hidup.",
      color: "#E63946"
    }
  },

  // 3. GANGGUAN SISTEM PEREDARAN DARAH
  disorders: [
    {
      id: "anemia",
      nama: "Anemia (Kurang Darah)",
      gejala: "5L: Lesu, Lemah, Letih, Lelah, Lalai, wajah pucat, dan mudah pusing.",
      penyebab: "Kekurangan zat besi, asam folat, atau hemoglobin sehingga sel darah merah sedikit.",
      caraCegah: "Makan makanan kaya zat besi seperti bayam, hati ayam, telur, kacang-kacangan, dan minum tablet tambah darah.",
      audioNarasi: "Anemia adalah kondisi tubuh yang kekurangan sel darah merah atau hemoglobin. Gejalanya dikenal dengan 5L: Lemah, Letih, Lesu, Lelah, dan Lalai. Faktor penyebab utamanya adalah non-keturunan, yaitu kekurangan zat besi dan nutrisi dalam makanan.",
      icon: "🥀",
      color: "#FF70A6",
      faktorKategori: "Non-Keturunan",
      faktorJenis: "Kekurangan Nutrisi & Zat Besi",
      faktorPenjelasan: "Asupan makanan kurang mengandung zat besi (Fe), vitamin B12, dan asam folat, atau akibat pendarahan aktif.",
      faktorBadgeColor: "#0284c7",
      faktorBadgeBg: "rgba(2, 132, 199, 0.12)",
      faktorIcon: "🥗"
    },
    {
      id: "hipertensi",
      nama: "Hipertensi (Tekanan Darah Tinggi)",
      gejala: "Sakit kepala, tengkuk terasa kaku, jantung berdebar kencang, pandangan kabur.",
      penyebab: "Tekanan darah di dinding arteri di atas 140/90 mmHg akibat makanan terlalu asin, stres, atau kurang olahraga.",
      caraCegah: "Kurangi konsumsi garam berlebih, hindari makanan cepat saji, rutin berolahraga, dan tidur teratur.",
      audioNarasi: "Hipertensi adalah tekanan darah tinggi akibat gaya hidup non-keturunan seperti konsumsi garam berlebih, stres, dan jarang berolahraga.",
      icon: "📈",
      color: "#FF595E",
      faktorKategori: "Non-Keturunan",
      faktorJenis: "Pola Hidup & Konsumsi Garam",
      faktorPenjelasan: "Pola makan tinggi natrium/garam berlebih, stres pikiran, berat badan berlebih (obesitas), dan kurang olahraga.",
      faktorBadgeColor: "#dc2626",
      faktorBadgeBg: "rgba(220, 38, 38, 0.12)",
      faktorIcon: "🧂"
    },
    {
      id: "hipotensi",
      nama: "Hipotensi (Tekanan Darah Rendah)",
      gejala: "Kepala berkunang-kunang saat berdiri tiba-tiba, mudah pingsan, badan lemas.",
      penyebab: "Tekanan darah di bawah normal (kurang dari 90/60 mmHg), dehidrasi atau kekurangan nutrisi.",
      caraCegah: "Minum air putih yang cukup (minimal 8 gelas sehari), makan teratur, dan istirahat cukup.",
      audioNarasi: "Hipotensi adalah tekanan darah rendah yang disebabkan oleh faktor non-keturunan seperti dehidrasi, kelelahan, dan kekurangan asupan cairan tubuh.",
      icon: "📉",
      color: "#1982C4",
      faktorKategori: "Non-Keturunan",
      faktorJenis: "Dehidrasi & Kondisi Tubuh",
      faktorPenjelasan: "Kurang asupan cairan (dehidrasi), kelelahan fisik yang berat, pola makan tidak teratur, atau anemia.",
      faktorBadgeColor: "#2563eb",
      faktorBadgeBg: "rgba(37, 99, 235, 0.12)",
      faktorIcon: "💧"
    },
    {
      id: "jantung_koroner",
      nama: "Penyakit Jantung Koroner (PJK)",
      gejala: "Nyeri dada sebelah kiri yang menjalar ke lengan atau leher, sesak napas.",
      penyebab: "Penyumbatan pembuluh darah arteri koroner oleh timbunan lemak jahat (kolesterol / plak).",
      caraCegah: "Hindari makanan berlemak jenuh/gorengan berlebih, jangan merokok, dan rutin olahraga kardio.",
      audioNarasi: "Penyakit Jantung Koroner dipicu oleh faktor non-keturunan seperti pola makan tinggi lemak jenuh, kolesterol jahat, dan kebiasaan merokok.",
      icon: "💔",
      color: "#D90429",
      faktorKategori: "Non-Keturunan",
      faktorJenis: "Pola Makan & Kolesterol",
      faktorPenjelasan: "Timbunan lemak jahat (kolesterol/plak) di arteri koroner akibat sering makan gorengan, makanan berlemak, dan merokok.",
      faktorBadgeColor: "#b91c1c",
      faktorBadgeBg: "rgba(185, 28, 28, 0.12)",
      faktorIcon: "🍔"
    },
    {
      id: "stroke",
      nama: "Stroke",
      gejala: "Sebagian wajah atau anggota gerak mendadak lumpuh, bicara pelo atau tidak jelas.",
      penyebab: "Tersumbat atau pecahnya pembuluh darah yang menyuplai oksigen ke otak.",
      caraCegah: "Kontrol tekanan darah, jaga pola makan seimbang, dan hindari stres.",
      audioNarasi: "Stroke terjadi ketika pembuluh darah di otak tersumbat atau pecah. Faktor pemicunya adalah non-keturunan berupa hipertensi kronis dan pola hidup tidak sehat.",
      icon: "🧠",
      color: "#6A4C93",
      faktorKategori: "Non-Keturunan",
      faktorJenis: "Vaskular & Tekanan Darah Tinggi",
      faktorPenjelasan: "Penyumbatan atau pecahnya pembuluh darah otak akibat komplikasi hipertensi kronis, aterosklerosis, dan stres tinggi.",
      faktorBadgeColor: "#7c3aed",
      faktorBadgeBg: "rgba(124, 58, 237, 0.12)",
      faktorIcon: "🧠"
    },
    {
      id: "leukemia",
      nama: "Leukemia (Kanker Darah)",
      gejala: "Sering demam, mudah memar/berdarah tanpa sebab jelas, berat badan turun drastis.",
      penyebab: "Produksi sel darah putih (leukosit) yang tidak terkendali dan memakan sel darah merah sendiri.",
      caraCegah: "Menghindari paparan radiasi berbahaya dan zat kimia beracun, serta konsultasi medis.",
      audioNarasi: "Leukemia adalah kanker darah di mana sel darah putih diproduksi tak terkendali. Dipicu oleh faktor lingkungan seperti radiasi berbahaya dan zat karsinogenik.",
      icon: "🧬",
      color: "#8AC926",
      faktorKategori: "Non-Keturunan",
      faktorJenis: "Lingkungan & Mutasi Sel Darah",
      faktorPenjelasan: "Produksi leukosit berlebih akibat paparan zat kimia karsinogenik beracun, radiasi tinggi, atau infeksi virus tertentu.",
      faktorBadgeColor: "#16a34a",
      faktorBadgeBg: "rgba(22, 163, 74, 0.12)",
      faktorIcon: "☣️"
    },
    {
      id: "varises",
      nama: "Varises",
      gejala: "Pembuluh darah vena di betis kaki tampak membengkak, menonjol, dan berwarna biru keunguan.",
      penyebab: "Tekanan berlebih pada pembuluh vena akibat terlalu lama berdiri atau duduk bersila tanpa gerak.",
      caraCegah: "Hindari berdiri terlalu lama, lakukan peregangan kaki, dan biasakan meluruskan kaki setelah berolahraga.",
      audioNarasi: "Varises adalah pelebaran pembuluh vena di kaki. Faktor penyebabnya non-keturunan karena tekanan fisik saat berdiri atau menekuk kaki terlalu lama.",
      icon: "🦵",
      color: "#FF924C",
      faktorKategori: "Non-Keturunan",
      faktorJenis: "Tekanan Fisik & Posisi Tubuh",
      faktorPenjelasan: "Tekanan berlebih pada katup vena akibat berdiri terlalu lama, sering duduk bersila/menekuk kaki, atau kelebihan berat badan.",
      faktorBadgeColor: "#ea580c",
      faktorBadgeBg: "rgba(234, 88, 12, 0.12)",
      faktorIcon: "🧍"
    },
    {
      id: "hemofilia",
      nama: "Hemofilia",
      gejala: "Luka kecil mengeluarkan darah yang sangat lama berhenti dan sulit membeku.",
      penyebab: "Penyakit keturunan (genetik) di mana tubuh kekurangan faktor protein pembeku darah.",
      caraCegah: "Hati-hati terhadap cedera fisik benturan keras dan lakukan terapi suntik faktor pembeku sesuai anjuran dokter.",
      audioNarasi: "Hemofilia adalah gangguan peredaran darah bawaan atau faktor keturunan genetik dari orang tua, di mana darah sulit membeku saat terluka.",
      icon: "🩸",
      color: "#C1121F",
      faktorKategori: "Faktor Keturunan (Genetik)",
      faktorJenis: "Keturunan / Bawaan Genetik",
      faktorPenjelasan: "Kelainan genetik bawaan yang diwariskan dari orang tua (terpaut kromosom X), menyebabkan tubuh kekurangan protein pembeku darah.",
      faktorBadgeColor: "#991b1b",
      faktorBadgeBg: "rgba(153, 27, 27, 0.15)",
      faktorIcon: "🧬"
    }
  ],

  // 4. KUIS EDUKASI LATIHAN MENYUSUN ALUR PEREDARAN DARAH DENGAN ANIMASI
  circulationQuizData: {
    kecil: {
      id: "kecil",
      title: "Latihan Menyusun Alur Peredaran Darah Kecil",
      badge: "Jantung (Bilik Kanan) ➔ Paru-Paru ➔ Jantung (Serambi Kiri)",
      slogan: "Membersihkan darah kotor (CO₂) menjadi darah segar kaya Oksigen (O₂)",
      description: "Susunlah 5 tahapan organ dan pembuluh darah pada Peredaran Darah Kecil secara berurutan!",
      color: "#00b4d8",
      steps: [
        {
          id: "bilik_kanan",
          stepNum: 1,
          name: "Bilik Kanan",
          type: "jantung",
          gas: "Kaya CO₂ (Warna Biru)",
          icon: "❤️",
          desc: "Memompa darah kotor kaya CO₂ keluar dari jantung menuju paru-paru.",
          hint: "Langkah 1: Darah kotor pertama kali dipompa keluar dari ruang Bilik Kanan."
        },
        {
          id: "arteri_pulmonalis",
          stepNum: 2,
          name: "Arteri Pulmonalis",
          type: "pembuluh",
          gas: "Kaya CO₂ (Warna Biru)",
          icon: "🩸",
          desc: "Pembuluh nadi khusus yang membawa darah kotor dari bilik kanan menuju paru-paru.",
          hint: "Langkah 2: Pembuluh yang membawa darah menuju ke paru-paru adalah Arteri Pulmonalis."
        },
        {
          id: "paru_paru",
          stepNum: 3,
          name: "Paru-Paru (Alveolus)",
          type: "organ",
          gas: "Pertukaran Gas (CO₂ ➔ O₂)",
          icon: "🫁",
          desc: "Tempat pertukaran gas: melepaskan Karbon Dioksida dan mengikat Oksigen segar ke hemoglobin.",
          hint: "Langkah 3: Organ tempat terjadinya pembersihan darah dan pertukaran gas adalah Paru-Paru."
        },
        {
          id: "vena_pulmonalis",
          stepNum: 4,
          name: "Vena Pulmonalis",
          type: "pembuluh",
          gas: "Kaya O₂ (Warna Merah)",
          icon: "🩸",
          desc: "Pembuluh balik khusus yang membawa darah bersih kaya O₂ dari paru-paru kembali ke jantung.",
          hint: "Langkah 4: Pembuluh yang membawa darah bersih dari paru-paru ke jantung adalah Vena Pulmonalis."
        },
        {
          id: "serambi_kiri",
          stepNum: 5,
          name: "Serambi Kiri",
          type: "jantung",
          gas: "Kaya O₂ (Warna Merah)",
          icon: "❤️",
          desc: "Ruang penerima darah bersih dari paru-paru sebelum diteruskan ke bilik kiri.",
          hint: "Langkah 5: Darah bersih dari paru-paru masuk kembali ke jantung melalui Serambi Kiri."
        }
      ]
    },
    besar: {
      id: "besar",
      title: "Latihan Menyusun Alur Peredaran Darah Besar",
      badge: "Jantung (Bilik Kiri) ➔ Seluruh Tubuh ➔ Jantung (Serambi Kanan)",
      slogan: "Mengedarkan darah bersih kaya O₂ & nutrisi ke seluruh sel dan organ tubuh",
      description: "Susunlah 5 tahapan organ dan pembuluh darah pada Peredaran Darah Besar secara berurutan!",
      color: "#e63946",
      steps: [
        {
          id: "bilik_kiri",
          stepNum: 1,
          name: "Bilik Kiri",
          type: "jantung",
          gas: "Kaya O₂ (Warna Merah)",
          icon: "❤️",
          desc: "Memompa darah bersih kaya O₂ dengan tekanan otot sangat kuat ke seluruh tubuh.",
          hint: "Langkah 1: Peredaran darah besar berawal dari pemompaan kuat di Bilik Kiri."
        },
        {
          id: "aorta",
          stepNum: 2,
          name: "Aorta (Nadi Utama)",
          type: "pembuluh",
          gas: "Kaya O₂ (Warna Merah)",
          icon: "🩸",
          desc: "Pembuluh nadi terbesar tubuh yang membagi aliran darah ke kepala, tangan, dan organ tubuh.",
          hint: "Langkah 2: Pembuluh nadi utama terbesar yang menerima darah dari bilik kiri adalah Aorta."
        },
        {
          id: "seluruh_tubuh",
          stepNum: 3,
          name: "Seluruh Tubuh & Organ",
          type: "organ",
          gas: "Pertukaran Gas (O₂ ➔ CO₂)",
          icon: "🧍",
          desc: "Jaringan dan sel-sel tubuh mengambil O₂ & sari makanan lalu menghasilkan gas sisa CO₂.",
          hint: "Langkah 3: Darah dialirkan ke pembuluh kapiler jaringan di Seluruh Tubuh."
        },
        {
          id: "vena_cava",
          stepNum: 4,
          name: "Vena Cava (Vena Utama)",
          type: "pembuluh",
          gas: "Kaya CO₂ (Warna Biru)",
          icon: "🩸",
          desc: "Pembuluh balik utama yang mengumpulkan kembali darah kotor kaya CO₂ dari seluruh tubuh.",
          hint: "Langkah 4: Pembuluh balik utama yang mengumpulkan darah dari tubuh adalah Vena Cava."
        },
        {
          id: "serambi_kanan",
          stepNum: 5,
          name: "Serambi Kanan",
          type: "jantung",
          gas: "Kaya CO₂ (Warna Biru)",
          icon: "❤️",
          desc: "Ruang penerima darah kotor dari seluruh tubuh sebelum dialirkan ke bilik kanan.",
          hint: "Langkah 5: Darah kotor dari seluruh tubuh masuk kembali ke jantung melalui Serambi Kanan."
        }
      ]
    },
    gabungan: {
      id: "gabungan",
      title: "Latihan Menggabungkan Alur Utuh (Sirkulasi Ganda)",
      badge: "Sirkulasi Ganda Lengkap Berkelanjutan (10 Langkah)",
      slogan: "Menggabungkan Peredaran Darah Kecil & Besar Menjadi Satu Alur Utuh",
      description: "Gabungkan peredaran darah kecil dan darah besar menjadi satu siklus sirkulasi darah manusia yang berputar secara terus menerus!",
      color: "#8338ec",
      steps: [
        {
          id: "bilik_kanan",
          stepNum: 1,
          name: "Bilik Kanan",
          type: "jantung",
          gas: "Kaya CO₂",
          icon: "❤️",
          desc: "Memompa darah kotor ke paru-paru.",
          hint: "Mulai dari Bilik Kanan jantung."
        },
        {
          id: "arteri_pulmonalis",
          stepNum: 2,
          name: "Arteri Pulmonalis",
          type: "pembuluh",
          gas: "Kaya CO₂",
          icon: "🩸",
          desc: "Saluran nadi menuju ke paru-paru.",
          hint: "Darah dialirkan lewat Arteri Pulmonalis."
        },
        {
          id: "paru_paru",
          stepNum: 3,
          name: "Paru-Paru (Alveolus)",
          type: "organ",
          gas: "CO₂ ➔ O₂",
          icon: "🫁",
          desc: "Pertukaran gas: darah dibersihkan & diisi Oksigen segar.",
          hint: "Pembersihan darah berlangsung di Paru-Paru."
        },
        {
          id: "vena_pulmonalis",
          stepNum: 4,
          name: "Vena Pulmonalis",
          type: "pembuluh",
          gas: "Kaya O₂",
          icon: "🩸",
          desc: "Saluran balik pembawa darah bersih ke jantung.",
          hint: "Darah segar kembali lewat Vena Pulmonalis."
        },
        {
          id: "serambi_kiri",
          stepNum: 5,
          name: "Serambi Kiri",
          type: "jantung",
          gas: "Kaya O₂",
          icon: "❤️",
          desc: "Menerima darah bersih dari paru-paru.",
          hint: "Darah masuk ke Serambi Kiri."
        },
        {
          id: "bilik_kiri",
          stepNum: 6,
          name: "Bilik Kiri",
          type: "jantung",
          gas: "Kaya O₂",
          icon: "❤️",
          desc: "Memompa darah bersih dengan kuat ke seluruh tubuh.",
          hint: "Masuk ke Bilik Kiri pemompa utama tubuh."
        },
        {
          id: "aorta",
          stepNum: 7,
          name: "Aorta",
          type: "pembuluh",
          gas: "Kaya O₂",
          icon: "🩸",
          desc: "Pembuluh nadi utama pembagi darah ke seluruh organ.",
          hint: "Darah dipancarkan keluar melalui Aorta."
        },
        {
          id: "seluruh_tubuh",
          stepNum: 8,
          name: "Seluruh Tubuh",
          type: "organ",
          gas: "O₂ ➔ CO₂",
          icon: "🧍",
          desc: "Sel tubuh menyerap O₂ & nutrisi lalu menghasilkan CO₂.",
          hint: "Darah diedarkan ke Seluruh Tubuh."
        },
        {
          id: "vena_cava",
          stepNum: 9,
          name: "Vena Cava",
          type: "pembuluh",
          gas: "Kaya CO₂",
          icon: "🩸",
          desc: "Saluran vena utama pengumpul darah kotor dari tubuh.",
          hint: "Darah kotor dihimpun lewat Vena Cava."
        },
        {
          id: "serambi_kanan",
          stepNum: 10,
          name: "Serambi Kanan",
          type: "jantung",
          gas: "Kaya CO₂",
          icon: "❤️",
          desc: "Penerima darah kotor sebelum siklus berulang kembali ke bilik kanan.",
          hint: "Darah kembali ke Serambi Kanan untuk mengulang alur secara terus menerus."
        }
      ]
    }
  },

  // 5. ASESMEN MODEL PROBLEM-BASED LEARNING (PBL)
  pblCases: [
    {
      id: "kasus_1",
      title: "Kasus 1: Misteri Kakek Budi yang Cepat Lelah dan Pusing",
      badge: "Kesehatan Lansia & Jantung",
      icon: "👴",
      scenario: `Kakek Budi (usia 65 tahun) sering mengeluh pusing dan napasnya ngos-ngosan saat menaiki tangga rumah. Dokter memeriksa tekanan darah Kakek Budi dan hasilnya menunjukkan angka 165/100 mmHg. Dokter juga menemukan bahwa Kakek Budi sangat suka makan makanan yang asin, gorengan berlemak, dan jarang sekali berolahraga pagi.`,
      fase: {
        orientasi: {
          tanya: "Apa masalah utama yang dialami oleh Kakek Budi?",
          petunjuk: "Perhatikan angka tekanan darah 165/100 mmHg dan keluhan fisiknya.",
          pilihanMasalah: [
            "Kakek Budi mengalami kekurangan sel darah merah (Anemia)",
            "Kakek Budi mengalami Hipertensi (Tekanan Darah Tinggi) akibat pola makan dan kurang gerak",
            "Kakek Budi mengalami luka yang sulit membeku (Hemofilia)"
          ],
          kunci: 1
        },
        organisasi: {
          tanya: "Kelompokkan fakta dan gejala yang mendukung analisis kalian!",
          itemWajib: [
            { text: "Tekanan darah 165/100 mmHg (Jauh di atas normal 120/80 mmHg)", benar: true },
            { text: "Suka makan makanan asin & gorengan berlemak tinggi", benar: true },
            { text: "Sering pusing dan sesak napas saat naik tangga", benar: true },
            { text: "Kekurangan asupan zat besi pada sayuran bayam", benar: false }
          ]
        },
        penyelidikan: {
          title: "Virtual Lab: Uji Pengaruh Penumpukan Plak Lemak pada Arteri",
          deskripsi: "Simulasikan bagaimana timbunan lemak pada dinding arteri mempersempit jalur darah dan menaikkan tekanan pompa jantung!",
          sliderLabel: "Tingkat Plak Lemak Kolesterol (%)"
        },
        solusi: {
          tanya: "Susun 3 rencana aksi hidup sehat untuk membantu Kakek Budi!",
          opsiSolusi: [
            "Mengurangi konsumsi garam dan makanan cepat saji / gorengan",
            "Mulai rutin jalan kaki santai 20-30 menit setiap pagi",
            "Memperbanyak makan sayur, buah kaya kalium, dan minum air putih teratur",
            "Minum minuman berenergi tinggi setiap hari"
          ],
          kunciBenar: [0, 1, 2]
        },
        evaluasi: {
          rubrikTitle: "Refleksi & Rubrik Penilaian Diri",
          pertanyaanRefleksi: "Apa yang kamu pelajari tentang pentingnya menjaga elastisitas pembuluh darah sejak usia dini?"
        }
      }
    },
    {
      id: "kasus_2",
      title: "Kasus 2: Detak Jantung Sang Juara: Rahasia Atlet Lari Maraton",
      badge: "Fisiologi Olahraga & Nadi",
      icon: "🏃‍♂️",
      scenario: `Siti dan Kak Dimas (seorang atlet lari maraton) sama-sama berlari sprint selama 3 menit. Sebelum lari, denyut nadi Siti adalah 75 BPM dan Kak Dimas 55 BPM. Setelah lari 3 menit, denyut Siti melonjak ke 145 BPM dan butuh 15 menit untuk normal kembali, sedangkan Kak Dimas hanya 110 BPM dan sudah kembali normal hanya dalam waktu 3 menit! Siti bingung mengapa hal tersebut bisa terjadi.`,
      fase: {
        orientasi: {
          tanya: "Mengapa denyut nadi dan pemulihan atlet maraton jauh lebih efisien dibanding orang biasa?",
          petunjuk: "Kekuatan otot bilik kiri jantung atlet terlatih lebih prima.",
          pilihanMasalah: [
            "Jantung atlet memiliki otot yang lebih kuat sehingga volume darah per pompaan lebih besar dan efisien",
            "Atlet tidak membutuhkan oksigen saat berlari",
            "Darah atlet tidak mengandung sel darah putih"
          ],
          kunci: 0
        },
        organisasi: {
          tanya: "Manakah faktor yang memengaruhi frekuensi denyut nadi manusia?",
          itemWajib: [
            { text: "Tingkat aktivitas fisik / olahraga", benar: true },
            { text: "Kebugaran dan latihan kekuatan otot jantung", benar: true },
            { text: "Kondisi emosi atau stres", benar: true },
            { text: "Warna pakaian yang dikenakan saat lari", benar: false }
          ]
        },
        penyelidikan: {
          title: "Virtual Lab: Simulasi Kebutuhan Oksigen Otot vs Detak Jantung (BPM)",
          deskripsi: "Tingkatkan intensitas aktivitas dari Istirahat → Jalan Santai → Lari Cepat, lalu amati perubahan denyut jantung!",
          sliderLabel: "Intensitas Aktivitas Fisik"
        },
        solusi: {
          tanya: "Bagaimana cara kita melatih jantung agar sehat dan kuat seperti atlet?",
          opsiSolusi: [
            "Melakukan olahraga aerobik teratur (bersepeda, renang, lari santai) 3-5 kali seminggu",
            "Tidur teratur 8 jam setiap malam untuk regenerasi sel otot jantung",
            "Makan makanan kaya antioksidan dan protein sehat",
            "Berlari maraton tanpa pemanasan terlebih dahulu"
          ],
          kunciBenar: [0, 1, 2]
        },
        evaluasi: {
          rubrikTitle: "Refleksi Fisiologi Tubuh",
          pertanyaanRefleksi: "Bagaimana perasaanmu setelah memahami bahwa jantung adalah otot yang bisa dilatih menjadi semakin sehat?"
        }
      }
    },
    {
      id: "kasus_3",
      title: "Kasus 3: Bahaya Camilan: Mengapa Wajah Rani Sering Pucat dan Lesu?",
      badge: "Nutrisi Darah & Anemia",
      icon: "👧",
      scenario: `Rani adalah siswi kelas 6 SD yang sering tidak sarapan pagi. Di sekolah, ia lebih suka jajan keripik pedas dan minuman manis berwarna, serta menolak makan sayur bayam atau lauk tempe telur di rumah. Saat upacara bendera hari Senin, Rani tiba-tiba pingsan. Wajahnya terlihat pucat dan kelopak mata bagian dalamnya berwarna putih pudar.`,
      fase: {
        orientasi: {
          tanya: "Berdasarkan gejala fisik Rani, gangguan peredaran darah apa yang paling mungkin dialaminya?",
          petunjuk: "Wajah pucat, kelopak mata pucat, sering pingsan, dan menolak makan sayur.",
          pilihanMasalah: [
            "Rani menderita Anemia akibat defisiensi zat besi dan hemoglobin",
            "Rani menderita Hipertensi",
            "Rani menderita Varises di kaki"
          ],
          kunci: 0
        },
        organisasi: {
          tanya: "Tentukan makanan yang sangat dianjurkan untuk mengatasi masalah Rani!",
          itemWajib: [
            { text: "Sayuran hijau gelap (bayam, brokoli, daun singkong)", benar: true },
            { text: "Kacang-kacangan, telur, dan daging/hati ayam kaya zat besi", benar: true },
            { text: "Buah-buahan kaya Vitamin C untuk membantu penyerapan zat besi", benar: true },
            { text: "Minuman bersoda dan keripik berminyak", benar: false }
          ]
        },
        penyelidikan: {
          title: "Virtual Lab: Mikroskop Kadar Hemoglobin dan Jumlah Eritrosit",
          deskripsi: "Bandingkan sampel darah penderita Anemia dengan darah sehat di bawah mikroskop!",
          sliderLabel: "Kadar Asupan Zat Besi Harian"
        },
        solusi: {
          tanya: "Susun menu bekal sehat 4 Sehat 5 Sempurna untuk Rani di sekolah!",
          opsiSolusi: [
            "Nasi merah/putih + Telur dadar bayam + Tahu tempe + Buah jeruk manis",
            "Rutin sarapan bergizi sebelum berangkat sekolah",
            "Minum tablet tambah darah sesuai anjuran guru UKS / Puskesmas",
            "Hanya makan mie instan setiap hari"
          ],
          kunciBenar: [0, 1, 2]
        },
        evaluasi: {
          rubrikTitle: "Kampanye Hidup Sehat",
          pertanyaanRefleksi: "Apa komitmen pribadimu untuk memperbaiki menu makanan harianmu demi sel darah merah yang sehat?"
        }
      }
    }
  ]
};
