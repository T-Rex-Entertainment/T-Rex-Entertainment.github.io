document.addEventListener('DOMContentLoaded', () => {
    // Установка cookie
    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
    }

    // Получение cookie
    function getCookie(name) {
        const matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([.$?*|{}()[]\\+^])/g, "\\$1") + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    // Переключение языка
    function switchLanguage(lang) {
        setCookie('userLang', lang, 365);
        const pathParts = window.location.pathname.split('/');
        pathParts[1] = lang;
        const newPath = pathParts.join('/');
        window.location.href = newPath;
    }

    const currentLang = window.location.pathname.split('/')[1];
    const supportedLangs = ['ru', 'en'];
    const langCookie = getCookie('userLang');

    if (!langCookie) {
        const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
        const isCIS = ['ru', 'uk', 'be', 'kk', 'ky', 'uz', 'tg', 'az', 'hy', 'mo', 'tk', 'ge'].includes(browserLang);
        const preferredLang = isCIS ? 'ru' : 'en';
        setCookie('userLang', preferredLang, 365);
        const pathParts = window.location.pathname.split('/');
        pathParts[1] = preferredLang;
        const newPath = pathParts.join('/');
        window.location.href = newPath;
    }

    // Куки-согласие
    const cookieConsent = getCookie('cookieConsent');
    const consentBanner = document.getElementById('cookie-consent');

    if (!cookieConsent && consentBanner) {
        consentBanner.style.display = 'block';

        document.getElementById('accept-cookies')?.addEventListener('click', () => {
            setCookie('cookieConsent', 'accepted', 365);
            consentBanner.style.display = 'none';
            location.reload();
        });

        document.getElementById('decline-cookies')?.addEventListener('click', () => {
            setCookie('cookieConsent', 'declined', 365);
            consentBanner.style.display = 'none';
            location.reload();
        });
    }

    // Кнопки смены языка
    document.getElementById('lang-ru')?.addEventListener('click', () => switchLanguage('ru'));
    document.getElementById('lang-en')?.addEventListener('click', () => switchLanguage('en'));

    // Соцсети hover
    const socialLinks = document.querySelectorAll('.header__links a img');
    socialLinks.forEach(img => {
        img.addEventListener('mouseover', () => img.style.transform = 'scale(1.1)');
        img.addEventListener('mouseout', () => img.style.transform = 'scale(1)');
    });

    // Кнопка прокрутки вверх
    const scrollToTopButton = document.querySelector('.scroll-to-top');
    window.addEventListener('scroll', () => {
        scrollToTopButton.style.display = window.scrollY > 100 ? 'block' : 'none';
    });

    scrollToTopButton?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Якорные ссылки
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            document.querySelector(targetId)?.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Прокрутка к контактам
    document.querySelector('.banner__button')?.addEventListener('click', () => {
        document.querySelector('.news-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Загрузка новостей по текущему языку
    const lang = currentLang || 'ru';
    loadNews(lang);
});

// ----------------------
// Обновлённая функция загрузки новостей
// ----------------------
async function loadNews(lang = 'ru') {
    try {
        const response = await fetch('/assets/json/news.json');
        const data = await response.json();
        const news = data[lang] || [];

        const container = document.getElementById('news-container');
        container.innerHTML = '';

        // Показываем только первые 3 новости
        news.slice(0, 3).forEach(item => {
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="news-image">
                <h2>${item.title}</h2>
                <p>${item.content}</p>
                <div class="date">${item.date}</div>
            `;
            container.appendChild(div);
        });

        document.getElementById('news-title').textContent = lang === 'ru' ? 'Новости' : 'News';

    } catch (error) {
        console.error('Ошибка загрузки новостей:', error);
    }
}