const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    performSearch(searchInput.value);
  }
});

function performSearch(query) {
  if (query) {
    window.location.href = `/aonix/public/pages/store.html?q=${encodeURIComponent(query)}`;
  }
}
