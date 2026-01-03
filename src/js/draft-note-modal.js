import $ from "jquery";
// Імпортуємо функції для роботи з Google Calendar
import { syncNoteToCalendar, deleteCalendarEvent, updateCalendarEvent } from './google-api.js';

let tasks = [];
// STORAGE_KEY je název klíče v localStorage, pod kterým to ukládáš ("myNotes").
const STORAGE_KEY = "myNotes";

// local storage
// завантаження нотаток з локалсторедж
// з local storage витягуємо my Notes, локал сторедж в ф12
// load tasks бере ключ і бере данні
// parce - розбирає JSON рядок в об'єкт
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            // když se to povede, nastaví načtené úkoly
            tasks = JSON.parse(stored);
        } catch (e) {
            // když se to nepovede, vypíše chybu a nastaví prázdný seznam úkolů
            console.error('Error parsing localStorage.', e);
            tasks = [];
        }
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// захист від XSS
// XSS je útok, kdy se vstup od uživatele vykoná jako kód místo textu.
function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, s =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
    );
}

function toInputDateTime(iso) {
    if (!iso) return "";
    // const d = new Date(iso) створює об'єкт дати з ISO рядка 
    const d = new Date(iso);
    // d.getMonth() + 1 тому що місяці в JS рахуються з 0
    // padStart(2, "0") додає нуль, якщо потрібно
    // padStart() funguje jen na stringu
    // Vezmi měsíc z data → přičti 1 → převeď na text → pokud má jen 1 číslici, přidej zleva nulu
    return (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + "T" + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"));
}

function formatDateTime(iso) {
    if (!iso) return "";
    // ISO: 2025-12-27T18:30:00.0000;  prevracime do 18:30 timto kodem:
    return new Date(iso).toLocaleString("cz-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

// když dáš start, ale nedáš end, tak end = start + 1 hodina.
function addHoursToIso(iso, hours = 1) {
    if (!iso) return null;
    return new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
}
// funkce se jmenuje renderTasks, dostane seznam poznámek, dyž jí žádný seznam nedáš, použije globální tasks
function renderTasks(tasksToRender = tasks) {
    // najde v HTML element s id taskList v NOTES.HTML, tam se zobrazují poznámky
    const $list = $('#taskList');
    // vyčistí obsah seznamu
    // ????????????????????????????????????????????????????????? НАХІБА РОБИТИ ЕМПТІ
    $list.empty();

    // pokud nemáš žádné úkoly, zobrazí se místo nich zpráva
    if (!tasksToRender.length) {
        $list.append(`<p class="notes-empty">There are no notes yet</p>`);
        return;
    }

    // [...tasksToRender] - udělá kopii seznamu, originální data se nezmění
    // .sort((a, b) => b.id - a.id), seřadí poznámky podle id, větší id = novější poznámka
    // sorted.forEach(task => {...}) Pro každou poznámku v seznamu udělej následující kroky, kde task = jedna konkrétní poznámka.
    const sorted = [...tasksToRender].sort((a, b) => b.id - a.id);

    sorted.forEach(task => {
        // když poznámka má start → použij ho, když nemá → nastav null
        const startIso = task.start || null;
        // když má end → použij ho, jinak:
        // když má start → end = start + 1 hodina
        // jinak → žádný čas
        const endIso = task.end || (startIso ? addHoursToIso(startIso, 1) : null);
        const startStr = startIso ? formatDateTime(startIso) : "";
        const endStr = endIso ? formatDateTime(endIso) : "";
        // když existuje start i end → 18:30 — 19:30
        // když existuje jen jeden → zobraz ho
        // když neexistuje nic → prázdný text
        const time = startStr && endStr ? `${startStr} — ${endStr}` : startStr || endStr || "";
        // Button type BUTTON ????????????????????????????????????????????????????????????
        const html = `
        <article class="note-card" data-id="${task.id}">
            <div class="note-top">
                <button type="button" class="icon-btn note-edit-btn"><i class="icon-edit"></i></button>
                <button type="button" class="icon-btn note-delete-btn"><i class="icon-delete"></i></button>
            </div>
            <h3 class="note-title">${escapeHtml(task.summary)}</h3>
            ${task.description ? `<p class="note-text">${escapeHtml(task.description)}</p>` : ""}
            <div class="note-bottom">
                <span class="time-icon">🕓</span>
                <span class="note-time">${time}</span>
                ${task.location ? `<span class="note-location">📍 ${escapeHtml(task.location)}</span>` : ""}
            </div>
        </article>`;
        $list.append(html);
    });
}

// ukázat modální okno pro novou nebo editaci poznámky
function openModal(mode = "new", task = null) {
    $("#taskModal").removeClass('hidden');
    $("#modalTitle").text(mode === "new" ? "New Note" : "Edit Note");

    // podminka pro vyplnění formuláře v modálním okně
    if (mode === "new") {
        $("#taskSummary").val("");
        $("#taskDescription").val("");
        $("#taskStart").val("");
        $("#taskEnd").val("");
        $("#taskLocation").val("");
    } else {
        $("#taskSummary").val(task.summary);
        $("#taskDescription").val(task.description || "");
        $("#taskStart").val(toInputDateTime(task.start));
        $("#taskEnd").val(toInputDateTime(task.end));
        $("#taskLocation").val(task.location || "");
    }
    // saveTaskBtn - najde tlačítko Save v modalu, vrátí jQuery objekt, na ten teď budeme postupně volat další metody
    // tecky tam jso: tohle je řetězení metod (chaining): „Najdi tlačítko(#saveTaskBtn) → ulož na něj data → ulož další data → změň text“
    // .data("id", task?.id ?? null) - „Když task existuje, vezmi task.id, jinak vrať undefined“, „Když je vlevo null nebo undefined, použij null“
    $('#saveTaskBtn').data("mode", mode).data("id", task?.id ?? null).text(mode === "new" ? "Create Note" : "Save Changes");
}

// zavřít modální okno
function closeModal() {
    $("#taskModal").addClass('hidden');
}

// Načte uložené poznámky a vykreslí je.
$(function () {
    loadTasks();
    renderTasks();
    initSettingsListeners();

     // URL-CHECK FOR VIEW
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'settings') showSettingsView();
    else showNotesView();

    // SIDEBAR NAVIGATION
    $('.content_item:contains("Note")').on('click', function(e) {
        e.preventDefault();
        history.pushState({view: 'notes'}, "", "?view=notes");
        showNotesView();
        $('#sidebar_toggle').prop('checked', false);
    });

    $('.content_item:contains("Settings")').on('click', function(e) {
        e.preventDefault();
        history.pushState({view: 'settings'}, "", "?view=settings");
        showSettingsView();
        $('#sidebar_toggle').prop('checked', false);
    });

    // HANDLE BACK/FORWARD BROWSER BUTTONS
    window.onpopstate = function() {
        const v = new URLSearchParams(window.location.search).get('view');
        if (v === 'settings') showSettingsView();
        else showNotesView();
    };

    // SEARCH NOTES BY SUMMARY OR DESCRIPTION
    // .on('input') - event listener, který čeká na změnu v input poli
    $('input[placeholder="Search..."]').on('input', function() {
        // this: ten input, do kterého právě píšu
        // $(this): obalí ho do jQuery, aby šly použít metody
        // .val(): vrátí aktuální text v inputu
        // .toLowerCase(): převede text na malá písmena
        const query = $(this).val().toLowerCase();
        // t = jedna konkrétní poznámka
        // Vyber jen ty poznámky, které splní podmínku
        const filtered = tasks.filter(t => 
            // t.summary: vezmi název poznámky
            // toLowerCase(): převedˇ ho na malá písmena
            // includes(query): zkontroluj, jestli obsahuje hledaný text
            t.summary.toLowerCase().includes(query) || 
            (t.description && t.description.toLowerCase().includes(query))
        );
        renderTasks(filtered);
    });
   

    // Consolidated handler: handles header button and icon clicks
    // TOGGLE - ON/OFF LIST VIEW
    $('#form-note_btn').on('click', function() {
        $('#taskList').toggleClass('list-view');
        const isList = $('#taskList').hasClass('list-view');
        // CHANGING THE LINK HASH
        window.location.hash = isList ? 'view=list' : 'view=grid';
        // Toggle icon: list-bulleted ↔ apps
        // ІКОНКА <i class="icon-list-bulleted"> САМЕ В КНОПЦІ form-note_btn
        // THIS - FORM-NOTE_BTN
        const $icon = $(this).find('i');
        // icon-list-bulleted - LIST
        // icon-apps - GRID
        $icon.toggleClass('icon-list-bulleted icon-apps');
    });


    // Klik na „Add note“ otevře modal v režimu new.
    $(`#add-note_btn`).on('click', () => openModal("new"));
    // Cancel schová modal.
    $('#cancelTaskBtn').on('click', closeModal);

    // najde tlačítko Save

    $('#saveTaskBtn').on('click', async function () {
        const mode = $(this).data('mode');
        // Zjištění ID poznámky
        // vezmi uložené id z tlačítka
        // převede ho na číslo
        const id = Number($(this).data('id'));
        // .val() = text, který uživatel napsal
        // .trim() = odstraní mezery na začátku a konci
        const summary = $("#taskSummary").val().trim();
        const description = $("#taskDescription").val().trim();

        const startVal = $("#taskStart").val();
        const endVal = $("#taskEnd").val();
        const locationVal = $("#taskLocation").val();

        if (!summary) {
            alert("Summary can't be empty");
            return;
        }

        // start/end z datetime-local stringu do ISO.
        // new Date(startVal).toISOString(): 
        // end fallback = start+1h
        const start = startVal ? new Date(startVal).toISOString() : null;
        const end = endVal ? new Date(endVal).toISOString() : (start ? addHoursToIso(start, 1) : null);
        const location = locationVal ? locationVal.trim() : null;

        if (mode === "new") {
            // id: Date.now(): vytvoří unikátní číslo
            // Vytvořím si poznámku lokálně, i kdyby Google nefungoval
            const newTask = { id: Date.now(), summary, description, start, end, location, googleEventId: null };
            // přidá poznámku do seznamu všech poznámek
            tasks.push(newTask);
            
            // vytvoří událost v Google Calendar
            // vrátí ID té události
            // await znamená: „Počkej, než Google odpoví.“
            try {
                const googleId = await syncNoteToCalendar(summary, description, start, end, location);
                newTask.googleEventId = googleId;
                saveTasks();
            // když Google selže: appka nespadne a poznámka zůstane uložená lokálně
            } catch (err) {
                console.error("Sync to Google Calendar failed:", err);
            }
        } else {
            const index = tasks.findIndex(task => task.id === id);
            if (index !== -1) {
                const oldTask = tasks[index];
                tasks[index] = { ...tasks[index], summary, description, start, end, location };
                
                // Sync changes to Google Calendar
                if (oldTask.googleEventId) {
                    try {
                        // Update existing event
                        await updateCalendarEvent(oldTask.googleEventId, summary, description, start, end, location);
                    } catch (err) {
                        console.error("Failed to update Google Calendar event:", err);
                    }
                } else {
                    // If no Google event exists, create one
                    try {
                        const googleId = await syncNoteToCalendar(summary, description, start, end, location);
                        tasks[index].googleEventId = googleId;
                    } catch (err) {
                        console.error("Failed to create Google Calendar event:", err);
                    }
                }
            }
        }

        saveTasks();
        renderTasks();
        closeModal();
    });

    // // jQuery říká: „pokud klik byl na element .note-edit-btn, spusť funkci“.
    $('#taskList').on("click", ".note-edit-btn", function () {
        // .closest(".note-card") = najdi nejbližší obal kartičky poznámky.
        // Number(...) = převede na číslo (protože id poznámek je číslo z Date.now()).
        const id = Number($(this).closest(".note-card").data('id'));
        // tasks = pole všech poznámek.
        // .find(...) = najdi první poznámku, která má stejné id.
        const task = tasks.find(t => t.id === id);
        // pokud se poznámka našla, otevři modal v režimu edit
        if (task) openModal("edit", task);
    });


    $('#taskList').on("click", ".note-delete-btn", async function () {
        const id = Number($(this).closest(".note-card").data('id'));
        // Najde odpovídající poznámku v poli a uloží ji do taskToDelete.
        const taskToDelete = tasks.find(t => t.id === id);
        // Vyskočí potvrzovací okno (OK/Cancel).
        // Když uživatel klikne Cancel, funkce se hned ukončí (return).
        if (!confirm("Delete this note?")) return;

        // smaže událost z Google Календáře, якщо нотатка має googleEventId
        if (taskToDelete && taskToDelete.googleEventId) {
            try {
                // Спробуйте видалити подію в Google Calendar за ID.
                await deleteCalendarEvent(taskToDelete.googleEventId);
            } catch (err) {
                // виведе помилку, але все ще продовжить і видалить локальну нотатку
                console.error('Failed to delete Google Calendar event:', err);
            }
        }

        // filter залишає тільки ті, які не мають даного id
        tasks = tasks.filter(t => t.id !== id);
        // saveTasks() зберігає новий масив у localStorage
        saveTasks();
        // renderTasks() перерисовує UI, так що нотатка зникає зі сторінки
        renderTasks();
    });
});



