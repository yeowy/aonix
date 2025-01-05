import { auth } from './firebase-config.js';
import { sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const resetForm = document.getElementById('password-reset-form');
const resetEmail = document.getElementById('reset-email');
const resetButton = document.getElementById('reset-button');
const resetError = document.getElementById('reset-error');

resetButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = resetEmail.value;
    
    try {
        await sendPasswordResetEmail(auth, email);
        // Show success message
        resetError.style.color = '#4caf50';
        resetError.textContent = 'Password reset email sent! Check your inbox.';
        
        // Clear the form
        resetEmail.value = '';
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = '/aonix/pages/login.html';
        }, 3000);
    } catch (error) {
        resetError.style.color = '#ff4d4d';
        resetError.textContent = error.message;
    }
});
