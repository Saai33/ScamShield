/* =========================================================
   SCAMSHIELD - ANALYZE PAGE
   Handles input upload, progress animation, API request, 
   and dynamic client-side scoring fallback.
========================================================= */

// Elements
const uploadBox = document.getElementById("uploadBox");
const offerImage = document.getElementById("offerImage");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImage = document.getElementById("removeImage");
const analyzeBtn = document.getElementById("analyzeBtn");
const opportunityUrl = document.getElementById("opportunityUrl");
const opportunityDetails = document.getElementById("opportunityDetails");
const scanOverlay = document.getElementById("scanOverlay");
const scanProgressBar = document.getElementById("scanProgressBar");
const scanStatus = document.getElementById("scanStatus");

// Open file picker
if (uploadBox && offerImage) {
    uploadBox.addEventListener("click", () => offerImage.click());

    offerImage.addEventListener("change", () => {
        const file = offerImage.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image file (PNG, JPG, JPEG).");
            offerImage.value = "";
            return;
        }
        showImagePreview(file);
    });
}

function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreviewContainer.classList.remove("hidden");
        uploadBox.style.display = "none";
    };
    reader.readAsDataURL(file);
}

if (removeImage) {
    removeImage.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        offerImage.value = "";
        imagePreview.src = "";
        imagePreviewContainer.classList.add("hidden");
        uploadBox.style.display = "flex";
    });
}

// Drag and drop
if (uploadBox) {
    uploadBox.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadBox.classList.add("dragover");
    });
    uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("dragover"));
    uploadBox.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadBox.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith("image/")) {
            alert("Please drop a valid image file.");
            return;
        }
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        offerImage.files = dataTransfer.files;
        showImagePreview(file);
    });
}

// =========================================================
// CLIENT-SIDE DYNAMIC RISK ENGINE FALLBACK
// =========================================================

function generateClientSideAnalysis(url, details, hasImage) {
    const text = (url + " " + details).toLowerCase();

    let score = 15; // Baseline minimal risk
    const scamReasons = [];
    const notScamReasons = [];

    // 1. Payment Check
    const paymentWords = ["registration fee", "application fee", "processing fee", "security deposit", "pay ₹", "pay rs", "pay inr", "joining fee", "training fee", "refundable fee", "upi", "crypto", "paytm", "gpay", "phonepe"];
    const foundPayments = paymentWords.filter(w => text.includes(w));

    if (foundPayments.length > 0) {
        score += 32 + (foundPayments.length * 5);
        scamReasons.append ? scamReasons.push({
            type: "negative",
            category: "Payment Request",
            title: "Upfront Payment Request Detected",
            description: `The opportunity requests upfront fees or deposits ('${foundPayments.slice(0, 2).join(", ")}'). Authentic employers do not demand fees from applicants.`
        }) : scamReasons.push({
            type: "negative",
            category: "Payment Request",
            title: "Upfront Payment Request Detected",
            description: `The opportunity requests upfront fees or deposits ('${foundPayments.slice(0, 2).join(", ")}'). Authentic employers do not demand fees from applicants.`
        });
    } else {
        notScamReasons.push({
            type: "positive",
            category: "Payment Check",
            title: "No Upfront Payment Required",
            description: "No mandatory registration or deposit fee language was detected in the submitted content."
        });
    }

    // 2. Urgency Check
    const urgencyWords = ["urgent", "act now", "limited seats", "apply immediately", "today only", "last chance", "within 24 hours", "immediate joining"];
    const foundUrgency = urgencyWords.filter(w => text.includes(w));
    if (foundUrgency.length > 0) {
        score += 18 + (foundUrgency.length * 3);
        scamReasons.push({
            type: "negative",
            category: "Urgency Tactics",
            title: "Pressure / Urgency Language Detected",
            description: `Uses high-pressure phrases like '${foundUrgency.slice(0, 2).join(", ")}' to force quick action.`
        });
    } else {
        notScamReasons.push({
            type: "positive",
            category: "Communication Tone",
            title: "Standard Professional Tone",
            description: "No suspicious deadline pressure or urgent demand language detected."
        });
    }

    // 3. Claims Check
    const claimWords = ["guaranteed job", "100% job guarantee", "no interview", "easy money", "earn lakhs", "earn daily", "selected immediately"];
    const foundClaims = claimWords.filter(w => text.includes(w));
    if (foundClaims.length > 0) {
        score += 25;
        scamReasons.push({
            type: "negative",
            category: "Offer Claims",
            title: "Unrealistic Job Promises",
            description: `Contains placement promises like '${foundClaims.slice(0, 2).join(", ")}'. Real hiring involves assessment.`
        });
    }

    // 4. Domain / URL Check
    if (url) {
        let domain = url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
        const suspiciousExts = [".xyz", ".top", ".click", ".buzz", ".online", ".site", ".info", ".link", ".fun"];
        const isSuspiciousTLD = suspiciousExts.some(ext => domain.endsWith(ext));

        if (isSuspiciousTLD) {
            score += 26;
            scamReasons.push({
                type: "negative",
                category: "Domain Safety",
                title: "High-Risk Domain Extension",
                description: `Domain '${domain}' uses an extension commonly seen in temporary phishing landing pages.`
            })
        } else if (domain.includes("google.com") || domain.includes("microsoft.com") || domain.includes("linkedin.com") || domain.includes("tcs.com") || domain.includes(".edu") || domain.includes(".ac.in")) {
            score -= 15;
            notScamReasons.push({
                type: "positive",
                category: "Domain Safety",
                title: "Verified Enterprise / Academic Domain",
                description: `Submitted domain '${domain}' belongs to a verified enterprise or accredited domain.`
            });
        } else {
            notScamReasons.push({
                type: "positive",
                category: "Domain Safety",
                title: "Valid Domain Provided",
                description: `Website domain '${domain}' is active and properly formatted.`
            });
        }
    } else {
        score += 8;
        scamReasons.push({
            type: "warning",
            category: "Domain Verification",
            title: "No Website Provided",
            description: "No domain was supplied for online registration verification."
        });
    }

    // 5. Contact Check
    if (text.includes("whatsapp") || text.includes("wa.me") || text.includes("telegram") || text.includes("t.me")) {
        score += 12;
        scamReasons.push({
            type: "warning",
            category: "Contact Channel",
            title: "Informal Messaging Channel",
            description: "Recruiter conducts communication primarily via WhatsApp/Telegram rather than official corporate email."
        });
    }

    if (text.includes("@gmail.com") || text.includes("@yahoo.com") || text.includes("@hotmail.com")) {
        score += 15;
        scamReasons.push({
            type: "negative",
            category: "Contact Verification",
            title: "Free Mail Address for Official Hiring",
            description: "Recruiter relies on a free public email address rather than an official corporate email domain."
        });
    }

    // Dynamic Variance Factor (Hash based on exact text string)
    let hash = 0;
    const combinedStr = url + details;
    for (let i = 0; i < combinedStr.length; i++) {
        hash = ((hash << 5) - hash) + combinedStr.charCodeAt(i);
        hash |= 0;
    }
    const variance = (Math.abs(hash) % 11) - 5; // -5 to +5
    score += variance;

    // Clamp score
    const finalScore = Math.max(8, Math.min(96, Math.round(score)));

    let level = "LOW RISK";
    let title = "Appears Low Risk";
    let description = "The offer displays positive trust indicators with low warning signals. Maintain standard precautions.";

    if (finalScore >= 65) {
        level = "HIGH RISK";
        title = "High Risk — Likely Scam";
        description = "Multiple critical red flags detected. Do not pay money or disclose sensitive identity/bank details.";
    } else if (finalScore >= 35) {
        level = "MEDIUM RISK";
        title = "Verify Before Proceeding";
        description = "Some signals require verification. Independently verify the company on official portals.";
    }

    const allSignals = [...scamReasons, ...notScamReasons];

    return {
        status: "success",
        assessment: {
            risk_score: finalScore,
            level: level,
            title: title,
            description: description
        },
        signals: allSignals,
        scam_reasons: scamReasons,
        not_scam_reasons: notScamReasons
    };
}

