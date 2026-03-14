/**
 * CMS Service — Page content and configuration CRUD.
 * Reads/writes cms_pages collection and cms_config documents.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db, storage } from '../config/firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type {
    CmsPageDoc,
    CmsHeaderConfigDoc,
    CmsFooterConfigDoc,
    CmsMenuItemDoc,
    CmsAboutValuesDoc,
    CmsAboutPageDoc,
    CmsLandingPageDoc,
    CmsDestinationsConfigDoc,
    CmsDestinationDoc,
    NotificationPrefsDoc,
} from '../types/firestore';

// ─── Collection Refs ───────────────────────────────────────

const cmsPagesRef = collection(db, 'cms_pages');
const cmsConfigRef = collection(db, 'cms_config');

// ─── CMS Pages ─────────────────────────────────────────────

export async function getCmsPages(): Promise<CmsPageDoc[]> {
    const q = query(cmsPagesRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CmsPageDoc));
}

export async function getCmsPageById(id: string): Promise<CmsPageDoc | null> {
    const snap = await getDoc(doc(cmsPagesRef, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as CmsPageDoc : null;
}

export async function getCmsPageBySlug(slug: string): Promise<CmsPageDoc | null> {
    const q = query(cmsPagesRef, where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as CmsPageDoc;
}

export async function createCmsPage(
    data: Omit<CmsPageDoc, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const docRef = await addDoc(cmsPagesRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateCmsPage(
    id: string,
    data: Partial<Omit<CmsPageDoc, 'id' | 'createdAt'>>
): Promise<void> {
    await updateDoc(doc(cmsPagesRef, id), {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteCmsPage(id: string): Promise<void> {
    await deleteDoc(doc(cmsPagesRef, id));
}

/**
 * Ensure default CMS pages exist. Called once when PageEditor loads.
 * If a page with the given slug already exists, it is skipped.
 */
export async function seedDefaultPages(): Promise<void> {
    const DEFAULT_PAGES: Omit<CmsPageDoc, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
            title: 'Careers',
            slug: 'careers',
            content: `<section>
<h1>Join Our Crew</h1>
<p>Help us connect West Africa to the world. We're building the future of aviation — and we need talented people like you.</p>
</section>

<section>
<h2>Why Join Deltablue Jet Air?</h2>
<ul>
<li><strong>Free &amp; Discounted Travel</strong> — Complimentary flights and discounted travel for you and your family across all routes.</li>
<li><strong>Training &amp; Development</strong> — World-class aviation training programs, mentorship, and certifications.</li>
<li><strong>Health &amp; Wellbeing</strong> — Comprehensive medical, dental, and vision coverage plus wellness programs.</li>
<li><strong>Competitive Pay</strong> — Market-leading compensation with annual reviews, bonuses, and retirement plans.</li>
<li><strong>Inclusive Workplace</strong> — A diverse, respectful environment where every team member is valued.</li>
<li><strong>Global Opportunities</strong> — Explore opportunities at any of our stations across West Africa and beyond.</li>
</ul>
</section>

<section>
<h2>What We Stand For</h2>
<ul>
<li><strong>Safety First</strong> — Every decision starts with the safety of our passengers and crew.</li>
<li><strong>Teamwork</strong> — Aviation is a team effort. We rise together.</li>
<li><strong>Excellence</strong> — We set the standard for service in West African aviation.</li>
<li><strong>Sustainability</strong> — We are committed to reducing our environmental footprint.</li>
</ul>
</section>

<section>
<h2>Open Positions</h2>
<ul>
<li>First Officer (Boeing 737) — Flight Operations — Banjul, The Gambia</li>
<li>Cabin Crew Member — In-Flight Services — Banjul, The Gambia</li>
<li>Aircraft Maintenance Engineer — Engineering — Banjul, The Gambia</li>
<li>Ground Operations Agent — Airport Services — Lagos, Nigeria</li>
<li>Revenue Management Analyst — Commercial — Banjul, The Gambia</li>
<li>Customer Service Representative — Customer Experience — Remote / Banjul</li>
<li>Software Engineer, Aviation Systems — Technology — Remote</li>
<li>Safety &amp; Compliance Officer — Safety — Banjul, The Gambia</li>
</ul>
</section>

<section>
<h2>Our Hiring Process</h2>
<ol>
<li><strong>Submit Your Application</strong> — Send your CV and cover letter through our portal.</li>
<li><strong>Initial Screening</strong> — Our recruitment team reviews and reaches out.</li>
<li><strong>Assessment &amp; Interview</strong> — Skills assessment followed by panel interviews.</li>
<li><strong>Offer &amp; Onboarding</strong> — Join the team and begin our structured onboarding.</li>
</ol>
</section>`,
            metaTitle: 'Careers at Deltablue Jet Air — Join Our Crew',
            metaDescription: 'Explore career opportunities at Deltablue Jet Air. We are hiring pilots, cabin crew, engineers, and more across West Africa.',
            featuredImage: null,
            parentPage: null,
            tags: ['careers', 'jobs', 'hiring'],
            status: 'published',
            author: 'system',
        },
    ];

    for (const page of DEFAULT_PAGES) {
        const existing = await getCmsPageBySlug(page.slug);
        if (!existing) {
            await createCmsPage(page);
            console.log(`[CMS] Seeded default page: ${page.slug}`);
        }
    }
}

// ─── CMS Config — Header ──────────────────────────────────

