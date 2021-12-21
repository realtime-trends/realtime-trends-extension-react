/* global chrome */
import { updateKeyword } from '../issue';

chrome.alarms.create('updateKeyword', {
    when: 1000,
    periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener(async function() {
    await updateKeyword();
});