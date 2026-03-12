// ==================== ГЛАВНЫЙ ФАЙЛ ====================
// Здесь общие функции и инициализация

document.addEventListener('DOMContentLoaded', function() {
    // Подсветка активного пункта меню
    highlightActiveNav();
    
    // Инициализация контактной формы
    initContactForm();
    
    // Кликабельные карточки контактов
    initContactLinks();
});

// Подсветка активного пункта меню
function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav__link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}

// Инициализация контактной формы (если есть)
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name')?.value.trim();
        const message = document.getElementById('message')?.value.trim();
        
        if (!name || !message) {
            alert('❌ Заполни имя и сообщение');
            return;
        }
        
        alert('✅ Сообщение отправлено! (демо-режим)');
        contactForm.reset();
    });
}

// Клика по карточкам контактов (Telegram / WhatsApp)
function initContactLinks() {
    const items = document.querySelectorAll('.contact-item[data-url]');
    if (!items.length) return;
    
    items.forEach(item => {
        item.addEventListener('click', (e) => {
            // Если кликнули прямо по ссылке <a>, даём ей сработать как обычно
            if (e.target.closest('a')) return;
            
            const url = item.getAttribute('data-url');
            const textToCopy = item.getAttribute('data-copy');
            
            if (url) {
                window.open(url, '_blank');
            }
            
            if (textToCopy && typeof copyToClipboard === 'function') {
                copyToClipboard(textToCopy);
            }
        });
    });
}

// Копирование в буфер обмена
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        if (typeof showNotification === 'function') {
            showNotification('✅ Скопировано!', 'success');
        } else {
            alert('Скопировано!');
        }
    }).catch(() => {
        alert('Не удалось скопировать');
    });
}

// Форматирование даты
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}