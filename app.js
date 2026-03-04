require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const https = require('https');
const admin = require('firebase-admin');
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- Firebase Initialization ---
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Used in Vercel via Environment Variables
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // ADD THIS LINE: Fix Vercel's newline formatting issue
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    
} else {
    // Used for local development
    serviceAccount = require('./firebase-key.json');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://naujantourism-ad6a6-default-rtdb.firebaseio.com/'
});
const db = admin.database();

// --- Visit tracking (persisted to Firebase RTDB) ---
const RESET_AFTER_DAYS = 30;
let visitCounts = {}; // { attractionId: number }
let lastResetAt = null; // Date string (ISO) when counts were last reset

function loadVisits() {
    db.ref('/visits').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
            visitCounts = data.counts || {};
            lastResetAt = data.lastReset || new Date().toISOString();
        } else {
            visitCounts = {};
            lastResetAt = new Date().toISOString();
            saveVisits();
        }
        maybeResetIfMonthPassed();

        // Listen for future changes
        db.ref('/visits').on('value', (s) => {
            const d = s.val();
            if (d) {
                visitCounts = d.counts || {};
                lastResetAt = d.lastReset || lastResetAt;
            } else {
                visitCounts = {};
            }
        });
    }).catch(error => {
        console.error('Error reading visits from Firebase:', error);
    });
}

function saveVisits() {
    return db.ref('/visits').set({
        lastReset: lastResetAt || new Date().toISOString(),
        counts: visitCounts
    }).catch(e => {
        console.error('Could not save visit counts to Firebase:', e.message);
    });
}

/** If last reset was more than RESET_AFTER_DAYS ago, clear counts and set new reset date. */
async function maybeResetIfMonthPassed() {
    if (!lastResetAt) {
        lastResetAt = new Date().toISOString();
        await saveVisits();
        return;
    }
    const then = new Date(lastResetAt).getTime();
    const now = Date.now();
    const daysSince = (now - then) / (1000 * 60 * 60 * 24);
    if (daysSince >= RESET_AFTER_DAYS) {
        visitCounts = {};
        lastResetAt = new Date().toISOString();
        await saveVisits();
    }
}

/** Manually reset all visit counts and set lastReset to now. */
async function resetVisits() {
    visitCounts = {};
    lastResetAt = new Date().toISOString();
    return await saveVisits();
}

/** Record one visit for an attraction by id. Call this when someone views the attraction page. */
async function recordVisit(attractionId) {
    if (!attractionId) return;
    await maybeResetIfMonthPassed();
    visitCounts[attractionId] = (visitCounts[attractionId] || 0) + 1;
    
    // Create a 1.5-second timeout to prevent the page from hanging if Firebase fails
    const timeoutPromise = new Promise(resolve => setTimeout(() => {
        console.warn('Firebase save timed out, skipping to load page.');
        resolve();
    }, 1500));

    // Race the Firebase save against the 1.5 second timeout
    await Promise.race([saveVisits(), timeoutPromise]); 
}

// --- Favorites and Ratings tracking (persisted to Firebase RTDB) ---
let favData = {}; // { attractionId: { favorites: 0, ratingSum: 0, ratingCount: 0 } }

function loadFavs() {
    db.ref('/favs').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
            favData = data;
        } else {
            favData = {};
            saveFavs();
        }

        // Listen for future changes
        db.ref('/favs').on('value', (s) => {
            const d = s.val();
            favData = d || {};
        });
    }).catch(error => {
        console.error('Error reading favs from Firebase:', error);
    });
}

function saveFavs() {
    return db.ref('/favs').set(favData).catch(e => {
        console.error('Could not save favorites to Firebase:', e.message);
    });
}

/** Manually reset all favorites and ratings */
async function resetFavs() {
    favData = {};
    return await saveFavs();
}

function getAttractionStats(id) {
    const f = favData[id] || { favorites: 0, ratingSum: 0, ratingCount: 0 };
    return {
        favoritesCount: f.favorites || 0,
        ratingSum: f.ratingSum || 0,
        ratingCount: f.ratingCount || 0,
        avgRating: f.ratingCount > 0 ? (f.ratingSum / f.ratingCount).toFixed(1) : 0
    };
}

/** Get all attractions with their visit counts, sorted by visits descending (most visited first). */
function getAttractionsWithVisits() {
    return attractions.map(a => ({
        ...a,
        visits: visitCounts[a.id] || 0,
        stats: getAttractionStats(a.id)
    })).sort((a, b) => b.visits - a.visits);
}

loadVisits();
loadFavs();

