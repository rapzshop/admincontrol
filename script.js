document.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    databaseURL: "https://pembayaran-8587d-default-rtdb.asia-southeast1.firebasedatabase.app",
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  const hasilEl = document.getElementById("hasilTransaksi");
  const errorEl = document.getElementById("error");

  document.getElementById("btnCari").addEventListener("click", cariTransaksi);
  document.getElementById("btnRestock").addEventListener("click", tambahStok);

  function cariTransaksi() {
    const id = document.getElementById("idTransaksi").value.trim();
    hasilEl.style.display = "none";
    errorEl.textContent = "";

    if (!id) return (errorEl.textContent = "⚠️ Masukkan ID Transaksi terlebih dahulu.");

    db.ref("pesanan/" + id).once("value").then((snapshot) => {
      if (!snapshot.exists()) {
        errorEl.textContent = "❌ ID Transaksi tidak ditemukan.";
        return;
      }

      const data = snapshot.val();
      hasilEl.innerHTML = `
        <p><b>Nama:</b> ${data.nama}</p>
        <p><b>WA:</b> ${data.wa}</p>
        <p><b>Produk:</b> ${data.produk}</p>
        <p><b>Email:</b> ${data.email || '-'}</p>
        <p><b>Harga:</b> Rp${data.harga}</p>
        <p><b>Metode:</b> ${data.metode}</p>
        <p><b>Waktu:</b> ${data.waktu}</p>
        <p><b>Status:</b> ${data.status}</p>
        <button onclick="konfirmasiTransaksi('${id}')">✅ Tandai Selesai</button>
        <button onclick="hapusTransaksi('${id}')">🗑 Hapus Transaksi</button>
      `;
      hasilEl.style.display = "block";
    });
  }

  window.konfirmasiTransaksi = function (id) {
    db.ref("pesanan/" + id).once("value").then((snapshot) => {
      const data = snapshot.val();
      if (!data) return alert("❌ Transaksi tidak ditemukan.");

      db.ref("pesanan/" + id + "/status").set("selesai").then(() => {
        alert("✅ Transaksi dikonfirmasi.");
        kirimWA(data);
        cariTransaksi();
      });
    });
  };

  window.hapusTransaksi = function (id) {
    if (confirm("Yakin ingin menghapus transaksi ini?")) {
      db.ref("pesanan/" + id).remove().then(() => {
        alert("🗑 Transaksi dihapus.");
        hasilEl.style.display = "none";
      });
    }
  };

  function tambahStok() {
    const produk = document.getElementById("produkRestock").value;
    const tambah = parseInt(document.getElementById("jumlahRestock").value);
    const result = document.getElementById("restockResult");

    if (!tambah || tambah < 1) {
      result.innerHTML = "<span class='error'>❗ Masukkan jumlah yang valid.</span>";
      return;
    }

    const stokRef = db.ref("stok/" + produk);
    stokRef.once("value").then((snapshot) => {
      const current = snapshot.val() || 0;
      const updated = current + tambah;
      stokRef.set(updated).then(() => {
        result.textContent = `✅ Stok ${produk} berhasil ditambah menjadi ${updated}`;
        document.getElementById("jumlahRestock").value = "";
      });
    });
  }

  function kirimWA(data) {
    const fonnteToken = "5GMYufEN5CdzTGmwdTn4";

    let produkLabel = "";
    let emailProduk = "";

    switch (data.produk) {
      case "alight":
        produkLabel = "Alight Motion Premium";
        emailProduk = "kerewasfas-9754@yopmail.com";
        break;
      case "canva":
        produkLabel = "Canva Pro 1 Bulan";
        emailProduk = data.email || "-";
        break;
      case "am1thn":
        produkLabel = "AM Premium Sharing";
        emailProduk = "biceeake-115@yopmail.com";
        break;
      default:
        produkLabel = data.produk;
        emailProduk = data.email || "-";
    }

    const pesan = `✅ Pesanan ${produkLabel} Anda Telah Dikonfirmasi!\n📧 Email: ${emailProduk}\n💳 Metode: ${data.metode}\n💰 Harga: Rp ${data.harga}\n🕒 Waktu: ${data.waktu}\n\nTutorial: https://jpst.it/3UWRT\nTerima kasih 🙏\n\n`;

    fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: fonnteToken,
      },
      body: new URLSearchParams({
        target: data.wa,
        message: pesan,
      }),
    }).then(() => {
      console.log("✅ Pesan WA terkirim ke", data.wa);
    }).catch((e) => {
      console.error("❌ Gagal kirim WA:", e);
    });
  }
});
