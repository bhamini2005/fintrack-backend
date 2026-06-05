  const btn = document.getElementById("menuBtn");
  const sidebar = document.querySelector(".sidebar");

  // Toggle sidebar
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent immediate close
    sidebar.classList.toggle("active");
  });

  // Prevent sidebar clicks from closing it
  sidebar.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Click anywhere else → close sidebar
  document.addEventListener("click", () => {
    sidebar.classList.remove("active");
  });