function rand(n) {
    return Math.random() * n;
  }
  
  function fadeInOut(t, m) {
    const hm = 0.5 * m;
    return Math.abs((t + hm) % m - hm) / hm;
  }
  
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
      canvas.toDataURL("image/jpeg", quality).length > 0
        ? callback(canvas.toDataURL("image/jpeg", quality))
        : callback(null);
    };
    img.onerror = () => callback(null);
    reader.readAsDataURL(file);
  }