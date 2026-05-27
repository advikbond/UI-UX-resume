if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function resetScrollOnRefresh() {
  const navigationEntry = performance.getEntriesByType("navigation")[0];

  if (navigationEntry?.type === "reload") {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
  }
}

resetScrollOnRefresh();
window.addEventListener("pageshow", resetScrollOnRefresh);

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const homeLink = document.querySelector("[data-home-link]");
const navItems = Array.from(document.querySelectorAll(".nav-links a"));
const caseToc = document.querySelector(".case-toc");
const caseTocToggle = document.querySelector(".case-toc-toggle");
const carousels = Array.from(document.querySelectorAll("[data-carousel]"));
const downloadTooltipAreas = Array.from(document.querySelectorAll("[data-download-tooltip]"));
const mascotGrids = Array.from(document.querySelectorAll("[data-mascot-grid]"));
const refreshMascotButtons = Array.from(document.querySelectorAll("[data-refresh-mascots]"));
const activeSections = [
  { id: "work", node: document.querySelector("#work") },
  { id: "contact", node: document.querySelector("#contact") }
].filter((section) => section.node);
const path = window.location.pathname.replace(/\/$/, "");
const isHomePage = path === "" || path === "/index.html";
const standaloneSection = path === "/work" || path === "/work.html" || path === "/8answers" || path === "/whatihad.info" || path === "/yarddeck"
  ? "work"
  : path === "/play" || path === "/play.html"
    ? "play"
  : path === "/contact" || path === "/contact.html"
    ? "contact"
    : null;
const typingText = document.querySelector("#typing-text");
const typingLines = [
  "Messy mind, clean design.",
  "Question everything, refine and refine.",
  "Research and prototype with time,",
  "Making complicated things feel divine.",
  "Sticky notes covering every line,",
  "Until the patterns finally align.",
  "Users complain, I read the signs,",
  "Turning confusion into something refined."
];

function setMenuOpen(isOpen) {
  menuToggle.classList.toggle("is-open", isOpen);
  navLinks.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(!navLinks.classList.contains("is-open"));
});

navLinks.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    setMenuOpen(false);
  }
});

if (caseToc && caseTocToggle) {
  caseTocToggle.addEventListener("click", () => {
    const isOpen = caseToc.classList.toggle("is-open");
    caseTocToggle.setAttribute("aria-expanded", String(isOpen));
  });

  caseToc.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      caseToc.classList.remove("is-open");
      caseTocToggle.setAttribute("aria-expanded", "false");
    }
  });
}

carousels.forEach((carousel) => {
  const images = Array.from(carousel.querySelectorAll(".screen-carousel-track img"));
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const count = carousel.querySelector(".screen-carousel-count");
  let activeIndex = 0;

  function showImage(nextIndex) {
    activeIndex = (nextIndex + images.length) % images.length;

    images.forEach((image, index) => {
      const isActive = index === activeIndex;
      image.classList.toggle("is-active", isActive);
      image.toggleAttribute("hidden", !isActive);
    });

    if (count) {
      count.textContent = `${activeIndex + 1} / ${images.length}`;
    }
  }

  if (images.length < 2) {
    previousButton?.setAttribute("hidden", "");
    nextButton?.setAttribute("hidden", "");
    count?.setAttribute("hidden", "");
    return;
  }

  previousButton?.addEventListener("click", () => showImage(activeIndex - 1));
  nextButton?.addEventListener("click", () => showImage(activeIndex + 1));
  showImage(0);
});

function shuffled(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

const mascotFiles = [
  "anxiety.png",
  "beer.png",
  "birthday.png",
  "bored.png",
  "burp.png",
  "celebrating.png",
  "confused.png",
  "crying.png",
  "dance.png",
  "diwali.png",
  "dreaming.png",
  "eating.png",
  "exercising.png",
  "fat-happy.png",
  "fat.png",
  "fit.png",
  "flying.png",
  "frustrated.png",
  "full-stomach.png",
  "happy-2.png",
  "happy-3.png",
  "happy.png",
  "hiding.png",
  "hungry.png",
  "in-love.png",
  "jumping.png",
  "looking-back.png",
  "mad.png",
  "mind-blown.png",
  "money.png",
  "normal.png",
  "party.png",
  "pray.png",
  "relief.png",
  "sad-2.png",
  "sad-plain.png",
  "sad.png",
  "sarcastic.png",
  "shock.png",
  "sleeping.png",
  "smart.png",
  "thin.png",
  "winner-medal.png",
  "winning-trophy.png"
];

function createMascotLink(fileName) {
  const link = document.createElement("a");
  const image = document.createElement("img");
  const label = fileName.replace(".png", "").replaceAll("-", " ");
  const source = `/assets/whatihad.info/mascots/${fileName}`;

  link.href = source;
  link.download = "";
  image.src = source;
  image.alt = `Bellyo mascot ${label}`;
  link.append(image);

  return link;
}

function renderMascotGrid(grid) {
  grid.replaceChildren();

  shuffled(mascotFiles).slice(0, 9).forEach((fileName) => {
    grid.append(createMascotLink(fileName));
  });
}

mascotGrids.forEach(renderMascotGrid);

refreshMascotButtons.forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.add("is-loading");
    mascotGrids.forEach(renderMascotGrid);
    window.setTimeout(() => button.classList.remove("is-loading"), 450);
  });
});

downloadTooltipAreas.forEach((area) => {
  const label = area.querySelector(".download-cursor-label");

  if (!label) {
    return;
  }

  area.addEventListener("pointermove", (event) => {
    const rect = area.getBoundingClientRect();
    label.style.left = `${event.clientX - rect.left}px`;
    label.style.top = `${event.clientY - rect.top}px`;
  });
});

function setActiveNav(targetId) {
  const isHomeActive = targetId === "top" || targetId === "about";
  homeLink.classList.toggle("is-active", isHomeActive);

  if (isHomeActive) {
    homeLink.setAttribute("aria-current", "page");
  } else {
    homeLink.removeAttribute("aria-current");
  }

  navItems.forEach((item) => {
    const itemSection = item.dataset.section;
    const isActive = isHomeActive ? itemSection === "home" : itemSection === targetId;
    item.classList.toggle("is-active", isActive);

    if (isActive) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}

function updateActiveNav() {
  if (isHomePage) {
    setActiveNav("top");
    return;
  }

  if (standaloneSection) {
    setActiveNav(standaloneSection);
    return;
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const nearBottom = window.scrollY >= maxScroll - 4;
  const activationLine = window.scrollY + window.innerHeight * 0.45;
  let activeId = "top";

  for (const section of activeSections) {
    if (section.node.offsetTop <= activationLine) {
      activeId = section.id;
    }
  }

  if (nearBottom && document.querySelector("#contact")) {
    activeId = "contact";
  }

  setActiveNav(activeId);
}

window.addEventListener("scroll", updateActiveNav, { passive: true });
window.addEventListener("resize", updateActiveNav);
updateActiveNav();

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

async function runTypingLoop() {
  let lineIndex = 0;

  while (typingText) {
    const line = typingLines[lineIndex];
    typingText.textContent = "";

    for (let index = 0; index < line.length; index += 1) {
      typingText.textContent += line[index];
      await wait(42);
    }

    await wait(1600);
    typingText.textContent = "";
    await wait(180);
    lineIndex = (lineIndex + 1) % typingLines.length;
  }
}

runTypingLoop();
