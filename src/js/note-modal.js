import $ from "jquery";
import {
  syncNoteToCalendar,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "./google-api.js";
import {
  translations,
  getCurrentLang,
  updateUserGreeting,
  initSettingsListeners,
} from "./settings.js";

let tasks = [];
const STORAGE_KEY = "myNotes";

// LOCAL STORAGE load/save
function loadTasks() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      tasks = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing localStorage.", e);
      tasks = [];
    }
  }
}
// ???????????????????????????????????????????????????????????
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

//  XSS prevention
function escapeHtml(str) {
  return String(str || "").replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        s
      ])
  );
}
// ???????????????????????????????????????????????????????????
function toInputDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0") +
    "T" +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

// TIME ON THE NOTE CARD
function formatDateTime(iso) {
  if (!iso) return "";
  // FROM ISO: 2025-12-27T18:30:00.0000 TO 18:30
  return new Date(iso).toLocaleString("cz-CZ", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
// +1 IF NO ENDING TIME
function addHoursToIso(iso, hours = 1) {
  if (!iso) return null;
  return new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
}

// ?????????????????????????????????????????????????????????
function renderTasks(tasksToRender = tasks) {
  const $list = $("#taskList");
  // ?????????????????????????????????????????????????????????
  $list.empty();

  // MESSAGE WHEN NO NOTES
  if (!tasksToRender.length) {
    $list.append(`<p class="notes-empty">There are no notes yet</p>`);
    return;
  }

  // SORTING BY ID DESCENDING
  const sorted = [...tasksToRender].sort((a, b) => b.id - a.id);

  // DISPLAY NOTES
  sorted.forEach((task) => {
    const startIso = task.start || null;
    const endIso = task.end || (startIso ? addHoursToIso(startIso, 1) : null);
    const startStr = startIso ? formatDateTime(startIso) : "";
    const endStr = endIso ? formatDateTime(endIso) : "";
    const time =
      startStr && endStr ? `${startStr} — ${endStr}` : startStr || endStr || "";

    const html = `
        <article class="note-card" data-id="${task.id}">
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
                ${
                  task.location
                    ? `<span class="note-location">📍 ${escapeHtml(
                        task.location
                      )}</span>`
                    : ""
                }
            </div>
        </article>`;
    $list.append(html);
  });
}

// SETTINGS PAGE
function renderSettingsPage() {
  const $list = $("#taskList");
  const lang = getCurrentLang();
  const userName = localStorage.getItem("user-name") || "";
  const t = translations[lang];

  $list.empty().append(`
        <div class="settings-container">
            <div class="status-card">
                <div>
                    <label class="settings-label">${t.userNameLabel}</label>
                    <input type="text" id="settings-user-name" value="${userName}" placeholder="${
    t.placeholderName
  }">
                </div>
                <div>
                    <label class="settings-label">${t.langLabel}</label>
                    <select id="settings-lang">
                        <option value="cz" ${
                          lang === "cz" ? "selected" : ""
                        }>Čeština</option>
                        <option value="en" ${
                          lang === "en" ? "selected" : ""
                        }>English</option>
                    </select>
                </div>
                <button id="backFromSettings" class="btn secondary">${
                  t.backBtn
                }</button>
            </div>
        </div>
    `);

  // REINITIALIZE SETTINGS LISTENERS
  initSettingsListeners();

  $("#backFromSettings").on("click", () => {
    history.pushState({ view: "notes" }, "", "?view=notes");
    showNotesView();
  });
}

//LANGUAGE-SENSITIVE VIEW FUNCTIONS
function showNotesView() {
  $("#taskList").removeClass("settings-view");
  $(".notes_title").text(translations[getCurrentLang()].notesTitle);
  $(".notes_btn-wrap").show();
  renderTasks();
}

function showSettingsView() {
  $("#taskList").addClass("settings-view");
  $(".notes_title").text(translations[getCurrentLang()].settingsTitle);
  $(".notes_btn-wrap").hide();
  renderSettingsPage();
}

// MODAL WINDOW FUNCTIONS
function openModal(mode = "new", task = null) {
  const t = translations[getCurrentLang()];

  $("#taskModal").removeClass('hidden');
  $("#modalTitle").text(mode === "new" ? t.modalNewTitle : t.modalEditTitle);

  // set field labels and placeholders from translations
  const $fields = $(".modal-field span");
  $fields.eq(0).text(t.summaryLabel);      // summary
  $fields.eq(1).text(t.descriptionLabel);  // description
  $fields.eq(2).text(t.locationLabel);     // location
  $fields.eq(3).text(t.startLabel);        // start
  $fields.eq(4).text(t.endLabel);          // end

  $("#taskSummary").attr('placeholder', t.summaryPlaceholder);
  $("#taskDescription").attr('placeholder', t.descriptionPlaceholder);
  $("#taskLocation").attr('placeholder', t.locationPlaceholder);

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

  // set save button text based on mode and store mode/id on button
  $('#saveTaskBtn').data("mode", mode).data("id", task?.id ?? null)
      .text(mode === "new" ? t.createBtn : t.saveBtn);
  $('#cancelTaskBtn').text(t.cancelBtn);
}

// CLOSE MODAL
function closeModal() {
  $("#taskModal").addClass("hidden");
}

// MAIN LOGIC AFTER PAGE LOAD
$(function () {
  loadTasks();
  renderTasks();
  initSettingsListeners();

  // URL-CHECK FOR VIEW
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  if (view === "settings") showSettingsView();
  else showNotesView();

  // SIDEBAR NAVIGATION

  $('.content_item:contains("Note")').on("click", function (e) {
    e.preventDefault();
    history.pushState({ view: "notes" }, "", "?view=notes");
    showNotesView();
    $("#sidebar_toggle").prop("checked", false);
  });

  $('.content_item:contains("Settings")').on("click", function (e) {
    e.preventDefault();
    history.pushState({ view: "settings" }, "", "?view=settings");
    showSettingsView();
    $("#sidebar_toggle").prop("checked", false);
  });

  // HANDLE BACK/FORWARD BROWSER BUTTONS
  window.onpopstate = function () {
    const v = new URLSearchParams(window.location.search).get("view");
    if (v === "settings") showSettingsView();
    else showNotesView();
  };

  // SEARCH NOTES BY SUMMARY OR DESCRIPTION
  $('input[placeholder="Search..."]').on("input", function () {
    const query = $(this).val().toLowerCase();
    const filtered = tasks.filter(
      (t) =>
        t.summary.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    );
    renderTasks(filtered);
  });

  // Consolidated handler: handles header button and icon clicks
  // TOGGLE - ON/OFF LIST VIEW
  $("#form-note_btn").on("click", function () {
    $("#taskList").toggleClass("list-view");
    const isList = $("#taskList").hasClass("list-view");
    // CHANGING THE LINK HASH
    window.location.hash = isList ? "view=list" : "view=grid";
    // Toggle icon: list-bulleted ↔ apps
    // ІКОНКА <i class="icon-list-bulleted"> САМЕ В КНОПЦІ form-note_btn
    // THIS - FORM-NOTE_BTN
    const $icon = $(this).find("i");
    // icon-list-bulleted - LIST
    // icon-apps - GRID
    $icon.toggleClass("icon-list-bulleted icon-apps");
  });

  // ADD NOTE BUTTON OPENS MODAL IN NEW MODE
  $(`#add-note_btn`).on("click", () => openModal("new"));
  // CANCEL BUTTON MODAL
  $("#cancelTaskBtn").on("click", closeModal);

  // SAVE BUTTON - CREATE OR UPDATE NOTE
  $("#saveTaskBtn").on("click", async function () {
    const t = translations[getCurrentLang()];
    const mode = $(this).data('mode');
    const id = Number($(this).data('id'));
    const summary = $("#taskSummary").val().trim();
    const description = $("#taskDescription").val().trim();
    const startVal = $("#taskStart").val();
    const endVal = $("#taskEnd").val();
    const locationVal = $("#taskLocation").val();

    if (!summary) {
      alert(t.summaryEmpty);
      return;
    }

    // NOTE TIME AND LOCATION PROCESSING
    const start = startVal ? new Date(startVal).toISOString() : null;
    const end = endVal
      ? new Date(endVal).toISOString()
      : start
      ? addHoursToIso(start, 1)
      : null;
    const location = locationVal ? locationVal.trim() : null;

    // ID FOR NEW NOTE DATE.now()
    if (mode === "new") {
      const newTask = {
        id: Date.now(),
        summary,
        description,
        start,
        end,
        location,
        googleEventId: null,
      };
      tasks.push(newTask);

      // SYNC TO GOOGLE CALENDAR
      try {
        const googleId = await syncNoteToCalendar(
          summary,
          description,
          start,
          end,
          location
        );
        newTask.googleEventId = googleId;
        saveTasks();
        // IF ERROR, SAVING LOCALLY WITHOUT GOOGLE EVENT ID
      } catch (err) {
        console.error("Sync to Google Calendar failed:", err);
      }
    } else {
      const index = tasks.findIndex((task) => task.id === id);
      if (index !== -1) {
        const oldTask = tasks[index];
        tasks[index] = {
          ...tasks[index],
          summary,
          description,
          start,
          end,
          location,
        };

        // SYNC UPDATES TO GOOGLE CALENDAR
        if (oldTask.googleEventId) {
          try {
            // Update existing event
            await updateCalendarEvent(
              oldTask.googleEventId,
              summary,
              description,
              start,
              end,
              location
            );
          } catch (err) {
            console.error("Failed to update Google Calendar event:", err);
          }
        } else {
          // CREATE NEW EVENT IF NONE EXISTS BEFORE
          try {
            const googleId = await syncNoteToCalendar(
              summary,
              description,
              start,
              end,
              location
            );
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

  // EDITTING NOTES
  $("#taskList").on("click", ".note-edit-btn", function () {
    const id = Number($(this).closest(".note-card").data("id"));
    const task = tasks.find((t) => t.id === id);
    if (task) openModal("edit", task);
  });

  // DELETING NOTES
  $("#taskList").on("click", ".note-delete-btn", async function () {
    const id = Number($(this).closest(".note-card").data("id"));
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!confirm("Delete this note?")) return;

    // DELETE GOOGLE CALENDAR EVENT IF EXISTS
    if (taskToDelete && taskToDelete.googleEventId) {
      try {
        await deleteCalendarEvent(taskToDelete.googleEventId);
      } catch (err) {
        console.error("Failed to delete Google Calendar event:", err);
      }
    }

    // FINAL LOCAL DELETION
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
  });

  // handle language change emitted by settings.js (no full page reload)
  $(document).on("app:langChanged", () => {
    const v = new URLSearchParams(window.location.search).get("view");
    if (v === "settings") showSettingsView();
    else showNotesView();
    updateUserGreeting();
  });
});
