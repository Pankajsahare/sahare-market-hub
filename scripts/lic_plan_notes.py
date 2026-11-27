#!/usr/bin/env python3
"""
LIC plan पानांसाठी आपल्या शब्दांतला मजकूर (Sahare Financial Services).
हा मजकूर आपण स्वतः LIC brochure / तथ्यांवरून लिहिलेला आहे — दुसऱ्या app चा मजकूर नाही.
प्रत्येक नोंद: id: (name, category, status, tagline, [highlights], best_for)
status: open = विक्रीत, closed = बंद, check = LIC कडे खात्री करा
वापर: python3 scripts/lic_plan_notes.py  → assets/data/lic-plan-notes.json
"""
import json
import os

N = {
    '714': ('New Endowment', 'endowment', 'open', 'A classic savings-cum-protection plan: life cover for the whole term and a lump sum with bonuses at maturity.',
            ['Pays Sum Assured plus all bonuses on maturity', 'Death benefit is Sum Assured plus bonuses (never less than 7 times the yearly premium)', 'Bonuses are declared by LIC each year and stay added once declared', 'Loan facility after the first policy year'], 'First-time savers who want a simple, disciplined plan'),
    '715': ('New Jeevan Anand', 'endowment', 'open', 'Endowment plan with a bonus-linked maturity and life cover that continues even after the maturity is paid.',
            ['Maturity: Sum Assured plus bonuses', 'Death during the term: 125% of Sum Assured plus bonuses', 'After maturity, a free life cover equal to the Sum Assured stays till age 100', 'Popular as a family protection plus savings plan'], 'Families who want savings and lifelong cover in one policy'),
    '717': ('Single Premium Endowment', 'endowment', 'open', 'Pay once and get a bonus-linked lump sum at maturity, with life cover during the term.',
            ['Only one premium at the start', 'Maturity: Sum Assured plus bonuses', 'Life cover for the full term', 'Loan available on the policy'], 'People with a lump sum (bonus, gift, maturity) to park safely'),
    '720': ('New Money Back 20 Years', 'moneyback', 'open', 'Money back plan that returns 20% of the Sum Assured every five years, with bonuses at the end.',
            ['20% of Sum Assured after 5, 10 and 15 years', '40% of Sum Assured plus bonuses at maturity (year 20)', 'Death benefit is the full cover plus bonuses, even after money-back payments', 'Premium paid for 15 years only'], 'Planned expenses every few years, such as education or home needs'),
    '721': ('New Money Back 25 Years', 'moneyback', 'open', 'Longer money back plan with 15% of the Sum Assured paid every five years and bonuses at maturity.',
            ['15% of Sum Assured after 5, 10, 15 and 20 years', '40% of Sum Assured plus bonuses at maturity (year 25)', 'Full life cover continues even after the money-back payments', 'Premium paid for 20 years'], 'Long-term goals with regular cash needs along the way'),
    '732': ("New Children's Money Back", 'child', 'open', "Child plan that pays money at ages 18, 20 and 22 and the balance with bonuses at 25.",
            ['20% of Sum Assured each at ages 18, 20 and 22', '40% of Sum Assured plus bonuses at age 25', 'Policy is on the child; entry from birth up to age 12', 'Premium Waiver rider can protect the plan if the parent dies'], "Funding a child's higher education and marriage"),
    '733': ('Jeevan Lakshya', 'endowment', 'open', 'Goal plan for families: if the policyholder dies, the family gets yearly income and the full maturity is still paid.',
            ['Death: 10% of Sum Assured every year till maturity, plus 110% of Sum Assured at maturity', 'Survival: Sum Assured plus bonuses at maturity', 'Premiums stop on death; the goal amount stays protected', 'Premium paying term is 3 years less than the policy term'], "Parents saving for a child's future goal"),
    '734': ('Jeevan Tarun', 'child', 'check', 'Child plan with a choice of survival payouts from age 20 to 24 and the balance at 25.',
            ['Choose between no payout, 5%, 10% or 15% of Sum Assured each year from age 20 to 24', 'Balance Sum Assured plus bonuses at age 25', 'Entry from 90 days to 12 years of age'], "Parents planning for a child's college years"),
    '735': ('New Endowment Plus', 'ulip', 'check', 'Unit-linked endowment plan where premiums are invested in a chosen fund with life cover.',
            ['Returns depend on fund performance (market-linked)', 'Fund value paid at maturity', 'Death: higher of Sum Assured or fund value'], 'Investors comfortable with market-linked returns'),
    '736': ('Jeevan Labh', 'endowment', 'open', 'Limited payment endowment: pay for 10, 15 or 16 years and stay covered for 16, 21 or 25 years.',
            ['Policy terms 16, 21 and 25 years with shorter premium payment', 'Maturity: Sum Assured plus bonuses', 'Death: Sum Assured plus bonuses (at least 7 times the yearly premium)', 'One of the most popular LIC plans for tax-free maturity'], 'Earning people who want to finish paying early'),
    '745': ('Jeevan Umang', 'wholelife', 'open', 'Whole life plan that pays 8% of the Sum Assured every year for life after the premium paying term, and a lump sum at 100.',
            ['8% of Sum Assured every year from the end of premium paying term till age 100', 'Sum Assured plus bonuses at age 100 or to the family on death', 'Premium paying terms 15, 20, 25 or 30 years', 'Works like a family pension with life cover'], 'Retirement income with lifelong cover'),
    '748': ('Bima Shree', 'moneyback', 'check', 'High Sum Assured money back plan with guaranteed additions and survival benefits in the last years.',
            ['Guaranteed additions every year during premium payment', 'Part of the Sum Assured paid in the last few policy years', 'Balance Sum Assured plus additions at maturity', 'Minimum Sum Assured is high (for HNI customers)'], 'High-income customers wanting guaranteed additions'),
    '749': ('Nivesh Plus', 'ulip', 'check', 'Single premium unit-linked plan with a choice of funds and life cover.',
            ['One-time investment in market-linked funds', 'Fund value at maturity', 'Death: higher of Sum Assured (less withdrawals) or fund value'], 'Lump-sum investors open to market risk'),
    '751': ('Micro Bachat', 'endowment', 'check', 'Low-cost micro insurance savings plan with small Sum Assured.',
            ['Small Sum Assured and low premiums', 'Sum Assured plus loyalty addition at maturity', 'Simple proposal (Form 505)'], 'Low-income families and first-time insurance buyers'),
    '752': ('SIIP', 'ulip', 'open', 'Systematic investment insurance plan: regular premiums invested in LIC unit funds with life cover.',
            ['Choose from several fund options and switch between them', 'Fund value paid at maturity', 'Death: higher of 10 times yearly premium or fund value', 'Partial withdrawals after the lock-in period'], 'SIP-style investors who also want life cover'),
    '758': ('New Jeevan Shanti', 'pension', 'open', 'Single premium deferred annuity: invest once and get a guaranteed pension after a chosen waiting period.',
            ['Pension rate fixed on the day you buy', 'Choose a waiting (deferment) period; single or joint life', 'Purchase price (plus additions) returned to the family on death'], 'Retirement planning with a guaranteed pension'),
    '760': ('Bima Jyoti', 'endowment', 'check', 'Non-participating savings plan with a fixed guaranteed addition every year — the maturity amount is known on day one.',
            ['Guaranteed addition of Rs 50 per 1,000 Sum Assured every year', 'Maturity: Sum Assured plus all guaranteed additions', 'Premium paid for 5 years less than the term', 'Death: higher of 125% of Sum Assured or 7 times the yearly premium, plus additions'], 'People who want a fully guaranteed maturity amount'),
    '764': ('Bima Ratna', 'moneyback', 'check', 'Money back plan with guaranteed additions and 25% payouts in the last two years before maturity.',
            ['25% of Sum Assured in each of the two years before maturity', '50% of Sum Assured plus guaranteed additions at maturity', 'Guaranteed additions accrue every year'], 'Planned expenses just before a goal year'),
    '768': ('Jeevan Azad', 'endowment', 'check', 'Simple guaranteed endowment where you pay for 8 years less than the term and get the Sum Assured back.',
            ['Maturity: full Basic Sum Assured', 'Premium payment term is the policy term minus 8 years', 'Death: higher of Sum Assured or 7 times the yearly premium'], 'Guaranteed savings with short premium payment'),
    '770': ('Bima Platinum', 'wholelife', 'open', 'Limited premium savings plan with guaranteed additions, yearly income after premiums end, and a booster payout (on sale till 31 March 2027).',
            ['Guaranteed additions every year while premiums are paid', 'Regular income of 10% of Sum Assured every year after premium payment', 'One-time booster income and Sum Assured plus additions at maturity', 'Choose premium terms of 7, 10, 12, 15 or 18 years'], 'Guaranteed income in later years'),
    '771': ('Jeevan Utsav', 'wholelife', 'open', 'Whole life plan with guaranteed additions while you pay, then 10% of the Sum Assured every year for life.',
            ['Guaranteed additions of Rs 40 per 1,000 Sum Assured every year of premium payment', 'Lifelong income of 10% of Sum Assured (or let it grow with LIC at interest)', 'Death: Sum Assured on death plus all guaranteed additions', 'Premium terms from 5 to 16 years'], 'Lifelong guaranteed income with life cover'),
    '774': ('Amrit Baal', 'child', 'open', 'Child plan with guaranteed additions; the policy matures between ages 18 and 25.',
            ['Guaranteed additions accrue every year', 'Maturity: Sum Assured plus guaranteed additions', 'Entry for children from 30 days to 13 years', 'Single, limited or regular premium options'], 'Guaranteed fund for a child at 18–25'),
    '822': ('Anmol Jeevan', 'term', 'check', 'Low-cost term cover: pays the Sum Assured only if death happens during the term.',
            ['Pure protection, no maturity benefit', 'Low premium for a high cover'], 'Breadwinners needing affordable cover'),
    '856': ('Pradhan Mantri Vaya Vandana Yojana', 'pension', 'closed', 'Government-backed pension scheme for senior citizens (closed for new business).',
            ['Pension for 10 years at a fixed rate', 'Purchase price returned at the end of 10 years'], 'Existing policyholders only'),
    '857': ('Jeevan Akshay VII', 'pension', 'open', 'Immediate annuity: buy once and start receiving a guaranteed pension right away.',
            ['Pension starts immediately after purchase', 'Many annuity options: life only, return of purchase price, joint life and more', 'Rates guaranteed for life on the purchase day'], 'Retirees with a lump sum who want pension now'),
    '859': ('Saral Jeevan Bima', 'term', 'check', 'Standard term plan with simple, uniform features as prescribed by IRDAI.',
            ['Pure protection, no maturity benefit', 'Death: Sum Assured (at least 10 times yearly premium)', 'Terms from 5 to 40 years'], 'Simple term cover for anyone'),
    '861': ('Bachat Plus', 'endowment', 'check', 'Savings plan with single or limited premium and loyalty additions.',
            ['Single premium or 5-year premium options', 'Maturity: Sum Assured plus loyalty additions', 'Death: Sum Assured on death plus loyalty additions after 5 years'], 'Short premium payment with savings'),
    '862': ('Saral Pension', 'pension', 'open', 'Standard immediate annuity plan: pension for life with the purchase price returned to the family.',
            ['Single life or joint life options', 'Purchase price returned on death', 'Pension can be monthly, quarterly, half-yearly or yearly'], 'Simple pension for retirees'),
    '863': ('Dhan Rekha', 'moneyback', 'check', 'Money back plan with guaranteed additions and periodic survival benefits; also available for women at special rates.',
            ['Part of the Sum Assured paid back every few years', 'Guaranteed additions accrue every year', 'Single or limited premium options'], 'Guaranteed money-back with flexibility'),
    '865': ('Dhan Sanchay', 'wholelife', 'check', 'Guaranteed income plan with a choice of level or increasing income.',
            ['Guaranteed income after premium payment', 'Lump sum terminal benefit at the end', 'Death: higher of 11 times yearly premium or the maturity sum'], 'Guaranteed income for a fixed period'),
    '866': ('Dhan Varsha', 'endowment', 'check', 'Single premium guaranteed plan with a choice of death cover of 1.25 or 10 times the premium.',
            ['Pay once, get guaranteed additions every year', 'Maturity: Sum Assured plus guaranteed additions', 'Choose higher life cover (10 times premium) if needed'], 'Lump-sum investors wanting guaranteed returns'),
    '867': ('New Pension Plus', 'pension', 'open', 'Unit-linked pension plan: build a retirement fund in LIC unit funds and convert it to pension.',
            ['Market-linked retirement corpus', 'Guaranteed additions on in-force policies', 'At vesting, buy a pension; part can be commuted as allowed'], 'Retirement savers open to market-linked growth'),
    '869': ('Dhan Vriddhi', 'endowment', 'closed', 'Single premium close-ended guaranteed plan.',
            ['Guaranteed additions every year', 'Maturity: Sum Assured plus additions'], 'Existing policyholders only'),
    '870': ('Jeevan Kiran', 'term', 'open', 'Term plan that returns all the premiums paid if you survive the term.',
            ['Death: Sum Assured on death during the term', 'Survival: total premiums paid returned at maturity', 'Separate rates for smokers and non-smokers'], 'Term cover with premium refund'),
    '872': ('Jeevan Dhara', 'pension', 'closed', 'Deferred annuity plan (replaced by New Jeevan Dhara-II).',
            ['Annuity from the vesting date', 'Several annuity options'], 'Existing policyholders only'),
    '873': ('Index Plus', 'ulip', 'open', 'Unit-linked plan investing in index-based funds with guaranteed additions on premiums.',
            ['Funds linked to market indices', 'Guaranteed additions on in-force policies', 'Fund value at maturity'], 'Long-term investors wanting index exposure'),
    '875': ('Yuva Term', 'term', 'open', 'Affordable term plan for young earners with level cover.',
            ['Pure protection, no maturity benefit', 'Regular, limited or single premium', 'Entry from 18 to 45 years'], 'Young earners starting their family'),
    '877': ('Yuva Credit Life', 'term', 'open', 'Decreasing cover term plan to protect a home, vehicle or education loan.',
            ['Cover reduces as the loan is repaid', 'Protects the family from loan repayment on death'], 'Borrowers with a home or personal loan'),
    '879': ('Smart Pension', 'pension', 'open', 'Single premium immediate annuity with many single and joint life options, including liquidity.',
            ['Pension starts right away', 'Joint life options for spouse', 'Partial withdrawal option under selected annuity options'], 'Retirees wanting flexible pension'),
    '880': ('Jan Suraksha', 'endowment', 'open', 'Micro insurance savings plan with guaranteed additions for low-income families.',
            ['Small Sum Assured and low premium', 'Maturity: Sum Assured plus guaranteed additions', 'Simple proposal (Form 505)'], 'Rural and low-income families'),
    '881': ('Bima Lakshmi', 'moneyback', 'open', 'Savings plan for women with guaranteed additions and a choice of payout patterns.',
            ['Policy term of 25 years', 'Choose a payout at the end of premium term, every 2 years or every 4 years', 'Guaranteed additions accrue every year'], 'Women planning their own savings'),
    '883': ('Jeevan Utsav Single Premium', 'wholelife', 'open', 'Pay once, earn guaranteed additions during a waiting period, then get 10% of the Sum Assured every year for life.',
            ['Single premium only', 'Guaranteed additions during the chosen waiting period (7 to 17 years)', 'Lifelong income of 10% of Sum Assured after the waiting period', 'Sum Assured plus additions to the family on death'], 'Lump sum today for guaranteed lifelong income'),
    '886': ('Protection Plus', 'ulip', 'open', 'Unit-linked plan with a strong life cover and refund of mortality charges at maturity.',
            ['Market-linked fund growth', 'Mortality charges refunded at maturity', 'Choice of policy and premium terms'], 'Investors wanting cover plus market growth'),
    '887': ('Bima Kavach', 'term', 'open', 'Non-linked term plan with level or increasing cover options.',
            ['Pure protection, no maturity benefit', 'Regular, limited or single premium', 'Cover up to age 100 on some options'], 'High cover at low cost'),
    '888': ('New Jeevan Sathi (Single Premium)', 'endowment', 'open', 'Joint life savings plan for couples with a single premium.',
            ['One policy covers both spouses', 'Maturity: Sum Assured plus guaranteed additions if both survive', 'Benefits on first and second death are defined separately'], 'Married couples'),
    '889': ('New Jeevan Sathi (Limited Premium)', 'endowment', 'open', 'Joint life savings plan for couples with limited premium payment.',
            ['One policy covers both spouses', 'Maturity: Sum Assured plus guaranteed additions if both survive', 'Premium paid for a limited period'], 'Married couples'),
    '890': ('New Bima Jyoti', 'endowment', 'open', 'Guaranteed savings plan where additions grow with the premiums paid.',
            ['Guaranteed additions every year based on premiums paid', 'Maturity: Sum Assured plus all additions', 'Death: higher of 125% of Sum Assured or 7 times yearly premium, plus additions'], 'Fully guaranteed maturity'),
    '892': ('New Jeevan Dhara-II', 'pension', 'open', 'Deferred annuity: pay regularly or once, and get a guaranteed pension for life from the vesting date.',
            ['Pension rates fixed at the start', 'Regular or single premium; deferment up to 15 years', 'Options to return part or all of the premiums', 'Top-up and liquidity options'], 'Planning a guaranteed pension in advance'),
    '894': ('Jeevan Raksha', 'term', 'open', 'Pure term plan with separate rates for men and women, smokers and non-smokers.',
            ['Pure protection, no maturity benefit', 'Regular, limited (10/15 years) or single premium', 'Death: higher of Sum Assured or 7 times yearly premium'], 'Affordable family protection'),
    '905': ('Cancer Cover', 'health', 'closed', 'Old cancer protection plan (replaced by New Cancer Cover 908).',
            ['Lump sum on early or major stage cancer'], 'Existing policyholders only'),
    '906': ('Arogya Rakshak', 'health', 'check', 'Fixed benefit health plan that pays defined amounts for hospitalisation and surgery, whatever the actual bill.',
            ['Fixed daily hospital cash and surgery benefits', 'Covers the whole family in one policy', 'Pays in addition to any mediclaim'], 'Extra cash support during hospitalisation'),
    '907': ('Health Shield', 'health', 'open', 'Fixed benefit health plan for the family with hospital cash, surgery and day care benefits.',
            ['Defined amounts for hospitalisation and surgery', 'Covers self, spouse, children and parents', 'Benefits paid irrespective of actual bills'], 'Family health safety net'),
    '908': ('New Cancer Cover', 'health', 'open', 'Cancer protection plan that pays a lump sum and monthly income on diagnosis.',
            ['25% of cover on early stage cancer and premiums waived for 3 years', '100% of cover on major stage cancer plus monthly income', 'Level or increasing cover options'], 'Protection against the cost of cancer treatment'),
    '911': ('Nav Jeevan Shree Single Premium', 'endowment', 'closed', 'Close-ended single premium guaranteed plan (sale period ended 31 March 2026).',
            ['Guaranteed additions every year', 'Maturity: Sum Assured plus additions'], 'Existing policyholders only'),
    '912': ('Nav Jeevan Shree', 'endowment', 'closed', 'Close-ended limited premium guaranteed plan (sale period ended 31 March 2026).',
            ['Guaranteed additions linked to premium', 'Maturity: Sum Assured plus additions'], 'Existing policyholders only'),
    '916': ('Bima Bachat', 'moneyback', 'check', 'Single premium money back plan returning 15% of the Sum Assured every three years.',
            ['15% of Sum Assured every 3 years', 'Single premium refunded with loyalty addition at maturity'], 'Short-term money back'),
    '943': ('Aadhaar Stambh', 'endowment', 'check', 'Endowment plan for men with an Aadhaar card, with loyalty additions.',
            ['Maturity: Sum Assured plus loyalty addition', 'Low minimum Sum Assured'], 'Basic savings for men'),
    '944': ('Aadhaar Shila', 'endowment', 'check', 'Endowment plan for women with an Aadhaar card, with loyalty additions.',
            ['Maturity: Sum Assured plus loyalty addition', 'Low minimum Sum Assured'], 'Basic savings for women'),
    '947': ('Jeevan Shiromani', 'moneyback', 'check', 'High Sum Assured money back plan with guaranteed additions and critical illness cover.',
            ['Guaranteed additions every year during premium payment', 'Survival benefits in the last years of the term', 'Minimum Sum Assured of Rs 1 crore'], 'High net worth customers'),
}


def slugify(name, pid):
    import re
    s = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return f'{s}-{pid}'


def main():
    out = {}
    for pid, (name, cat, status, tag, points, best) in N.items():
        out[pid] = {'name': name, 'slug': slugify(name, pid), 'category': cat, 'status': status, 'tagline': tag, 'points': points, 'best_for': best}
    p = os.path.join(os.path.dirname(__file__), '..', 'wp', 'a4u-lic-calculator', 'plugin', 'a4u-lic-calculator', 'assets', 'data', 'lic-plan-notes.json')
    with open(p, 'w', encoding='utf-8') as fh:
        json.dump({'v': 1, 'plans': out}, fh, ensure_ascii=False, indent=0)
    print(len(out), 'plans →', p)


if __name__ == '__main__':
    main()
