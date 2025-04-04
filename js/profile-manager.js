const profilePic = document.getElementById("profilePic");
const profilePicUpload = document.getElementById("profilePicUpload");
const displayName = document.getElementById("displayName");
const editName = document.getElementById("editName");
const bioText = document.getElementById("bioText");
const editBio = document.getElementById("editBio");
const bioCharCount = document.getElementById("bioCharCount");
const previewPic = document.getElementById("previewPic");
const previewName = document.getElementById("previewName");
const previewBio = document.getElementById("previewBio");

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
  linkColor: "#000000",
  cardColor: "#ffffff",
  textColor: "#333333",
  linkBoxTextColor: "#ffffff" // Default link box text color
};

let originalProfile = JSON.parse(JSON.stringify(defaultProfile));
let currentLinks = [];

function loadProfile() {
  const data = JSON.parse(localStorage.getItem("profileData") || JSON.stringify(defaultProfile));
  originalProfile = JSON.parse(JSON.stringify(data));
  profilePic.src = localStorage.getItem("profilePic") || "https://i.pravatar.cc/100?u=yourusername";
  displayName.textContent = data.name;
  bioText.textContent = data.bio; // Allow blank bio
  editName.value = data.name;
  editBio.value = data.bio; // Allow blank bio
  currentLinks = data.links;
  document.getElementById("bgColor").value = data.bgColor;
  document.getElementById("linkColor").value = data.linkColor;
  document.getElementById("cardColor").value = data.cardColor;
  document.getElementById("textColor").value = data.textColor;
  document.getElementById("linkBoxTextColor").value = data.linkBoxTextColor; // Load link box text color
  document.getElementById("bgColorValue").textContent = data.bgColor;
  document.getElementById("linkColorValue").textContent = data.linkColor;
  document.getElementById("cardColorValue").textContent = data.cardColor;
  document.getElementById("textColorValue").textContent = data.textColor;
  document.getElementById("linkBoxTextColorValue").textContent = data.linkBoxTextColor; // Update link box text color value
  document.documentElement.style.setProperty("--bg-color", data.bgColor);
  document.documentElement.style.setProperty("--link-bg", data.linkColor);
  document.documentElement.style.setProperty("--card-bg", data.cardColor);
  document.documentElement.style.setProperty("--profile-text-color", data.textColor);
  document.documentElement.style.setProperty("--link-box-text-color", data.linkBoxTextColor); // Apply link box text color
  // Update preview elements
  previewPic.src = profilePic.src;
  previewName.textContent = displayName.textContent;
  previewBio.textContent = bioText.textContent;
  bioCharCount.textContent = `${editBio.value.length}/80`;
}

function saveProfile(updated) {
  localStorage.setItem("profileData", JSON.stringify(updated));
  originalProfile = JSON.parse(JSON.stringify(updated));
}

function resetToOriginal() {
  const data = JSON.parse(JSON.stringify(originalProfile));
  editName.value = data.name;
  editBio.value = data.bio; // Allow blank bio
  currentLinks = data.links;
  document.getElementById("bgColor").value = data.bgColor;
  document.getElementById("linkColor").value = data.linkColor;
  document.getElementById("cardColor").value = data.cardColor;
  document.getElementById("textColor").value = data.textColor;
  document.getElementById("linkBoxTextColor").value = data.linkBoxTextColor;
  document.getElementById("bgColorValue").textContent = data.bgColor;
  document.getElementById("linkColorValue").textContent = data.linkColor;
  document.getElementById("cardColorValue").textContent = data.cardColor;
  document.getElementById("textColorValue").textContent = data.textColor;
  document.getElementById("linkBoxTextColorValue").textContent = data.linkBoxTextColor;
  document.documentElement.style.setProperty("--bg-color", data.bgColor);
  document.documentElement.style.setProperty("--link-bg", data.linkColor);
  document.documentElement.style.setProperty("--card-bg", data.cardColor);
  document.documentElement.style.setProperty("--profile-text-color", data.textColor);
  document.documentElement.style.setProperty("--link-box-text-color", data.linkBoxTextColor);
  // Update preview elements
  previewPic.src = profilePic.src;
  previewName.textContent = displayName.textContent;
  previewBio.textContent = bioText.textContent;
  bioCharCount.textContent = `${editBio.value.length}/80`;
}

profilePic.addEventListener("click", () => profilePicUpload.click());

profilePicUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const maxSize = 25 * 1024 * 1024;
    const isGif = file.type === "image/gif";
    if (isGif) {
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
        localStorage.setItem("profilePic", imageData);
      };
      reader.readAsDataURL(file);
    } else {
      if (file.size > maxSize) {
        compressImage(file, 300, 300, 0.7, (compressedData) => {
          if (compressedData) {
            profilePic.src = compressedData;
            previewPic.src = compressedData;
            localStorage.setItem("profilePic", compressedData);
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
          localStorage.setItem("profilePic", imageData);
        };
        reader.readAsDataURL(file);
      }
    }
  }
});

editName.addEventListener("input", () => {
  previewName.textContent = editName.value || defaultProfile.name;
});

editBio.addEventListener("input", (e) => {
  const lines = e.target.value.split("\n");
  if (lines.length > 5) e.target.value = lines.slice(0, 5).join("\n");
  bioCharCount.textContent = `${e.target.value.length}/80`;
  previewBio.textContent = editBio.value; // Allow blank bio
});

editBio.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.value.split("\n").length >= 5) e.preventDefault();
});

export { loadProfile, saveProfile, resetToOriginal, currentLinks, defaultProfile };
