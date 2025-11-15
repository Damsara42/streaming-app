// admin panel JS (starter)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-login');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // TODO: add real auth
      alert('Admin login submitted (placeholder)');
    });
  }
});
