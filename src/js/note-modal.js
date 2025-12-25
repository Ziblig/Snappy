import $ from "jquery";
// Імпортуємо функції для роботи з Google Calendar
import { syncNoteToCalendar, deleteCalendarEvent } from './google-api.js';

let tasks = [];
const STORAGE_KEY = "myNotes";

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing localStorage.', e);
            tasks = [];
        }
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// захист від XSS
function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, s =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
    );
}

function toInputDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + "T" + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"));
}

function formatDateTime(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("cz-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

function renderTasks(tasksToRender = tasks) {
    const $list = $('#taskList');
    $list.empty();

    if (!tasksToRender.length) {
        $list.append(`<p class="notes-empty">There are no notes yet</p>`);
        return;
    }

    const sorted = [...tasksToRender].sort((a, b) => b.id - a.id);

    sorted.forEach(task => {
        const time = task.start ? formatDateTime(task.start) : "";
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
            </div>
        </article>`;
        $list.append(html);
    });
}

function openModal(mode = "new", task = null) {
    $("#taskModal").removeClass('hidden');
    $("#modalTitle").text(mode === "new" ? "New Note" : "Edit Note");

    if (mode === "new") {
        $("#taskSummary").val("");
        $("#taskDescription").val("");
        $("#taskStart").val("");
    } else {
        $("#taskSummary").val(task.summary);
        $("#taskDescription").val(task.description || "");
        $("#taskStart").val(toInputDateTime(task.start));
    }

    $('#saveTaskBtn').data("mode", mode).data("id", task?.id ?? null).text(mode === "new" ? "Create Note" : "Save Changes");
}

function closeModal() {
    $("#taskModal").addClass('hidden');
}

$(function () {
    loadTasks();
    renderTasks();

    $('input[placeholder="Search..."]').on('input', function() {
        const query = $(this).val().toLowerCase();
        const filtered = tasks.filter(t => 
            t.summary.toLowerCase().includes(query) || 
            (t.description && t.description.toLowerCase().includes(query))
        );
        renderTasks(filtered);
    });

    $('.icon-btn:has(.icon-list), .icon-list').closest('button').on('click', function() {
        $('#taskList').toggleClass('list-view');
        const isList = $('#taskList').hasClass('list-view');
        window.location.hash = isList ? 'view=list' : 'view=grid';
    });

    $(`#add-note_btn`).on('click', () => openModal("new"));
    $('#cancelTaskBtn').on('click', closeModal);

    $('#saveTaskBtn').on('click', async function () {
        const mode = $(this).data('mode');
        const id = Number($(this).data('id'));
        const summary = $("#taskSummary").val().trim();
        const description = $("#taskDescription").val().trim();
        const startVal = $("#taskStart").val();


        if (!summary) {
            alert("Summary can't be empty");
            return;
        }

        const start = startVal ? new Date(startVal).toISOString() : null;

        if (mode === "new") {
            const newTask = { id: Date.now(), summary, description, start, googleEventId: null };
            tasks.push(newTask);
            
            // Отримуємо ID від Google та оновлюємо нотатку
            try {
                const googleId = await syncNoteToCalendar(summary, description, start);
                newTask.googleEventId = googleId;
                saveTasks();
            } catch (err) {
                console.error("Sync to Google Calendar failed:", err);
            }
        } else {
            const index = tasks.findIndex(task => task.id === id);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], summary, description, start };
            }
        }

        saveTasks();
        renderTasks();
        closeModal();
    });

    $('#taskList').on("click", ".note-edit-btn", function () {
        const id = Number($(this).closest(".note-card").data('id'));
        const task = tasks.find(t => t.id === id);
        if (task) openModal("edit", task);
    });

    $('#taskList').on("click", ".note-delete-btn", function () {
        const id = Number($(this).closest(".note-card").data('id'));
        const taskToDelete = tasks.find(t => t.id === id);

        if (confirm("Delete this note?")) {
            // Видаляємо з Google Календаря
            if (taskToDelete && taskToDelete.googleEventId) {
                deleteCalendarEvent(taskToDelete.googleEventId);
            }

            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
        }
    });
});
