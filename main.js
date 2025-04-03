const editToggle = document.getElementById("editToggle");
const profilePic = document.getElementById("profilePic");
const profilePicUpload = document.getElementById("profilePicUpload");
const displayName = document.getElementById("displayName");
const editName = document.getElementById("editName");
const bioText = document.getElementById("bioText");
const editBio = document.getElementById("editBio");
const bioCharCount = document.getElementById("bioCharCount");
const followBtn = document.getElementById("followBtn");
const followerCount = document.getElementById("followerCount");
const typewriter = document.getElementById("typewriter");
const modal = document.getElementById("settingsModal");
const closeModal = document.querySelector(".close-modal");
const loader = document.getElementById("loader");
const mainContainer = document.getElementById("mainContainer");
const bgColor = document.getElementById("bgColor");
const linkColor = document.getElementById("linkColor");
const bgColorValue = document.getElementById("bgColorValue");
const linkColorValue = document.getElementById("linkColorValue");
const previewPic = document.getElementById("previewPic");
const previewName = document.getElementById("previewName");
const previewBio = document.getElementById("previewBio");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

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

editToggle.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
  resetToOriginal();
});

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

const defaultProfile = {
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

let originalProfile = JSON.parse(JSON.stringify(defaultProfile));

// Function to compress the image (for non-GIFs)
function compressImage(file, maxWidth, maxHeight, quality, callback) {
  const img = new Image();
  const reader = new FileReader();
  reader.onload = (e) => {
    img.src = e.target.result;
  };
  img.onload = () => {
    const canvas = document.createElement("canvas");
    let width = img.width;
    let height = img.height;

    // Resize the image while maintaining aspect ratio
    if (width > height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to data URL with specified quality
    canvas.toDataURL("image/jpeg", quality).length > 0
      ? callback(canvas.toDataURL("image/jpeg", quality))
      : callback(null);
  };
  img.onerror = () => callback(null);
  reader.readAsDataURL(file);
}

profilePic.addEventListener("click", () => {
  profilePicUpload.click();
});

profilePicUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    // Check file size (increased to 25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    const isGif = file.type === "image/gif";

    if (isGif) {
      // Handle GIFs without compression to preserve animation
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        if (file.size > maxSize) {
          alert("GIF file is too large (over 25MB). Please use a smaller GIF.");
          profilePic.src = localStorage.getItem("profilePic") || "https://i.pravatar.cc/100?u=yourusername";
          previewPic.src = profilePic.src;
          return;
        }
        profilePic.src = imageData;
        previewPic.src = imageData;
        try {
          localStorage.setItem("profilePic", imageData);
          updatePreview();
        } catch (e) {
          console.error("Error saving GIF profile picture to localStorage:", e);
          alert("Failed to save GIF profile picture. The file might be too large for localStorage. Please try a smaller GIF.");
          profilePic.src = localStorage.getItem("profilePic") || "https://i.pravatar.cc/100?u=yourusername";
          previewPic.src = profilePic.src;
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Handle non-GIF images with compression if needed
      if (file.size > maxSize) {
        compressImage(file, 300, 300, 0.7, (compressedData) => {
          if (compressedData) {
            profilePic.src = compressedData;
            previewPic.src = compressedData;
            try {
              localStorage.setItem("profilePic", compressedData);
              updatePreview();
            } catch (e) {
              console.error("Error saving compressed profile picture to localStorage:", e);
              alert("Failed to save profile picture. The image might be too large even after compression. Please try a smaller image.");
              profilePic.src = localStorage.getItem("profilePic") || "https://i.pravatar.cc/100?u=yourusername";
              previewPic.src = profilePic.src;
            }
          } else {
            alert("Failed to compress the image. Please try a smaller image.");
            profilePic.src = localStorage.getItem("profilePic") || "https://i.pravatar.cc/100?u=yourusername";
            previewPic.src = profilePic.src;
          }
        });
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target.result;
          profilePic.src = imageData;
          previewPic.src = imageData;
          try {
            localStorage.setItem("profilePic", imageData);
            updatePreview();
          } catch (e) {
            console.error("Error saving profile picture to localStorage:", e);
            alert("Failed to save profile picture. The image might be too large for localStorage. Please try a smaller image.");
            profilePic.src = localStorage.getItem("profilePic") || "https://i.pravatar.cc/100?u=yourusername";
            previewPic.src = profilePic.src;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }
});

function updatePreview() {
  previewPic.src = profilePic.src;
  previewName.textContent = editName.value || defaultProfile.name;
  previewBio.textContent = editBio.value || defaultProfile.bio;
  renderLinks(currentLinks, document.getElementById("previewLinks"));
  document.documentElement.style.setProperty("--bg-color", bgColor.value);
  document.documentElement.style.setProperty("--link-bg", linkColor.value);
  bgColorValue.textContent = bgColor.value;
  linkColorValue.textContent = linkColor.value;
}

function loadProfile() {
  const data = JSON.parse(localStorage.getItem("profileData") || JSON.stringify(defaultProfile));
  originalProfile = JSON.parse(JSON.stringify(data));
  profilePic.src = localStorage.getItem("profilePic") || "https://i.pravatar.cc/100?u=yourusername";
  displayName.textContent = data.name;
  bioText.textContent = data.bio;
  editName.value = data.name;
  editBio.value = data.bio;
  currentLinks = data.links;
  bgColor.value = data.bgColor;
  linkColor.value = data.linkColor;
  document.documentElement.style.setProperty("--bg-color", data.bgColor);
  document.documentElement.style.setProperty("--link-bg", data.linkColor);
  renderLinks(data.links, document.getElementById("linksContainer"));
  renderLinkEditor();
  updatePreview();
  bioCharCount.textContent = `${editBio.value.length}/80`;
  setTimeout(() => {
    loader.style.display = "none";
    mainContainer.style.display = "block";
  }, 1000);
}

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

editName.addEventListener("input", updatePreview);

// Limit bio to 5 lines
editBio.addEventListener("input", (e) => {
  const lines = e.target.value.split("\n");
  if (lines.length > 5) {
    e.target.value = lines.slice(0, 5).join("\n");
  }
  bioCharCount.textContent = `${e.target.value.length}/80`;
  updatePreview();
});

editBio.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const lines = e.target.value.split("\n");
    if (lines.length >= 5) {
      e.preventDefault();
    }
  }
});

bgColor.addEventListener("input", updatePreview);
linkColor.addEventListener("input", updatePreview);

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    tabButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    tabContents.forEach(content => content.style.display = "none");
    document.getElementById(`${button.dataset.tab}Tab`).style.display = "flex";
  });
});

document.querySelectorAll(".save-tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    const updated = {
      name: editName.value || defaultProfile.name,
      bio: editBio.value || defaultProfile.bio,
      links: currentLinks,
      bgColor: bgColor.value,
      linkColor: linkColor.value
    };
    try {
      localStorage.setItem("profileData", JSON.stringify(updated));
      originalProfile = JSON.parse(JSON.stringify(updated));
      loadProfile();
      modal.style.display = "none";
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      alert("Failed to save settings. The profile picture might be too large. Try using a smaller image or reloading the page.");
    }
  });
});

document.querySelectorAll(".discard-tab-btn").forEach(button => {
  button.addEventListener("click", resetToOriginal);
});

loadProfile();

document.addEventListener("contextmenu", e => {
  if (!["INPUT", "TEXTAREA"].includes(e.target.tagName)) e.preventDefault();
});

document.addEventListener("keydown", e => {
  const isInput = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v")) {
    if (!isInput) e.preventDefault();
  }
});