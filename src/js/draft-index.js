import $ from "jquery";
// пустий масив куди додавати будемо нотатки
// let tasks = [];

// ключ під яким збергаються дані в локалсторедж
// const STORAGE_KEY = "myNotes";

// local storage
// завантаження нотаток з локалсторедж
// з local storage витягуємо my Notes, локал сторедж в ф12
// load tasks бере ключ і бере данні
// parce обєкт з рядок
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try{
            // якщо є данні, парсимоб з рядочка стає обєктом
            tasks = JSON.parse(stored);
            // якщо парсинг пройшов неуспішно, то викине помилку
        } catch(e){
            console.error("Error parsing tasks from localStorage.", e);
            tasks = [];
        }
    }
}

// збереження нотаток в локалсторедж
// json.stringify перетворює обєкт в рядок
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// конвертор
// iso - формат дати (рік, місяць, день, година, хвилина, секунда)
function toInputDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return(d.getFullYear() + "-" + String(d.getMonth()+ 1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") + "T" + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0"));  
}

// форматування
function formatDateTime(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

// CRUD
// немає довжини масиву, показуємо повідомлення що нотаток немає
function renderTasks() {
    const $list = $("#taskList");
    $list.empty();

    if (!tasks.length) {
        // append додає в кінець елемент 
        $list.append(`<p class = "notes-empty"> No notes available for now </p>`);
        return;
    }

    // створюємо щоб остання нотатка була зверху
    const sorted = [...tasks].sort((a, b) => b.id - a.id);
    sorted.forEach(task => {
        // slice - вирізає частину рядка
        const time = task.start ? formatDateTime(task.start).slice(-5) : "";
        const html = `<article class="note-card" data-id="${task.id}">
            <div class="note-top">
                <button type="button" class="icon-btn note-edit-btn"><i class="icon-edit"></i></button>
                <button type="button" class="icon-btn note-delete-btn"><i class="icon-delete"></i></button>
            </div>

            <h3 class="note-title">${escapeHtml(task.summary)}</h3>

            ${
                task.description
                    ? `<p class="note-text">${escapeHtml(task.description)}</p>`
                    : ""
            }

            <div class="note-bottom">
                <span class="time-icon">🕓</span>
                <span class="note-time">${time}</span>
            </div>
        </article>`;
        $list.append(html);
    });
}

// Modal window

function openModal(mode = "new", task = 0) {
    // забираємо хіден з note-modal.html
    $("#taskModal").removeClass('hidden');
    // if else це тернарний оператор
    $("modalTitle").text(mode === "new" ? "New Note" : "Edit Note");
    // заповнення форми 
    if (mode === "new") {
        // # - id, #taskSummary - заголовок, val - значення
        $("#taskSummary").val("");
        $("#taskDescription").val("");
        $("#taskLocation").val("");
        $("#taskStart").val("");
    } else{
        $("#taskSummary").val(task.summary);
        // або є опис або його немає
        $("#taskDescription").val(task.description || "");
        $("#taskLocation").val(task.location);
        $("#taskStart").val( toInputDateTime(task.start));
    }

    // save btn
    // в кнопку зберігаємо айдішник нотатки
    // ?? - оператор обєднання 
    // текст який буде на кнопках
    $("#saveTaskBtn").data("mode", mode).data("id", task ?. id ?? null).text(mode === "new" ? "Create Note" : "Save Changes");
}

// функція закриття модалки
function closeModal() {
    $("#taskModal").addClass("hidden");
}


$(function () {

    loadTasks();
    renderTasks();

    // обробники відкриття та закриття модалки
    $(`#add-note_btn`).on('click', () => openModal("new"));
    $('#cancelTaskBtn').on('click', closeModal);

    // save btn
    $('#saveTaskBtn').on('click', function () {
        const mode = $(this).data('mode');
        const id = Number($(this).data('id'));

        const summary = $("#taskSummary").val().trim();
        const description = $("#taskDescription").val().trim();
        const startVal = $("#taskStart").val().trim();

        if (!summary) {
            alert("Summary can't be empty");
            return;
        }

        const start = startVal ? new Date(startVal).toISOString() : null;

        if (mode === "new") {
            // логіка створення
            tasks.push({
                id: Date.now(),
                summary,
                description,
                start
            })
        } else {
            const index = tasks.findIndex(task => task.id === id);
            if (index !== -1) {
                tasks[index] = {
                    ...tasks[index],
                    summary,
                    description,
                    start
                }
            }
        }

        saveTasks();
        renderTasks();
        closeModal();
    })

    // edit btn
    $('#taskList').on("click", ".note-edit-btn", function () {
        const id = Number($(this).closest(".note-card").data('id'));
        const task = tasks.find(t => t.id === id);

        if (task) openModal("edit", task);
    })

    // delete btn
    $('#taskList').on("click", ".note-delete-btn", function () {
        const id = Number($(this).closest(".note-card").data('id'));

        if (!confirm("Delete this note?"))
            return;

        tasks = tasks.filter(t => t.id !== id);

        saveTasks();
        renderTasks();

    })
});


// NOTE-MODAL

import $ from "jquery";

// глобальний масив для зберіганння нотаток
let tasks = [];
// ключ під яким зберігаються дані в Local Storage
const STORAGE_KEY = "myNotes";

// Local storage
// завантеження нотаток з local storage
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            console.error('Помилка localStorage.', e);
            tasks = [];
        }
    }
}