// Mock Data: Real spots in Naujan, Oriental Mindoro
const attractions = [
    {
        id: 'naujan-lake',
        highlights: 'A breathtaking biodiversity hotspot and birdwatching paradise on the Philippines\' fifth-largest lake.',
        uniqueHighlight: 'Oriental Mindoro’s only nationally protected lake park, offering an unforgettable mix of serene lake cruises, vibrant birdwatching, and sweeping mountain panoramas.',
        name: 'Naujan Lake National Park',
        category: 'Nature',
        image: '/images/lake.jpg',
        desc: 'Discover the untamed beauty of the Philippines\' fifth-largest lake. This sprawling biodiversity hotspot offers a tranquil escape where you can glide across glass-like waters, marvel at migratory birds, and soak in breathtaking sunsets framed by majestic mountain ranges.',
        coordinates: [121.32143932976706, 13.164128472005663]
    },
    {
        id: 'simbahang-bato',
        highlights: 'Enchanting 17th-century coral-stone ruins featuring a dramatic, historical "church within a church."',
        uniqueHighlight: 'Step into a captivating piece of history with a rare, picturesque inner-chapel built right into the heart of an ancient stone fortress.',
        name: 'Simbahang Bato (Bancuro Ruins)',
        category: 'Heritage',
        image: '/images/simbahan/main.jpg',
        desc: 'Step back in time at this hauntingly beautiful 17th-century relic. Originally built as a stone fortress against raids, these moss-draped coral and adobe ruins now cradle a rare "church within a church," offering a deeply atmospheric and picturesque glimpse into Spanish-era history.',
        coordinates: [121.32184698287517, 13.281370180034118],
        gallery: ['/images/simbahan/1.jpg']
    },
    {
        id: 'liwasang-bonifacio',
        highlights: 'The lively, green heart of Naujan, perfect for leisurely strolls and vibrant community festivals.',
        uniqueHighlight: 'Naujan’s vibrant "living room," seamlessly blending lively cultural shows, civic events, and laid-back everyday local life.',
        name: 'Liwasang Bonifacio',
        category: 'Cultural',
        image: '/images/liwasang.jpg',
        desc: 'Feel the pulse of Naujan at its vibrant town plaza. Surrounded by manicured greenery, this inviting open space is the perfect backdrop for leisurely afternoon strolls, lively community festivals, and experiencing the warm, everyday charm of local life.',
        coordinates: [121.3030, 13.3242]
    },
    {
        id: 'dao-waterlily-minipark',
        highlights: 'A highly photogenic eco-park blending scenic boat rides with inspiring, sustainable local craftsmanship.',
        uniqueHighlight: 'Drift through stunning lily-covered waterways and discover how the community transforms these blooms into gorgeous, eco-chic fashion.',
        name: 'Dao Waterlily Minipark',
        category: 'Nature',
        image: '/images/waterlily/main.jpg',
        desc: 'Glide through a vibrant carpet of blooming water lilies at this picturesque eco-park. Beyond the incredibly scenic boat rides, you will discover an inspiring community hub where local artisans transform humble lily stalks into beautiful, sustainable eco-fashion.',
        coordinates: [121.31942065376933, 13.2567513208881],
        gallery: ['/images/waterlily/1.jpg', '/images/waterlily/2.jpg', '/images/waterlily/3.jpg']
    },
    {
        id: 'montelago-hot-spring',
        highlights: 'A soothing sanctuary of therapeutic, warm mineral pools and refreshing forest falls.',
        uniqueHighlight: 'The ultimate relaxation hub that pairs soothing geothermal hot springs with a stunning forest waterfall, all accessed via a scenic trek.',
        name: 'Montelago Hot Spring & Forest Falls',
        category: 'Nature',
        image: '/images/hotspring/main.jpg',
        desc: 'Melt your stress away in therapeutic, warm mineral pools nestled deeply within the region\'s geothermal veins. This hidden sanctuary perfectly balances relaxation and adventure, featuring refreshing forest falls and trails that reveal the rugged volcanic beauty of the lake\'s shoreline.',
        coordinates: [121.37576057128022, 13.222410474261634],
        gallery: ['/images/hotspring/1.jpg']
    },
    {
        id: 'agrigold-farm',
        highlights: 'An inspiring, certified learning farm offering hands-on experiences in sustainable and organic agriculture.',
        uniqueHighlight: 'Roll up your sleeves and "learn in the field" at this accredited, highly interactive farm celebrating modern organic practices.',
        name: 'AgriGold Farm Learning Center Inc.',
        category: 'Agri-Tourism',
        image: '/images/agrigold/main.jpg',
        desc: 'Get your hands dirty and your mind inspired at this vibrant educational sanctuary. Whether you are an aspiring farmer or an eco-enthusiast, you will love the immersive, hands-on workshops in sustainable agriculture and organic farming that empower the local community.',
        coordinates: [121.25798077115141, 13.2533426861691],
        gallery: ['/images/agrigold/1.jpg', '/images/agrigold/2.jpg', '/images/agrigold/3.jpg']
    },
    {
        id: 'celeste-beach-house',
        highlights: 'A serene, intimate beachfront retreat offering pure relaxation and direct access to calming sea waters.',
        uniqueHighlight: 'Experience the ultimate "home-away-from-home" vibe where the shoreline is practically at your doorstep.',
        name: 'Celeste Beach House',
        category: 'Resort',
        image: '/images/celeste/main.jpg',
        desc: 'Trade crowded resorts for your own private slice of paradise at this intimate beachfront retreat. Offering a laid-back, "home-away-from-home" vibe with the ocean just steps from your door, it is the ultimate seaside escape for quiet holidays and memorable family getaways.',
        coordinates: [121.31222816936804, 13.32851830943331],
        gallery: ['/images/celeste/1.jpg', '/images/celeste/2.jpg'],
        rooms: [
            { name: 'Duplex Guest Room', details: 'Good for 6, fan room', price: '₱800 / night', image: '/images/celeste/duplex.jpg' }
        ],
        facebook: 'https://web.facebook.com/profile.php?id=61573655720760',
        openingHours: 'Check-in: 2:00 PM | Check-out: 12:00 NN',
        entranceFees: 'Exclusive rental (Rates apply)',
        visitorTips: 'Bring your own snorkeling gear! The waters right in front of the house are incredibly clear.'
    },
    {
        id: 'largo-castillo-farm',
        highlights: 'A beautifully rustic, eco-conscious haven championing creative upcycling and sprawling green serenity.',
        uniqueHighlight: 'Every corner tells a story in this creatively upcycled paradise, offering a uniquely inspiring setting for peaceful farm-to-table moments.',
        name: 'Largo Castillo Farm House',
        category: 'Agri-Tourism',
        image: '/images/largo/main.jpg',
        desc: 'Experience the charm of sustainable living at this wonderfully rustic, eco-conscious farmhouse. Set amidst sprawling green fields, every corner showcases creative upcycling, providing a uniquely inspiring and peaceful backdrop for intimate celebrations and farm-to-table dining.',
        coordinates: [121.27758068131465, 13.333447596743362],
        gallery: ['/images/largo/1.jpg', '/images/largo/2.jpg', '/images/largo/3.jpg']
    },
    {
        id: 'nabul-beach-resort',
        highlights: 'A picture-perfect strip of native kubo cottages and crystal-clear waters for the ultimate laid-back beach day.',
        uniqueHighlight: 'Ditch the crowds for a classic, back-to-basics Filipino seaside picnic where calm, shallow waters are the main attraction.',
        name: 'Nabul Beach Resort',
        category: 'Resort',
        image: '/images/nabul/main.jpg',
        desc: 'Embrace the ultimate back-to-basics beach day at Nabul. With its classic native kubo cottages catching the gentle sea breeze and incredibly clear, shallow waters, it is the perfect spot for a carefree, traditional Filipino seaside picnic with family and friends.',
        coordinates: [121.34785867159911, 13.292433044845254],
        openingHours: '7:00 AM - 6:00 PM',
        entranceFees: '₱50 per head',
        visitorTips: 'Classic "probinsya" beach vibes! Best to bring your own packed lunch and rent a kubo.'
    },
    {
        id: 'villa-cornitz',
        highlights: 'Adrialuna’s hidden oasis, featuring pristine swimming pools and breezy open-air cabanas.',
        uniqueHighlight: 'The perfect intimately scaled resort, offering an exclusive, private-feel atmosphere ideal for memorable local celebrations.',
        name: 'Villa Cornitz Mini Resort',
        category: 'Resort',
        image: '/images/cornitz/1.jpg',
        desc: 'Uncover Adrialuna’s best-kept secret. This charming mini-resort offers an exclusive, intimate atmosphere with pristine swimming pools and breezy open-air cabanas—making it the ideal private oasis for memorable family reunions, birthdays, or a quick weekend plunge.',
        coordinates: [121.28569607104512, 13.212265618761423],
        gallery: ['/images/cornitz/1.jpg', '/images/cornitz/2.jpg', '/images/cornitz/3.jpg', '/images/cornitz/4.jpg'],
        openingHours: '8:00 AM - 10:00 PM',
        entranceFees: '₱100 Adult / ₱80 Kids',
        visitorTips: 'Great for private parties. Message them in advance to reserve a pavilion.'
    },
    {
        id: 'la-hacienda',
        highlights: 'A breathtaking Balinese-inspired oasis boasting lush tropical gardens, a stunning centerpiece pool, and elegant villas.',
        uniqueHighlight: 'Transport yourself to Bali right in the heart of Naujan with curated, highly photogenic tropical landscaping and luxurious themed villas.',
        name: 'La Hacienda',
        category: 'Resort',
        image: '/images/hacienda/main.jpg',
        desc: 'Escape to Bali without leaving Mindoro at this breathtaking private oasis. Featuring elegantly designed themed villas, lush tropical landscaping, and a stunning centerpiece pool, La Hacienda delivers a luxurious, highly photogenic retreat in the heart of the countryside.',
        coordinates: [121.30584297294946, 13.317016887351807],
        gallery: ['/images/hacienda/1.jpg', '/images/hacienda/2.jpg', '/images/hacienda/3.jpg', '/images/hacienda/4.jpg', '/images/hacienda/5.jpg'],
        openingHours: 'Check-in: 2:00 PM | Check-out: 12:00 NN',
        entranceFees: 'Overnight Rates Apply',
        visitorTips: 'Highly photogenic spot! Don’t forget to pack your best resort wear.'
    },
    {
        id: 'villa-catalina',
        highlights: 'A delightful fusion of vibrant farm charm and relaxing resort leisure for a picture-perfect family escape.',
        uniqueHighlight: 'Enjoy the best of both worlds: immerse yourself in beautiful harvest views by day and unwind with top-tier resort comfort by night.',
        name: 'Villa Catalina Eco Farm Resort',
        category: 'Resort',
        image: '/images/catalina/main.jpg',
        desc: 'Experience the best of both worlds where vibrant farm life meets resort-style relaxation. Villa Catalina offers a wholesome, family-friendly escape where you can explore lush agricultural surroundings by day and unwind in ultimate comfort by night.',
        coordinates: [121.27171983311774, 13.309237043724876],
        gallery: ['/images/catalina/1.jpg', '/images/catalina/2.jpg'],
        facebook: 'https://web.facebook.com/VillaCatalinaEcoFarmResort',
        openingHours: '7:00 AM - 8:00 PM',
        entranceFees: '₱150 per head (Day Tour)',
        visitorTips: 'Explore the agricultural areas in the early morning for the best weather and views.'
    },
    {
        id: 'benilda-ng-bancuro',
        highlights: 'An action-packed family paradise featuring thrilling pool slides, a magical butterfly sanctuary, and horseback riding.',
        uniqueHighlight: 'The ultimate all-in-one family playland where you can swim, ride, explore nature, and dine—all in one vibrant destination.',
        name: 'Benilda ng Bancuro Resort & Restaurant',
        category: 'Resort',
        image: '/images/benilda.jpg',
        desc: 'Dive into endless fun at Naujan\'s ultimate family playground. From thrilling slide-equipped pools and a mesmerizing butterfly sanctuary to horseback riding adventures, this sprawling resort guarantees an action-packed, unforgettable day out for all ages.',
        coordinates: [121.3225, 13.2795],
        facebook: 'https://web.facebook.com/BenildaResort',
        openingHours: '8:00 AM - 6:00 PM',
        entranceFees: '₱150 Adult / ₱100 Kids',
        visitorTips: 'Make sure to check out the butterfly sanctuary before getting wet in the pools.'
    },
    {
        id: '333-steps',
        highlights: 'An exhilarating 333-step ascent rewarding you with spellbinding, panoramic views of the lush Melgar landscape.',
        uniqueHighlight: 'A beautiful blend of fitness and scenic wonder, ending at a dramatic view deck that promises unforgettable sunrise and sunset reflections.',
        name: '333 Steps (Melgar A)',
        category: 'Nature',
        image: '/images/333-steps.jpg',
        desc: 'Challenge yourself to a rewarding climb where faith meets fitness. Ascend 333 steps through lush greenery to reach a stunning hilltop viewing deck, rewarding your effort with a spellbinding, panoramic sweep of the rolling Melgar landscape and the sparkling coast.',
        coordinates: [121.35578622557868, 13.275250119249757]
    },
    {
        id: 'naujan-agri-center',
        highlights: 'The dynamic heart of Naujan’s agricultural innovation, showcasing modern farming research and practices.',
        uniqueHighlight: 'Get an exclusive, behind-the-scenes look at the thriving demo farms and nurseries that power Naujan’s rich agricultural heritage.',
        name: 'Naujan Agricultural Center',
        category: 'Agri-Tourism',
        image: '/images/naujan-agri.jpg',
        desc: 'Discover the roots of Naujan\'s rich farming heritage at this dynamic agricultural hub. Get a fascinating behind-the-scenes look at sustainable food production, vibrant demo farms, and the innovative programs driving the town\'s local farming community forward.',
        coordinates: [121.3005, 13.3230]
    },
    {
        id: 'hafa-adai',
        highlights: 'A blissful seaside dining spot serving mouth-watering local delicacies against an unobstructed ocean horizon.',
        uniqueHighlight: 'Your ultimate coastal lounge—enjoy incredible drinks and eats while the crashing waves and sea breeze provide the perfect natural soundtrack.',
        name: 'Hafa Adai',
        category: 'Resort',
        image: '/images/hafa-adai.jpg',
        desc: 'Savor the ultimate seaside chill at Hafa Adai. Enjoy an unforgettable dining experience where you can feast on delicious local delicacies and cold drinks, all while soaking in an unobstructed, horizon-stretching view of the sea accompanied by a soothing ocean breeze.',
        coordinates: [121.31022214428944, 13.331900799869143]
    },
    {
        id: 'emerald-resort',
        highlights: 'A spacious, tranquil beachfront sanctuary perfectly situated on the pristine Brgy. Estrella shoreline.',
        uniqueHighlight: 'The ultimate crowd-pleaser, offering an expansive beachfront and roomy quarters designed to perfectly host large clans and barkadas.',
        name: 'Emerald Resort',
        category: 'Resort',
        image: '/images/emerald.jpg',
        desc: 'Gather the whole gang for an unforgettable coastal getaway. Boasting a remarkably wide, pristine beachfront and exceptionally spacious accommodations, Emerald Resort is the perfect sanctuary for large families and barkadas craving a peaceful, crowd-free oceanfront escape.',
        coordinates: [121.3134430221171, 13.323650337442288],
        openingHours: '8:00 AM - 5:00 PM',
        entranceFees: '₱50 per head',
        visitorTips: 'Spacious beachfront! Bring volleyballs and frisbees for group games.'
    },
    {
        id: 'mulawin-boulevard',
        highlights: 'A scenic, tree-lined thoroughfare that beautifully captures the vibrant, modern growth of Naujan.',
        uniqueHighlight: 'A captivating cityscape viewpoint that frames Naujan’s exciting urban development against beautiful, leafy roadside trees.',
        name: 'Mulawin Boulevard',
        category: 'Landmark',
        image: '/images/mulawin.jpg',
        desc: 'Take a scenic drive down Mulawin Boulevard, the dynamic artery connecting Naujan\'s vibrant neighborhoods. Framed by roadside trees, this bustling thoroughfare offers a captivating, everyday glimpse into the town\'s steady growth and welcoming local spirit.',
        coordinates: [121.13913740674923, 13.236412504363686]
    },
    {
        id: 'mais-place',
        highlights: 'A pristine, modern private pool and cozy dining space crafted for the ultimate exclusive staycation.',
        uniqueHighlight: 'Your personal luxury hideaway—enjoy an entire premium pool and dining space completely exclusive to your closest group.',
        name: 'Mai’s Place Private Pool',
        category: 'Resort',
        image: '/images/mai/main.jpg',
        desc: 'Claim your own private paradise for the day at Mai’s Place. Featuring a pristine, modern swimming pool and a cozy dining area completely exclusive to your group, it is the ultimate premium staycation spot for intimate celebrations and undisturbed relaxation.',
        coordinates: [121.312303, 13.31945],
        gallery: ['/images/mai/1.jpg', '/images/mai/2.jpg', '/images/mai/3.jpg', '/images/mai/4.jpg', '/images/mai/5.jpg'],
        facebook: 'https://web.facebook.com/profile.php?id=100075758085120',
        openingHours: 'Private Booking Only',
        entranceFees: 'Starts at ₱5,000 / 12 hrs',
        visitorTips: 'You can bring your own food and drinks. Ideal for undisturbed family bonding.'
    },
    {
        id: 'rio-del-sierra',
        highlights: 'A breathtaking, off-grid riverside sanctuary enveloped by majestic mountains and icy, refreshing waters.',
        uniqueHighlight: 'Escape the concrete jungle for a wildly beautiful, off-grid experience featuring raw nature, rustic kubos, and towering forested walls.',
        name: 'Rio del Sierra',
        category: 'Nature',
        image: '/images/rio-del-sierra.jpg',
        desc: 'Disconnect from the grid and reconnect with nature at this raw, hidden riverside sanctuary. Flanked by majestic mountain walls, you can lounge in rustic kubo huts and plunge into crystal-clear, ice-cold river waters for a truly refreshing and wild escape.',
        coordinates: [121.08257645610377, 13.275679230651638]
    },
    {
        id: 'organic-healing-park',
        highlights: 'A transformative wellness destination dedicated to a chemical-free, healing lifestyle and slow living.',
        uniqueHighlight: 'Hit the reset button with farm-fresh organic food, tranquil spaces, and deeply grounding holistic activities designed to recharge your soul.',
        name: 'DJMV Organic Healing Park',
        category: 'Agri-Tourism',
        image: '/images/djmv/main.jpg',
        desc: 'Hit the reset button on your mind and body at this holistic wellness haven. Championing a chemical-free, slow-living lifestyle, the park invites you to heal and recharge through farm-fresh food, tranquil spaces, and deeply grounding eco-friendly activities.',
        coordinates: [121.26191557028895, 13.257723450711651],
        gallery: ['/images/djmv/1.jpg', '/images/djmv/2.jpg', '/images/djmv/3.jpg', '/images/djmv/4.jpg'],
        facebook: 'https://web.facebook.com/djmvfarm1960',
        phone: '0995 154 1359',
        email: 'djmvfarm12@gmail.com'
    },
    {
        id: 'villa-valerie',
        highlights: 'A beloved local cornerstone famous for its massive swimming pools and famously warm, inviting atmosphere.',
        uniqueHighlight: 'Naujan’s classic, nostalgic resort destination—the ultimate multi-generational gathering spot filled with joyful community memories.',
        name: 'Villa Valerie Resort',
        category: 'Resort',
        image: '/images/valerie/main.jpg',
        desc: 'Create new memories at the classic Naujan resort locals have loved for generations. Known for its massive, inviting swimming pools and famously warm hospitality, Villa Valerie remains the undisputed go-to destination for joyful family gatherings and weekend fun.',
        gallery: ['/images/valerie/1.jpg', '/images/valerie/2.jpg'],
        coordinates: [121.30551630916001, 13.273115341550229],
        facebook: 'https://web.facebook.com/profile.php?id=100083105421531',
        openingHours: '8:00 AM - 10:00 PM',
        entranceFees: '₱100 Adult / ₱80 Kids',
        visitorTips: 'It gets quite popular on weekends, so arrive early to secure a good cottage!'
    },
    {
        id: 'karacha-falls',
        highlights: 'A majestic, dramatic single-drop waterfall featuring powerful cascades and a crystal-clear forest pool.',
        uniqueHighlight: 'The ultimate reward for off-road adventurers: an awe-inspiring hidden cascade plunging into a deep, swimmable, icy basin.',
        name: 'Karacha Falls',
        category: 'Nature',
        image: '/images/karacha/main.jpg',
        desc: 'Embark on an off-road adventure to discover one of Naujan\'s most dramatic natural wonders. Hidden deep within the forest, this towering, single-drop waterfall rewards daring explorers with a spectacular cascade and a deep, icy basin perfect for a wild, refreshing swim.',
        coordinates: [121.15033698134432, 13.18974045547888],
        gallery: ['/images/karacha/1.jpg', '/images/karacha/2.jpg', '/images/karacha/3.jpg', '/images/karacha/4.jpg']
    },
    {
        id: 'oric-sa-bathala',
        highlights: 'An exciting eco-tourism gem featuring a thrilling hanging bridge, horseback rides, and stunning hidden falls.',
        uniqueHighlight: 'A spectacular mini-adventure circuit: conquer a swinging bridge, ride through nature, and cool off under breathtaking waterfalls in one epic trip.',
        name: 'ORIC sa Bathala Waterfalls',
        category: 'Nature',
        image: '/images/bathala/main.jpg',
        desc: 'Answer the call of adventure at this thrilling, up-and-coming eco-tourism hotspot. Test your nerves on a suspended hanging bridge, enjoy a scenic horseback ride, and cap it all off with a cool, well-deserved dip at the stunning hidden waterfalls.',
        coordinates: [121.32986053347372, 13.249813090109098],
        gallery: ['/images/bathala/1.jpg']
    },
    {
        id: 'la-familia-cortijo',
        highlights: 'A highly sophisticated, elegantly rustic venue set amidst exquisitely landscaped gardens and farm views.',
        uniqueHighlight: 'The premier destination for fairytale garden weddings, blending stunning styled architecture with the enchanting backdrop of a working calamansi farm.',
        name: 'La Familia Cortijo & Event Place',
        category: 'Event-Place',
        image: '/images/cortijo/main.jpg',
        desc: 'Celebrate your biggest moments in absolute style at this sophisticated farm venue. Seamlessly blending rustic architectural elegance with perfectly manicured gardens against a working calamansi farm backdrop, it is the premier setting for unforgettable garden weddings and grand events.',
        coordinates: [121.29332313907008, 13.31360065147099],
        gallery: ['/images/cortijo/1.jpg', '/images/cortijo/2.jpg', '/images/cortijo/3.jpg', '/images/cortijo/4.jpg'],
        rent: [
            { name: 'Rent', details: 'Rent the whole area', price: 'Contact them using the links', image: '/images/cortijo/offer.jpg' }
        ],
        facebook: 'https://web.facebook.com/pinoyfleamarket',
        phone: '0966-251-0050'
    },
    {
        id: 'darie-tambayan',
        highlights: 'A friendly, highly convenient road-trip haven offering spotlessly clean and comfortable accommodations.',
        uniqueHighlight: 'The ultimate traveler\'s pitstop right on the highway—perfectly positioned for a quick, exceptionally comfortable recharge during your Mindoro journey.',
        name: 'Darie Tambayan Hotel',
        category: 'Accommodation',
        image: '/images/darie/main.jpg',
        desc: 'Hit the brakes and rest easy at the ultimate road-tripper\'s pitstop. Conveniently located right on the Nautical Highway, Darie Tambayan offers spotlessly clean, comfortable rooms and incredibly friendly service to recharge weary travelers exploring the beauty of Mindoro.',
        coordinates: [121.24395862557884, 13.27465704490922],
        gallery: ['/images/darie/1.jpg', '/images/darie/2.jpg', '/images/darie/3.jpg', '/images/darie/4.jpg'],
        rooms: [
            { name: 'Couple Room', details: 'Good for 2, Free Wifi/Airconditioned, TV Available Netflix and Youtube', price: '₱1,200 / 12hrs', image: '/images/darie/couple.jpg' },
            { name: 'Family/Barkada Room', details: 'Good for 4, air-conditioned', price: '₱1,500 / 12hrs \n ₱2,500 / 24hrs', image: '/images/darie/family.jpg' }
        ],
        facebook: 'https://web.facebook.com/darietambayanhotel',
        phone: '0945 380 9638',
        openingHours: '24/7 Front Desk',
        entranceFees: 'N/A (Room Rates Apply)',
        visitorTips: 'Right along the highway—an easy, hassle-free spot to recharge during a long road trip.'
    },
    {
        id: 'el-caviteno',
        highlights: 'An incredibly affordable, centrally located apartelle serving as the perfect launchpad for backpackers.',
        uniqueHighlight: 'Your ideal, budget-friendly "basecamp" in Estrella, making beach-hopping and exploring local town spots an absolute breeze.',
        name: 'El Caviteño Apartelle',
        category: 'Accommodation',
        image: '/images/el-caviteno.jpg',
        desc: 'Drop your bags and start exploring from this highly convenient backpacker\'s basecamp. Offering superb affordability right in the heart of Brgy. Estrella, it places you just moments away from sun-kissed beaches and Naujan\'s best local landmarks.',
        coordinates: [121.31352692293383, 13.324207214721454],
        rooms: [
            { name: 'Studio Unit', details: 'With kitchenette', price: '₱1,200 / night' },
            { name: 'Family Suite', details: 'Good for 5–6 pax', price: '₱2,000 / night' }
        ],
        openingHours: '24/7 Front Desk',
        entranceFees: 'N/A (Room rates apply)',
        visitorTips: 'Use the kitchenette! Buy fresh seafood at the local Naujan market and cook it yourself.'
    },
    {
        id: 'naujan-travellers-inn',
        highlights: 'A beloved, budget-friendly inn famous for its incredibly popular in-house restobar and hearty Filipino fare.',
        uniqueHighlight: 'The ultimate dine-and-rest combo—enjoy generous, unli-style meals downstairs and crash in absolute comfort upstairs.',
        name: 'Naujan Traveller’s Inn and Resto Bar',
        category: 'Accommodation',
        image: '/images/inn/main.jpg',
        desc: 'Treat yourself to a fantastic night\'s sleep and an even better meal. This beloved highway haven pairs budget-friendly, comfortable rooms with an incredibly popular restobar downstairs, serving up mouth-watering, unli-style Filipino comfort food and ice-cold drinks.',
        coordinates: [121.24275524252755, 13.274613101398995],
        gallery: ['/images/inn/1.jpg', '/images/inn/2.jpg', '/images/inn/3.jpg'],
        rooms: [
            { name: 'Casual Room', details: 'With breakfast, lunch, meal. Free Wifi, unli rice', price: '₱1,800 \n ₱2,300 \n ₱2,600', image: '/images/inn/1.jpg' }
        ],
        menu: [
            { name: 'Mixed Seafoods W/ Unli Rice, Juice', details: 'Unli seafood', price: '₱199 \n ₱299 \n ₱399', image: '/images/inn/puds.jpg' }
        ],
        facebook: 'https://web.facebook.com/NaujanTravellersInn',
        openingHours: '24/7 Front Desk',
        entranceFees: 'N/A (Room rates apply)',
        visitorTips: 'You absolutely cannot miss their unli-rice seafood meals downstairs.'
    },
    {
        id: 'bahay-tuklasan-hall',
        highlights: 'A dynamic, state-of-the-art plenary hall hosting high-energy agricultural congresses and regional events.',
        uniqueHighlight: 'The powerful "thinking hub" of Naujan, shaping the community\'s future through vital agricultural and civic collaborations.',
        name: 'Bahay Tuklasan Plenary Hall',
        category: 'Event-Place',
        image: '/images/bahay-tuklasan-hall.jpg',
        desc: 'Step inside the intellectual hub of Naujan. This dynamic plenary hall is where the community\'s future is shaped, regularly hosting high-energy agricultural congresses, crucial training sessions, and key local events that drive the region forward.',
        coordinates: [121.30076869567007, 13.319883003820582]
    },
    {
        id: 'bahay-tuklasan-dorm',
        highlights: 'A clean, vibrant, and highly practical communal living space tailored for large groups and student trips.',
        uniqueHighlight: 'Purpose-built for camaraderie and convenience, offering the perfect budget-friendly base right next to Naujan’s top training facilities.',
        name: 'Bahay Tuklasan Dormitory',
        category: 'Accommodation',
        image: '/images/dorm/main.jpg',
        desc: 'Find comfort and camaraderie at this incredibly practical, budget-friendly dormitory. Purpose-built for large groups, students, and training attendees, it offers clean, communal living spaces perfectly situated next to the town\'s top agricultural and training facilities.',
        coordinates: [121.30076869567007, 13.319883003820582],
        gallery: ['/images/dorm/1.jpg', '/images/dorm/2.jpg'],
        rooms: [
            { name: 'Dorm Bed', details: 'Shared room, fan', price: '₱5,000 / night', image: '/images/dorm/1.jpg' }
        ],
        openingHours: 'Check-in: 2:00 PM',
        entranceFees: 'N/A (Room Rates Apply)',
        visitorTips: 'Ideal for big student trips or training groups. Book well ahead of local agricultural events.'
    },
    {
        id: 'balay-murraya',
        highlights: 'An impeccably stylish, highly Instagrammable homestay wrapped in the tranquil embrace of surrounding farms.',
        uniqueHighlight: 'Masterfully balances chic, modern interior design with the deep, grounding peace of authentic "probinsya" farm life.',
        name: 'Balay Murraya',
        category: 'Accommodation',
        image: '/images/balai/main.jpg',
        desc: 'Immerse yourself in ‘probinsya’ peace without sacrificing modern style. Surrounded by quiet farms, this highly Instagrammable homestay features thoughtfully curated rooms and exceptional local hospitality, providing a wonderfully chic and cozy base for your Naujan adventures.',
        coordinates: [121.27171220105949, 13.271838002910227],
        gallery: ['/images/balai/1.jpg', '/images/balai/2.jpg', '/images/balai/3.jpg', '/images/balai/4.jpg'],
        facebook: 'https://www.facebook.com/profile.php?id=61566762603706',
        email: 'balaymurraya.ph@gmail.com',
        phone: '+63 915 934 7458',
        rooms: [{ name: 'Silid Bangka', details: 'max 8 adults', price: 'Go to Balay Murraya FB page' },
        { name: 'Silid Lakatan', details: 'max 4 adults', price: 'Go to Balay Murraya FB page' },
        { name: 'Silid Palmera', details: 'max 4 adults', price: 'Go to Balay Murraya FB page' }
        ],
        openingHours: 'Check-in: 2:00 PM | Check-out: 12:00 NN',
        entranceFees: 'N/A (Room Rates Apply)',
        visitorTips: 'Every corner is Instagrammable, so be sure to take photos during the golden hour.'
    },
    {
        id: 'bistro-amparo',
        name: 'Bistro Amparo',
        category: 'Food / Resto',
        coordinates: [121.30076869567007, 13.319883003820582],
    },
    {
        id: 'EUT',
        name: 'Eat, Unwind, Tea (EUT)',
        category: 'Food / Resto',
        coordinates: [121.30076869567007, 13.319883003820582],
    },
    {
        id: 'big-brew',
        name: 'Big Brew',
        category: 'Food / Resto',
        coordinates: [121.30076869567007, 13.319883003820582],
    },
    {
        id: 'sizzling',
        name: 'Sizzling',
        category: 'Food / Resto',
        coordinates: [121.30076869567007, 13.319883003820582],
    },
    {
        id: 'suarez-farm',
        name: 'Suarez Farm',
        category: 'Food / Resto',
        coordinates: [121.30076869567007, 13.319883003820582],
    },
    {
        id: 'melbourne-lomi-house',
        name: 'Melbourne Lomi House',
        category: 'Food / Resto',
        coordinates: [121.30076869567007, 13.319883003820582],
    }
];

