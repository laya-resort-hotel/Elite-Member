import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js';
import { CONTENT_LANGS } from './content-service.js?v=20260405cms4b';

export const STATIC_PAGE_KEYS = ['about', 'contact', 'faq'];
export const STATIC_PAGE_LABELS = {
  about: 'About Us',
  contact: 'Contact Us',
  faq: 'FAQ',
};

const STATIC_FIELDS = ['sectionTitle', 'profileMeta', 'heroKicker', 'heroTitle', 'heroLead', 'contentHtml', 'footerHtml'];
const LANG_PRIORITY = ['en', 'th', 'ru', 'zh'];

function stringValue(value = '') {
  return String(value || '').trim();
}

function plainTextToHtml(value = '') {
  const text = stringValue(value);
  if (!text) return '';
  if (/[<][a-z!/]/i.test(text)) return text;
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`).join('');
}

function blankTranslation() {
  return {
    sectionTitle: '',
    profileMeta: '',
    heroKicker: '',
    heroTitle: '',
    heroLead: '',
    contentHtml: '',
    footerHtml: '',
  };
}

export function blankStaticPageEditorState(slug = 'about') {
  return {
    slug,
    pageLabel: STATIC_PAGE_LABELS[slug] || slug,
    translations: Object.fromEntries(CONTENT_LANGS.map((lang) => [lang, blankTranslation()])),
    activeLocale: 'en',
    createdAt: null,
    createdBy: '',
    updatedAt: null,
    updatedBy: '',
  };
}

function defaultStaticPageTranslations(slug = 'about') {
  const defaults = {
    about: {
      en: {
        sectionTitle: 'ABOUT US',
        profileMeta: 'About Laya Resort Phuket',
        heroKicker: 'A refined escape in Cherngtalay, Phuket',
        heroTitle: 'Where every stay feels personal.',
        heroLead: 'At Laya Resort Phuket, every stay is designed to feel deeply personal. Set beside the tranquil beauty of Layan Beach in Cherngtalay, our resort is a private sanctuary where refined comfort, natural serenity, and genuine Thai hospitality come together in perfect harmony.',
        contentHtml: `<h2 class="about-section-heading">Elegant stays with effortless comfort</h2>
<p>Our elegantly appointed rooms and suites are thoughtfully created to offer a sense of space, calm, and effortless luxury. With generous interiors, private balconies, and carefully curated amenities, each stay invites guests to slow down, unwind, and reconnect with the rhythm of the island.</p>
<h2 class="about-section-heading">A collection of experiences</h2>
<p>Beyond the room, Laya Resort Phuket offers a collection of enriching experiences crafted for every kind of traveler. Guests may relax by our three outdoor swimming pools, restore balance in the yoga room, energize in the Fitness Center, or indulge in soothing wellness rituals at Malai Spa. Culinary moments are equally memorable, with our signature outlets—The Taste, Mangrove Bar &amp; Restaurant, and Aroonsawat Café—offering a graceful blend of international favorites and local inspiration.</p>
<h2 class="about-section-heading">Peaceful, connected, unforgettable</h2>
<p>Ideally located just 15 minutes from Phuket International Airport, the resort provides a peaceful escape while remaining close to the island’s vibrant attractions and coastal charm. Whether for a romantic retreat, a family holiday, or a quiet journey of rest and renewal, Laya Resort Phuket welcomes each guest with warmth, elegance, and attentive care.</p>
<div class="about-quote">From poolside relaxation to sunset cocktails and restorative spa rituals, every moment at Laya Resort Phuket is crafted to leave a lasting impression.</div>`,
        footerHtml: `<div class="about-contact-grid">
  <div>
    <div class="about-contact-label">Location</div>
    <div class="about-contact-value">Layan Beach, Cherngtalay, Phuket</div>
  </div>
  <div>
    <div class="about-contact-label">Travel time</div>
    <div class="about-contact-value">Approx. 15 minutes from Phuket International Airport</div>
  </div>
  <div>
    <div class="about-contact-label">Dining</div>
    <div class="about-contact-value">The Taste · Mangrove Bar &amp; Restaurant · Aroonsawat Café</div>
  </div>
  <div>
    <div class="about-contact-label">Wellness</div>
    <div class="about-contact-value">Malai Spa · Fitness Center · Yoga Room · Three outdoor pools</div>
  </div>
</div>`,
      },
    },
    contact: {
      en: {
        sectionTitle: 'CONTACT US',
        profileMeta: 'Contact information',
        heroKicker: 'We are always here to assist',
        heroTitle: 'Contact Laya Resort Phuket',
        heroLead: 'Our team will be pleased to assist with reservations, stay details, special requests, and any questions you may have before or during your visit.',
        contentHtml: `<div class="about-contact-grid contact-grid-single">
  <div>
    <div class="about-contact-label">Address</div>
    <div class="about-contact-value">Laya Resort Phuket<br>48 Moo 6 Cherngtalay Sub-District<br>Talang District, Phuket 83110, Thailand</div>
  </div>
  <div>
    <div class="about-contact-label">Telephone</div>
    <div class="about-contact-value"><a class="about-inline-link" href="tel:+6676328888">+66 (0) 7632 8888</a></div>
  </div>
  <div>
    <div class="about-contact-label">Email</div>
    <div class="about-contact-value"><a class="about-inline-link" href="mailto:info@layaresortphuket.com">info@layaresortphuket.com</a></div>
  </div>
</div>
<p class="mt-md">We are pleased to provide thoughtful assistance and ensure every experience with Laya Resort Phuket feels smooth, comfortable, and memorable.</p>`,
        footerHtml: `<div class="about-contact-grid">
  <div>
    <div class="about-contact-label">Reservations</div>
    <div class="about-contact-value">For bookings, room requests, and stay assistance</div>
  </div>
  <div>
    <div class="about-contact-label">Travel time</div>
    <div class="about-contact-value">Approx. 15 minutes from Phuket International Airport</div>
  </div>
  <div>
    <div class="about-contact-label">Hours</div>
    <div class="about-contact-value">Our team is available daily for guest support</div>
  </div>
  <div>
    <div class="about-contact-label">Hospitality</div>
    <div class="about-contact-value">Warm, attentive, and personal service</div>
  </div>
</div>`,
      },
    },
    faq: {
      en: {
        sectionTitle: 'FAQ',
        profileMeta: 'Frequently asked questions',
        heroKicker: 'Helpful information for your stay',
        heroTitle: 'Frequently Asked Questions',
        heroLead: 'Find quick answers about Laya Resort Phuket, our facilities, location, dining, and guest services. For anything more specific, our team will always be pleased to assist you.',
        contentHtml: `<div class="faq-item"><h2 class="about-section-heading">1. Where is Laya Resort Phuket located?</h2><p>Laya Resort Phuket is located near the peaceful shoreline of Layan Beach in Cherngtalay, Phuket, offering a tranquil setting for couples, families, and solo travelers.</p></div>
<div class="faq-item"><h2 class="about-section-heading">2. How far is the resort from Phuket International Airport?</h2><p>The resort is approximately 15 minutes away from Phuket International Airport by car, making arrivals and departures convenient and comfortable.</p></div>
<div class="faq-item"><h2 class="about-section-heading">3. What facilities are available at the resort?</h2><p>Guests can enjoy three outdoor swimming pools, a fully equipped Fitness Center, a yoga room, Malai Spa, and thoughtfully designed rooms and suites created for comfort and relaxation.</p></div>
<div class="faq-item"><h2 class="about-section-heading">4. Are there dining options at the resort?</h2><p>Yes. Our signature dining venues include The Taste, Mangrove Bar &amp; Restaurant, and Aroonsawat Café, offering a selection of local and international flavors for every mood and occasion.</p></div>
<div class="faq-item"><h2 class="about-section-heading">5. Is Laya Resort Phuket suitable for families?</h2><p>Yes. The resort offers a calm and welcoming atmosphere with spacious accommodation and facilities that make it suitable for family holidays as well as romantic escapes and individual stays.</p></div>
<div class="faq-item"><h2 class="about-section-heading">6. Can guests use the spa and fitness facilities?</h2><p>Guests may enjoy the resort’s wellness and fitness facilities, subject to operating hours and service availability. Please contact our front desk for the latest details during your stay.</p></div>
<div class="faq-item"><h2 class="about-section-heading">7. Is the resort close to lifestyle attractions and local highlights?</h2><p>Yes. The resort offers a peaceful retreat while remaining conveniently close to lifestyle destinations, restaurants, and attractions in Cherngtalay and the surrounding Phuket area.</p></div>
<div class="faq-item"><h2 class="about-section-heading">8. How can I contact Laya Resort Phuket?</h2><p>You may contact us by telephone at <a class="about-inline-link" href="tel:+6676328888">+66 (0) 7632 8888</a> or by email at <a class="about-inline-link" href="mailto:info@layaresortphuket.com">info@layaresortphuket.com</a>.</p></div>
<div class="faq-item"><h2 class="about-section-heading">9. Is the resort suitable for romantic getaways?</h2><p>Absolutely. With its serene location, elegant accommodation, wellness experiences, and inviting dining venues, the resort is well suited for romantic and memorable Phuket escapes.</p></div>
<div class="faq-item"><h2 class="about-section-heading">10. What should I do if I need special assistance or more information?</h2><p>Please contact our team directly. We will be pleased to assist with reservations, special requests, and any additional information you may need before or during your stay.</p></div>`,
        footerHtml: `<div class="about-contact-grid">
  <div>
    <div class="about-contact-label">Location</div>
    <div class="about-contact-value">Layan Beach, Cherngtalay, Phuket</div>
  </div>
  <div>
    <div class="about-contact-label">Travel time</div>
    <div class="about-contact-value">Approx. 15 minutes from Phuket International Airport</div>
  </div>
  <div>
    <div class="about-contact-label">Phone</div>
    <div class="about-contact-value">+66 (0) 7632 8888</div>
  </div>
  <div>
    <div class="about-contact-label">Email</div>
    <div class="about-contact-value">info@layaresortphuket.com</div>
  </div>
</div>`,
      },
    },
  };

  const seed = defaults[slug] || {};
  const output = Object.fromEntries(CONTENT_LANGS.map((lang) => [lang, blankTranslation()]));
  Object.entries(seed).forEach(([lang, value]) => {
    output[lang] = { ...blankTranslation(), ...value };
  });
  return output;
}

function normalizeTranslation(entry = {}, fallback = {}) {
  return {
    sectionTitle: stringValue(entry.sectionTitle || fallback.sectionTitle),
    profileMeta: stringValue(entry.profileMeta || fallback.profileMeta),
    heroKicker: stringValue(entry.heroKicker || fallback.heroKicker),
    heroTitle: stringValue(entry.heroTitle || fallback.heroTitle),
    heroLead: stringValue(entry.heroLead || fallback.heroLead),
    contentHtml: plainTextToHtml(entry.contentHtml || fallback.contentHtml),
    footerHtml: plainTextToHtml(entry.footerHtml || fallback.footerHtml),
  };
}

export function normalizeStaticPageEditorState(value = {}) {
  const slug = STATIC_PAGE_KEYS.includes(value.slug) ? value.slug : 'about';
  const defaults = defaultStaticPageTranslations(slug);
  const translations = {};
  CONTENT_LANGS.forEach((lang) => {
    translations[lang] = normalizeTranslation(value?.translations?.[lang] || {}, defaults[lang] || defaults.en || {});
  });
  return {
    ...blankStaticPageEditorState(slug),
    ...value,
    slug,
    pageLabel: STATIC_PAGE_LABELS[slug] || slug,
    translations,
    activeLocale: CONTENT_LANGS.includes(value.activeLocale) ? value.activeLocale : 'en',
  };
}

function chooseLocalizedEntry(translations = {}, lang = state.currentLanguage || 'en') {
  const order = [lang, ...LANG_PRIORITY.filter((code) => code !== lang)];
  for (const code of order) {
    const entry = translations?.[code];
    if (entry && STATIC_FIELDS.some((field) => stringValue(entry[field]))) {
      return { lang: code, entry };
    }
  }
  return { lang: 'en', entry: normalizeTranslation({}, {}) };
}

export function getLocalizedStaticPage(pageData = {}, lang = state.currentLanguage || 'en') {
  const normalized = normalizeStaticPageEditorState(pageData);
  const localized = chooseLocalizedEntry(normalized.translations, lang);
  return {
    ...normalized,
    localizedLanguage: localized.lang,
    ...localized.entry,
  };
}

export async function loadStaticPageContent(slug = 'about') {
  const normalizedSlug = STATIC_PAGE_KEYS.includes(slug) ? slug : 'about';
  if (!state.db) {
    return normalizeStaticPageEditorState({ slug: normalizedSlug });
  }
  const ref = doc(state.db, 'site_pages', normalizedSlug);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return normalizeStaticPageEditorState({ slug: normalizedSlug });
  }
  return normalizeStaticPageEditorState({ slug: normalizedSlug, ...snap.data() });
}

export async function saveStaticPageContent(slug = 'about', payload = {}) {
  if (!state.db) throw new Error('Firebase not ready');
  const normalized = normalizeStaticPageEditorState({ slug, ...payload });
  const author = state.currentUser?.email || 'manual-admin';
  const ref = doc(state.db, 'site_pages', normalized.slug);
  await setDoc(ref, {
    slug: normalized.slug,
    pageLabel: normalized.pageLabel,
    translations: normalized.translations,
    updatedAt: serverTimestamp(),
    updatedBy: author,
    createdAt: normalized.createdAt || serverTimestamp(),
    createdBy: normalized.createdBy || author,
  }, { merge: true });
  return loadStaticPageContent(normalized.slug);
}
