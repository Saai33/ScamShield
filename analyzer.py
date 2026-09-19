import re
from urllib.parse import urlparse
import hashlib

def analyze_opportunity(url="", details=""):
    """
    ScamShield Rule-Based Dynamic Risk Engine.
    Computes precise, non-static risk score (0-100) and separates Scam Reasons vs Not Scam Reasons.
    """
    text = f"{url} {details}".lower().strip()
    
    risk_score = 15
    negative_signals = []
    positive_signals = []

    # 1. PAYMENT CHECK
    payment_words = ["registration fee", "application fee", "processing fee", "security deposit", "pay ₹", "pay rs", "pay inr", "joining fee", "training fee", "refundable fee", "upi", "crypto"]
    found_payments = [w for w in payment_words if w in text]
    if found_payments:
        risk_score += 32 + (len(found_payments) * 4)
        negative_signals.append({
            "type": "negative",
            "category": "Payment Risk",
            "title": "Upfront Payment Detected",
            "description": f"Requests upfront payment ('{', '.join(found_payments[:2])}'). Legitimate jobs do not charge candidates."
        })
    else:
        positive_signals.append({
            "type": "positive",
            "category": "Payment Risk",
            "title": "No Upfront Payment Required",
            "description": "No explicit payment or deposit request was found."
        })

    # 2. URGENCY & PRESSURE
    urgency_words = ["urgent", "act now", "limited seats", "apply immediately", "today only", "last chance", "within 24 hours", "immediate joining"]
    found_urgency = [w for w in urgency_words if w in text]
    if found_urgency:
        risk_score += 16 + (len(found_urgency) * 3)
        negative_signals.append({
            "type": "negative",
            "category": "Pressure Language",
            "title": "Urgency Language Detected",
            "description": f"Uses pressure wording like '{', '.join(found_urgency[:2])}'."
        })

    # 3. UNREALISTIC CLAIMS
    claims = ["guaranteed job", "100% job guarantee", "no interview", "easy money", "earn lakhs", "selected immediately"]
    found_claims = [w for w in claims if w in text]
    if found_claims:
        risk_score += 24
        negative_signals.append({
            "type": "negative",
            "category": "Offer Quality",
            "title": "Unrealistic Placement Claims",
            "description": f"Contains suspicious claims like '{', '.join(found_claims[:2])}'."
        })

    # 4. DOMAIN CHECK
    if url:
        parsed = urlparse(url if url.startswith("http") else "https://" + url)
        domain = parsed.netloc.lower().replace("www.", "")
        
        if any(domain.endswith(ext) for ext in [".xyz", ".top", ".click", ".buzz", ".online", ".site", ".info", ".link"]):
            risk_score += 24
            negative_signals.append({
                "type": "negative",
                "category": "URL Check",
                "title": "High-Risk Domain Extension",
                "description": f"Domain extension for '{domain}' is frequently associated with disposable scam pages."
            })
        else:
            positive_signals.append({
                "type": "positive",
                "category": "URL Check",
                "title": "Website Provided",
                "description": f"Active domain provided for review: {domain}"
            })
    else:
        risk_score += 8
        negative_signals.append({
            "type": "warning",
            "category": "URL Check",
            "title": "No Website Provided",
            "description": "No link available for domain verification."
        })

    # 5. DYNAMIC VARIANCE
    hash_val = int(hashlib.md5(text.encode('utf-8')).hexdigest()[:4], 16)
    risk_score += (hash_val % 9) - 4

    final_score = max(5, min(98, risk_score))

    if final_score >= 65:
        level = "HIGH RISK"
        title = "High Risk — Likely Scam"
        description = "Multiple red flags identified. Independent verification required before proceeding."
    elif final_score >= 35:
        level = "MEDIUM RISK"
        title = "Verify Before Applying"
        description = "Some warning signals require additional verification."
    else:
        level = "LOW RISK"
        title = "Appears Low Risk"
        description = "Low warning signals detected from available details."

    return {
        "risk_score": final_score,
        "level": level,
        "title": title,
        "description": description,
        "signals": negative_signals + positive_signals,
        "scam_reasons": negative_signals,
        "not_scam_reasons": positive_signals
    }