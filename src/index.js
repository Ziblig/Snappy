// Підключаємо файл, який відповідає за перемикачі / UI-стани (наприклад тема, вигляд)
import './js/switch';

// Підключаємо основну логіку нотаток:
// модалка, CRUD, рендер, синхронізація з Google Calendar
import './js/note-modal';

// Підключаємо логіку бокового меню (sidebar)
import './js/sidebar';

// Імпортуємо функції ініціалізації Google API та OAuth
import { gapiLoaded, gisLoaded } from './js/google-api.js';

// Чекаємо, поки сторінка повністю завантажиться
// це гарантує, що всі DOM-елементи та зовнішні скрипти вже доступні
window.addEventListener('load', () => {

    // Ініціалізуємо Google API (gapi)
    // готує клієнт для роботи з Google Calendar
    gapiLoaded();

    // Ініціалізуємо Google Identity Services (GIS)
    // готує OAuth для отримання токена доступу
    gisLoaded();
});
