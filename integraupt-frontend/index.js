window.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("global-loader");
  if (!loader) return;

  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 600);
  }, 400);
});
