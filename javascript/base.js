import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'zh-TW',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
}

window.translatePage = function() {
    const translateElement = document.getElementById('google_translate_element');
    if (!translateElement) {
        const translateDiv = document.createElement('div');
        translateDiv.id = 'google_translate_element';
        translateDiv.style.display = 'none'; // Hide the translate element
        document.body.appendChild(translateDiv);
        googleTranslateElementInit();
    } else {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = 'zh-TW'; // Set the language to Chinese Traditional
            select.dispatchEvent(new Event('change')); // Trigger the change event
        }
    }
}

// Hide the Google Translate banner and grey bar after translation
window.addEventListener('load', () => {
    const observer = new MutationObserver(() => {
        const iframe = document.querySelector('iframe.goog-te-banner-frame');
        if (iframe) {
            iframe.style.display = 'none';
        }
        const banner = document.querySelector('.goog-te-banner-frame.skiptranslate');
        if (banner) {
            banner.style.display = 'none';
        }
        const skiptranslate = document.querySelector('.skiptranslate');
        if (skiptranslate) {
            skiptranslate.style.display = 'none';
        }
        const body = document.querySelector('body');
        if (body) {
            body.style.top = '0px'; // Remove the grey bar
        }
        const googBar = document.querySelector('.goog-te-banner-frame');
        if (googBar) {
            googBar.style.display = 'none';
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

// Loads the header
document.addEventListener("DOMContentLoaded", function() {
    fetch('/aonix/pages/base.html')
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML('afterbegin', data);

            // Add event listener for account icon after header is loaded
            document.getElementById('accountIcon').addEventListener('click', handleAccountRedirect);

            // Check for developer mode cookie and set stylesheet accordingly
            const developerMode = getCookie('developerMode');
            let link = document.querySelector('link[href="/aonix/stylesheets/developer.css"]');
            if (!link) {
                link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/aonix/stylesheets/developer.css';
                document.head.appendChild(link);
            }
            link.disabled = developerMode !== 'true';
        });
});

// Checks for user login status
function handleAccountRedirect() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = '/aonix/pages/member.html';
        } else {
            window.location.href = '/aonix/pages/login.html';
        }
    });
}

// Toggle developer mode stylesheet
window.toggleDeveloperMode = function() {
    let link = document.querySelector('link[href="/aonix/stylesheets/developer.css"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/aonix/stylesheets/developer.css';
        document.head.appendChild(link);
    }
    link.disabled = !link.disabled;
    setCookie('developerMode', !link.disabled, 7);
};

// Helper function to set a cookie
export function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Helper function to get a cookie
export function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}