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
        hello: "Vítejte,",
        modalNewTitle: "Nová poznámka",
        modalEditTitle: "Upravit poznámku",
        summaryLabel: "Název",
        descriptionLabel: "Popis",
        locationLabel: "Lokace",
        startLabel: "Začátek",
        endLabel: "Konec",
        summaryPlaceholder: "Krátký název poznámky",
        descriptionPlaceholder: "Popište poznámku...",
        locationPlaceholder: "Volitelná lokace",
        createBtn: "Vytvořit poznámku",
        saveBtn: "Uložit změny",
        cancelBtn: "Zrušit",
        summaryEmpty: "Název nesmí být prázdný"
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
        hello: "Hello,",
        modalNewTitle: "New Note",
        modalEditTitle: "Edit Note",
        summaryLabel: "Summary",
        descriptionLabel: "Description",
        locationLabel: "Location",
        startLabel: "Start date-time",
        endLabel: "End date-time",
        summaryPlaceholder: "Short note title",
        descriptionPlaceholder: "Describe your note...",
        locationPlaceholder: "Optional location",
        createBtn: "Create note",
        saveBtn: "Save Changes",
        cancelBtn: "Cancel",
        summaryEmpty: "Summary can't be empty"
    }
};

// GET CURRENT LANGUAGE
export function getCurrentLang() {
    return localStorage.getItem('app-lang') || 'en';
}

// UPDATE USER GREETING
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

// INITIALIZE SETTINGS LISTENERS
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
        // NOTIFY OTHER PARTS OF THE APP ABOUT LANGUAGE CHANGE
        $(document).trigger('app:langChanged');
    });
}