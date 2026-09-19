/* =====================================================
   SCAMSHIELD — REPORT STATUS TRACKER
   Displays case status timeline, Scam Reasons vs Not Scam Reasons,
   and enables Report ID lookup.
===================================================== */

const reportIdEl = document.getElementById("statusReportId");
const statusEl = document.getElementById("currentStatus");
const riskScoreEl = document.getElementById("statusRiskScore");
const assessmentEl = document.getElementById("statusAssessment");
const riskBar = document.getElementById("riskBar");
const redFlagsEl = document.getElementById("statusRedFlags");
const notScamReasonsEl = document.getElementById("statusNotScamReasons");
const submittedTimeEl = document.getElementById("submittedTime");
const searchReportIdInput = document.getElementById("searchReportId");
const searchReportBtn = document.getElementById("searchReportBtn");

function getSavedReport(lookupId = null) {
    // 1. Try lookup ID in local registry
    if (lookupId) {
        try {
            const allReports = JSON.parse(localStorage.getItem("scamshield_all_reports") || "[]");
            const found = allReports.find(r => r.id.toLowerCase() === lookupId.trim().toLowerCase());
            if (found) return found;
        } catch (e) {
            console.error(e);
        }
    }

    // 2. Fall back to current session report
    const sessionReport = sessionStorage.getItem("latestReport") || sessionStorage.getItem("lastScamReport");
    if (sessionReport) {
        try {
            return JSON.parse(sessionReport);
        } catch (e) {
            console.error(e);
        }
    }

    return null;
}

function renderReportDetails(report) {
    if (!report) {
        if (reportIdEl) reportIdEl.textContent = "No Active Report";
        if (statusEl) statusEl.textContent = "Not Found";
        if (riskScoreEl) riskScoreEl.textContent = "--";
        if (assessmentEl) assessmentEl.textContent = "Please submit or search a valid Report ID.";
        if (redFlagsEl) redFlagsEl.innerHTML = `<div class="text-xs text-slate-500">No report evidence loaded.</div>`;
        return;
    }

    // Update Report Header
    if (reportIdEl) reportIdEl.textContent = report.id || "SCM-UNKNOWN";
    if (statusEl) statusEl.textContent = report.status || "Submitted";

    // Risk Score
    const score = Number(report.assessment?.riskScore ?? 0);
    if (riskScoreEl) riskScoreEl.textContent = isNaN(score) ? "--" : score;
    if (riskBar) riskBar.style.width = `${Math.min(isNaN(score) ? 0 : score, 100)}%`;
    if (assessmentEl) assessmentEl.textContent = report.assessment?.title || "Assessment Available";

    // Time
    if (submittedTimeEl && report.createdAt) {
        try {
            submittedTimeEl.textContent = new Date(report.createdAt).toLocaleString();
        } catch (e) {
            submittedTimeEl.textContent = "Recently";
        }
    }

    // Scam Reasons (Red Flags)
    if (redFlagsEl) {
        redFlagsEl.innerHTML = "";
        const flagsText = report.opportunity?.redFlags || "";
        if (flagsText.trim()) {
            const lines = flagsText.split("\n").filter(Boolean);
            lines.forEach(line => {
                const item = document.createElement("div");
                item.className = "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200 leading-relaxed font-medium flex gap-2";
                item.innerHTML = `<span class="font-bold text-red-400 shrink-0">🚩</span> <div>${line.replace(/^[•!\s]+/, "")}</div>`;
                redFlagsEl.appendChild(item);
            });
        } else {
            redFlagsEl.innerHTML = `<div class="text-xs text-slate-400 italic">No major scam warning signals were flagged for this report.</div>`;
        }
    }

    // Not Scam Reasons (Trust Indicators)
    if (notScamReasonsEl) {
        notScamReasonsEl.innerHTML = "";
        const trustText = report.opportunity?.notScamReasons || "";
        if (trustText.trim()) {
            const lines = trustText.split("\n").filter(Boolean);
            lines.forEach(line => {
                const item = document.createElement("div");
                item.className = "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200 leading-relaxed font-medium flex gap-2";
                item.innerHTML = `<span class="font-bold text-emerald-400 shrink-0">🟢</span> <div>${line.replace(/^[•✓\s]+/, "")}</div>`;
                notScamReasonsEl.appendChild(item);
            });
        } else {
            notScamReasonsEl.innerHTML = `<div class="text-xs text-slate-400 italic">No specific trust indicators recorded for this report.</div>`;
        }
    }
}

// Initial Load
const currentReport = getSavedReport();
renderReportDetails(currentReport);

// Report ID Search Handler
if (searchReportBtn && searchReportIdInput) {
    const handleSearch = () => {
        const id = searchReportIdInput.value.trim();
        if (!id) {
            alert("Please enter a valid Report ID (e.g. SCM-2026-12345).");
            return;
        }
        const report = getSavedReport(id);
        if (report) {
            renderReportDetails(report);
            searchReportIdInput.value = "";
        } else {
            alert(`Report ID '${id}' not found in browser history. Make sure you entered the correct ID.`);
        }
    };

    searchReportBtn.addEventListener("click", handleSearch);
    searchReportIdInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    });
}