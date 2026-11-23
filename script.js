document.addEventListener("DOMContentLoaded", function ()
{
    const themeButtons = document.querySelectorAll("#themeToggle");
    let saved = null;
    try { saved = localStorage.getItem("tourismTheme"); } catch (e){}
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    function applyTheme(dark)
    {
        document.body.classList.toggle("dark-mode", dark);
        document.documentElement.setAttribute("data-bs-theme", dark ? "dark" : "light");
        themeButtons.forEach(function (button)
        {
            button.textContent = dark ? "Light mode" : "Dark mode";
            button.setAttribute("aria-pressed", dark);
        });
    }

    applyTheme(saved ? saved === "dark" : prefersDark);

    themeButtons.forEach(function (button) {
        button.addEventListener("click", function ()
        {
            const dark = !document.body.classList.contains("dark-mode");
            applyTheme(dark);
            try { localStorage.setItem("tourismTheme", dark ? "dark" : "light"); } catch (e){}
        });
    });

    const backToTop = document.getElementById("backToTop");
    if (backToTop)
    {
        window.addEventListener("scroll", function ()
        {
            backToTop.hidden = window.scrollY < 500;
        }, { passive: true });
        backToTop.addEventListener("click", function ()
        {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    const searchInput = document.getElementById("destinationSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const destinationItems = document.querySelectorAll(".destination-item");
    const resultsCount = document.getElementById("resultsCount");
    const noResults = document.getElementById("noResults");

    function filterDestinations()
    {
        const searchText = searchInput.value.toLowerCase().trim();
        const selectedCategory = categoryFilter.value;
        let visibleCount = 0;

        destinationItems.forEach(function (item)
        {
            const matches =
                item.textContent.toLowerCase().includes(searchText) &&
                (selectedCategory === "all" || item.dataset.category === selectedCategory);
            item.hidden = !matches;
            if (matches) visibleCount++;
        });

        if (resultsCount)
        {
            resultsCount.textContent = visibleCount + (visibleCount === 1 ? " destination found" : " destinations found");
        }
        if (noResults) noResults.hidden = visibleCount !== 0;
    }

    if (searchInput && categoryFilter)
    {
        searchInput.addEventListener("input", filterDestinations);
        categoryFilter.addEventListener("change", filterDestinations);
        const params = new URLSearchParams(window.location.search);
        if (params.get("category")) categoryFilter.value = params.get("category");
        filterDestinations();
    }

    const imageModal = document.getElementById("imageModal");
    const filterButtons = document.querySelectorAll(".gallery-filter");
    const galleryItems = document.querySelectorAll(".gallery-item");
    let currentIndex = 0;

    function visibleGalleryButtons()
    {
        return Array.from(galleryItems)
            .filter(function (item) { return !item.hidden; })
            .map(function (item) { return item.querySelector(".gallery-image"); });
    }

    filterButtons.forEach(function (button)
    {
        button.addEventListener("click", function ()
        {
            const filter = button.dataset.filter;
            filterButtons.forEach(function (b)
            {
                const active = b === button;
                b.classList.toggle("btn-primary", active);
                b.classList.toggle("btn-outline-secondary", !active);
            });
            galleryItems.forEach(function (item)
            {
                item.hidden = !(filter === "all" || item.dataset.category === filter);
            });
        });
    });

    function showImage(index)
    {
        const buttons = visibleGalleryButtons();
        if (!buttons.length) return;
        currentIndex = (index + buttons.length) % buttons.length;
        const target = buttons[currentIndex];
        const caption = target.getAttribute("data-caption");
        const modalImage = document.getElementById("modalImage");
        modalImage.src = target.getAttribute("data-image");
        modalImage.alt = caption;
        document.getElementById("modalCaption").textContent = caption;
        document.getElementById("modalCounter").textContent = (currentIndex + 1) + " of " + buttons.length;
    }

    if (imageModal)
    {
        imageModal.addEventListener("show.bs.modal", function (event)
        {
            showImage(visibleGalleryButtons().indexOf(event.relatedTarget));
        });
        imageModal.addEventListener("hidden.bs.modal", function ()
        {
            document.getElementById("modalImage").src = "";
        });
        document.getElementById("prevImage").addEventListener("click", function ()
            { showImage(currentIndex - 1); });
        document.getElementById("nextImage").addEventListener("click", function ()
            { showImage(currentIndex + 1); });
        document.addEventListener("keydown", function (event)
        {
            if (!imageModal.classList.contains("show")) return;
            if (event.key === "ArrowLeft") showImage(currentIndex - 1);
            if (event.key === "ArrowRight") showImage(currentIndex + 1);
        });
    }

    const activityButtons = document.querySelectorAll(".add-activity");
    const tripList = document.getElementById("tripList");
    const tripCount = document.getElementById("tripCount");
    const tripNotice = document.getElementById("tripNotice");
    const clearTripButton = document.getElementById("clearTrip");
    let selectedActivities = [];

    try {
        const stored = JSON.parse(localStorage.getItem("tourismTrip"));
        if (Array.isArray(stored)) selectedActivities = stored;
    } catch (e) {}

    function saveTrip()
    {
        try { localStorage.setItem("tourismTrip", JSON.stringify(selectedActivities)); } catch (e) {}
    }

    function renderTripList()
    {
        if (!tripList) return;
        tripList.replaceChildren();
        if (tripCount) tripCount.textContent = selectedActivities.length;

        activityButtons.forEach(function (button)
        {
            const added = selectedActivities.includes(button.dataset.activity);
            button.textContent = added ? "Added ✓" : "Add to My Trip";
            button.classList.toggle("btn-success", added);
            button.classList.toggle("btn-primary", !added);
        });

        if (selectedActivities.length === 0)
        {
            const item = document.createElement("li");
            item.textContent = "No activities selected yet.";
            tripList.appendChild(item);
            return;
        }

        selectedActivities.forEach(function (activity)
        {
            const item = document.createElement("li");
            item.className = "mb-2";

            const activityName = document.createElement("span");
            activityName.textContent = activity + " ";

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "btn btn-sm btn-outline-light";
            removeButton.textContent = "Remove";
            removeButton.setAttribute("aria-label", "Remove " + activity);
            removeButton.addEventListener("click", function () {
                selectedActivities = selectedActivities.filter(function (name)
                    { return name !== activity; });
                saveTrip();
                renderTripList();
            });

            item.appendChild(activityName);
            item.appendChild(removeButton);
            tripList.appendChild(item);
        });
    }

    activityButtons.forEach(function (button)
    {
        button.addEventListener("click", function ()
        {
            const activity = button.dataset.activity;
            if (!selectedActivities.includes(activity))
            {
                selectedActivities.push(activity);
                if (tripNotice) tripNotice.textContent = activity + " added to your shortlist.";
            } 
            else {
                if (tripNotice) tripNotice.textContent = activity + " is already in your shortlist.";
            }
            saveTrip();
            renderTripList();
        });
    });

    if (clearTripButton)
    {
        clearTripButton.addEventListener("click", function ()
        {
            selectedActivities = [];
            if (tripNotice) tripNotice.textContent = "Shortlist cleared.";
            saveTrip();
            renderTripList();
        });
    }

    renderTripList();

    const aboutVideo = document.getElementById("aboutVideo");
    const videoSoundToggle = document.getElementById("videoSoundToggle");
    const videoVolume = document.getElementById("videoVolume");
    const siteAudio = document.getElementById("siteAudio");
    const audioNotice = document.getElementById("audioNotice");

    if (aboutVideo && videoSoundToggle && videoVolume)
    {
        function syncVideoControls()
        {
            const silent = aboutVideo.muted || aboutVideo.volume === 0;
            videoSoundToggle.textContent = silent ? "Unmute video" : "Mute video";
            videoVolume.value = aboutVideo.muted ? 0 : aboutVideo.volume;
        }

        videoSoundToggle.addEventListener("click", function ()
        {
            if (aboutVideo.muted || aboutVideo.volume === 0)
            {
                aboutVideo.muted = false;
                if (aboutVideo.volume === 0) aboutVideo.volume = 0.5;
            } 
            else {
                aboutVideo.muted = true;
            }
        });

        videoVolume.addEventListener("input", function ()
        {
            const level = Number(videoVolume.value);
            aboutVideo.volume = level;
            aboutVideo.muted = level === 0;
        });

        aboutVideo.addEventListener("volumechange", syncVideoControls);
        syncVideoControls();
    }

    if (siteAudio)
    {
        siteAudio.addEventListener("play", function ()
        {
            if (aboutVideo) aboutVideo.pause();
            if (audioNotice) audioNotice.textContent = "";
        });
        if (aboutVideo)
        {
            aboutVideo.addEventListener("play", function ()
                { siteAudio.pause(); });
        }
        const audioSource = siteAudio.querySelector("source");
        if (audioSource && audioNotice)
        {
            audioSource.addEventListener("error", function ()
            {
                audioNotice.textContent = "Sorry, this audio is not available right now.";
            });
        }

        if (siteAudio)
        {
            siteAudio.play().catch(function()
            {
                document.addEventListener("click", function()
                {
                    siteAudio.play()
                }, {})
            }
        }
    }

    const contactForm = document.getElementById("contactForm");
    const messageBox = document.getElementById("contactMessage");
    const messageCount = document.getElementById("messageCount");

    if (messageBox && messageCount)
    {
        messageBox.addEventListener("input", function ()
        {
            messageCount.textContent = messageBox.value.length + " / " + messageBox.maxLength;
        });
    }

    if (contactForm)
    {
        contactForm.addEventListener("submit", function (event)
        {
            event.preventDefault();
            const feedback = document.getElementById("contactFeedback");

            if (!contactForm.checkValidity())
            {
                contactForm.classList.add("was-validated");
                feedback.textContent = "";
                feedback.className = "mt-3";
                return;
            }

            const name = document.getElementById("contactName").value.trim();
            feedback.textContent =
                "Thank you, " + name + ". Your demonstration message has been validated. It has not been sent to a real tourism office.";
            feedback.className = "mt-3 alert alert-success";
            contactForm.reset();
            contactForm.classList.remove("was-validated");
            if (messageCount) messageCount.textContent = "0 / " + messageBox.maxLength;
        });
    }

    const bookingForm = document.getElementById("bookingForm");
    const bookingDate = document.getElementById("bookingDate");
    const bookingDestination = document.getElementById("bookingDestination");

    const destinationImages = {
        "Maluti Mountains": "Maluti_mountain.jpg",
        "Maletsunyane Falls": "Malitsunyane.jpg",
        "Katse Dam": "Katse_dam.jpg",
        "Mohale Dam": "Mohale_dam.jpg",
        "Thaba Bosiu": "Thaba_busiu.jpg",
        "Masitise Cave House": "Masitise_cave.jpg",
        "Afriski Mountain Resort": "Afriski.jpg",
        "Liphofung Cave": "Liphofung.jpg",
        "Lesotho Highland Trails": "Basotho_highland.jpg"
    };

    if (bookingDate)
    {
        const today = new Date();
        bookingDate.min =
            today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0");
    }

    if (bookingDestination)
    {
        bookingDestination.addEventListener("change", function () {
            const preview = document.getElementById("destinationPreview");
            const img = document.getElementById("destinationPreviewImg");
            const file = destinationImages[bookingDestination.value];
            if (file)
            {
                img.src = "images/" + file;
                img.alt = bookingDestination.value;
                preview.hidden = false;
            } 
            else {
                preview.hidden = true;
            }
        });
    }

    if (bookingForm)
    {
        bookingForm.addEventListener("submit", function (event)
        {
            event.preventDefault();
            const feedback = document.getElementById("budgetFeedback");

            if (!bookingForm.checkValidity())
            {
                bookingForm.classList.add("was-validated");
                feedback.textContent = "";
                feedback.className = "mt-3";
                return;
            }

            const travellers = Number(document.getElementById("travellers").value);
            const budget = Number(document.getElementById("budget").value);
            const destination = bookingDestination.value;
            const date = bookingDate.value;
            const perPerson = budget / travellers;

            feedback.textContent =
                "Your estimated total budget is M" + budget.toLocaleString() +
                " for " + travellers + (travellers === 1 ? " traveller" : " travellers") +
                ". That is approximately M" +
                perPerson.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
                " per person for " + destination + " on " + date +
                ". This is a planning estimate, not a confirmed booking.";
            feedback.className = "mt-3 alert alert-success";
        });
    }
});
