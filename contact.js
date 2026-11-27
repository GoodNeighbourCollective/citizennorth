// Contact form: until a form service is connected, Send opens the visitor's email app
// with every answer filled in, addressed to the form's data-mailto.
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const f = new FormData(form);
    const rows = [
      ['Name', f.get('name')], ['Title', f.get('title')], ['Property or brand', f.get('property')],
      ['Email', f.get('email')], ['Phone', f.get('phone')], ['Location of property', f.get('location')],
      ['Approximate dates', f.get('dates')], ['What we need', f.getAll('needs').join(', ')],
    ].filter(([, v]) => v);
    const body = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\n' + (f.get('message') || '');
    const subject = `New project: ${f.get('property') || 'property'}`;
    location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
