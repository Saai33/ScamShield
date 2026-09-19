/* =====================================================
   SCAMSHIELD RESULT PAGE LOGIC
   Renders score, Scam Reasons vs Not Scam Reasons, 
   End-to-End Workflow Visualizer, and Chatbot
===================================================== */

const savedResult = sessionStorage.getItem("scamshieldResult");
const savedUrl = sessionStorage.getItem("opportunityUrl");
const savedDetails = sessionStorage.getItem("opportunityDetails");
const savedScreenshot = sessionStorage.getItem("opportunityScreenshot");

const riskScore = document.getElementById("riskScore");
const resultTitle = document.getElementById("resultTitle");
const resultDescription = document.getElementById("resultDescription");
const scoreBadge = document.getElementById("scoreBadge");
const scoreBar = document.getElementById("scoreBar");
const signalsContainer = document.getElementById("signalsContainer");

// Display submitted inputs
const submittedUrlEl = document.getElementById("submittedUrl");
const submittedDetailsEl = document.getElementById("submittedDetails");
const submittedScreenshotEl = document.getElementById("submittedScreenshot");

if (submittedUrlEl) submittedUrlEl.textContent = savedUrl || "Not provided";
if (submittedDetailsEl) submittedDetailsEl.textContent = savedDetails || "Not provided";
if (submittedScreenshotEl) submittedScreenshotEl.textContent = savedScreenshot ? "Screenshot attached" : "Not uploaded";

let parsedData = null;

if (!savedResult) {
    if (riskScore) riskScore.textContent = "--";
    if (scoreBadge) scoreBadge.textContent = "NO DATA";
    if (resultTitle) resultTitle.textContent = "No Assessment Found";
    if (resultDescription) resultDescription.textContent = "Please submit an opportunity to analyze first.";
} else {
    try {
        parsedData = JSON.parse(savedResult);
        const assessment = parsedData.assessment || {};
        const score = Number(assessment.risk_score ?? 0);
        const title = assessment.title || "Assessment Complete";
        const description = assessment.description || "Review the evidence below.";

        // Update score UI
        if (riskScore) riskScore.textContent = score;
        if (scoreBar) scoreBar.style.width = `${score}%`;
        if (resultTitle) resultTitle.textContent = title;
        if (resultDescription) resultDescription.textContent = description;

        // Badge styling & risk level highlight
        if (scoreBadge) {
            if (score >= 65) {
                scoreBadge.textContent = "HIGH RISK";
                scoreBadge.style.color = "#f87171";
                scoreBadge.style.background = "rgba(239, 68, 68, 0.15)";
                scoreBadge.style.borderColor = "rgba(239, 68, 68, 0.3)";
            } else if (score >= 35) {
                scoreBadge.textContent = "MEDIUM RISK";
                scoreBadge.style.color = "#facc15";
                scoreBadge.style.background = "rgba(234, 179, 8, 0.15)";
                scoreBadge.style.borderColor = "rgba(234, 179, 8, 0.3)";
            } else {
                scoreBadge.textContent = "LOW RISK";
                scoreBadge.style.color = "#4ade80";
                scoreBadge.style.background = "rgba(34, 197, 94, 0.15)";
                scoreBadge.style.borderColor = "rgba(34, 197, 94, 0.3)";
            }
        }

        // Render Scam Reasons vs Not Scam Reasons
        renderReasonsBreakdown(parsedData);

        // Highlight Active Flow Node in End-to-End Diagram
        highlightWorkflowPath(score);

    } catch (e) {
        console.error("Result render error:", e);
    }
}

// Render Scam Reasons vs Not Scam Reasons
function renderReasonsBreakdown(data) {
    if (!signalsContainer) return;

    const signals = data.signals || [];
    const scamReasons = data.scam_reasons || signals.filter(s => s.type === "negative" || s.type === "warning");
    const notScamReasons = data.not_scam_reasons || signals.filter(s => s.type === "positive");

    let html = `
        <div class="grid md:grid-cols-2 gap-6 w-full col-span-2">
            <!-- SCAM REASONS -->
            <div class="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                <div class="flex items-center gap-2.5 mb-4 pb-3 border-b border-red-500/10">
                    <span class="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs">🚩</span>
                    <div>
                        <h4 class="font-bold text-sm text-red-300">Scam Reasons (Red Flags)</h4>
                        <p class="text-[10px] text-slate-400">${scamReasons.length} risk factor(s) identified</p>
                    </div>
                </div>
                <div class="space-y-3">
    `;

    if (scamReasons.length === 0) {
        html += `<div class="text-xs text-slate-400 italic p-3 bg-slate-900/40 rounded-xl">🟢 No major scam warning signals were detected in this submission.</div>`;
    } else {
        scamReasons.forEach(item => {
            html += `
                <div class="p-3.5 rounded-xl bg-slate-900/60 border border-red-500/15 flex gap-3">
                    <span class="text-red-400 font-bold text-sm shrink-0">!</span>
                    <div>
                        <strong class="block text-xs text-slate-200">${item.title}</strong>
                        <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">${item.description}</p>
                    </div>
                </div>
            `;
        });
    }

    html += `
                </div>
            </div>

            <!-- NOT SCAM REASONS -->
            <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                <div class="flex items-center gap-2.5 mb-4 pb-3 border-b border-emerald-500/10">
                    <span class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">🟢</span>
                    <div>
                        <h4 class="font-bold text-sm text-emerald-300">Not Scam Reasons (Trust Indicators)</h4>
                        <p class="text-[10px] text-slate-400">${notScamReasons.length} trust signal(s) identified</p>
                    </div>
                </div>
                <div class="space-y-3">
    `;

    if (notScamReasons.length === 0) {
        html += `<div class="text-xs text-slate-400 italic p-3 bg-slate-900/40 rounded-xl">⚠️ Limited trust evidence found. Verify company details independently.</div>`;
    } else {
        notScamReasons.forEach(item => {
            html += `
                <div class="p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/15 flex gap-3">
                    <span class="text-emerald-400 font-bold text-sm shrink-0">✓</span>
                    <div>
                        <strong class="block text-xs text-slate-200">${item.title}</strong>
                        <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">${item.description}</p>
                    </div>
                </div>
            `;
        });
    }

    html += `
                </div>
            </div>
        </div>
    `;

    signalsContainer.innerHTML = html;
}