// збереження нотаток
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, s =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
    );
}

// конвертор 
function toInputDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);

    return (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + "T" + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"));
}

// форматувнання
function formatDateTime(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    })
}

// CRUD

function renderTasks() {
    const $list = $('#taskList');
    $list.empty();

    if (!tasks.length) {
        $list.append(`<p class="notes-empty">Поки що немає нотаток</p>`);
        return;
    }

    const sorted = [...tasks].sort((a, b) => b.id - a.id);

    sorted.forEach(task => {
        const time = task.start ? formatDateTime(task.start).slice(-5) : "";

        const html = `
        <article class="note-card" data-id="${task.id}">
            <div class="note-top">
                <button type="button" class="icon-btn note-edit-btn"><i class="icon-edit"></i>❤</button>
                <button type="button" class="icon-btn note-delete-btn"><i class="icon-delete"></i></button>
            </div>

            <h3 class="note-title">${escapeHtml(task.summary)}</h3>

            ${task.description
                ? `<p class="note-text">${escapeHtml(task.description)}</p>`
                : ""
            }

            <div class="note-bottom">
                <span class="time-icon">🕓</span>
                <span class="note-time">${time}</span>
            </div>
        </article>
        `;

        $list.append(html);
    });
}




// MODAL WINDOW
function openModal(mode = "new", task = 0) {
    $("#taskModal").removeClass('hidden');
    $("#modalTitle").text(mode === "new" ? "New Note" : "Edit Note");

    // заповнення форми
    if (mode === "new") {
        $("#taskSummary").val("");
        $("#taskDescription").val("");
        $("#taskLocation").val("");
        $("#taskStart").val("");
    } else {
        $("#taskSummary").val(task.summary);
        $("#taskDescription").val(task.description || "");
        $("#taskLocation").val(task.location);
        $("#taskStart").val(toInputDateTime(task.start));
    }

    // save btn
    $('#saveTaskBtn').data("mode", mode).data("id", task?.id ?? null).text(mode === "new" ? "Create Note" : "Save Changes");
}

function closeModal() {
    $("#taskModal").addClass('hidden');
}


$(function () {

    loadTasks();
    renderTasks();

    // обробники відкриття та закриття модалки
    $(`#add-note_btn`).on('click', () => openModal("new"));
    $('#cancelTaskBtn').on('click', closeModal);

    // save btn
    $('#saveTaskBtn').on('click', function () {
        const mode = $(this).data('mode');
        const id = Number($(this).data('id'));

        const summary = $("#taskSummary").val().trim();
        const description = $("#taskDescription").val().trim();
        const startVal = $("#taskStart").val().trim();

        if (!summary) {
            alert("Summary can't be empty");
            return;
        }

        const start = startVal ? new Date(startVal).toISOString() : null;


        if (mode === "new") {
            // логіка створення
            tasks.push({
                id: Date.now(),
                summary,
                description,
                start
            })
        } else {
            const index = tasks.findIndex(task => task.id === id);
            if (index !== -1) {
                tasks[index] = {
                    ...tasks[index],
                    summary,
                    description,
                    start
                }
            }
        }

        saveTasks();
        renderTasks();
        closeModal();
    })

    // edit btn
    $('#taskList').on("click", ".note-edit-btn", function () {
        const id = Number($(this).closest(".note-card").data('id'));
        const task = tasks.find(t => t.id === id);

        if (task) openModal("edit", task);
    })

    // delete btn
    $('#taskList').on("click", ".note-delete-btn", function () {
        const id = Number($(this).closest(".note-card").data('id'));

        if (!confirm("Delete this note?"))
            return;

        tasks = tasks.filter(t => t.id !== id);

        saveTasks();
        renderTasks();

    })
});





