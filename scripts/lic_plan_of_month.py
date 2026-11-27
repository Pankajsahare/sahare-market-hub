#!/usr/bin/env python3
"""
S4: "LIC Plan of the Month" — दर महिन्याला एक plan Telegram channel वर (plan पानाच्या link सह).
महिन्यानुसार फिरत्या क्रमाने विक्रीत असलेले plans निवडले जातात. Secrets: TELEGRAM_BOT_TOKEN,
TELEGRAM_CHANNEL_ID (नसेल तर TELEGRAM_CHAT_ID).
"""
import datetime
import json
import os
import sys
import urllib.parse
import urllib.request

SITE = os.environ.get('SITE_URL', 'https://www.advisor4u.in').rstrip('/')
NOTES = os.path.join(os.path.dirname(__file__), '..', 'wp', 'a4u-lic-calculator', 'plugin', 'a4u-lic-calculator', 'assets', 'data', 'lic-plan-notes.json')
# लोकप्रिय, विक्रीत असलेले plans (calculator असलेले आधी)
ROTATION = ['736', '715', '771', '745', '714', '733', '883', '732', '720', '717', '721', '857', '758', '875', '908', '774']


def pick(plans, today):
    open_ids = [p for p in ROTATION if p in plans and plans[p]['status'] == 'open']
    return open_ids[(today.year * 12 + today.month) % len(open_ids)]


def message(p, pid):
    url = f"{SITE}/lic-plans/{p['slug']}/"
    pts = '\n'.join('• ' + x for x in p['points'][:3])
    return (f"📌 LIC Plan of the Month: {p['name']} (Plan {pid})\n\n{p['tagline']}\n\n{pts}\n\n"
            f"Best for: {p['best_for']}.\n\n👉 Full details and free calculator: {url}\n"
            f"💬 Questions? WhatsApp: https://wa.me/919405908605\n\n"
            "For information only. Please read the LIC sales brochure before buying.")


def main():
    plans = json.load(open(NOTES, encoding='utf-8'))['plans']
    today = datetime.date.today()
    pid = os.environ.get('PLAN_ID') or pick(plans, today)
    text = message(plans[pid], pid)
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat = os.environ.get('TELEGRAM_CHANNEL_ID') or os.environ.get('TELEGRAM_CHAT_ID', '')
    if '--dry-run' in sys.argv or not token or not chat:
        print(text)
        if not token or not chat:
            print('\n(Telegram secrets missing — dry run only)')
        return
    data = urllib.parse.urlencode({'chat_id': chat, 'text': text, 'disable_web_page_preview': 'false'}).encode()
    with urllib.request.urlopen(f'https://api.telegram.org/bot{token}/sendMessage', data=data, timeout=20) as r:
        body = json.loads(r.read().decode())
    if not body.get('ok'):
        sys.exit('Telegram error: ' + json.dumps(body)[:300])
    print('posted plan', pid)


if __name__ == '__main__':
    main()
