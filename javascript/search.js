function toggleHint() {
    const hint = document.getElementById('searchHint');
    if (hint.style.display === 'none' || hint.style.display === '') {
        hint.style.display = 'block'; 
    } else {
        hint.style.display = 'none';
    }
}

