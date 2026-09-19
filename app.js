document.addEventListener("DOMContentLoaded", () => {

    // Add a small reveal animation when sections enter the viewport

    const revealElements = document.querySelectorAll(
        ".flow-card, .feature-panel"
    );

    const observer = new IntersectionObserver(
        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }

            });

        },
        {
            threshold: 0.15
        }
    );

    revealElements.forEach((element) => {
        observer.observe(element);
    });

});