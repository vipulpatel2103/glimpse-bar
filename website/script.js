document.addEventListener('DOMContentLoaded', () => {
  // Reveal-on-scroll
  // rootMargin -4% prevents elements near bottom from never triggering on small viewports
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Year stamp
  const y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
});
