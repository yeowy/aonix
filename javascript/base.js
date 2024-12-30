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