export async function getHeaderConfig(): Promise<CmsHeaderConfigDoc | null> {
    const snap = await getDoc(doc(cmsConfigRef, 'header'));
    return snap.exists() ? snap.data() as CmsHeaderConfigDoc : null;
}

export async function updateHeaderConfig(
    data: Partial<CmsHeaderConfigDoc>
): Promise<void> {
    await setDoc(doc(cmsConfigRef, 'header'), {
        ...data,
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

// ─── CMS Config — Footer ──────────────────────────────────

// ─── CMS Config — Destinations ────────────────────────────

export async function getDestinationsConfig(): Promise<CmsDestinationsConfigDoc | null> {
    const snap = await getDoc(doc(cmsConfigRef, 'destinations'));
    return snap.exists() ? snap.data() as CmsDestinationsConfigDoc : null;
}

export async function updateDestinationConfig(
    code: string,
    data: CmsDestinationDoc,
    pageFields?: Partial<Omit<CmsDestinationsConfigDoc, 'destinations' | 'updatedAt'>>
): Promise<void> {
    const existing = await getDestinationsConfig();
    const destinations = existing?.destinations || {};
    destinations[code] = data;
    await setDoc(doc(cmsConfigRef, 'destinations'), {
        ...pageFields,
        destinations,
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

export async function updateDestinationsPageContent(
    fields: Partial<Omit<CmsDestinationsConfigDoc, 'destinations' | 'updatedAt'>>
): Promise<void> {
    await setDoc(doc(cmsConfigRef, 'destinations'), {
        ...fields,
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

export async function uploadDestinationImage(
    file: File,
    airportCode: string
): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const storageRef = ref(storage, `cms/destinations/${airportCode.toLowerCase()}.${ext}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

export async function getFooterConfig(): Promise<CmsFooterConfigDoc | null> {
    const snap = await getDoc(doc(cmsConfigRef, 'footer'));
    return snap.exists() ? snap.data() as CmsFooterConfigDoc : null;
}

export async function updateFooterConfig(
    data: Partial<CmsFooterConfigDoc>
): Promise<void> {
    await setDoc(doc(cmsConfigRef, 'footer'), {
        ...data,
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

// ─── CMS Config — Menus ───────────────────────────────────

export async function getMenuConfig(): Promise<CmsMenuItemDoc[]> {
    const snap = await getDoc(doc(cmsConfigRef, 'menus'));
    if (!snap.exists()) return [];
    const data = snap.data();
    return (data.items || []) as CmsMenuItemDoc[];
}

export async function updateMenuConfig(items: CmsMenuItemDoc[]): Promise<void> {
    await setDoc(doc(cmsConfigRef, 'menus'), {
        items,
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

// ─── CMS Config — About Values ────────────────────────────

export async function getAboutValuesConfig(): Promise<CmsAboutValuesDoc | null> {
    const snap = await getDoc(doc(cmsConfigRef, 'aboutValues'));
    return snap.exists() ? snap.data() as CmsAboutValuesDoc : null;
}

export async function updateAboutValuesConfig(
    data: Partial<CmsAboutValuesDoc>
): Promise<void> {
    await setDoc(doc(cmsConfigRef, 'aboutValues'), {
        ...data,
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

// ─── CMS Config — Full About Page ─────────────────────────

export async function getAboutPageConfig(): Promise<CmsAboutPageDoc | null> {
    const snap = await getDoc(doc(cmsConfigRef, 'aboutValues'));
    return snap.exists() ? snap.data() as CmsAboutPageDoc : null;
}

export async function updateAboutPageConfig(
    data: Partial<CmsAboutPageDoc>
): Promise<void> {
    await setDoc(doc(cmsConfigRef, 'aboutValues'), {
        ...data,
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

// ─── CMS Config — Notification Preferences ────────────────

export async function getNotificationPrefs(uid: string): Promise<NotificationPrefsDoc | null> {
    const snap = await getDoc(doc(cmsConfigRef, `notificationPrefs_${uid}`));
    return snap.exists() ? snap.data() as NotificationPrefsDoc : null;
}

export async function updateNotificationPrefs(
    uid: string,
    data: Partial<NotificationPrefsDoc>
): Promise<void> {
    await setDoc(doc(cmsConfigRef, `notificationPrefs_${uid}`), {
        ...data,
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

// ─── CMS Config — Landing Page ────────────────────────────

export async function getLandingPageConfig(): Promise<CmsLandingPageDoc | null> {
    const snap = await getDoc(doc(cmsConfigRef, 'landingPage'));
    return snap.exists() ? snap.data() as CmsLandingPageDoc : null;
}

export async function updateLandingPageConfig(
    data: Partial<CmsLandingPageDoc>
): Promise<void> {
    await setDoc(doc(cmsConfigRef, 'landingPage'), {
        ...data,
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

// ─── Brand Asset Upload ───────────────────────────────────

/**
 * Upload a brand asset (logo or favicon) to Firebase Storage.
 * Returns the public download URL.
 */
export async function uploadBrandAsset(
    file: File,
    type: 'logo' | 'favicon'
): Promise<string> {
    const ext = file.name.split('.').pop() || 'png';
    const storageRef = ref(storage, `cms/brand/${type}.${ext}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

/**
 * Upload a CMS page featured image to Firebase Storage.
 * Returns the public download URL.
 */
export async function uploadPageImage(
    file: File,
    pageId: string
): Promise<string> {
    const ext = file.name.split('.').pop() || 'png';
    const storageRef = ref(storage, `cms/pages/${pageId}.${ext}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

