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
  { label: "Custom", icon: "https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/globe.svg", value: "custom" },
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
    { label: "My Website", icon: "https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/globe.svg", url: "https://example.com", platform: "custom" },
    { label: "Twitter", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg", url: "https://twitter.com", platform: "twitter" },
    { label: "Instagram", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg", url: "https://instagram.com", platform: "instagram" },
    { label: "YouTube", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg", url: "https://youtube.com", platform: "youtube" }
  ],
  bgColor: "#f5f5f5",
  linkColor: "#000000"
};

let currentLinks = [];
let originalProfile = JSON.parse(JSON.stringify(defaultProfile));

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
  document.documentElement.style.setProperty("--link-bg", linkColor.value);
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
  linkColor.value = data.linkColor;
  document.documentElement.style.setProperty("--bg-color", data.bgColor);
  document.documentElement.style.setProperty("--link-bg", data.linkColor);
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
  linkColor.value = data.linkColor;
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
  currentLinks.push({ label: "New Link", url: "https://example.com", icon: "https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/globe.svg", platform: "custom" });
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
        linkColor: linkColor.value
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

// Animated cursor 
const canvas = document.getElementById("cursor-canvas");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const trail = [];
const trailLimit = 70; /* Slightly longer trail for better visibility */
const rippleGroups = []; /* Array to store groups of ripples */
const maxRippleGroups = 8; /* Reduced limit for active ripple groups */
let mouseX = width / 2;
let mouseY = height / 2;
let hasMoved = false;
let time = 0; /* For shimmer and rainbow effect */
let lastClickTime = 0; /* For throttling clicks */
const clickThrottle = 150; /* Increased throttle time to 150ms */

// Track mouse movement
document.addEventListener("mousemove", (e) => {
  hasMoved = true;
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Track mouse clicks for ripple effect with throttling
document.addEventListener("click", (e) => {
  const currentTime = Date.now();
  if (currentTime - lastClickTime < clickThrottle) return; /* Throttle clicks */
  lastClickTime = currentTime;

  // Limit the number of ripple groups
  if (rippleGroups.length >= maxRippleGroups) {
    rippleGroups.shift(); /* Remove the oldest group */
  }

  const rippleGroup = [];
  const baseHue = (time % 360) / 360; /* Start with the current hue */
  // Create two ripple layers with slight delays
  for (let i = 0; i < 2; i++) {
    rippleGroup.push({
      x: e.clientX,
      y: e.clientY,
      radius: 0,
      opacity: 1,
      hue: (baseHue + i * 0.1) % 1, /* Slightly different hues for each layer */
      delay: i * 5, /* Reduced delay for faster cascade */
      frame: 0 /* Track frames for delay */
    });
  }
  rippleGroups.push(rippleGroup);
});

// Resize support
window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // Achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function animate() {
  time += 0.05; /* Increment for shimmer and rainbow effect */

  const last = trail.length ? trail[trail.length - 1] : { x: mouseX, y: mouseY };
  const smoothX = last.x + (mouseX - last.x) * 0.2;
  const smoothY = last.y + (mouseY - last.y) * 0.2;

  trail.push({ x: smoothX, y: smoothY });
  if (trail.length > trailLimit) trail.shift();

  ctx.clearRect(0, 0, width, height);

  const coreColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--cursor-core-color').trim();

  // Calculate rainbow colors for the trail
  const hue = (time % 360) / 360;
  const glowColor = hslToRgb(hue, 0.8, 0.6);
  const outerGlowColor = hslToRgb(hue, 0.9, 0.5);

  // Draw ripples
  for (let i = rippleGroups.length - 1; i >= 0; i--) {
    const group = rippleGroups[i];
    let allFaded = true;

    for (let j = group.length - 1; j >= 0; j--) {
      const ripple = group[j];
      ripple.frame++;

      if (ripple.frame < ripple.delay) continue; /* Apply delay */

      ripple.radius += 0.8; /* Slower expansion for smaller ripples */
      ripple.opacity -= 0.015; /* Faster fade-out to reduce active ripples */
      ripple.hue = (ripple.hue + 0.003) % 1; /* Slower hue cycle for smoother transition */

      if (ripple.opacity <= 0) {
        group.splice(j, 1);
        continue;
      }

      allFaded = false;

      const shimmer = 1 + 0.15 * Math.sin(time + j); /* Enhanced shimmer effect */
      const rippleColor = hslToRgb(ripple.hue, 0.9, 0.5);

      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = rippleColor;
      ctx.globalAlpha = ripple.opacity;
      ctx.shadowColor = rippleColor;
      ctx.shadowBlur = 30 * shimmer; /* Reduced glow for performance */
      ctx.lineWidth = 8 - j * 2; /* Smaller thickness: 8, 6 */
      ctx.stroke();
    }

    if (allFaded) {
      rippleGroups.splice(i, 1); /* Remove empty groups */
    }
  }
  ctx.globalAlpha = 1; /* Reset alpha for trail */

  // Draw the trail if there's enough points
  if (hasMoved && trail.length >= 4) {
    // Shimmer effect for glow
    const shimmer = 1 + 0.1 * Math.sin(time);
    const outerBlur = 50 * shimmer;
    const innerBlur = 35 * shimmer;

    // Outer glow trail
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length - 2; i += 1) {
      if (i + 2 < trail.length) {
        ctx.bezierCurveTo(
          trail[i].x, trail[i].y,
          trail[i + 1].x, trail[i + 1].y,
          trail[i + 2].x, trail[i + 2].y
        );
      }
    }
    ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);

    ctx.strokeStyle = outerGlowColor;
    ctx.shadowColor = outerGlowColor;
    ctx.shadowBlur = outerBlur;
    ctx.lineWidth = 18;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Inner glow trail
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length - 2; i += 1) {
      if (i + 2 < trail.length) {
        ctx.bezierCurveTo(
          trail[i].x, trail[i].y,
          trail[i + 1].x, trail[i + 1].y,
          trail[i + 2].x, trail[i + 2].y
        );
      }
    }
    ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);

    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = innerBlur;
    ctx.lineWidth = 14;
    ctx.stroke();

    // Core white trail
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length - 2; i += 1) {
      if (i + 2 < trail.length) {
        ctx.bezierCurveTo(
          trail[i].x, trail[i].y,
          trail[i + 1].x, trail[i + 1].y,
          trail[i + 2].x, trail[i + 2].y
        );
      }
    }
    ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);

    ctx.strokeStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 7;
    ctx.stroke();
  }

  requestAnimationFrame(animate);
}

animate();

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
