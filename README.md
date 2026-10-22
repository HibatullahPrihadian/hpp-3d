# Kalkulator HPP Cetak 3D

Aplikasi web untuk menghitung HPP (Harga Pokok Produksi) cetak 3D dan harga jual per margin. Rumus diturunkan langsung dari `HPP.xlsx` dan diverifikasi dengan angka aslinya.

## Rumus

| Komponen | Rumus | Contoh (Excel) |
|---|---|---|
| Biaya material | `berat gram / 1000 × harga filament per kg` | 55/1000 × 130.000 = **7.150** |
| Biaya penyusutan | `harga mesin / umur mesin (jam) × waktu cetak` | 13.000.000/5.000 × 4 = **10.400** |
| Biaya listrik | `daya printer (kW) × waktu cetak × tarif per kWh` | 0,5 × 4 × 1.350 = **2.700** |
| Subtotal HPP | `material + penyusutan + listrik + jasa cat` | **35.250** |
| Total HPP | `subtotal × (1 + risiko)` | 35.250 × 1,1 = **38.775** |
| Harga jual | `total HPP × (1 + persentase)` | 50% → **58.163** |
| Bersih | `harga jual − total HPP` | 50% → **19.388** |

Semua nilai dibulatkan ke rupiah penuh (half-up). Preset margin: 50%, 70%, 80%, 100%, 125% dan bisa ditambah/dihapus.

## Fitur

- Perhitungan real-time saat input berubah.
- Pengaturan mesin, listrik, risiko, dan margin disimpan otomatis di server sebagai nilai awal form.
- Riwayat perhitungan tersimpan di SQLite, bisa dibuka kembali dan dihapus.
- Cetak / simpan PDF (print stylesheet khusus).
- Salin ringkasan format WhatsApp.
- Mode gelap (mengikuti preferensi sistem, bisa diubah manual).
- Format Rupiah Indonesia; input menerima `,` maupun `.` sebagai desimal/pemisah ribuan.

## Menjalankan dengan Docker (disarankan)

```bash
docker compose up -d --build
```

Buka http://localhost:8080. Data tersimpan di volume `hpp-data` sehingga tetap ada setelah container dihapus/dibuat ulang. Ganti port host dengan env `HPP_PORT`, mis. `HPP_PORT=3001 docker compose up -d`.

Tanpa Compose:

```bash
docker build -t hpp-3d .
docker run -d --name hpp-3d -p 8080:3001 -v hpp-data:/data hpp-3d
```

Konfigurasi container:

| Env | Default | Keterangan |
|---|---|---|
| `PORT` | `3001` | Port HTTP di dalam container |
| `DATABASE_PATH` | `/data/hpp.db` | Lokasi file SQLite |
| `HPP_PORT` | `8080` | Port host yang dipetakan Compose |

Backup data:

```bash
docker run --rm -v hpp-data:/data -v "$PWD":/backup alpine tar czf /backup/hpp-data.tar.gz -C /data .
```

## Pengembangan lokal

Butuh Node.js 24+ (memakai modul bawaan `node:sqlite`).

```bash
npm install
npm run dev      # server :3001 + client :5173
```

Buka http://localhost:5173. Vite mem-proxy `/api` ke server.

Perintah lain:

```bash
npm test                         # unit test rumus + API
npm run typecheck                # typecheck server & shared
npm run typecheck --workspace client
npm run build                    # build client ke client/dist
npm start                        # jalankan server (menyajikan client/dist)
```

## Struktur

```
shared/src/calc.ts        rumus HPP murni (dipakai client & server)
shared/src/format.ts      format Rupiah + parser angka id/en
server/src/db.ts          SQLite, migrasi, seed default
server/src/routes/        endpoint settings & calculations
client/src/App.tsx        halaman kalkulator
client/src/components/    form, rincian biaya, tabel margin, riwayat, aksi
```

## API

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/health` | status server |
| GET | `/api/settings` | pengaturan tersimpan (seed otomatis) |
| PUT | `/api/settings` | simpan pengaturan |
| GET | `/api/calculations?limit=100&q=` | riwayat terbaru |
| POST | `/api/calculations` | simpan perhitungan; server menghitung ulang dan menolak total yang tidak cocok |
| DELETE | `/api/calculations/:id` | hapus riwayat |

## Catatan keamanan

Tidak ada autentikasi (single-tenant). Jika di-deploy ke internet, lindungi dengan reverse proxy + basic auth atau VPN; jangan ekspos port 3001 langsung ke publik.
