/* global chrome */
import { updateKeyword } from './issue';

chrome.alarms.create('updateKeyword', {
    when: 1000,
    periodInMinutes: 0.5
});

chrome.alarms.onAlarm.addListener(async function() {
    await updateKeyword();
});