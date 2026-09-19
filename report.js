/* =====================================================
   SCAMSHIELD — REPORT SCAM FORM LOGIC
===================================================== */

const savedResult = sessionStorage.getItem("reportAssessment") || sessionStorage.getItem("scamshieldResult");
const savedUrl = sessionStorage.getItem("opportunityUrl") || "";
const savedDetails = sessionStorage.getItem("opportunityDetails") || "";
const savedScreenshot = sessionStorage.getItem("opportunityScreenshot") || "";

const reportIdEl = document.getElementById("reportId");
const reportUrlEl = document.getElementById("reportUrl");
const reportRiskScoreEl = document.getElementById("reportRiskScore");
const reportSummaryEl = document.getElementById("reportSummary");
const reportRedFlagsEl = document.getElementById("reportRedFlags");
const reportNotScamReasonsEl = document.getElementById("reportNotScamReasons");
const reportTitleEl = document.getElementById("reportTitle");
const reportDescriptionEl = document.getElementById("reportDescription");
const reportSubmittedUrlEl = document.getElementById("reportSubmittedUrl");
const reportSubmittedDetailsEl = document.getElementById("reportSubmittedDetails");
const reportSubmittedScreenshotEl = document.getElementById("reportSubmittedScreenshot");

function buildReportId() {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `SCM-${year}-${random}`;
}

function getAssessmentData() {
    let score = "--";
    let title = "Assessment Available";
    let description = "Review the available evidence.";
    let signals = [];
    let scamReasons = [];
    let notScamReasons = [];

    if (savedResult) {
        try {
            const data = JSON.parse(savedResult);
            const assessment = data.assessment || {};
            score = assessment.risk_score ?? "--";
            title = assessment.title || title;
            description = assessment.description || description;
            signals = data.signals || [];
            scamReasons = data.scam_reasons || signals.filter(s => s.type === "negative" || s.type === "warning");
            notScamReasons = data.not_scam_reasons || signals.filter(s => s.type === "positive");
        } catch (error) {
            console.error("Assessment parsing failed:", error);
        }
    }

    return { score, title, description, signals, scamReasons, notScamReasons };
}

function fillAssessmentData() {
    const data = getAssessmentData();
    const reportId = buildReportId();

    if (reportIdEl) reportIdEl.textContent = reportId;
    if (reportRiskScoreEl) reportRiskScoreEl.value = data.score;
    if (reportTitleEl) reportTitleEl.textContent = data.title;
    if (reportDescriptionEl) reportDescriptionEl.textContent = data.description;

    if (reportUrlEl) reportUrlEl.value = savedUrl;
    if (reportSubmittedUrlEl) reportSubmittedUrlEl.textContent = savedUrl || "Not provided";
    if (reportSubmittedDetailsEl) reportSubmittedDetailsEl.textContent = savedDetails || "Not provided";
    if (reportSubmittedScreenshotEl) reportSubmittedScreenshotEl.textContent = savedScreenshot || "Not uploaded";

    if (reportSummaryEl && savedDetails) {
        reportSummaryEl.value = `Opportunity reviewed with the following details:\n\n${savedDetails}`;
    }

    // Populate Scam Reasons (Red Flags)
    if (reportRedFlagsEl) {
        if (data.scamReasons.length > 0) {
            reportRedFlagsEl.value = data.scamReasons.map(s => `• ${s.title}: ${s.description}`).join("\n");
        } else {
            reportRedFlagsEl.value = "No major warning signals automatically detected.";
        }
    }

    // Populate Not Scam Reasons (Trust Indicators)
    if (reportNotScamReasonsEl) {
        if (data.notScamReasons.length > 0) {
            reportNotScamReasonsEl.value = data.notScamReasons.map(s => `• ${s.title}: ${s.description}`).join("\n");
        } else {
            reportNotScamReasonsEl.value = "No specific trust indicators verified.";
        }
    }

    sessionStorage.setItem("currentReportId", reportId);
}

fillAssessmentData();

// Submit report form
const reportForm = document.getElementById("reportForm");
if (reportForm) {
    reportForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const reportId = sessionStorage.getItem("currentReportId") || buildReportId();
        const name = document.getElementById("reporterName") ? document.getElementById("reporterName").value.trim() : "Anonymous";
        const email = document.getElementById("reporterEmail") ? document.getElementById("reporterEmail").value.trim() : "not-provided";
        const url = reportUrlEl ? reportUrlEl.value.trim() : savedUrl;
        const summary = reportSummaryEl ? reportSummaryEl.value.trim() : "";
        const redFlags = reportRedFlagsEl ? reportRedFlagsEl.value.trim() : "";
        const notScamReasons = reportNotScamReasonsEl ? reportNotScamReasonsEl.value.trim() : "";

        const report = {
            id: reportId,
            status: "Submitted",
            createdAt: new Date().toISOString(),
            reporter: { name, email },
            opportunity: {
                url: url || savedUrl || "Not provided",
                summary: summary || "No summary provided",
                redFlags: redFlags,
                notScamReasons: notScamReasons
            },
            assessment: {
                riskScore: reportRiskScoreEl ? reportRiskScoreEl.value : "--",
                title: reportTitleEl ? reportTitleEl.textContent : "Assessment Available",
                description: reportDescriptionEl ? reportDescriptionEl.textContent : "Review the evidence."
            }
        };

        // Save report session & history
        sessionStorage.setItem("latestReport", JSON.stringify(report));
        sessionStorage.setItem("lastScamReport", JSON.stringify(report));
        sessionStorage.setItem("lastReportId", reportId);

        // Store in reports registry list
        try {
            const reportsRegistry = JSON.parse(localStorage.getItem("scamshield_all_reports") || "[]");
            reportsRegistry.unshift(report);
            localStorage.setItem("scamshield_all_reports", JSON.stringify(reportsRegistry));
        } catch (err) {
            console.error(err);
        }

        alert(`Scam Report Submitted Successfully!\n\nReport ID: ${reportId}\n\nYou can track the status of this report using your Report ID.`);
        window.location.href = "report-status.html";
    });
}