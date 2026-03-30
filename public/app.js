(function () {
  const stage = document.getElementById("stage");
  const img = document.getElementById("floater");
  const status = document.getElementById("status");

  let vx = 0;
  let vy = 0;
  let x = 0;
  let y = 0;
  let rafId = 0;
  const speed = 12;

  function pickVelocity() {
    const angleMin = 0.698;
    const angleMax = 0.87;
    const angle = angleMin + Math.random() * (angleMax - angleMin);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
  }

  function bounds() {
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);
    return { w, h, maxX, maxY };
  }

  function clampPosition() {
    const { maxX, maxY } = bounds();
    x = Math.min(Math.max(0, x), maxX);
    y = Math.min(Math.max(0, y), maxY);
  }

  function applyTransform() {
    img.style.transform = `translate(${x}px, ${y}px)`;
  }

  function tick() {
    const { maxX, maxY } = bounds();
    x += vx;
    y += vy;
    if (x <= 0) {
      x = 0;
      vx = Math.abs(vx);
    } else if (x >= maxX) {
      x = maxX;
      vx = -Math.abs(vx);
    }
    if (y <= 0) {
      y = 0;
      vy = Math.abs(vy);
    } else if (y >= maxY) {
      y = maxY;
      vy = -Math.abs(vy);
    }
    applyTransform();
    rafId = requestAnimationFrame(tick);
  }

  function startMotion() {
    const { maxX, maxY } = bounds();
    x = maxX > 0 ? Math.random() * maxX : 0;
    y = maxY > 0 ? Math.random() * maxY : 0;
    pickVelocity();
    applyTransform();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    if (img.classList.contains("ready")) {
      clampPosition();
      applyTransform();
    }
  });

  fetch("/api/image")
    .then(async (res) => {
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const body = await res.json();
          throw new Error(body.error || res.statusText);
        }
        throw new Error(res.statusText || "Request failed");
      }
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        img.classList.add("ready");
        status.textContent = "";
        startMotion();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        status.textContent = "Could not display the image.";
      };
      img.src = url;
    })
    .catch((err) => {
      status.textContent = err.message || "Failed to load image.";
    });
})();