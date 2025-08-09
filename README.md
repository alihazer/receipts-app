# Receipts App

This is an Express.js application that allows authenticated users to upload an Excel sheet, specify a date and project name, and generate a paginated PDF of Arabic receipts. Each row of the Excel sheet becomes a separate receipt in the resulting PDF.

## Features

- Username/password authentication using Passport and sessions.
- Dashboard with an **Add records** button for uploading Excel files.
- Supports uploading `.xlsx`, `.xls`, or `.csv` files with `multer`.
- Generates a PDF using Puppeteer so that Arabic text is shaped correctly. The PDF contains one receipt per row of the uploaded file.
- Uses chunking and `pdf-lib` to merge PDFs when handling large Excel files to keep memory consumption low.
- Cleanup of temporary upload files and generated PDFs after download.
- EJS templates for the front‑end pages and the PDF.

## Getting Started

1. **Clone the repository**

   ```sh
   git clone https://github.com/<your‑username>/receipts-app.git
   cd receipts-app
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Create an environment file**

   Copy `.env.example` to `.env` and fill in the values. You need to set a session secret, admin username and a hashed admin password (use `bcrypt` to generate one).

   ```sh
   cp .env.example .env
   ```

4. **Run the application**

   ```sh
   npm start
   ```

5. **Navigate to** `http://localhost:3000` and log in with your admin credentials.

## Directory Structure

- `server.js` – entry point for the Express application
- `auth/` – Passport configuration
- `routes/` – Route handlers for the dashboard and file uploads
- `views/` – EJS templates
- `public/` – Static assets (CSS and fonts)
- `tmp/` – Temporary directory for file uploads and generated PDFs (ignored via `.gitignore`)

## Arabic PDF Rendering

The PDF generator uses the [Noto Naskh Arabic](https://fonts.google.com/specimen/Noto+Naskh+Arabic) font. To build receipts that render Arabic correctly, the `public/fonts` directory contains the `NotoNaskhArabic-Regular.ttf` file. If you replace the font or add your own, ensure that the CSS in `views/pdf-template.ejs` points to the correct font file.

## Notes

- This project is intended as a reference implementation. You can extend it by adding a progress bar, saving generated PDFs to persistent storage, or adding more fields to the receipt template.
- Do not commit sensitive information such as your session secret or admin password into the repository. Use environment variables instead.

## License

This project is licensed under the MIT License.
