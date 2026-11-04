import os
import json
import time
import urllib.request
import urllib.error
from datetime import datetime

MARKETS_MCP_URL = "https://mcp.foliyo.ai/markets"
PMS_MCP_URL = "https://mcp.foliyo.ai/pms"
OUTPUT_FILE = "daily_market_hub.json"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")


def call_mcp_tool(endpoint_url, tool_name, arguments, req_id=1):
    """Call a Foliyo MCP tool via JSON-RPC 2.0 POST."""
    payload = {
        "jsonrpc": "2.0",
        "id": req_id,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint_url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "User-Agent": "SahareWealthHub/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw_body = resp.read().decode("utf-8").strip()
            for line in raw_body.splitlines():
                if line.startswith("data:"):
                    raw_body = line[5:].strip()
                    break
            parsed = json.loads(raw_body)
            content_list = parsed.get("result", {}).get("content", [])
            for item in content_list:
                if item.get("type") == "text":
                    try:
                        return json.loads(item.get("text", "{}"))
                    except json.JSONDecodeError:
                        return {"raw_text": item.get("text", "")}
            return parsed.get("result", {})
    except Exception as err:
        print(f"[ERROR] MCP tool {tool_name} failed: {err}")
        return None


def compute_pe_zone(pe_value):
    """Derive P/E zone from Nifty 50 P/E."""
    try:
        pe = float(pe_value)
    except (TypeError, ValueError):
        return {"zone": "Neutral — Maintain Discipline", "color": "#f59e0b", "pe": pe_value}

    if pe < 20.0:
        return {
            "zone": "Attractive Zone — Ideal for Lumpsum & SIP Top-Up",
            "color": "#10b981",
            "pe": round(pe, 2),
        }
    elif pe <= 24.0:
        return {
            "zone": "Fairly Valued Zone — Continue Regular SIPs & Balanced Allocation",
            "color": "#3b82f6",
            "pe": round(pe, 2),
        }
    else:
        return {
            "zone": "Cautious Zone — Prefer Staggered STP & Multi-Asset Allocation",
            "color": "#ef4444",
            "pe": round(pe, 2),
        }


def generate_gemini_verdict(summary_payload):
    """Generate a 2-line market verdict using Gemini."""
    if not GEMINI_API_KEY:
        return (
            "Markets are driven by earnings and asset allocation. "
            "Stay disciplined with your SIPs and review portfolio weights periodically."
        )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={GEMINI_API_KEY}"
    prompt = (
        "You are an AMFI-registered Mutual Fund Advisor at Sahare Financial Services (advisor4u.in). "
        "Write a crisp 2-sentence plain-English daily market verdict for retail and HNI investors based on this EOD data: "
        f"{json.dumps(summary_payload)[:1800]}. Do not give stock tips; focus on asset allocation and SIP discipline."
    )
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as err:
        print(f"[WARN] Gemini verdict fallback used: {err}")
        return "Maintain disciplined SIP contributions and review your equity-to-debt ratio based on your goal horizon."


def send_telegram_morning_digest(hub_data):
    """Send daily Telegram digest."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("[INFO] Telegram secrets not set; skipping broadcast.")
        return

    pe_info = hub_data.get("valuation_signal", {})
    verdict = hub_data.get("ai_verdict", "")
    as_of = hub_data.get("as_of_date", datetime.utcnow().strftime("%Y-%m-%d"))

    message = (
        f"📊 *Sahare Financial Services — Daily Market Pulse*\n"
        f"🗓 *Data As Of:* {as_of} (End-of-Day)\n\n"
        f"🧭 *Nifty 50 P/E:* {pe_info.get('pe', 'N/A')}x\n"
        f"🚦 *Signal:* {pe_info.get('zone', 'N/A')}\n\n"
        f"💡 *Advisor Verdict:*\n{verdict}\n\n"
        f"🔍 *Explore Live GIFT City (USD) & PMS Rankings:*\n"
        f"🌐 https://www.advisor4u.in/\n"
        f"💬 *Book Portfolio Review:* https://wa.me/+919405908605"
    )
    tg_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = json.dumps(
        {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown",
            "disable_web_page_preview": False,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        tg_url, data=payload, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        urllib.request.urlopen(req, timeout=15)
        print("[INFO] Morning Telegram broadcast sent successfully.")
    except Exception as err:
        print(f"[ERROR] Telegram broadcast failed: {err}")


def resolve_instrument_ids(names, types, req_id_start=100):
    """
    Resolve human-readable names (e.g., 'NIFTY 50') to Foliyo instrument IDs
    by calling search_instruments. Returns a list of IDs.
    """
    ids = []
    for idx, name in enumerate(names, start=req_id_start):
        search_args = {"query": name, "types": types, "limit": 1}
        res = call_mcp_tool(MARKETS_MCP_URL, "search_instruments", search_args, req_id=idx)
        time.sleep(1)
        if isinstance(res, dict) and "results" in res:
            results = res["results"]
            if results and isinstance(results, list):
                first = results[0]
                if isinstance(first, dict) and "id" in first:
                    ids.append(first["id"])
                    continue
        # Fallback: if search returns a string or direct ID
        if isinstance(res, str):
            import re
            m = re.search(r"(stock:[A-Za-z0-9._-]+|index:[A-Za-z0-9._-]+|gift:[A-Za-z0-9._-]+)", res)
            if m:
                ids.append(m.group(1))
                continue
        # Final fallback: use the raw name (may work for exact tickers)
        ids.append(name)
    return ids


def main():
    previous_data = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                previous_data = json.load(f)
        except Exception:
            previous_data = {}

    # 1. Resolve index/benchmark IDs first, then fetch quotes
    index_names = [
        "NIFTY 50",
        "BSE SENSEX",
        "NIFTY MIDCAP 150",
        "NIFTY SMALLCAP 250",
        "INDIA VIX",
        "GOLD",
        "USD/INR",
    ]
    index_ids = resolve_instrument_ids(index_names, ["index"], req_id_start=100)
    time.sleep(1)
    quotes_res = call_mcp_tool(
        MARKETS_MCP_URL, "get_quotes", {"instruments": index_ids}, req_id=1
    )
    time.sleep(1)

    # 2. GIFT City funds (get_fund_details works ONLY for GIFT funds)
    gift_funds_names = [
        "Parag Parikh IFSC S&P 500 Fund of Fund",
        "Parag Parikh IFSC Nasdaq 100 Fund of Fund",
        "DSP Global Equity Fund",
        "HDFC International Developed Markets Equity Fund",
        "HDFC International Emerging Markets Equity Fund",
        "Marcellus Global Equities Fund",
        "Edelweiss Greater China Equity Fund",
    ]
    gift_list = []
    for idx, g_name in enumerate(gift_funds_names, start=10):
        g_detail = call_mcp_tool(
            MARKETS_MCP_URL, "get_fund_details", {"fund": g_name}, req_id=idx
        )
        if g_detail and not (isinstance(g_detail, dict) and g_detail.get("raw_text")):
            gift_list.append({"name": g_name, "details": g_detail})
        time.sleep(1)

    # 3. PMS schemes — sort_by MUST be one of: y3, y1, y5, since_inception, aum
    pms_res = call_mcp_tool(
        PMS_MCP_URL,
        "screen_pms_schemes",
        {"sort_by": "y3", "limit": 10},
        req_id=30,
    )
    time.sleep(1)

    # 4. Indian mutual funds are NOT supported by Foliyo's get_fund_details.
    #    Keep the section but mark it as "coming soon" or populate via another source.
    #    For now, we output an empty list to avoid error objects in JSON.
    mf_list = []

    # If all critical data failed, keep previous snapshot
    if not quotes_res and not gift_list and not pms_res and previous_data:
        print("[WARN] Foliyo returned empty response; keeping previous snapshot intact.")
        return

    # 5. Extract P/E and as-of date
    extracted_pe = 22.4
    as_of_date = datetime.utcnow().strftime("%Y-%m-%d")
    if isinstance(quotes_res, dict):
        as_of_date = quotes_res.get("as_of", as_of_date)
        extracted_pe = (
            quotes_res.get("pe")
            or quotes_res.get("nifty_pe")
            or extracted_pe
        )

    valuation_signal = compute_pe_zone(extracted_pe)

    ai_verdict = generate_gemini_verdict(
        {
            "as_of": as_of_date,
            "valuation": valuation_signal,
            "quotes_sample": str(quotes_res)[:600],
        }
    )

    hub_payload = {
        "updated_at_utc": datetime.utcnow().isoformat() + "Z",
        "as_of_date": as_of_date,
        "advisor": {
            "firm": "Sahare Financial Services",
            "arn": "ARN-151469",
            "euin": "E266872",
            "whatsapp": "+919405908605",
            "website": "https://www.advisor4u.in",
        },
        "valuation_signal": valuation_signal,
        "ai_verdict": ai_verdict,
        "indices_and_benchmarks": quotes_res,
        "mutual_funds": mf_list,
        "gift_city_funds": gift_list,
        "top_pms_schemes": pms_res,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(hub_payload, f, indent=2, ensure_ascii=False)

    if previous_data.get("as_of_date") != as_of_date:
        send_telegram_morning_digest(hub_payload)
    else:
        print("[INFO] Market holiday / unchanged as_of_date detected; skipping duplicate Telegram alert.")


if __name__ == "__main__":
    main()
