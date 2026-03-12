// ==================== ПЕРЕКЛЮЧЕНИЕ ТЕМЫ ====================

(function() {
    // Создаём кнопку
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle';
    btn.innerHTML = '🌙';
    btn.setAttribute('aria-label', 'Переключить тему');
    btn.title = 'Сменить тему';
    document.body.appendChild(btn);

    // Получаем сохранённую тему
    const savedTheme = localStorage.getItem('gitvova_theme') || 'light';
    
    // Применяем тему
    document.documentElement.setAttribute('data-theme', savedTheme);
    btn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';

    // Переключение
    btn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('gitvova_theme', newTheme);
        btn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        
        // Анимация
        btn.classList.add('is-animating');
        setTimeout(() => btn.classList.remove('is-animating'), 220);
        
        // Показываем уведомление
        if (typeof showNotification === 'function') {
            showNotification(`✨ Тема: ${newTheme === 'dark' ? 'тёмная' : 'светлая'}`, 'info');
        }
    });
})();