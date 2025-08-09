const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const XLSX = require('xlsx');
const { v4: uuid } = require('uuid');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const { PDFDocument } = require('pdf-lib');

// Configure Multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..', 'tmp'));
    },
    filename: (_req, file, cb) => {
      cb(null, uuid() + path.extname(file.originalname));
    }
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.xlsx', '.xls', '.csv'].includes(ext);
    cb(allowed ? null : new Error('Invalid file type'), allowed);
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

// GET route to display upload form
router.get('/upload', (req, res) => {
  res.render('upload', { error: null });
});

// POST route to process uploaded file and generate PDF
router.post('/upload', upload.single('excel'), async (req, res) => {
  try {
    const { project, date } = req.body;
    if (!project || !date || !req.file) {
      throw new Error('All fields are required.');
    }

    // Read and parse the Excel file
    const workbook = XLSX.readFile(req.file.path, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    let rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

    // Normalize values to strings
    rows = rows.map((r) => {
      const obj = {};
      Object.entries(r).forEach(([k, v]) => {
        obj[k] = (v || '').toString().trim();
      });
      return obj;
    });

    const CHUNK_SIZE = 400;
    const outputName = `receipts-${uuid()}.pdf`;
    const outputPath = path.join(__dirname, '..', 'tmp', outputName);

    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    let first = true;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const slice = rows.slice(i, i + CHUNK_SIZE);

      // Render HTML using EJS template
      const tplPath = path.join(__dirname, '..', 'views', 'pdf-template.ejs');
      const html = await ejs.renderFile(tplPath, { rows: slice, project, date }, {});

      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
      });

      if (first) {
        await fs.writeFile(outputPath, pdfBuffer);
        first = false;
      } else {
        const mainPdf = await PDFDocument.load(await fs.readFile(outputPath));
        const partPdf = await PDFDocument.load(pdfBuffer);
        const copied = await mainPdf.copyPages(partPdf, partPdf.getPageIndices());
        copied.forEach((p) => mainPdf.addPage(p));
        const merged = await mainPdf.save();
        await fs.writeFile(outputPath, merged);
      }
    }

    await browser.close();
    await fs.unlink(req.file.path).catch(() => {});

    // Provide download to the user and cleanup
    res.download(outputPath, outputName, async () => {
      setTimeout(() => fs.unlink(outputPath).catch(() => {}), 30000);
    });
  } catch (err) {
    console.error(err);
    if (req.file) {
      fs.unlink(req.file.path).catch(() => {});
    }
    res.status(400).render('upload', { error: err.message || 'Failed to process file.' });
  }
});

module.exports = router;
