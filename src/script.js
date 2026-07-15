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

  var booking = document.getElementById("booking");
  var loaded = false;

  function loadBooking() {
    if (loaded || !booking) {
      return;
    }
    var url = booking.getAttribute("data-koalendar-url");
    if (!url || url.indexOf("http") !== 0) {
      return;
    }
    var frame = document.createElement("iframe");
    frame.src = url;
    frame.title = "Book a free 20 minute security snapshot call";
    frame.loading = "lazy";
    frame.setAttribute("allow", "fullscreen");
    booking.appendChild(frame);
    loaded = true;
  }

  if (booking && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          loadBooking();
          observer.disconnect();
        }
      });
    }, { rootMargin: "400px" });
    observer.observe(booking);
  } else {
    loadBooking();
  }

  var bookButton = document.getElementById("book-btn");
  if (bookButton) {
    bookButton.addEventListener("click", loadBooking);
  }
})();
