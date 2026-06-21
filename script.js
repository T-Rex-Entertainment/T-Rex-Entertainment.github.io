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
    updateGameButtons();
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

// ----------------------
// Корзина
// ----------------------

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(game) {
    let cart = getCart();

    const existingGame = cart.find(item => item.id === game.id);

    if (existingGame) {
        existingGame.quantity += 1;
    } else {
        cart.push({
            id: game.id,
            title: game.title,
            price: Number(game.price),
            image: game.image,
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartCount();
    updateGameButtons();

    showNotification('Игра добавлена в корзину');
}

function removeFromCart(gameId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== gameId);

    saveCart(cart);
    renderCart();
    updateCartCount();
}


function updateCartCount() {
    const cart = getCart();

    const count = cart.reduce((sum, item) => {
        return sum + item.quantity;
    }, 0);

    const badge = document.getElementById('cart-count-badge');

    if (!badge) return;

    if (count === 0) {
        badge.classList.add('hidden');
    } else {
        badge.classList.remove('hidden');
        badge.textContent = count;
        badge.classList.remove('bump');

        void badge.offsetWidth;

        badge.classList.add('bump');
    }
}

function checkoutOrder() {
    const cart = getCart();

    if (cart.length === 0) {
        showNotification('Корзина пуста');
        return;
    }

    showNotification('Заказ успешно оформлен');

    localStorage.removeItem('cart');
    renderCart();
    updateCartCount();
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('add-to-cart')) {
        const button = event.target;

        const game = {
            id: button.dataset.id,
            title: button.dataset.title,
            price: button.dataset.price,
            image: button.dataset.image
        };

        addToCart(game);
    }
});

function showNotification(message) {
    const notification = document.createElement('div');

    notification.className = 'notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('hide');

        setTimeout(() => {
            notification.remove();
        }, 300);

    }, 2500);
}

function renderCart() {
    const cartContainer = document.getElementById('cart-container');
    const cartActions = document.querySelector('.cart-actions');

    if (!cartContainer) return;

    const cart = getCart();

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="cart-empty">
                <h2>Корзина пуста</h2>
                <p>Вы пока не добавили ни одной игры.</p>
                <a href="/ru/our-games" class="cart-btn cart-btn-main">
                    Перейти к играм
                </a>
            </div>
        `;

        if (cartActions) {
            cartActions.style.display = 'none';
        }

        return;
    }

    if (cartActions) {
        cartActions.style.display = 'flex';
    }

    let total = 0;

    let html = `
        <div class="cart-table">
            <div class="cart-row cart-header">
                <div>Игра</div>
                <div>Цена</div>
                <div>Количество</div>
                <div>Сумма</div>
                <div>Действие</div>
            </div>
    `;

    cart.forEach(item => {
        const sum = item.price * item.quantity;
        total += sum;

        html += `
            <div class="cart-row">
                <div>${item.title}</div>
                <div>${item.price} ₽</div>
                <div class="quantity-controls">
                    <button onclick="decreaseQuantity('${item.id}')">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="increaseQuantity('${item.id}')">+</button>
                </div>
                <div>${sum} ₽</div>
                <div>
                    <button class="cart-remove" onclick="removeFromCart('${item.id}')">
                        Удалить
                    </button>
                </div>
            </div>
        `;
    });

    html += `
        </div>

        <div class="cart-total">
            <h2>Итого: ${total} ₽</h2>
        </div>
    `;

    cartContainer.innerHTML = html;
}

function increaseQuantity(gameId) {
    const cart = getCart();
    const item = cart.find(game => game.id === gameId);

    if (item) {
        item.quantity += 1;
    }

    saveCart(cart);
    renderCart();
    updateCartCount();
}

function decreaseQuantity(gameId) {
    let cart = getCart();
    const item = cart.find(game => game.id === gameId);

    if (item) {
        item.quantity -= 1;

        if (item.quantity <= 0) {
            cart = cart.filter(game => game.id !== gameId);
        }
    }

    saveCart(cart);
    renderCart();
    updateCartCount();
}

function clearCart() {
    const cart = getCart();

    if (cart.length === 0) {
        showNotification('Корзина уже пуста');
        return;
    }

    showConfirmModal(
        'Очистить корзину?',
        'Все выбранные игры будут удалены из корзины.',
        function() {
            localStorage.removeItem('cart');
            renderCart();
            updateCartCount();
            showNotification('Корзина очищена');
        }
    );
}

function showConfirmModal(title, text, onConfirm) {
    const oldModal = document.querySelector('.confirm-modal-overlay');

    if (oldModal) {
        oldModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'confirm-modal-overlay';

    modal.innerHTML = `
        <div class="confirm-modal">
            <h2>${title}</h2>
            <p>${text}</p>

            <div class="confirm-modal-buttons">
                <button class="cart-btn" id="cancel-confirm">
                    Отмена
                </button>

                <button class="cart-btn cart-btn-main" id="accept-confirm">
                    Очистить
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('cancel-confirm').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('accept-confirm').addEventListener('click', () => {
        onConfirm();
        modal.remove();
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    });
}

