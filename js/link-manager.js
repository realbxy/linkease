const linksEditor = document.getElementById("linksEditor");
const addLinkBtn = document.getElementById("addLinkBtn");
const linksContainer = document.getElementById("linksContainer");
const previewLinks = document.getElementById("previewLinks");
import { currentLinks } from './profile-manager.js';

const socialPlatforms = [
  { label: "Custom", icon: "https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/globe.svg", value: "custom" },
  { label: "Twitter", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg", value: "twitter" },
  { label: "Instagram", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg", value: "instagram" },
  { label: "YouTube", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg", value: "youtube" },
  { label: "Facebook", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg", value: "facebook" }
];

function renderLinks(links, container) {
  const linksNav = container.id === "linksContainer" ? document.getElementById("linksNav") : document.getElementById("previewLinksNav");
  const linksPerPage = 5;
  const totalPages = Math.ceil(links.length / linksPerPage);
  let currentPage = 0;

  // Function to render the current page of links
  function renderPage(page) {
    container.innerHTML = "";
    const start = page * linksPerPage;
    const end = Math.min(start + linksPerPage, links.length);

    // Render links for the current page
    for (let i = start; i < end; i++) {
      const link = links[i];
      const a = document.createElement("a");
      a.href = link.url;
      a.target = "_blank";
      a.setAttribute("data-label", link.label);
      a.setAttribute("aria-label", `Visit ${link.label}`);
      a.style.setProperty("--index", i - start); // For animation delay
      a.innerHTML = `<span><img src="${link.icon}" alt="" class="social-logo" /> ${link.label}</span>`;
      const countSpan = document.createElement("span");
      countSpan.classList.add("click-count");
      countSpan.id = `counter-${link.label}`;
      const clicks = localStorage.getItem(link.label) || 0;
      countSpan.innerHTML = `${clicks}`;
      a.appendChild(countSpan);
      a.addEventListener("click", (e) => {
        e.preventDefault();
        let count = parseInt(localStorage.getItem(link.label) || 0) + 1;
        localStorage.setItem(link.label, count);
        countSpan.innerHTML = `${count}`;
        window.open(link.url, "_blank");
      });
      container.appendChild(a);
    }

    // Add the "visible" class to trigger animations
    setTimeout(() => {
      const linkElements = container.querySelectorAll("a");
      linkElements.forEach((link, idx) => {
        link.classList.add("visible");
        link.style.transitionDelay = `${idx * 0.1}s`; // Staggered animation
      });
    }, 50);

    // Update navigation dots
    linksNav.innerHTML = "";
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      if (i === page) dot.classList.add("active");
      dot.addEventListener("click", () => {
        currentPage = i;
        renderPage(currentPage);
      });
      linksNav.appendChild(dot);
    }
  }

  // Initial render
  renderPage(currentPage);
}

function renderLinkEditor() {
  linksEditor.innerHTML = "";
  currentLinks.forEach((link, index) => {
    const linkItem = document.createElement("div");
    linkItem.classList.add("link-item");
    linkItem.setAttribute("draggable", "true");
    linkItem.setAttribute("data-index", index);
    linkItem.innerHTML = `
      <select class="link-platform" data-index="${index}">
        ${socialPlatforms.map(platform => `<option value="${platform.value}" ${link.platform === platform.value ? "selected" : ""}>${platform.label}</option>`).join("")}
      </select>
      <input type="text" class="link-label" placeholder="Title" value="${link.label}" oncopy="return true;" onpaste="return true;" />
      <input type="text" class="link-url" placeholder="URL" value="${link.url}" oncopy="return true;" onpaste="return true;" />
      <div class="link-actions">
        <button class="edit-link" data-index="${index}" title="Edit Link"><i class="fas fa-edit"></i> Edit</button>
        <button class="remove-link" data-index="${index}" title="Remove Link"><i class="fas fa-trash-alt"></i> Remove</button>
      </div>
    `;
    linksEditor.appendChild(linkItem);
  });

  const linkItems = document.querySelectorAll(".link-item");
  linkItems.forEach(item => {
    item.addEventListener("dragstart", (e) => {
      item.classList.add("dragging");
      e.dataTransfer.setData("text/plain", item.dataset.index);
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("dragover", (e) => e.preventDefault());
    item.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const targetIndex = parseInt(item.dataset.index);
      if (draggedIndex !== targetIndex) {
        const [draggedLink] = currentLinks.splice(draggedIndex, 1);
        currentLinks.splice(targetIndex, 0, draggedLink);
        renderLinkEditor();
        renderLinks(currentLinks, previewLinks);
      }
    });
  });

  document.querySelectorAll(".link-platform").forEach(select => {
    select.addEventListener("change", (e) => {
      const index = e.target.dataset.index;
      const platform = socialPlatforms.find(p => p.value === e.target.value);
      currentLinks[index].platform = platform.value;
      currentLinks[index].icon = platform.icon;
      renderLinks(currentLinks, previewLinks);
    });
  });

  document.querySelectorAll(".link-label").forEach(input => {
    input.addEventListener("input", (e) => {
      const index = e.target.parentElement.querySelector(".link-platform").dataset.index;
      currentLinks[index].label = e.target.value;
      renderLinks(currentLinks, previewLinks);
    });
  });

  document.querySelectorAll(".link-url").forEach(input => {
    input.addEventListener("input", (e) => {
      const index = e.target.parentElement.querySelector(".link-platform").dataset.index;
      currentLinks[index].url = e.target.value;
      renderLinks(currentLinks, previewLinks);
    });
  });

  document.querySelectorAll(".edit-link").forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const index = e.target.dataset.index || e.target.parentElement.dataset.index;
      const newUrl = linksEditor.children[index].querySelector(".link-url").value;
      if (verifyLink(newUrl)) {
        currentLinks[index].label = linksEditor.children[index].querySelector(".link-label").value;
        currentLinks[index].url = newUrl;
        renderLinks(currentLinks, previewLinks);
      }
    });
  });

  document.querySelectorAll(".remove-link").forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const index = e.target.dataset.index || e.target.parentElement.dataset.index;
      currentLinks.splice(index, 1);
      renderLinkEditor();
      renderLinks(currentLinks, previewLinks);
    });
  });
}

function verifyLink(url) {
  if (!url.startsWith("https://")) {
    alert("Warning: Link should start with 'https://' for security.");
    return false;
  }
  const suspiciousKeywords = ["phishing", "malware", "virus"];
  if (suspiciousKeywords.some(keyword => url.toLowerCase().includes(keyword))) {
    alert("Warning: This link may be unsafe. It contains suspicious keywords.");
    return false;
  }
  return true;
}

addLinkBtn.addEventListener("click", () => {
  currentLinks.push({ label: "New Link", url: "https://example.com", icon: "https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/globe.svg", platform: "custom" });
  renderLinkEditor();
  renderLinks(currentLinks, previewLinks);
});

export { renderLinks, renderLinkEditor };
