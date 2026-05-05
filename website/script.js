// Reveal-on-scroll
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Year stamp
const y = document.querySelector('[data-year]');
if (y) y.textContent = new Date().getFullYear();
