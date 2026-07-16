(function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var form = document.getElementById("query-form");
  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("query-submit");

  function setStatus(message, kind) {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message || "";
    statusEl.className = "form-status" + (kind ? " form-status-" + kind : "");
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      setStatus("");

      var name = (form.name.value || "").trim();
      var email = (form.email.value || "").trim();
      var query = (form.query.value || "").trim();
      var company = (form.company && form.company.value) || "";

      if (!name) {
        setStatus("Please enter your name.", "error");
        form.name.focus();
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus("Please enter a valid email.", "error");
        form.email.focus();
        return;
      }
      if (!query) {
        setStatus("Please enter your query.", "error");
        form.query.focus();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: name, email: email, query: query, company: company }),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok && body && body.ok, body: body, status: res.status };
          });
        })
        .then(function (result) {
          if (result.ok) {
            form.reset();
            setStatus("Sent. I will reply by email.", "ok");
            return;
          }
          var msg =
            (result.body && result.body.error) ||
            "Could not send. Email hello@hardencode.com instead.";
          setStatus(msg, "error");
        })
        .catch(function () {
          setStatus("Network error. Email hello@hardencode.com instead.", "error");
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send query";
          }
        });
    });
  }

  var modal = document.getElementById("booking-modal");
  var openBtn = document.getElementById("open-booking");
  var closeBtn = document.getElementById("close-booking");
  var booking = document.getElementById("booking");
  var loaded = false;

  function loadBooking() {
    if (loaded || !booking || !openBtn) {
      return;
    }
    var url = openBtn.getAttribute("data-koalendar-url");
    if (!url || url.indexOf("http") !== 0) {
      return;
    }
    var frame = document.createElement("iframe");
    frame.src = url;
    frame.title = "Book a short consultation";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.setAttribute("allow", "fullscreen");
    booking.appendChild(frame);
    loaded = true;
  }

  function openBooking() {
    if (!modal) {
      return;
    }
    loadBooking();
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }
  }

  function closeBooking() {
    if (!modal) {
      return;
    }
    if (typeof modal.close === "function") {
      modal.close();
    } else {
      modal.removeAttribute("open");
    }
  }

  if (openBtn) {
    openBtn.addEventListener("click", openBooking);
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", closeBooking);
  }
  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeBooking();
      }
    });
  }
})();
