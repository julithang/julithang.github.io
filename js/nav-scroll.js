document.addEventListener('DOMContentLoaded', () => {
  const projectsSection = document.getElementById('projects');
  const projectsLink = document.querySelector('.nav-link[href="#projects"]');
  if (!projectsSection || !projectsLink || !('IntersectionObserver' in window)) return;

  const headerHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
    10
  ) || 0;

  const observer = new IntersectionObserver(
    ([entry]) => {
      projectsLink.classList.toggle('is-current', entry.isIntersecting);
      if (entry.isIntersecting) {
        projectsLink.setAttribute('aria-current', 'page');
      } else {
        projectsLink.removeAttribute('aria-current');
      }
    },
    { rootMargin: `-${headerHeight}px 0px -50% 0px` }
  );

  observer.observe(projectsSection);
});
