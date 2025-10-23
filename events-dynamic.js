/**
 * NeoSharX Events - Dynamic Backend Integration
 * Fetches events from Django backend and renders them with carousel functionality
 */

const EVENTS_API_BASE = "http://localhost:8000/api/auth/events";

// Event card template generator
function createEventCard(event, eventType) {
  const isUpcoming = eventType === "upcoming";
  const isPast = eventType === "past";
  const isRecent = eventType === "recent";

  // Determine image styling
  const imageClass = isPast ? "filter grayscale" : "";
  const cardClass = isUpcoming
    ? "border-2 border-primary shadow-glow-blue"
    : "shadow-lg";
  const gradientClass = isPast
    ? "bg-black/50"
    : "bg-gradient-to-t from-black/70 to-transparent";

  // Build benefits HTML if available
  let benefitsHTML = "";
  if (event.benefits && event.benefits.length > 0) {
    benefitsHTML = `
            <div class="benefits-section hidden opacity-0 absolute inset-0 bg-black/95 p-6 overflow-y-auto transition-opacity duration-300">
                <button class="close-benefits absolute top-2 right-2 text-white hover:text-primary">
                    <span class="material-symbols-outlined">close</span>
                </button>
                <h5 class="text-white font-bold text-lg mb-4">Event Benefits</h5>
                <ul class="text-white text-sm space-y-2">
                    ${event.benefits
                      .map(
                        (benefit) =>
                          `<li class="flex items-start"><span class="material-symbols-outlined text-primary mr-2 text-sm">check_circle</span><span>${benefit}</span></li>`
                      )
                      .join("")}
                </ul>
                ${
                  event.details
                    ? `<p class="text-white/80 text-xs mt-4 border-t border-white/20 pt-4">${event.details}</p>`
                    : ""
                }
                ${
                  event.location
                    ? `<p class="text-white/80 text-xs mt-2"><span class="material-symbols-outlined text-sm inline">location_on</span> ${event.location}</p>`
                    : ""
                }
            </div>
        `;
  }

  // Hover button text
  let hoverButtonText = "";
  if (isUpcoming) {
    hoverButtonText = event.is_registration_open
      ? "Register Now"
      : "Learn More";
  } else if (isRecent) {
    hoverButtonText = "View Photos / Replay";
  } else {
    hoverButtonText = "Watch Highlights";
  }

  // Coming soon badge for upcoming
  const comingSoonBadge = isUpcoming
    ? '<div class="absolute top-2 right-2 bg-primary/80 text-white text-xs font-bold px-2 py-1 rounded-full">Coming Soon</div>'
    : "";

  // Image source
  const imageSrc =
    event.thumbnail_image ||
    event.featured_image ||
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400";

  return `
        <div class="carousel-item flex-shrink-0 w-full rounded-xl overflow-hidden group relative ${cardClass}" data-event-id="${
    event.id
  }">
            <img alt="${
              event.name
            }" class="w-full h-80 object-cover ${imageClass}" src="${imageSrc}" loading="lazy" />
            ${comingSoonBadge}
            <div class="absolute inset-0 ${gradientClass} flex flex-col justify-end p-4 text-white">
                <h4 class="font-bold text-lg line-clamp-2">${event.name}</h4>
                <p class="text-sm">${
                  event.formatted_date || event.event_date
                }</p>
                ${
                  event.location
                    ? `<p class="text-xs opacity-80 mt-1">${event.location}</p>`
                    : ""
                }
                ${
                  isUpcoming
                    ? `
                    <button class="register-btn bg-primary text-white font-bold py-2 px-4 rounded-lg w-full hover:bg-primary/90 transition-colors mt-2">
                        ${hoverButtonText}
                    </button>
                `
                    : `
                    <button class="view-details-btn absolute inset-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-lg">
                        ${hoverButtonText}
                    </button>
                `
                }
            </div>
            ${benefitsHTML}
        </div>
    `;
}

