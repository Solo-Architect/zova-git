// ==================== СТАТИСТИКА ДЛЯ СТРАНИЦЫ "ОБО МНЕ" ====================

// Обновление статистики
async function updateStats(projects) {
    try {
        const count = projects.length;
        
        // Обновляем счётчик проектов
        const countElement = document.getElementById('project-count');
        if (countElement) {
            countElement.classList.add('stat-bump');
            countElement.textContent = count;
            setTimeout(() => countElement.classList.remove('stat-bump'), 300);
        }
        
        // Обновляем полоски навыков
        if (count > 0) {
            let htmlCount = 0, cssCount = 0, jsCount = 0;
            
            projects.forEach(p => {
                const type = (p.type || '').toLowerCase();
                if (type.includes('html')) htmlCount++;
                if (type.includes('css')) cssCount++;
                if (type.includes('javascript') || type.includes('js')) jsCount++;
            });
            
            const htmlPercent = Math.round((htmlCount / count) * 100);
            const cssPercent = Math.round((cssCount / count) * 100);
            const avgPercent = Math.round((htmlPercent + cssPercent) / 2);
            const jsPercent = Math.round((jsCount / count) * 100);
            
            const skillItems = document.querySelectorAll('.skill-item');
            if (skillItems.length >= 2) {
                updateSkillBar(skillItems[0], avgPercent, 'HTML/CSS');
                updateSkillBar(skillItems[1], jsPercent, 'JavaScript');
            }
        } else {
            document.querySelectorAll('.skill-item').forEach((item, index) => {
                updateSkillBar(item, 0, index === 0 ? 'HTML/CSS' : 'JavaScript');
            });
        }
    } catch (error) {
        // Тихо игнорируем ошибки статистики (не ломаем страницу и не спамим консоль)
    }
}

function updateSkillBar(skillItem, percent, skillName) {
    const bar = skillItem.querySelector('.skill-progress');
    const nameElement = skillItem.querySelector('.skill-name');
    
    if (bar) {
        bar.style.width = percent + '%';
    }
    
    if (nameElement) {
        nameElement.innerHTML = `${skillName} <span class="skill-percent">${percent}%</span>`;
    }
}

// Делаем функцию глобальной
window.updateStats = updateStats;