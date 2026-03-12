// ==================== КОНФИГУРАЦИЯ ====================
// Определяем базовый URL для API
const API_BASE = window.location.origin;
const API_URL = API_BASE + '/api/projects';
const UPLOAD_URL = API_BASE + '/api/upload';

let allProjects = [];
let isLoading = false;

// Хранилище для админ-токена (для /admin)
let adminToken = sessionStorage.getItem('gitvova_admin_token') || '';

const DEBUG = false;
function debugError(...args) {
    if (DEBUG) console.error(...args);
}

function isAdminPage() {
    return Boolean(document.getElementById('adminProjectsGrid'));
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async () => {
    createNotificationSystem();
    createAdminIndicator();
    setupFilters();

    // Если мы в админке — инициализируем drag&drop
    if (document.getElementById('dropZone')) {
        setupAdminUpload();
    }

    setupReadmeModal();

    await loadProjects();
});

// ==================== ЗАГРУЗКА ПРОЕКТОВ ====================
async function loadProjects() {
    try {
        isLoading = true;

        const latestGrid = document.getElementById('latestProjects');
        const projectsGrid = document.getElementById('projectsGrid') || document.getElementById('adminProjectsGrid');

        if (projectsGrid) {
            showSkeleton(projectsGrid, 6);
        }
        if (latestGrid) {
            showSkeleton(latestGrid, 3);
        }

        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Ошибка загрузки проектов');

        allProjects = await response.json();

        if (latestGrid) {
            displayProjects(latestGrid, allProjects.slice(0, 3));
        }

        if (projectsGrid) {
            displayProjects(projectsGrid, allProjects);
        }

        if (typeof updateStats === 'function') {
            updateStats(allProjects);
        }

        return allProjects;
    } catch (error) {
        debugError('❌ Ошибка:', error);
        showNotification('Не удалось загрузить проекты. Проверь, запущен ли сервер.', 'error');
        return [];
    } finally {
        isLoading = false;
    }
}

// ==================== SKELETON ====================
function showSkeleton(container, count) {
    const items = [];
    for (let i = 0; i < count; i++) {
        items.push(`
            <div class="project-card skeleton">
                <div class="project-card-header">
                    <div class="skeleton-line skeleton-title"></div>
                </div>
                <div class="skeleton-line skeleton-text"></div>
                <div class="skeleton-line skeleton-text short"></div>
                <div class="project-tags">
                    <span class="project-tag skeleton-pill"></span>
                    <span class="project-tag skeleton-pill"></span>
                </div>
                <div class="project-stats">
                    <span class="skeleton-line skeleton-stat"></span>
                    <span class="skeleton-line skeleton-stat"></span>
                </div>
                <div class="project-download skeleton-btn"></div>
            </div>
        `);
    }
    container.innerHTML = items.join('');
}

