// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Копирование текста
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

// Задержка (для анимаций)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Генерация ID
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}