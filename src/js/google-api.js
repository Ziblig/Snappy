// const - не змінюється 
//  let - змінюється
const CLIENT_ID = process.env.GAPI_CLIENT_ID;
// ідентифікатор клієнта
const DISCOVERY_DOC = process.env.GAPI_DISCOVERY_DOC;
// права доступу
const SCOPES = process.env.GAPI_SCOPES;

let tokenClient;
// ЗМІННА
// стан ініціалізації(чи він ок) Google API
let gapiInited = false;
// стан ініціалізації Google Identity Services
let gisInited = false;

// Ініціалізація Google API
export function gapiLoaded() {
// завантаження клієнта GAPI
// await завжди в async
    gapi.load('client', async () => {
        await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        console.log("GAPI Initialized");
    })
}

// Ініціалізація Google Identity Services
export function gisLoaded() {
    // створення токен клієнта
    // token - дані клієнта
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: "", 
    });
    gisInited = true;
    console.log("GIS Initialized");
};

// Синхронізація нотатки з Google Календарем
export async function syncNoteToCalendar(title, description, startIso) {
    // || - або 
    if (!gapiInited || !gisInited) {
        alert("Google API not initialized");
        return null;
    }
    // new - створення нового об'єкта
    return new Promise((resolve, reject) => {
        // звертаємось до callback функції
        // resop - response
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                reject(resp);
                return;
            }
            const event = {
            'summary': title,
            'description': description,
            'start': { 'dateTime': startIso || new Date().toISOString(), 'timeZone': 'Europe/Kyiv' },
            'end': { 'dateTime': new Date(startIso ? new Date(startIso).getTime() + 3600000 : Date.now() + 3600000).toISOString(), 'timeZone': 'Europe/Kyiv' }
        };

        try {
        const response = await gapi.client.calendar.events.insert({
          'calendarId': 'primary',
          'resource': event,
        });
        console.log('Подія створена в Google:', response.result.id);
        resolve(response.result.id);
      } catch (err) {
        console.error('Помилка створення події:', err);
        reject(err);
      }
    };

    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

// Функція видалення події з Google Календаря
export async function deleteCalendarEvent(googleEventId) {
  if (!googleEventId) return;
  try {
    await gapi.client.calendar.events.delete({
      'calendarId': 'primary',
      'eventId': googleEventId,
    });
    console.log('Подію видалено з Google Календаря');
  } catch (err) {
    console.error('Помилка видалення з Google:', err);
  }
}