// Fetch events by type
async function fetchEventsByType(eventType) {
  try {
    const response = await fetch(`${EVENTS_API_BASE}/type/${eventType}/`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching ${eventType} events:`, error);
    return [];
  }
}

// Render events in carousel container
function renderEvents(events, containerSelector, eventType) {
  const container = document.querySelector(containerSelector);

  if (!container) {
    console.error(`Container not found: ${containerSelector}`);
    return;
  }

  // Clear existing content
  container.innerHTML = "";

  if (events.length === 0) {
    container.innerHTML = `
            <div class="carousel-item flex-shrink-0 w-full rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 flex items-center justify-center h-80">
                <p class="text-stone-600 dark:text-stone-400 text-center px-4">
                    No ${eventType} events available at this time.
                </p>
            </div>
        `;
    return;
  }

  // Render event cards
  events.forEach((event) => {
    container.innerHTML += createEventCard(event, eventType);
  });

  // Add event listeners after rendering
  addEventCardListeners(container);
}

// Add event listeners to cards
function addEventCardListeners(container) {
  // View details buttons
  const viewDetailsBtns = container.querySelectorAll(".view-details-btn");
  viewDetailsBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const card = this.closest(".carousel-item");
      const benefitsSection = card.querySelector(".benefits-section");

      if (benefitsSection) {
        benefitsSection.classList.remove("hidden");
        setTimeout(() => benefitsSection.classList.add("opacity-100"), 10);
      }
    });
  });

  // Close benefits buttons
  const closeBtns = container.querySelectorAll(".close-benefits");
  closeBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const benefitsSection = this.closest(".benefits-section");
      benefitsSection.classList.remove("opacity-100");
      setTimeout(() => benefitsSection.classList.add("hidden"), 300);
    });
  });

  // Register/Learn more buttons for upcoming events
  const registerBtns = container.querySelectorAll(".register-btn");
  registerBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const card = this.closest(".carousel-item");
      const eventId = card.dataset.eventId;
      console.log(`Registration clicked for event ${eventId}`);
      // TODO: Implement registration modal or redirect
      alert("Event registration coming soon!");
    });
  });

  // Card click to expand
  const cards = container.querySelectorAll(".carousel-item");
  cards.forEach((card) => {
    card.addEventListener("click", function () {
      // Add smooth scale animation
      this.style.transform = "scale(1.02)";
      setTimeout(() => {
        this.style.transform = "scale(1)";
      }, 200);
    });
  });
}

// Update pagination dots
function updatePagination(carousel) {
  const scrollContainer = carousel.querySelector(".scroll-container");
  const pagination = carousel.querySelector(".pagination");
  const items = scrollContainer.querySelectorAll(".carousel-item");

  if (!pagination || items.length === 0) return;

  // Clear existing dots
  pagination.innerHTML = "";

  // Create dots
  items.forEach((item, index) => {
    const dot = document.createElement("div");
    dot.classList.add(
      "dot",
      "w-2",
      "h-2",
      "rounded-full",
      "cursor-pointer",
      "transition-all"
    );

    if (index === 0) {
      dot.classList.add("bg-primary", "w-8");
    } else {
      dot.classList.add("bg-stone-400", "dark:bg-stone-600");
    }

    dot.addEventListener("click", () => {
      item.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    });

    pagination.appendChild(dot);
  });

  // Update active dot on scroll
  scrollContainer.addEventListener("scroll", () => {
    const scrollLeft = scrollContainer.scrollLeft;
    const itemWidth = items[0].offsetWidth;
    const activeIndex = Math.round(scrollLeft / itemWidth);

    pagination.querySelectorAll(".dot").forEach((dot, index) => {
      if (index === activeIndex) {
        dot.classList.add("bg-primary", "w-8");
        dot.classList.remove("bg-stone-400", "dark:bg-stone-600");
      } else {
        dot.classList.remove("bg-primary", "w-8");
        dot.classList.add("bg-stone-400", "dark:bg-stone-600");
      }
    });
  });
}

// Setup carousel navigation
function setupCarouselNavigation(carousel) {
  const scrollContainer = carousel.querySelector(".scroll-container");
  const prevBtn = carousel.querySelector(".carousel-prev");
  const nextBtn = carousel.querySelector(".carousel-next");
  const items = scrollContainer.querySelectorAll(".carousel-item");

  if (!scrollContainer || items.length === 0) return;

  const itemWidth = items[0].offsetWidth;

  // Previous button
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      scrollContainer.scrollBy({
        left: -itemWidth - 24, // item width + gap
        behavior: "smooth",
      });
    });
  }

  // Next button
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      scrollContainer.scrollBy({
        left: itemWidth + 24, // item width + gap
        behavior: "smooth",
      });
    });
  }

  // Mouse drag to scroll
  let isDown = false;
  let startX;
  let scrollLeft;

  scrollContainer.addEventListener("mousedown", (e) => {
    isDown = true;
    scrollContainer.style.cursor = "grabbing";
    startX = e.pageX - scrollContainer.offsetLeft;
    scrollLeft = scrollContainer.scrollLeft;
  });

  scrollContainer.addEventListener("mouseleave", () => {
    isDown = false;
    scrollContainer.style.cursor = "grab";
  });

  scrollContainer.addEventListener("mouseup", () => {
    isDown = false;
    scrollContainer.style.cursor = "grab";
  });

  scrollContainer.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scrollContainer.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    scrollContainer.scrollLeft = scrollLeft - walk;
  });

  // Update pagination
  updatePagination(carousel);
}

// Initialize all events
async function initializeEvents() {
  console.log("🎉 Initializing NeoSharX Events...");

  // Show loading state
  const eventTypes = [
    {
      type: "past",
      selector: "#events-carousel-section > div:nth-child(1) .scroll-container",
    },
    {
      type: "recent",
      selector: "#events-carousel-section > div:nth-child(2) .scroll-container",
    },
    {
      type: "upcoming",
      selector: "#events-carousel-section > div:nth-child(3) .scroll-container",
    },
  ];

  // Fetch and render events
  for (const { type, selector } of eventTypes) {
    const events = await fetchEventsByType(type);
    console.log(`✅ Loaded ${events.length} ${type} events`);
    renderEvents(events, selector, type);
  }

  // Setup carousels after rendering
  const carousels = document.querySelectorAll("#events-carousel-section > div");
  carousels.forEach((carousel) => {
    setupCarouselNavigation(carousel);
  });

  console.log("🚀 NeoSharX Events initialized successfully!");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeEvents);
} else {
  initializeEvents();
}

// Export for use in other scripts if needed
window.NeoSharXEvents = {
  fetchEventsByType,
  initializeEvents,
};
