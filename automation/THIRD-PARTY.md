# Dependensi proses sinkronisasi

Dependensi hanya dipasang pada GitHub Actions, bukan di browser atau fungsi Vercel:

- google-auth 2.62.0 — Apache-2.0, https://pypi.org/project/google-auth/2.62.0/
- requests 2.34.2 — Apache-2.0, https://pypi.org/project/requests/2.34.2/
- pypdfium2 5.14.0 — Apache-2.0/BSD-3-Clause dan lisensi PDFium/dependensi yang dibundel dalam paket resminya, https://pypi.org/project/pypdfium2/5.14.0/
- Pillow 12.3.0 — HPND, https://pypi.org/project/Pillow/12.3.0/

Versi dipatok di requirements.txt. Lisensi binari dan sumber dependensi berada pada distribusi pip masing-masing; paket ini tidak menyertakan ulang binarinya.