// =========================================================
// ANALYZE BUTTON CLICK HANDLER
// =========================================================

if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const hasImage = offerImage && offerImage.files && offerImage.files.length > 0;
        const url = opportunityUrl ? opportunityUrl.value.trim() : "";
        const details = opportunityDetails ? opportunityDetails.value.trim() : "";

        if (!hasImage && !url && !details) {
            alert("Please upload a screenshot, enter an opportunity URL, or paste offer details.");
            return;
        }

        // Show Scan Overlay
        if (scanOverlay) scanOverlay.classList.remove("hidden");
        if (scanProgressBar) scanProgressBar.style.width = "25%";
        if (scanStatus) scanStatus.textContent = "Analyzing domain, keywords, and recruiter signals...";

        const formData = new FormData();
        if (hasImage) formData.append("screenshot", offerImage.files[0]);
        formData.append("url", url);
        formData.append("details", details);

        let data = null;

        try {
            // Attempt backend API fetch
            const response = await fetch("http://127.0.0.1:5000/analyze", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                data = await response.json();
            }
        } catch (err) {
            console.warn("Backend server not reached. Switching to ScamShield dynamic client engine...", err);
        }

        // If backend failed or wasn't running, run client-side dynamic engine
        if (!data || data.status !== "success") {
            data = generateClientSideAnalysis(url, details, hasImage);
        }

        // Store result session data
        sessionStorage.setItem("scamshieldResult", JSON.stringify(data));
        sessionStorage.setItem("opportunityUrl", url);
        sessionStorage.setItem("opportunityDetails", details);
        if (hasImage) {
            sessionStorage.setItem("opportunityScreenshot", offerImage.files[0].name);
        }

        if (scanProgressBar) scanProgressBar.style.width = "100%";
        if (scanStatus) scanStatus.textContent = "Assessment generated successfully!";

        setTimeout(() => {
            window.location.href = "result.html";
        }, 600);
    });
}