// --- Weather API integration (WeatherAPI.com) ---
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'dbeefc9785684901b0c32744260303';
const WEATHER_API_BASE = 'https://api.weatherapi.com/v1';

function httpGetJson(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, res => {
                let data = '';
                res.on('data', chunk => (data += chunk));
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.error) {
                            return reject(new Error(json.error.message || 'Weather API error'));
                        }
                        resolve(json);
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .on('error', reject);
    });
}

async function getWeatherForAttraction(attraction) {
    if (!WEATHER_API_KEY || !attraction || !attraction.coordinates) {
        return null;
    }

    const [lng, lat] = attraction.coordinates;
    const query = encodeURIComponent(`${lat},${lng}`);
    const url = `${WEATHER_API_BASE}/forecast.json?key=${WEATHER_API_KEY}&q=${query}&days=3&aqi=no&alerts=no`;

    try {
        const json = await httpGetJson(url);
        const current = json.current || {};
        const today = (json.forecast && json.forecast.forecastday && json.forecast.forecastday[0]) || {};
        const hours = today.hour || [];

        const bestTime = computeBestVisitTime(hours);

        const forecastDays = (json.forecast && json.forecast.forecastday) ? json.forecast.forecastday.map(day => {
            const dateObj = new Date(day.date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
            return {
                date: dayName,
                icon: `https:${day.day.condition.icon}`,
                maxTemp: Math.round(day.day.maxtemp_c),
                minTemp: Math.round(day.day.mintemp_c)
            };
        }) : [];

        return {
            locationName: json.location ? json.location.name : 'Naujan',
            conditionText: current.condition ? current.condition.text : null,
            icon: current.condition ? `https:${current.condition.icon}` : null,
            tempC: current.temp_c,
            feelsLikeC: current.feelslike_c,
            chanceOfRain: current.chance_of_rain || (today.day && today.day.daily_chance_of_rain),
            bestTimeLabel: bestTime.label,
            bestTimeDetail: bestTime.detail,
            forecastDays: forecastDays
        };
    } catch (err) {
        console.warn('Failed to fetch weather:', err.message);
        return null;
    }
}

function computeBestVisitTime(hours) {
    if (!Array.isArray(hours) || hours.length === 0) {
        return {
            label: 'Anytime today',
            detail: 'Weather details are temporarily unavailable. Plan your visit according to your preferred schedule.'
        };
    }

    const daytime = hours.filter(h => {
        const hour = new Date(h.time).getHours();
        return hour >= 6 && hour <= 18;
    });

    const isGoodHour = h => {
        const text = (h.condition && h.condition.text || '').toLowerCase();
        const notRainy = !text.includes('rain') && !text.includes('thunder') && !text.includes('storm');
        const comfortableTemp = typeof h.temp_c === 'number' ? h.temp_c >= 23 && h.temp_c <= 32 : true;
        const uvOk = typeof h.uv === 'number' ? h.uv <= 9 : true;
        return notRainy && comfortableTemp && uvOk;
    };

    const good = (daytime.length ? daytime : hours).filter(isGoodHour);

    if (!good.length) {
        return {
            label: 'Plan flexibly today',
            detail: 'There may be heat, rain, or storms today. Consider indoor activities or check the sky before heading out.'
        };
    }

    const first = good[0];
    const last = good[good.length - 1];

    const formatTime = h => {
        const d = new Date(h.time);
        let hr = d.getHours();
        const ampm = hr >= 12 ? 'PM' : 'AM';
        hr = hr % 12 || 12;
        return `${hr} ${ampm}`;
    };

    const windowText = first.time === last.time
        ? formatTime(first)
        : `${formatTime(first)} – ${formatTime(last)}`;

    let label = 'Best hours today';
    const firstHour = new Date(first.time).getHours();
    if (firstHour < 9) label = 'Best in the morning';
    else if (firstHour < 15) label = 'Best in the afternoon';
    else label = 'Best in the late afternoon';

    return {
        label,
        detail: `Weather looks most comfortable around ${windowText} based on today’s forecast.`
    };
}

app.get('/', (req, res) => {
    const topByVisits = getAttractionsWithVisits().slice(0, 3);
    res.render('index', {
        title: 'Visit Naujan - Oriental Mindoro',
        featured: topByVisits.length ? topByVisits : attractions.slice(0, 3)
    });
});

app.get('/search', (req, res) => {
    const rawQuery = (req.query.q || '').trim();
    if (!rawQuery) {
        return res.redirect('/explore');
    }
    const searchQuery = rawQuery.toLowerCase();

    const searchResults = attractions.filter(spot =>
        spot.name.toLowerCase().includes(searchQuery) ||
        spot.category.toLowerCase().includes(searchQuery) ||
        spot.desc.toLowerCase().includes(searchQuery)
    ).map(a => ({ ...a, stats: getAttractionStats(a.id) }));

    res.render('explore', {
        title: `Search Results for "${rawQuery}"`,
        attractions: searchResults
    });
});

app.get('/api/search', (req, res) => {
    const searchQuery = (req.query.q || '').toLowerCase();

    if (!searchQuery) {
        return res.json([]);
    }

    const searchResults = attractions.filter(spot =>
        spot.name.toLowerCase().includes(searchQuery) ||
        spot.category.toLowerCase().includes(searchQuery)
    ).map(a => ({ ...a, stats: getAttractionStats(a.id) })).slice(0, 5);

    res.json(searchResults);
});

app.get('/explore', (req, res) => {
    res.render('explore', {
        title: 'Explore Naujan',
        attractions: attractions.map(a => ({ ...a, stats: getAttractionStats(a.id) }))
    });
});

app.get('/map', (req, res) => {
    res.render('map', {
        title: 'Weather Map - Visit Naujan',
        attractions: attractions.map(a => ({ ...a, stats: getAttractionStats(a.id) }))
    });
});

app.get('/api/weather/:id', async (req, res) => {
    const attraction = attractions.find(a => a.id === req.params.id);
    if (!attraction) {
        return res.status(404).json({ error: 'Attraction not found' });
    }
    const weather = await getWeatherForAttraction(attraction);
    res.json(weather || { error: 'Weather unavailable' });
});

app.get('/api/weather/coords/:lat/:lng', async (req, res) => {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);

    const customLocation = { coordinates: [lng, lat] };

    const weather = await getWeatherForAttraction(customLocation);
    res.json(weather || { error: 'Weather unavailable' });
});