function renderCheckoutTotal() {
    const totalBlock = document.getElementById('checkout-total');

    if (!totalBlock) return;

    const cart = getCart();

    if (cart.length === 0) {
        totalBlock.innerHTML = `
            <p>Корзина пуста. Добавьте игры перед оформлением заказа.</p>
        `;
        return;
    }

    const total = cart.reduce((sum, item) => {
        return sum + item.price * item.quantity;
    }, 0);

    totalBlock.innerHTML = `<h2>Итого к оплате: ${total} ₽</h2>`;
}

function generateGameKey(gameTitle, index) {
    const prefix = gameTitle
        .toUpperCase()
        .replace(/[^A-ZА-Я0-9]/g, '')
        .slice(0, 3);

    const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    return `${prefix}-TRX-${2025 + index}-${randomPart}`;
}

function submitCheckout(event) {
    event.preventDefault();

    const cart = getCart();

    if (cart.length === 0) {
        showNotification('Корзина пуста');
        return;
    }

    if (typeof emailjs === 'undefined') {
        showNotification('Ошибка подключения EmailJS');
        return;
    }

    const form = event.target;

    const userName = form.querySelector('input[type="text"]').value;
    const userEmail = form.querySelector('input[type="email"]').value;

    const orderItems = cart.map(item => {
        return `${item.title} — ${item.quantity} шт. × ${item.price} ₽`;
    }).join('\n');

    const orderTotal = cart.reduce((sum, item) => {
        return sum + item.price * item.quantity;
    }, 0);

    const gameKeys = cart.map((item, index) => {
        const keys = [];

        for (let i = 0; i < item.quantity; i++) {
            keys.push(`${item.title}: ${generateGameKey(item.title, index + i)}`);
        }

        return keys.join('\n');
    }).join('\n');

    const templateParams = {
        user_name: userName,
        user_email: userEmail,
        to_email: userEmail,
        order_items: orderItems,
        order_total: orderTotal,
        game_keys: gameKeys
    };

    emailjs.init({
        publicKey: EMAILJS_PUBLIC_KEY
    });

    showNotification('Отправляем ключи на почту...');

    emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
    ).then(() => {
        localStorage.removeItem('cart');
        renderCheckoutTotal();
        updateCartCount();

        showNotification('Заказ оформлен. Ключи отправлены на почту');

        setTimeout(() => {
            window.location.href = '/ru/our-games';
        }, 2000);
    }).catch((error) => {
        console.error('EmailJS error:', error);
        showNotification('Ошибка отправки письма');
    });
}

function updateGameButtons() {
    const cart = getCart();

    document.querySelectorAll('.add-to-cart').forEach(button => {
        const gameId = button.dataset.id;
        const gameInCart = cart.find(item => item.id === gameId);

        if (gameInCart) {
            button.textContent = `✓ В корзине (${gameInCart.quantity})`;
            button.classList.add('added-to-cart');
        } else {
            button.textContent = 'Добавить в корзину';
            button.classList.remove('added-to-cart');
        }
    });
}

const EMAILJS_PUBLIC_KEY = 'ACAEP5eNXrgfK9kV0';
const EMAILJS_SERVICE_ID = 'service_qxht6ib';
const EMAILJS_TEMPLATE_ID = 'template_vmsdlwn';

document.addEventListener('click', function(event) {
    const burgerBtn = event.target.closest('#burger-btn');

    if (burgerBtn) {
        const menu = document.getElementById('header-menu');

        if (menu) {
            menu.classList.toggle('active');
        }
    }
});

document.addEventListener('click', function(e) {

    const toggle = e.target.closest('.dropdown-toggle');

    if (!toggle) return;

    const dropdown = toggle.closest('.nav-dropdown');

    dropdown.classList.toggle('open');

});