// Highlight Workflow Path according to score
function highlightWorkflowPath(score) {
    const lowNode = document.getElementById("flowLowRiskNode");
    const highNode = document.getElementById("flowHighRiskNode");

    if (!lowNode || !highNode) return;

    if (score >= 65) {
        highNode.classList.add("ring-2", "ring-red-500", "bg-red-500/20");
        lowNode.classList.add("opacity-50");
    } else {
        lowNode.classList.add("ring-2", "ring-emerald-500", "bg-emerald-500/20");
        highNode.classList.add("opacity-50");
    }
}

// Save & Report Button handlers
const reportScamBtn = document.getElementById("reportScamBtn");
if (reportScamBtn) {
    reportScamBtn.addEventListener("click", () => {
        sessionStorage.setItem("reportAssessment", sessionStorage.getItem("scamshieldResult") || "");
        window.location.href = "report.html";
    });
}

const saveReportBtn = document.getElementById("saveReportBtn");
if (saveReportBtn) {
    saveReportBtn.addEventListener("click", () => {
        window.print();
    });
}

// Chatbot Assistant Logic
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");

function addChatMessage(msg, sender = "bot") {
    if (!chatMessages) return;
    const wrapper = document.createElement("div");
    wrapper.className = `chat-message ${sender}`;
    if (sender === "bot") {
        wrapper.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-bubble text-xs leading-relaxed">${msg}</div>
        `;
    } else {
        wrapper.innerHTML = `
            <div class="message-bubble text-xs leading-relaxed bg-cyan-600 text-white">${msg}</div>
        `;
    }
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateBotReply(q) {
    const text = q.toLowerCase();
    const score = parsedData?.assessment?.risk_score ?? "--";
    const scamReasons = parsedData?.scam_reasons || [];
    const notScamReasons = parsedData?.not_scam_reasons || [];

    if (text.includes("why") && (text.includes("risky") || text.includes("score") || text.includes("scam"))) {
        if (scamReasons.length > 0) {
            const list = scamReasons.map(s => `• <strong>${s.title}</strong>: ${s.description}`).join("<br>");
            return `<strong>Risk Score: ${score}/100</strong><br><br>ScamShield identified <strong>${scamReasons.length} Scam Reasons (Red Flags)</strong>:<br><br>${list}`;
        }
        return `<strong>Risk Score: ${score}/100</strong><br><br>No major scam red flags were detected in the provided inputs. Review company website directly before sharing sensitive details.`;
    }

    if (text.includes("not scam") || text.includes("trust") || text.includes("positive")) {
        if (notScamReasons.length > 0) {
            const list = notScamReasons.map(s => `• <strong>${s.title}</strong>: ${s.description}`).join("<br>");
            return `<strong>Trust Indicators (${notScamReasons.length})</strong>:<br><br>${list}`;
        }
        return "Limited trust evidence was detected. Request official email confirmation from the recruiter's corporate domain.";
    }

    if (text.includes("what should i do") || text.includes("next")) {
        if (Number(score) >= 65) {
            return `🚨 <strong>High Risk Action Plan</strong>:<br>1. Do not pay any registration, processing or security deposit fees.<br>2. Do not share your national ID or bank details.<br>3. File a complaint using the <strong>Report Scam</strong> button to generate an official Report ID.`;
        }
        return `🟢 <strong>Low/Medium Risk Action Plan</strong>:<br>1. Verify the company on its official career portal.<br>2. Confirm the recruiter's email matches the company's official domain.<br>3. Never pay fees prior to employment.`;
    }

    return `I can help with this assessment! Try asking:<br>• Why is this opportunity risky?<br>• What are the not-scam / trust reasons?<br>• What should I do next?`;
}

if (sendChatBtn && chatInput) {
    const handleSend = () => {
        const query = chatInput.value.trim();
        if (!query) return;
        addChatMessage(query, "user");
        chatInput.value = "";
        setTimeout(() => {
            const reply = generateBotReply(query);
            addChatMessage(reply, "bot");
        }, 300);
    };

    sendChatBtn.addEventListener("click", handleSend);
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
        }
    });
}

// Quick questions
document.querySelectorAll(".quick-question").forEach(btn => {
    btn.addEventListener("click", () => {
        const q = btn.dataset.question || btn.textContent.trim();
        if (chatInput) {
            chatInput.value = q;
            if (sendChatBtn) sendChatBtn.click();
        }
    });
});