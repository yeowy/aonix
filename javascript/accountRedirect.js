import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

function handleAccountRedirect() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = '/aonix/pages/member.html';
        } else {
            window.location.href = '/aonix/pages/login.html';
        }
    });
}

document.getElementById('accountIcon').addEventListener('click', handleAccountRedirect);
