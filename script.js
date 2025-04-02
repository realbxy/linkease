const themeToggle = document.getElementById("themeToggle");
const editToggle = document.getElementById("editToggle");
const profilePic = document.getElementById("profilePic");
const profilePicUpload = document.getElementById("profilePicUpload");
const displayName = document.getElementById("displayName");
const editName = document.getElementById("editName");
const bioText = document.getElementById("bioText");
const editBio = document.getElementById("editBio");
const bioCharCount = document.getElementById("bioCharCount");
const linksEditor = document.getElementById("linksEditor");
const addLinkBtn = document.getElementById("addLinkBtn");
const linksContainer = document.getElementById("linksContainer");
const shareBtn = document.getElementById("shareBtn");
const shareTwitter = document.getElementById("shareTwitter");
const shareInstagram = document.getElementById("shareInstagram");
const shareFacebook = document.getElementById("shareFacebook");
const followBtn = document.getElementById("followBtn");
const followerCount = document.getElementById("followerCount");
const typewriter = document.getElementById("typewriter");
const modal = document.getElementById("settingsModal");
const closeModal = document.querySelector(".close-modal");
const loader = document.getElementById("loader");
const mainContainer = document.getElementById("mainContainer");
const bgColor = document.getElementById("bgColor");
const linkColor = document.getElementById("linkColor");
const previewPic = document.getElementById("previewPic");
const previewName = document.getElementById("previewName");
const previewBio = document.getElementById("previewBio");
const previewLinks = document.getElementById("previewLinks");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Theme initialization
if (
  localStorage.getItem("theme") === "dark" ||
  (!localStorage.getItem("theme") &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.setAttribute("data-theme", "dark");
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateLinkColors();
  updateParticleColors();
});

// Share functionality
const shareUrl = window.location.href;
shareBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(shareUrl).then(() => {
    shareBtn.innerText = "✅ Copied!";
    setTimeout(() => (shareBtn.innerText = "📎 Copy Link"), 2000);
  });
});

