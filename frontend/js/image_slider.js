let currentSlide = 0;
const slides = document.querySelectorAll(".home-slider img");
const dotsContainer = document.querySelector(".slider-dots");
let slideInterval;

// Preload images to prevent flickering
slides.forEach((slide) => {
  const img = new Image();
  img.src = slide.src;
});

// Create dots for each slide
slides.forEach((_, index) => {
  const dot = document.createElement("span");
  dot.classList.add("dot");
  if (index === 0) dot.classList.add("active");
  dot.addEventListener("click", () => goToSlide(index));
  dotsContainer.appendChild(dot);
});

function updateSlides() {
  slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === currentSlide);
  });
  document.querySelectorAll(".slider-dots .dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === currentSlide);
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  updateSlides();
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateSlides();
}

function goToSlide(index) {
  currentSlide = index;
  updateSlides();
  resetInterval();
}

function startSlideShow() {
  slideInterval = setInterval(nextSlide, 5000);
}

function resetInterval() {
  clearInterval(slideInterval);
  startSlideShow();
}

// Initialize slider
updateSlides();
startSlideShow();
