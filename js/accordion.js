document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.accordion').forEach((accordion) => {
    const triggers = accordion.querySelectorAll('.accordion-trigger');

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion-item');
        const wasOpen = trigger.getAttribute('aria-expanded') === 'true';

        triggers.forEach((otherTrigger) => {
          otherTrigger.setAttribute('aria-expanded', 'false');
          otherTrigger.closest('.accordion-item').classList.remove('is-open');
        });

        if (!wasOpen) {
          trigger.setAttribute('aria-expanded', 'true');
          item.classList.add('is-open');
        }
      });
    });
  });
});