shareTwitter.addEventListener("click", () => {
  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=Check out my Linkhub!`, "_blank");
});

shareInstagram.addEventListener("click", () => {
  alert("Copy the link and share it on Instagram!");
  navigator.clipboard.writeText(shareUrl);
});

shareFacebook.addEventListener("click", () => {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
});

// Follow button functionality
let followers = parseInt(localStorage.getItem("followers") || "0");
let isFollowing = localStorage.getItem("isFollowing") === "true";
followerCount.textContent = `${followers} followers`;
if (isFollowing) {
  followBtn.classList.add("followed");
  followBtn.textContent = "Unfollow";
}

followBtn.addEventListener("click", () => {
  if (isFollowing) {
    followers--;
    isFollowing = false;
    followBtn.classList.remove("followed");
    followBtn.textContent = "Follow";
  } else {
    followers++;
    isFollowing = true;
    followBtn.classList.add("followed");
    followBtn.textContent = "Unfollow";
  }
  followerCount.textContent = `${followers} followers`;
  localStorage.setItem("followers", followers);
  localStorage.setItem("isFollowing", isFollowing);
});

// Modal toggle
editToggle.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
  resetToOriginal();
});

// Typewriter effect
let index = 0;
const message = "My socials:";
function type() {
  if (index < message.length) {
    typewriter.innerHTML = message.substring(0, index + 1);
    index++;
    setTimeout(type, 50);
  }
}
setTimeout(type, 1000);

// Social platforms with official logos
const socialPlatforms = [
  { label: "Custom", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/globe.svg", value: "custom" },
  { label: "Twitter", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg", value: "twitter" },
  { label: "Instagram", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg", value: "instagram" },
  { label: "YouTube", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg", value: "youtube" },
  { label: "Facebook", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg", value: "facebook" }
];

// Default profile data
const defaultProfile = {
  pic: "https://i.pravatar.cc/100?u=yourusername",
  name: "@yourname",
  bio: "My socials:",
  links: [
    { label: "My Website", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/globe.svg", url: "https://example.com", platform: "custom" },
    { label: "Twitter", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg", url: "https://twitter.com", platform: "twitter" },
    { label: "Instagram", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg", url: "https://instagram.com", platform: "instagram" },
    { label: "YouTube", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg", url: "https://youtube.com", platform: "youtube" }
  ],
  bgColor: "#f5f5f5",
  linkColor: null
};

let currentLinks = [];
let originalProfile = JSON.parse(JSON.stringify(defaultProfile));

// Update link colors based on theme if not manually set
function updateLinkColors() {
  if (!originalProfile.linkColor) {
    const theme = document.documentElement.getAttribute("data-theme");
    const defaultLinkColor = theme === "light" ? "#000000" : "#ffffff";
    document.documentElement.style.setProperty("--link-bg", defaultLinkColor);
  } else {
    document.documentElement.style.setProperty("--link-bg", originalProfile.linkColor);
  }
}

// Profile picture upload
profilePic.addEventListener("click", () => {
  profilePicUpload.click();
});

profilePicUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      profilePic.src = imageData;
      previewPic.src = imageData;
      localStorage.setItem("profilePic", imageData);
    };
    reader.readAsDataURL(file);
  }
});

// Render links in main container and preview
function renderLinks(links, container) {
  container.innerHTML = "";
  links.forEach((link, idx) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.setAttribute("data-label", link.label);
    a.setAttribute("aria-label", `Visit ${link.label}`);
    a.style.setProperty("--index", idx);
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
  });
}

// Render link editor in settings modal with drag-and-drop
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
        <button class="edit-link" data-index="${index}">Edit</button>
        <button class="delete-link" data-index="${index}">Delete</button>
      </div>
    `;
    linksEditor.appendChild(linkItem);
  });

  // Drag-and-drop functionality
  const linkItems = document.querySelectorAll(".link-item");
  linkItems.forEach(item => {
    item.addEventListener("dragstart", (e) => {
      item.classList.add("dragging");
      e.dataTransfer.setData("text/plain", item.dataset.index);
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const targetIndex = parseInt(item.dataset.index);
      if (draggedIndex !== targetIndex) {
        const [draggedLink] = currentLinks.splice(draggedIndex, 1);
        currentLinks.splice(targetIndex, 0, draggedLink);
        renderLinkEditor();
        updatePreview();
      }
    });
  });

  document.querySelectorAll(".link-platform").forEach(select => {
    select.addEventListener("change", (e) => {
      const index = e.target.dataset.index;
      const platform = socialPlatforms.find(p => p.value === e.target.value);
      currentLinks[index].platform = platform.value;
      currentLinks[index].icon = platform.icon;
      updatePreview();
    });
  });

  document.querySelectorAll(".link-label").forEach(input => {
    input.addEventListener("input", (e) => {
      const index = e.target.parentElement.querySelector(".link-platform").dataset.index;
      currentLinks[index].label = e.target.value;
      updatePreview();
    });
  });

  document.querySelectorAll(".link-url").forEach(input => {
    input.addEventListener("input", (e) => {
      const index = e.target.parentElement.querySelector(".link-platform").dataset.index;
      currentLinks[index].url = e.target.value;
      updatePreview();
    });
  });

  document.querySelectorAll(".edit-link").forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const index = e.target.dataset.index;
      const newUrl = linksEditor.children[index].querySelector(".link-url").value;
      if (verifyLink(newUrl)) {
        currentLinks[index].label = linksEditor.children[index].querySelector(".link-label").value;
        currentLinks[index].url = newUrl;
        updatePreview();
      }
    });
  });

  document.querySelectorAll(".delete-link").forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const index = e.target.dataset.index;
      currentLinks.splice(index, 1);
      renderLinkEditor();
      updatePreview();
    });
  });
}

// Link verification (mock implementation)
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

// Update preview in theme tab
function updatePreview() {
  previewPic.src = profilePic.src;
  previewName.textContent = editName.value || defaultProfile.name;
  previewBio.textContent = editBio.value || defaultProfile.bio;
  renderLinks(currentLinks, previewLinks);
  document.documentElement.style.setProperty("--bg-color", bgColor.value);
  if (linkColor.value === "#000000" && document.documentElement.getAttribute("data-theme") === "dark") {
    document.documentElement.style.setProperty("--link-bg", "#ffffff");
  } else if (linkColor.value === "#ffffff" && document.documentElement.getAttribute("data-theme") === "light") {
    document.documentElement.style.setProperty("--link-bg", "#000000");
  } else {
    document.documentElement.style.setProperty("--link-bg", linkColor.value);
  }
}

// Load profile data
function loadProfile() {
  const data = JSON.parse(localStorage.getItem("profileData") || JSON.stringify(defaultProfile));
  originalProfile = JSON.parse(JSON.stringify(data));
  profilePic.src = localStorage.getItem("profilePic") || data.pic;
  displayName.textContent = data.name;
  bioText.textContent = data.bio;
  editName.value = data.name;
  editBio.value = data.bio;
  currentLinks = data.links;
  bgColor.value = data.bgColor;
  linkColor.value = data.linkColor || (document.documentElement.getAttribute("data-theme") === "light" ? "#000000" : "#ffffff");
  document.documentElement.style.setProperty("--bg-color", data.bgColor);
  document.documentElement.style.setProperty("--link-bg", data.linkColor || (document.documentElement.getAttribute("data-theme") === "light" ? "#000000" : "#ffffff"));
  renderLinks(data.links, linksContainer);
  renderLinkEditor();
  updatePreview();
  bioCharCount.textContent = `${editBio.value.length}/80`;
  setTimeout(() => {
    loader.style.display = "none";
    mainContainer.style.display = "block";
  }, 1000);
}

