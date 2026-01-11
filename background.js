/**
 * Background Service Worker
 * Handles extension lifecycle and setup.
 */

// On install, we can set default storage values
chrome.runtime.onInstalled.addListener(() => {
    console.log("AI Interview Prep Extension Installed");
    chrome.storage.local.set({
        setupComplete: false,
        userRoleLevel: 'Mid'
    });
});
