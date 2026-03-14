/**
 * Seed the Careers CMS page into Firestore.
 * Run: node scripts/seed-careers-page.cjs
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize with project defaults (uses GOOGLE_APPLICATION_CREDENTIALS or
// the default service account when run in a GCP environment).
// For local dev, firebase-admin uses the emulator or the project's default credentials.
initializeApp({ projectId: 'deltablue-jet-air' });

const db = getFirestore();

const CAREERS_PAGE = {
    title: 'Careers',
    slug: 'careers',
    content: `<section class="hero">
<h1>Join Our Crew</h1>
<p>Help us connect West Africa to the world. We're building the future of aviation — and we need talented people like you.</p>
</section>

<section class="benefits">
<h2>Why Join Deltablue Jet Air?</h2>
<ul>
<li><strong>Free & Discounted Travel</strong> — Enjoy complimentary flights and heavily discounted travel for you and your family across all our routes.</li>
<li><strong>Training & Development</strong> — Access world-class aviation training programs, mentorship, and certifications to grow your career.</li>
<li><strong>Health & Wellbeing</strong> — Comprehensive medical, dental, and vision coverage, plus wellness programs for your entire family.</li>
<li><strong>Competitive Pay</strong> — Market-leading compensation packages with annual reviews, performance bonuses, and retirement plans.</li>
<li><strong>Inclusive Workplace</strong> — A diverse, respectful environment where every team member is valued regardless of background.</li>
<li><strong>Global Opportunities</strong> — With routes across West Africa and beyond, explore opportunities at any of our stations worldwide.</li>
</ul>
</section>

<section class="values">
<h2>What We Stand For</h2>
<ul>
<li><strong>Safety First</strong> — Every decision starts with the safety of our passengers and crew.</li>
<li><strong>Teamwork</strong> — Aviation is a team effort. We rise together.</li>
<li><strong>Excellence</strong> — We set the standard for service in West African aviation.</li>
<li><strong>Sustainability</strong> — We are committed to reducing our environmental footprint.</li>
</ul>
</section>

<section class="openings">
<h2>Open Positions</h2>
<ul>
<li>First Officer (Boeing 737) — Flight Operations — Banjul, The Gambia</li>
<li>Cabin Crew Member — In-Flight Services — Banjul, The Gambia</li>
<li>Aircraft Maintenance Engineer — Engineering — Banjul, The Gambia</li>
<li>Ground Operations Agent — Airport Services — Lagos, Nigeria</li>
<li>Revenue Management Analyst — Commercial — Banjul, The Gambia</li>
<li>Customer Service Representative — Customer Experience — Remote / Banjul</li>
<li>Software Engineer — Aviation Systems — Technology — Remote</li>
<li>Safety & Compliance Officer — Safety — Banjul, The Gambia</li>
</ul>
</section>

<section class="process">
<h2>Our Hiring Process</h2>
<ol>
<li><strong>Submit Your Application</strong> — Find a role that fits and submit your CV and cover letter.</li>
<li><strong>Initial Screening</strong> — Our recruitment team reviews your application and reaches out.</li>
<li><strong>Assessment & Interview</strong> — Skills assessment followed by panel interviews.</li>
<li><strong>Offer & Onboarding</strong> — Successful candidates receive an offer and begin onboarding.</li>
</ol>
</section>`,
    metaTitle: 'Careers at Deltablue Jet Air — Join Our Crew',
    metaDescription: 'Explore career opportunities at Deltablue Jet Air. We are hiring pilots, cabin crew, engineers, and more. Join the team connecting West Africa to the world.',
    featuredImage: null,
    parentPage: null,
    tags: ['careers', 'jobs', 'hiring'],
    status: 'published',
    author: 'admin@deltabluejet.com',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
};

async function seed() {
    try {
        const ref = db.collection('cms_pages');
        // Check if careers page already exists
        const existing = await ref.where('slug', '==', 'careers').get();
        if (!existing.empty) {
            console.log('✓ Careers page already exists in CMS (id:', existing.docs[0].id, ')');
            return;
        }
        const docRef = await ref.add(CAREERS_PAGE);
        console.log('✓ Careers page seeded into CMS → id:', docRef.id);
    } catch (err) {
        console.error('✗ Failed to seed careers page:', err.message);
        process.exit(1);
    }
}

seed();