// Reset to original profile data
function resetToOriginal() {
  const data = JSON.parse(JSON.stringify(originalProfile));
  editName.value = data.name;
  editBio.value = data.bio;
  currentLinks = data.links;
  bgColor.value = data.bgColor;
  linkColor.value = data.linkColor || (document.documentElement.getAttribute("data-theme") === "light" ? "#000000" : "#ffffff");
  renderLinkEditor();
  updatePreview();
  bioCharCount.textContent = `${editBio.value.length}/80`;
}

// Input listeners for live preview
editName.addEventListener("input", updatePreview);
editBio.addEventListener("input", (e) => {
  bioCharCount.textContent = `${e.target.value.length}/80`;
  updatePreview();
});
bgColor.addEventListener("input", updatePreview);
linkColor.addEventListener("input", updatePreview);

// Add new link
addLinkBtn.addEventListener("click", () => {
  currentLinks.push({ label: "New Link", url: "https://example.com", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/globe.svg", platform: "custom" });
  renderLinkEditor();
  updatePreview();
});

// Tab switching
tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    tabButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    tabContents.forEach(content => content.style.display = "none");
    document.getElementById(`${button.dataset.tab}Tab`).style.display = "flex";
  });
});

// Save changes for each tab
document.querySelectorAll(".save-tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    try {
      const updated = {
        pic: profilePic.src,
        name: editName.value || defaultProfile.name,
        bio: editBio.value || defaultProfile.bio,
        links: currentLinks,
        bgColor: bgColor.value,
        linkColor: linkColor.value === (document.documentElement.getAttribute("data-theme") === "light" ? "#000000" : "#ffffff") ? null : linkColor.value
      };

      localStorage.setItem("profileData", JSON.stringify(updated));
      originalProfile = JSON.parse(JSON.stringify(updated));
      loadProfile();
      modal.style.display = "none";
    } catch (e) {
      alert("Error saving settings. Please check your inputs.");
    }
  });
});

// Discard changes for each tab
document.querySelectorAll(".discard-tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    resetToOriginal();
  });
});

// Animated cursor with trail
const cursor = document.querySelector(".custom-cursor");
const trailContainer = document.querySelector(".cursor-trail-container");
const trails = [];
const trailLength = 10;

for (let i = 0; i < trailLength; i++) {
  const trail = document.createElement("div");
  trail.classList.add("cursor-trail");
  trailContainer.appendChild(trail);
  trails.push({ element: trail, x: 0, y: 0, opacity: 1 - (i / trailLength) });
}

document.addEventListener("mousemove", (e) => {
  const x = e.clientX;
  const y = e.clientY;

  cursor.style.left = x + "px";
  cursor.style.top = y + "px";

  trails.forEach((trail, index) => {
    const prevTrail = index === 0 ? { x, y } : trails[index - 1];
    const speed = 0.2 * (index + 1);
    trail.x += (prevTrail.x - trail.x) * speed;
    trail.y += (prevTrail.y - trail.y) * speed;
    trail.element.style.left = trail.x + "px";
    trail.element.style.top = trail.y + "px";
    trail.element.style.opacity = trail.opacity;
  });
});

// Background particle animation with connections
const canvas = document.getElementById("backgroundCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const particleCount = 50;

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 5 + 1;
    this.speedX = Math.random() * 1 - 0.5;
    this.speedY = Math.random() * 1 - 0.5;
    this.hue = Math.random() * 60 + 240; // Base hue around purple-blue
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

    this.hue += 0.5;
    if (this.hue > 360) this.hue -= 360;
  }

  draw() {
    const theme = document.documentElement.getAttribute("data-theme");
    const brightness = theme === "light" ? 0.8 : 0.4;
    ctx.fillStyle = `hsla(${this.hue}, 70%, ${brightness * 100}%, 0.8)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

for (let i = 0; i < particleCount; i++) {
  particles.push(new Particle());
}

function connectParticles() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 100) {
        const theme = document.documentElement.getAttribute("data-theme");
        const brightness = theme === "light" ? 0.5 : 0.2;
        const opacity = 1 - distance / 100;
        ctx.strokeStyle = `hsla(${particles[i].hue}, 70%, ${brightness * 100}%, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

function updateParticleColors() {
  particles.forEach(particle => {
    particle.draw();
  });
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(particle => {
    particle.update();
    particle.draw();
  });
  connectParticles();
  requestAnimationFrame(animateParticles);
}

animateParticles();
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Initial load
loadProfile();

// Disable right-click
document.addEventListener("contextmenu", e => {
  if (!["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
    e.preventDefault();
  }
});

// Disable Ctrl+C and Ctrl+V except in inputs
document.addEventListener("keydown", e => {
  const isInput = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v")) {
    if (!isInput) e.preventDefault();
  }
});
