const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const app = express();
const PORT = process.env.PORT || 3005;

// Папка с ZIP-проектами
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Простой "секрет" для админа
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'vova-admin-2026';
const ADMIN_PAGE_TOKEN = process.env.ADMIN_PAGE_TOKEN || 'vova777';

// Авто-создание папки downloads
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Базовые middlewares
app.use(cors());
app.use(express.json());

// Хранилище для multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOWNLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.zip';
    const base = path.basename(file.originalname, ext);
    cb(null, `${timestamp}-${base}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.zip')) {
      return cb(new Error('Можно загружать только ZIP файлы'));
    }
    cb(null, true);
  }
});

// Вспомогательные функции
function detectLanguageFromZip(zipPath) {
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    const counts = {
      javascript: 0,
      typescript: 0,
      python: 0,
      php: 0,
      csharp: 0,
      cpp: 0,
      java: 0,
      htmlcss: 0,
      other: 0
    };

    entries.forEach(entry => {
      if (entry.isDirectory) return;
      const ext = path.extname(entry.entryName).toLowerCase();

      switch (ext) {
        case '.js': counts.javascript++; break;
        case '.ts': case '.tsx': counts.typescript++; break;
        case '.py': counts.python++; break;
        case '.php': counts.php++; break;
        case '.cs': counts.csharp++; break;
        case '.cpp': case '.cc': case '.cxx': case '.h': case '.hpp': counts.cpp++; break;
        case '.java': counts.java++; break;
        case '.html': case '.htm': case '.css': counts.htmlcss++; break;
        default: counts.other++;
      }
    });

    const entriesCounts = Object.entries(counts);
    entriesCounts.sort((a, b) => b[1] - a[1]);
    const [bestLang, bestCount] = entriesCounts[0];

    if (!bestCount || bestCount === 0) return 'other';

    const map = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      php: 'PHP',
      csharp: 'C#',
      cpp: 'C++',
      java: 'Java',
      htmlcss: 'HTML/CSS',
      other: 'Other'
    };

    return map[bestLang] || 'Other';
  } catch (e) {
    return 'Other';
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function extractReadmeFromZip(zipPath) {
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    const readmeEntry = entries.find(e => {
      const name = e.entryName.toLowerCase();
      return !e.isDirectory && name.endsWith('readme.md');
    });
    if (!readmeEntry) return '';
    return readmeEntry.getData().toString('utf8');
  } catch (e) {
    return '';
  }
}

function decodeNameLatin1ToUtf8(name) {
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name;
  }
}

async function scanDownloads() {
  const files = await fs.promises.readdir(DOWNLOADS_DIR);
  const zipFiles = files.filter(f => f.toLowerCase().endsWith('.zip'));

  const projectsWithMeta = await Promise.all(
    zipFiles.map(async fileName => {
      const fullPath = path.join(DOWNLOADS_DIR, fileName);
      const stats = await fs.promises.stat(fullPath);
      const language = detectLanguageFromZip(fullPath);
      const readme = extractReadmeFromZip(fullPath);
      const ext = path.extname(fileName);
      const rawBase = path.basename(fileName, ext);
      const decodedBase = decodeNameLatin1ToUtf8(rawBase);
      const base = decodedBase.replace(/^\d{10,13}-/, '');

      return {
        id: fileName,
        title: base,
        description: `Проект на ${language}`,
        file: `/downloads/${encodeURIComponent(fileName)}`,
        size: formatFileSize(stats.size),
        date: formatDate(stats.mtime),
        type: language.toLowerCase(),
        readme,
        _mtimeMs: stats.mtimeMs
      };
    })
  );

  projectsWithMeta.sort((a, b) => (b._mtimeMs || 0) - (a._mtimeMs || 0));
  return projectsWithMeta.map(({ _mtimeMs, ...p }) => p);
}

// ===== 1. СНАЧАЛА ВСЕ API-МАРШРУТЫ =====
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await scanDownloads();
    res.json(projects);
  } catch (e) {
    res.status(500).json({ message: 'Не удалось получить проекты' });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const token = req.headers['x-admin-token'];
    if (!token || token !== ADMIN_TOKEN) {
      return res.status(403).json({ message: 'Нет доступа' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не найден' });
    }
    const projects = await scanDownloads();
    res.status(201).json({ message: 'Файл загружен', projects });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка загрузки файла' });
  }
});

app.get('/admin', (req, res) => {
  const key = req.query.key;
  if (!key || key !== ADMIN_PAGE_TOKEN) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  return res.redirect('/');
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const token = req.headers['x-admin-token'];
    if (!token || token !== ADMIN_TOKEN) {
      return res.status(403).json({ message: 'Нет доступа' });
    }
    const id = req.params.id;
    const safeName = path.basename(id);
    const fullPath = path.join(DOWNLOADS_DIR, safeName);
    const resolved = path.resolve(fullPath);
    const resolvedDownloads = path.resolve(DOWNLOADS_DIR) + path.sep;
    if (!resolved.startsWith(resolvedDownloads)) {
      return res.status(400).json({ message: 'Некорректный путь' });
    }
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Файл не найден' });
    }
    await fs.promises.unlink(fullPath);
    const projects = await scanDownloads();
    return res.json({ message: 'Удалено', projects });
  } catch (e) {
    return res.status(500).json({ message: 'Ошибка удаления' });
  }
});

// ===== 2. ТОЛЬКО ПОСЛЕ API СТАВИМ СТАТИКУ =====
app.use(express.static(__dirname));
app.use('/downloads', express.static(DOWNLOADS_DIR));

// ===== 3. ЗАПУСК СЕРВЕРА =====
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📦 Папка для ZIP: ${DOWNLOADS_DIR}`);
  console.log(`🔐 ADMIN_TOKEN: ${ADMIN_TOKEN}`);
  console.log(`🔐 ADMIN_PAGE_TOKEN: ${ADMIN_PAGE_TOKEN}`);
});