import $ from "jquery";

// Об'єкт із перекладами
export const translations = {
    cz: {
        settingsTitle: "Nastavení",
        userNameLabel: "Vaše jméno",
        langLabel: "Jazyk rozhraní",
        notesTitle: "Poznámky",
        calendarTitle: "Stav kalendáře",
        placeholderName: "Zadejte jméno...",
        syncText: "Poznámky jsou synchronizované",
        backBtn: "← Zpět",
        hello: "Vítejte,"
    },
    en: {
        settingsTitle: "Settings",
        userNameLabel: "Your Name",
        langLabel: "Interface Language",
        notesTitle: "Notes",
        calendarTitle: "Calendar Status",
        placeholderName: "Enter name...",
        syncText: "Notes currently synced",
        backBtn: "← Back",
        hello: "Hello,"
    }
};

// Отримання поточної мови
export function getCurrentLang() {
    return localStorage.getItem('app-lang') || 'en';
}

// Оновлення привітання в хедері
export function updateUserGreeting() {
    const name = localStorage.getItem('user-name');
    const lang = getCurrentLang();
    const t = translations[lang];
    
    if (name) {
        $('#user-greeting').text(`${t.hello} ${name}!`);
    } else {
        $('#user-greeting').text('');
    }
}

// Функція збереження налаштувань
export function initSettingsListeners() {
    $(document).on('input', '#settings-user-name', function() {
        localStorage.setItem('user-name', $(this).val());
        updateUserGreeting();
    });

    $(document).on('change', '#settings-lang', function() {
        const newLang = $(this).val();
        const inputName = $('#settings-user-name').val();
        if (inputName && inputName.trim()) {
            localStorage.setItem('user-name', inputName.trim());
        }
        localStorage.setItem('app-lang', newLang);
        updateUserGreeting();
        // notify app about language change instead of reloading
        $(document).trigger('app:langChanged');
    });
}