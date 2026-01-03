import './js/switch';
import './js/note-modal';
import './js/sidebar';
import { gapiLoaded, gisLoaded } from './js/google-api.js';
import './js/settings.js';

window.addEventListener('load', () => {
    gapiLoaded();
    gisLoaded();
});