// ==================== ОТОБРАЖЕНИЕ ПРОЕКТОВ ====================
function displayProjects(container, projects) {
    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state" data-aos="fade-up">
                <div class="empty-state-icon">📂</div>
                <h3>Здесь пока тихо...</h3>
                <p>Закинь свой первый шедевр в админке, и он появится здесь магически ✨</p>
            </div>
        `;
        return;
    }

    const adminMode = isAdminPage() && container.id === 'adminProjectsGrid';

    container.innerHTML = projects.map((project, index) => {
        const typeLabel = project.type
            ? project.type.charAt(0).toUpperCase() + project.type.slice(1)
            : 'Проект';

        const languageIcon = getLanguageIcon(project.type);
        const color = getLanguageColor(project.type);

        return `
        <div class="project-card" data-id="${project.id}" data-tags="${project.type || ''}" 
             data-lang-color="${color}">
            <div class="project-card-header">
                <h3>${escapeHtml(project.title)}</h3>
                <div class="project-card-header-right">
                    <span class="project-lang-badge"><i class="${languageIcon}"></i> ${typeLabel}</span>
                    ${adminMode ? `<button class="delete-project-btn" type="button" aria-label="Удалить проект" title="Удалить">×</button>` : ``}
                </div>
            </div>
            <p>${escapeHtml(project.description || 'ZIP‑проект')}</p>
            <div class="project-tags">
                <span class="project-tag">${typeLabel}</span>
            </div>
            <div class="project-stats">
                <span>📦 ${project.size || '—'}</span>
                <span>📅 ${project.date || formatDate(new Date())}</span>
            </div>
            <div class="project-card-actions">
                <button class="project-open-readme" data-id="${project.id}">
                    <i class="fa-regular fa-file-lines"></i> README
                </button>
                <a href="${project.file}" class="project-download" download>
                    Открыть ZIP
                </a>
            </div>
        </div>
    `;
    }).join('');

    // GSAP stagger-анимация
    if (window.gsap) {
        gsap.from(container.querySelectorAll('.project-card'), {
            y: 40,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out'
        });
    }

    // Parallax tilt
    if (window.VanillaTilt) {
        VanillaTilt.init(container.querySelectorAll('.project-card'), {
            max: 10,
            speed: 400,
            glare: true,
            'max-glare': 0.15
        });
    }

    attachReadmeHandlers();
    attachGlowHandlers();
    if (adminMode) {
        attachDeleteHandlers();
    }
}

// ==================== ЗАЩИТА ОТ XSS ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

function getLanguageIcon(type = '') {
    const t = type.toLowerCase();
    if (t.includes('javascript') || t.includes('js')) return 'fa-brands fa-js';
    if (t.includes('typescript') || t.includes('ts')) return 'fa-solid fa-code';
    if (t.includes('python') || t.includes('py')) return 'fa-brands fa-python';
    if (t.includes('php')) return 'fa-brands fa-php';
    if (t.includes('c#') || t.includes('csharp')) return 'fa-solid fa-code';
    if (t.includes('c++') || t.includes('cpp')) return 'fa-solid fa-code';
    if (t.includes('java')) return 'fa-brands fa-java';
    if (t.includes('html') || t.includes('css')) return 'fa-brands fa-html5';
    return 'fa-regular fa-folder-open';
}

function getLanguageColor(type = '') {
    const t = (type || '').toLowerCase();
    if (t.includes('javascript') || t.includes('js')) return '#facc15';
    if (t.includes('typescript') || t.includes('ts')) return '#38bdf8';
    if (t.includes('python') || t.includes('py')) return '#3b82f6';
    if (t.includes('php')) return '#a855f7';
    if (t.includes('c#') || t.includes('csharp')) return '#22c55e';
    if (t.includes('c++') || t.includes('cpp')) return '#ec4899';
    if (t.includes('java')) return '#f97316';
    if (t.includes('html') || t.includes('css')) return '#fb923c';
    return '#22c55e';
}

// ==================== ФИЛЬТРЫ ====================
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.add('is-pressed');
            setTimeout(() => btn.classList.remove('is-pressed'), 200);

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            const grid = document.getElementById('projectsGrid');
            if (!grid) return;

            if (filter === 'all') {
                displayProjects(grid, allProjects);
            } else {
                const filtered = allProjects.filter(p =>
                    p.type && p.type.toLowerCase().includes(filter.toLowerCase())
                );
                displayProjects(grid, filtered);
            }
        });
    });
}

// ==================== АДМИН-ЗАГРУЗКА (Drag & Drop) ====================
function setupAdminUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('adminFileInput');
    const selectBtn = document.getElementById('selectFileBtn');

    if (!dropZone || !fileInput || !selectBtn) return;

    const params = new URLSearchParams(window.location.search);
    if (!params.get('key')) {
        window.location.href = '/';
        return;
    }

    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('is-dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('is-dragover');
        });
    });

    dropZone.addEventListener('drop', async (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) {
            await handleAdminUpload(file);
        }
    });

    selectBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleAdminUpload(file);
        }
        fileInput.value = '';
    });
}

async function handleAdminUpload(file) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
        showNotification('Можно загружать только ZIP файлы', 'error');
        return;
    }

    if (!adminToken) {
        const pwd = prompt('🔐 Введи пароль администратора:');
        if (!pwd) return;
        adminToken = pwd;
        sessionStorage.setItem('gitvova_admin_token', adminToken);
    }

    try {
        showNotification('⏫ Загружаю проект...', 'info');

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: {
                'x-admin-token': adminToken
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Ошибка загрузки');
        }

        if (Array.isArray(data.projects)) {
            allProjects = data.projects;
        } else {
            await loadProjects();
        }

        const grid = document.getElementById('adminProjectsGrid');
        if (grid) {
            displayProjects(grid, allProjects);
        }

        showNotification('✅ Проект загружен!', 'success');
        if (window.Swal) {
            Swal.fire({
                icon: 'success',
                title: 'Проект загружен',
                text: file.name,
                toast: true,
                position: 'top-end',
                timer: 2500,
                showConfirmButton: false
            });
        }

        if (window.AOS) {
            setTimeout(() => window.AOS.refreshHard(), 50);
        }
    } catch (error) {
        debugError(error);
        showNotification(error.message || 'Не удалось загрузить проект', 'error');
    }
}

// ==================== СИСТЕМА УВЕДОМЛЕНИЙ ====================
function createNotificationSystem() {
    if (!document.getElementById('notificationContainer')) {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = 'notification notification--' + type;
    notification.textContent = message;

    container.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.add('is-visible');
    });

    setTimeout(() => {
        notification.classList.remove('is-visible');
        setTimeout(() => {
            notification.remove();
        }, 250);
    }, 3000);
}

// ==================== АДМИН-ИНДИКАТОР ====================
function createAdminIndicator() {
    if (!document.getElementById('adminIndicator')) {
        const indicator = document.createElement('div');
        indicator.id = 'adminIndicator';
        indicator.className = 'admin-indicator';
        document.body.appendChild(indicator);
    }
}

// ==================== УТИЛИТЫ ====================
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
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

window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatFileSize = formatFileSize;

// ==================== README MODAL ====================
let readmeModal, readmeOverlay, readmeContent, readmeTitle;

function setupReadmeModal() {
    readmeOverlay = document.createElement('div');
    readmeOverlay.className = 'readme-overlay';
    readmeOverlay.innerHTML = `
        <div class="readme-modal glass">
            <div class="readme-modal-header">
                <h3 class="readme-modal-title">README</h3>
                <button class="readme-close" aria-label="Закрыть">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="readme-modal-body">
                <div class="readme-modal-content"></div>
            </div>
        </div>
    `;
    document.body.appendChild(readmeOverlay);

    readmeModal = readmeOverlay.querySelector('.readme-modal');
    readmeContent = readmeOverlay.querySelector('.readme-modal-content');
    readmeTitle = readmeOverlay.querySelector('.readme-modal-title');

    const closeBtn = readmeOverlay.querySelector('.readme-close');
    closeBtn.addEventListener('click', closeReadmeModal);
    readmeOverlay.addEventListener('click', (e) => {
        if (e.target === readmeOverlay) closeReadmeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeReadmeModal();
    });
}

function attachReadmeHandlers() {
    const buttons = document.querySelectorAll('.project-open-readme');
    if (!buttons.length) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const project = allProjects.find(p => p.id === id);
            if (!project) return;

            const raw = project.readme || '# README не найден\n\nДобавь README.md внутрь архива, чтобы здесь была документация.';

            let html = '';
            if (window.marked && typeof marked.parse === 'function') {
                html = marked.parse(raw);
            } else {
                html = '<pre>' + escapeHtml(raw) + '</pre>';
            }

            readmeTitle.textContent = project.title || 'README';
            readmeContent.innerHTML = html;
            readmeOverlay.classList.add('visible');
        });
    });
}

function closeReadmeModal() {
    if (readmeOverlay) {
        readmeOverlay.classList.remove('visible');
    }
}

// ==================== CARD GLOW (BACKGLOW) ====================
function attachGlowHandlers() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        const color = card.getAttribute('data-lang-color') || '#22c55e';
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const gradient = 'radial-gradient(circle at ' + x + 'px ' + y + 'px, ' + color + '55, transparent 70%)';
            card.style.setProperty('--card-glow', gradient);
        });
        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--card-glow', 'radial-gradient(circle at 50% 0%, transparent, transparent)');
        });
    });
}

// ==================== УДАЛЕНИЕ ПРОЕКТА (АДМИН) ====================
function attachDeleteHandlers() {
    const cards = document.querySelectorAll('#adminProjectsGrid .project-card');
    cards.forEach(card => {
        const btn = card.querySelector('.delete-project-btn');
        if (!btn) return;

        btn.addEventListener('click', async () => {
            const id = card.getAttribute('data-id');
            if (!id) return;

            const title = allProjects.find(p => p.id === id)?.title || id;
            const ok = confirm('Удалить проект "' + title + '"?');
            if (!ok) return;

            if (!adminToken) {
                const pwd = prompt('🔐 Введи пароль администратора:');
                if (!pwd) return;
                adminToken = pwd;
                sessionStorage.setItem('gitvova_admin_token', adminToken);
            }

            try {
                showNotification('🗑️ Удаляю...', 'info');

                const response = await fetch(API_BASE + '/api/projects/' + encodeURIComponent(id), {
                    method: 'DELETE',
                    headers: {
                        'x-admin-token': adminToken
                    }
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.message || 'Ошибка удаления');
                }

                if (Array.isArray(data.projects)) {
                    allProjects = data.projects;
                } else {
                    await loadProjects();
                }

                const grid = document.getElementById('adminProjectsGrid');
                if (grid) displayProjects(grid, allProjects);

                showNotification('✅ Удалено', 'success');
            } catch (e) {
                debugError(e);
                showNotification(e.message || 'Не удалось удалить', 'error');
            }
        });
    });
}