app.get('/attraction/:id', async (req, res) => {
    const attraction = attractions.find(a => a.id === req.params.id);

    if (!attraction) {
        return res.status(404).render('404', { title: 'Not Found' });
    }

    // AWAIT added here
    await recordVisit(req.params.id);

    const weather = await getWeatherForAttraction(attraction);
    const stats = getAttractionStats(attraction.id);

    res.render('attraction', {
        title: `${attraction.name} - Visit Naujan`,
        attraction: attraction,
        mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || '',
        weather,
        stats
    });
});

app.post('/api/rate/:id', async (req, res) => {
    const id = req.params.id;
    const attraction = attractions.find(a => a.id === id);
    if (!attraction) return res.status(404).json({ error: 'Not found' });

    const rating = parseInt(req.body.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating' });
    }

    if (!favData[id]) favData[id] = { favorites: 0, ratingSum: 0, ratingCount: 0 };
    favData[id].ratingSum += rating;
    favData[id].ratingCount += 1;
    
    // AWAIT added here
    await saveFavs();

    res.json(getAttractionStats(id));
});

app.post('/api/favorite/:id', async (req, res) => {
    const id = req.params.id;
    const attraction = attractions.find(a => a.id === id);
    if (!attraction) return res.status(404).json({ error: 'Not found' });

    const action = req.body.action; // "add" or "remove"
    if (!favData[id]) favData[id] = { favorites: 0, ratingSum: 0, ratingCount: 0 };

    if (action === 'add') {
        favData[id].favorites += 1;
    } else if (action === 'remove') {
        favData[id].favorites = Math.max(0, favData[id].favorites - 1);
    }

    // AWAIT added here
    await saveFavs();
    
    res.json(getAttractionStats(id));
});

app.get('/dashboard', (req, res) => {
    // Add these headers to prevent caching on Vercel and the browser
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const attractionsWithVisits = getAttractionsWithVisits();
    const totalVisits = attractionsWithVisits.reduce((sum, a) => sum + a.visits, 0);
    res.render('dashboard', {
        title: 'Analytics Dashboard - Visit Naujan',
        attractionsWithVisits,
        totalVisits,
        lastResetAt
    });
});

app.post('/dashboard/reset', async (req, res) => {
    console.log('Received POST /dashboard/reset');
    // AWAIT added back. While awaiting might have caused local hangs before, 
    // it is necessary on Vercel to ensure the operation completes.
    await resetVisits();
    res.redirect('/dashboard');
});

app.post('/dashboard/reset-favs', async (req, res) => {
    console.log('Received POST /dashboard/reset-favs');
    // AWAIT added back.
    await resetFavs();
    res.redirect('/dashboard');
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Naujan Tourism Site running at http://localhost:${port}`);
    });
}

// Required for Vercel to recognize the Express app
module.exports = app;
