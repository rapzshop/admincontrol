// Firebase config
const firebaseConfig = {
  databaseURL: "https://pembayaran-8587d-default-rtdb.asia-southeast1.firebasedatabase.app",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function cariTransaksi() {
  const id = document.getElementById("idTransaksi").value.trim();
  const hasil = document.getElementById("hasilTransaksi");
  const error = document.getElementById("error");
  hasil.style.display = "none";
  error.textContent = "";

  if (!id) {
    error.textContent = "❗ Masukkan ID transaksi.";
    return;
  }

  db.ref("pesanan/" + id).once("value").then((snap) => {
    if (!snap.exists()) {
      error.textContent = "❌ ID tidak ditemukan.";
      return;
    }

    const data = snap.val();
    hasil.innerHTML = `
      <p><b>Nama:</b> ${data.nama}</p>
      <p><b>WA:</b> ${data.wa}</p>
      <p><b>Produk:</b> ${data.produk}</p>
      <p><b>Email:</b> ${data.email || '-'}</p>
      <p><b>Harga:</b> Rp${data.harga}</p>
      <p><b>Metode:</b> ${data.metode}</p>
      <p><b>Waktu:</b> ${data.waktu}</p>
      <p><b>Status:</b> ${data.status}</p>
      <button onclick="konfirmasi('${id}')">✅ Konfirmasi & Kirim WA</button>
      <button onclick="hapus('${id}')">🗑 Hapus</button>
    `;
    hasil.style.display = "block";
  });
}

function konfirmasi(id) {
  db.ref("pesanan/" + id).once("value").then((snap) => {
    const data = snap.val();
    if (!data) return alert("❌ Data tidak ditemukan.");

    db.ref("pesanan/" + id + "/status").set("selesai").then(() => {
      alert("✅ Transaksi dikonfirmasi.");
      kirimWA(data);
      cariTransaksi();
    });
  });
}

function hapus(id) {
  if (confirm("Hapus transaksi ini?")) {
    db.ref("pesanan/" + id).remove().then(() => {
      alert("🗑 Transaksi dihapus.");
      document.getElementById("hasilTransaksi").style.display = "none";
    });
  }
}

function tambahStok() {
  const produk = document.getElementById("produkRestock").value;
  const jumlah = parseInt(document.getElementById("jumlahRestock").value);
  const status = document.getElementById("restockStatus");

  if (!jumlah || jumlah <= 0) {
    status.style.color = "red";
    status.textContent = "❌ Masukkan jumlah yang valid.";
    return;
  }

  const stokRef = db.ref("stok/" + produk);
  stokRef.once("value").then((snap) => {
    const current = snap.val() || 0;
    stokRef.set(current + jumlah).then(() => {
      status.style.color = "green";
      status.textContent = `✅ Stok ${produk} jadi ${current + jumlah}`;
      document.getElementById("jumlahRestock").value = "";
    });
  });
}

function kirimWA(data) {
  const token = "5GMYufEN5CdzTGmwdTn4"; // fonnte
  let email = data.email || "-";
  if (data.produk === "alight") email = "kerewasfas-9754@yopmail.com";
  if (data.produk === "am1thn") email = "biceeake-115@yopmail.com";

  const pesan = `✅ Pesanan ${data.produk === "canva" ? "Canva Pro" : data.produk === "am1thn" ? "AM Premium Sharing" : "Alight Motion"} Anda Telah Dikonfirmasi!
📧 Email: ${email}
💳 Metode: ${data.metode}
💰 Harga: Rp ${data.harga}
🕒 Waktu: ${data.waktu}

Tutorial: https://jpst.it/3UWRT
Terima kasih 🙏

> Sent via fonnte.com`;

  fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: token },
    body: new URLSearchParams({
      target: data.wa,
      message: pesan,
    }),
  })
  .then(() => console.log("✅ WA Terkirim"))
  .catch(() => console.error("❌ Gagal kirim WA"));
}
