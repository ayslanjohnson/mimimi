document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/profile/1')
        .then(response => response.json())
        .then(profile => {
            document.getElementById('profiles').innerHTML = `<h2>${profile.name}</h2><p>Score: ${profile.score}</p>`;
        });
});