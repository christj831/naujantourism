require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Mock Data: Real spots in Naujan, Oriental Mindoro
const attractions = [
    { 
        id: 'naujan-lake',
        name: 'Naujan Lake National Park', 
        category: 'Nature', 
        image: '/images/lake.jpg', 
        desc: 'As the fifth largest lake in the Philippines, this expansive biodiversity hotspot is a sanctuary for migratory birds and endemic wildlife. Visitors can enjoy serene boat rides across its glass-like waters, framed by lush mountain ranges and breathtaking sunsets.',
        coordinates: [121.32143932976706, 13.164128472005663]
    },
    { 
        id: 'simbahang-bato',
        name: 'Simbahang Bato (Bancuro Ruins)', 
        category: 'Heritage', 
        image: '/images/simbahan/main.jpg',
        desc: 'A hauntingly beautiful relic of the Spanish era, these 17th-century coral and adobe ruins house a "church within a church." Originally built as a fortress against raids, it now serves as a unique open-air sanctuary where history and faith converge among moss-covered walls.',
        coordinates: [121.32184698287517, 13.281370180034118],
        gallery: ['/images/simbahan/1.jpg']
    },
    { 
        id: 'liwasang-bonifacio',
        name: 'Liwasang Bonifacio', 
        category: 'Leisure', 
        image: '/images/liwasang.jpg',
        desc: 'The vibrant heart of Naujan, this public plaza is a gathering spot for locals and visitors alike. With its manicured greenery and open spaces, it is the perfect place for rhythmic afternoon strolls, community festivals, and experiencing the town’s warm social atmosphere.',
        coordinates: [121.3030, 13.3242]
    },
    {
        id: 'dao-waterlily-minipark',
        name: 'Dao Waterlily Minipark',
        category: 'Nature',
        image: '/images/waterlily/main.jpg',
        desc: 'A picturesque eco-park where vibrant water lilies blanket the water’s surface. Beyond the scenic boat rides, the park is a hub for community craftsmanship, where local artisans transform dried water lily stalks into intricate, sustainable bags and fashion accessories.',
        coordinates: [121.31942065376933, 13.2567513208881],
        gallery: ['/images/waterlily/1.jpg', '/images/waterlily/2.jpg', '/images/waterlily/3.jpg']
    },
    {
        id: 'montelago-hot-spring',
        name: 'Montelago Hot Spring & Forest Falls',
        category: 'Nature',
        image: '/images/hotspring/main.jpg',
        desc: 'Nestled along the geothermal veins of the region, Montelago offers therapeutic warm mineral pools perfect for relaxation. The site also features refreshing forest falls and guided treks that showcase the rugged, volcanic beauty of the Naujan Lake shoreline.',
        coordinates: [121.37576057128022, 13.222410474261634],
        gallery: ['/images/hotspring/1.jpg']
    },
    {
        id: 'agrigold-farm',
        name: 'AgriGold Farm Learning Center Inc.',
        category: 'Agri-Tourism',
        image: '/images/agrigold/main.jpg',
        desc: 'An educational sanctuary for modern farmers and eco-enthusiasts. This certified learning site provides immersive workshops on sustainable organic agriculture, poultry management, and innovative farming techniques designed to empower the local community.',
        coordinates: [121.25798077115141, 13.2533426861691],
        gallery: ['/images/agrigold/1.jpg', '/images/agrigold/2.jpg', '/images/agrigold/3.jpg']
    },
    {
        id: 'celeste-beach-house',
        name: 'Celeste Beach House',
        category: 'Resort',
        image: '/images/celeste/main.jpg',
        desc: 'Escape the crowds at this intimate beachfront retreat in Brgy. Estrella. Featuring a laid-back, "home-away-from-home" vibe, it offers direct access to the sea and calm waters, making it an ideal choice for family reunions and quiet coastal holidays.',
        coordinates: [121.31222816936804, 13.32851830943331],
        gallery: ['/images/celeste/1.jpg', '/images/celeste/2.jpg'],
        rooms: [
            { name: 'Duplex Guest Room', details: 'Good for 6, fan room', price: '₱800 / night', image: '/images/celeste/duplex.jpg'}
        ],
        facebook: 'https://web.facebook.com/profile.php?id=61573655720760'
    },
    {
        id: 'largo-castillo-farm',
        name: 'Largo Castillo Farm House',
        category: 'Agri-Tourism',
        image: '/images/largo/main.jpg',
        desc: 'A rustic getaway that champions eco-consciousness through creative recycling and natural living. Located in the quiet fields of Nag-Iba 1, this farmhouse provides a sprawling green space for private events, birthday celebrations, and peaceful farm-to-table experiences.',
        coordinates: [121.27758068131465, 13.333447596743362],
        gallery: ['/images/largo/1.jpg' , '/images/largo/2.jpg', '/images/largo/3.jpg']
    },
    {
        id: 'nabul-beach-resort',
        name: 'Nabul Beach Resort',
        category: 'Resort',
        image: '/images/nabul/main.jpg',
        desc: 'Defined by its simple charm and native kubo cottages, Nabul is a favorite for day-trippers. With clear, shallow waters and a gentle sea breeze, it provides a classic Filipino seaside picnic experience for those looking to unwind without the frills.',
        coordinates: [121.34785867159911, 13.292433044845254]
    },
    {
        id: 'villa-cornitz',
        name: 'Villa Cornitz Mini Resort',
        category: 'Resort',
        image: '/images/cornitz/1.jpg',
        desc: 'A hidden gem in Adrialuna, this mini resort specializes in intimate gatherings. With its well-maintained swimming pools and open-air cabanas, it is a local favorite for family reunions, birthdays, and quick weekend dips.',
        coordinates: [121.28569607104512, 13.212265618761423],
        gallery: ['/images/cornitz/1.jpg', '/images/cornitz/2.jpg', '/images/cornitz/3.jpg', '/images/cornitz/4.jpg']
    },
    {
        id: 'la-hacienda',
        name: 'La Hacienda',
        category: 'Resort',
        image: '/images/hacienda/main.jpg',
        desc: 'Transport yourself to Indonesia at this Balinese-inspired private oasis. Featuring elegantly designed themed villas, tropical gardens, and a centerpiece pool, La Hacienda offers a luxurious and serene escape in the heart of the countryside.',
        coordinates: [121.30584297294946, 13.317016887351807],
        gallery: ['/images/hacienda/1.jpg', '/images/hacienda/2.jpg', '/images/hacienda/3.jpg', '/images/hacienda/4.jpg', '/images/hacienda/5.jpg']
    },
    {
        id: 'villa-catalina',
        name: 'Villa Catalina Eco Farm Resort',
        category: 'Resort',
        image: '/images/catalina/main.jpg',
        desc: 'Blending agricultural charm with resort leisure, Villa Catalina offers a wholesome environment for nature lovers. Explore the lush surroundings of Buhangin Road or simply relax in a family-friendly space designed to reconnect guests with the outdoors.',
        coordinates: [121.27171983311774, 13.309237043724876],
        gallery: ['/images/catalina/1.jpg', '/images/catalina/2.jpg'],
        facebook: 'https://web.facebook.com/VillaCatalinaEcoFarmResort'
    },
    {
        id: 'benilda-ng-bancuro',
        name: 'Benilda ng Bancuro Resort & Restaurant',
        category: 'Resort',
        image: '/images/benilda.jpg',
        desc: 'A sprawling leisure destination famous for its vibrant atmosphere and diverse activities. From its slide-equipped swimming pools and butterfly sanctuary to horseback riding and the iconic "Three Wise Monkeys" statues, it offers endless fun for all ages.',
        coordinates: [121.3225, 13.2795],
        facebook: 'https://web.facebook.com/BenildaResort'
    },
    {
        id: '333-steps',
        name: '333 Steps (Melgar A)',
        category: 'Nature',
        image: '/images/333-steps.jpg',
        desc: 'A rewarding pilgrimage of faith and fitness. The climb up 333 concrete steps takes you through lush vegetation, culminating in a hilltop view that offers a spellbinding panorama of the rolling Melgar landscape and the shimmering coastline.',
        coordinates: [121.35578622557868, 13.275250119249757]
    },
    {
        id: 'naujan-agri-center',
        name: 'Naujan Agricultural Center',
        category: 'Agri-Tourism',
        image: '/images/naujan-agri.jpg',
        desc: 'The backbone of the town’s agricultural innovation, this government-led facility is a vital hub for research and development. It provides farmers with access to essential services, modern training programs, and sustainable food production strategies.',
        coordinates: [121.3005, 13.3230]
    },
    {
        id: 'hafa-adai',
        name: 'Hafa Adai',
        category: 'Leisure',
        image: '/images/hafa-adai.jpg',
        desc: 'Borrowing its name from the friendly Chamorro greeting, this coastal spot in Estrella offers a refreshing seaside dining experience. It is the perfect place to enjoy the sea breeze while sampling local delicacies with an unobstructed view of the horizon.',
        coordinates: [121.31022214428944, 13.331900799869143]
    },
    {
        id: 'emerald-resort',
        name: 'Emerald Resort',
        category: 'Resort',
        image: '/images/emerald.jpg',
        desc: 'Situated along the pristine shoreline of Brgy. Estrella, Emerald Resort offers spacious accommodations and tranquil beachfront access. It is highly recommended for large group outings and family staycations seeking a peaceful oceanfront boundary.',
        coordinates: [121.3134430221171, 13.323650337442288]
    },
    {
        id: 'mulawin-boulevard',
        name: 'Mulawin Boulevard',
        category: 'Landmark',
        image: '/images/mulawin.jpg',
        desc: 'More than just a thoroughfare, Mulawin Boulevard represents the modern growth of Naujan. This scenic route serves as a key link between neighborhoods, offering a glimpse into the town’s developing infrastructure and local daily life.',
        coordinates: [121.13913740674923, 13.236412504363686]
    },
    {
        id: 'mais-place',
        name: 'Mai’s Place Private Pool',
        category: 'Resort',
        image: '/images/mai/main.jpg',
        desc: 'An exclusive retreat perfect for those who value privacy. Mai’s Place features a clean, modern private pool and an intimate dining area, making it a top choice for "staycations," small birthday parties, and quiet evening dips.',
        coordinates: [121.312303, 13.31945],
        gallery: ['/images/mai/1.jpg', '/images/mai/2.jpg', '/images/mai/3.jpg', '/images/mai/4.jpg', '/images/mai/5.jpg'],
        facebook: 'https://web.facebook.com/profile.php?id=100075758085120'
    },
    {
        id: 'rio-del-sierra',
        name: 'Rio del Sierra',
        category: 'Nature',
        image: '/images/rio-del-sierra.jpg',
        desc: 'A hidden riverside sanctuary in Sitio Sili where the water is always cold and refreshing. Surrounded by majestic mountain views, guests can lounge in native kubo huts and enjoy the rhythmic sounds of the flowing river in a truly raw, natural setting.',
        coordinates: [121.08257645610377, 13.275679230651638]
    },
    {
        id: 'organic-healing-park',
        name: 'DJMV Organic Healing Park',
        category: 'Agri-Tourism',
        image: '/images/djmv/main.jpg',
        desc: 'A unique destination focused on wellness and sustainability. This organic park promotes a "healing" lifestyle through chemical-free farming, eco-friendly practices, and a tranquil environment designed to soothe the mind and body.',
        coordinates: [121.26191557028895, 13.257723450711651],
        gallery: ['/images/djmv/1.jpg', '/images/djmv/2.jpg', '/images/djmv/3.jpg', '/images/djmv/4.jpg'],
        facebook: 'https://web.facebook.com/djmvfarm1960',
        phone: '0995 154 1359',
        email: 'djmvfarm12@gmail.com'

    },
    {
        id: 'villa-valerie',
        name: 'Villa Valerie Resort',
        category: 'Resort',
        image: '/images/valerie/main.jpg',
        desc: 'A cornerstone of local leisure, Villa Valerie is known for its spacious swimming pools and hospitable atmosphere. It remains one of the most popular venues for community celebrations, school outings, and family weekend activities.',
        gallery: ['/images/valerie/1.jpg', '/images/valerie/2.jpg'],
        coordinates: [121.30551630916001, 13.273115341550229],
        facebook: 'https://web.facebook.com/profile.php?id=100083105421531'
    },
    {
        id: 'karacha-falls',
        name: 'Karacha Falls',
        category: 'Nature',
        image: '/images/karacha/main.jpg',
        desc: 'For the adventurous soul, Karacha Falls offers a majestic reward after an off-road journey through Malvar. This towering waterfall features powerful cascades and a deep, refreshing pool perfect for a cool swim in the heart of the forest.',
        coordinates: [121.15033698134432, 13.18974045547888],
        gallery: ['/images/karacha/1.jpg', '/images/karacha/2.jpg', '/images/karacha/3.jpg', '/images/karacha/4.jpg']
    },
    {
        id: 'oric-sa-bathala',
        name: 'ORIC sa Bathala Waterfalls',
        category: 'Nature',
        image: '/images/bathala/main.jpg',
        desc: 'An emerging eco-tourism star in Sitio Bathala, this site features a thrilling hanging bridge crossing and the option to reach the falls on horseback. It is a must-visit for those looking to explore the untapped natural beauty of Naujan.',
        coordinates: [121.32986053347372, 13.249813090109098],
        gallery: ['/images/bathala/1.jpg']
    },
    {
        id: 'la-familia-cortijo',
        name: 'La Familia Cortijo & Event Place',
        category: 'Event-Place',
        image: '/images/cortijo/main.jpg',
        desc: 'A sophisticated farm-style venue that blends rustic elegance with modern amenities. With its beautifully landscaped gardens, calamansi farm backdrop, and dedicated events hall, it is the premier choice for weddings and grand reunions in Brgy. Santiago.',
        coordinates: [121.29332313907008, 13.31360065147099],
        gallery: ['/images/cortijo/1.jpg', '/images/cortijo/2.jpg', '/images/cortijo/3.jpg', '/images/cortijo/4.jpg'],
        rent: [
            { name: 'Rent', details: 'Rent the whole area', price: 'Contact them using the links', image: '/images/cortijo/offer.jpg'}
        ],
        facebook: 'https://web.facebook.com/pinoyfleamarket',
        phone: '0966-251-0050'
    },
    {
        id: 'darie-tambayan',
        name: 'Darie Tambayan Hotel',
        category: 'Accommodation',
        image: '/images/darie/main.jpg',
        desc: 'Strategically located along the Nautical Highway, this guesthouse is the perfect pitstop for weary travelers. It offers friendly service and clean, basic accommodations for those exploring the wider Mindoro province or passing through Naujan.',
        coordinates: [121.24395862557884, 13.27465704490922],
        gallery: ['/images/darie/1.jpg', '/images/darie/2.jpg', '/images/darie/3.jpg', '/images/darie/4.jpg'],
        rooms: [
            { name: 'Couple Room', details: 'Good for 2, Free Wifi/Airconditioned, TV Available Netflix and Youtube', price: '₱1,200 / 12hrs', image: '/images/darie/couple.jpg' },
            { name: 'Family/Barkada Room', details: 'Good for 4, air-conditioned', price: '₱1,500 / 12hrs \n ₱2,500 / 24hrs', image: '/images/darie/family.jpg' }
        ],
        facebook: 'https://web.facebook.com/darietambayanhotel',
        phone: '0945 380 9638'
    },
    {
        id: 'el-caviteno',
        name: 'El Caviteño Apartelle',
        category: 'Accommodation',
        image: '/images/el-caviteno.jpg',
        desc: 'Providing affordable and accessible lodging in Brgy. Estrella, this apartelle is designed for short-term guests and backpackers. Its central location makes it a convenient home base for visiting nearby beaches and local landmarks.',
        coordinates: [121.31352692293383, 13.324207214721454],
        rooms: [
            { name: 'Studio Unit', details: 'With kitchenette', price: '₱1,200 / night' },
            { name: 'Family Suite', details: 'Good for 5–6 pax', price: '₱2,000 / night' }
        ]
    },
    {
        id: 'naujan-travellers-inn',
        name: 'Naujan Traveller’s Inn and Resto Bar',
        category: 'Accommodation',
        image: '/images/inn/main.jpg',
        desc: 'Combining comfort with local flavor, this inn in Barcenaga is a popular stop for road-trippers. Beyond its budget-friendly rooms, the on-site restobar is known for serving hearty Filipino comfort food and ice-cold refreshments.',
        coordinates: [121.24275524252755, 13.274613101398995],
        gallery: ['/images/inn/1.jpg', '/images/inn/2.jpg', '/images/inn/3.jpg'],
        rooms: [
            { name: 'Casual Room', details: 'With breakfast, lunch, meal. Free Wifi, unli rice', price: '₱1,800 \n ₱2,300 \n ₱2,600', image: '/images/inn/1.jpg'}
        ],
        menu: [
            { name: 'Mixed Seafoods W/ Unli Rice, Juice', details: 'Unli seafood', price: '₱199 \n ₱299 \n ₱399', image: '/images/inn/puds.jpg' }
        ],
        facebook: 'https://web.facebook.com/NaujanTravellersInn'
    },
    {
        id: 'bahay-tuklasan-hall',
        name: 'Bahay Tuklasan Plenary Hall',
        category: 'Event-Place',
        image: '/images/bahay-tuklasan-hall.jpg',
        desc: 'A cornerstone for community development, this plenary hall hosts significant regional training sessions and agricultural congresses. It serves as a vital venue for local government initiatives and public sector gatherings.',
        coordinates: [121.30076869567007, 13.319883003820582]
    },
    {
        id: 'bahay-tuklasan-dorm',
        name: 'Bahay Tuklasan Dormitory',
        category: 'Accommodation',
        image: '/images/dorm/main.jpg',
        desc: 'Offering practical and budget-friendly shared quarters, this dormitory is ideal for students, NGO volunteers, and large groups. It provides a clean, communal living space close to the town’s key training and agricultural facilities.',
        coordinates: [121.30076869567007, 13.319883003820582],
        gallery: ['/images/dorm/1.jpg', '/images/dorm/2.jpg'],
        rooms: [
            { name: 'Dorm Bed', details: 'Shared room, fan', price: '₱5,000 / night', image: '/images/dorm/1.jpg'}
        ]
    },
    {
        id: 'balay-murraya',
        name: 'Balay Murraya',
        category: 'Accommodation',
        image: '/images/balai/main.jpg',
        desc: 'Offering practical and budget-friendly shared quarters, this dormitory is ideal for students, NGO volunteers, and large groups. It provides a clean, communal living space close to the town’s key training and agricultural facilities.',
        coordinates: [121.27171220105949, 13.271838002910227],
        gallery: ['/images/balai/1.jpg', '/images/balai/2.jpg', '/images/balai/3.jpg', '/images/balai/4.jpg'],
        facebook: 'https://www.facebook.com/profile.php?id=61566762603706',
        email: 'balaymurraya.ph@gmail.com',
        phone: '+63 915 934 7458',
        rooms: [{name: 'Silid Bangka', details: 'max 8 adults', price: 'Go to Balay Murraya FB page'},
            {name: 'Silid Lakatan', details: 'max 4 adults', price: 'Go to Balay Murraya FB page'},
            {name: 'Silid Palmera', details: 'max 4 adults', price: 'Go to Balay Murraya FB page'}
        ]
    }
];

// 1. Home Page (Hero Video/Banner style)
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Visit Naujan - Oriental Mindoro',
        featured: attractions.slice(0, 3) // Show top 3 on home
    });
});

// 3. Search Route  
app.get('/search', (req, res) => {
    // Get the search term from the URL (e.g., ?q=lake)
    const searchQuery = req.query.q.toLowerCase();

    // Filter the attractions array based on name, category, or description
    const searchResults = attractions.filter(spot => 
        spot.name.toLowerCase().includes(searchQuery) || 
        spot.category.toLowerCase().includes(searchQuery) ||
        spot.desc.toLowerCase().includes(searchQuery)
    );

    // Render the explore page, but ONLY pass the filtered results
    res.render('explore', { 
        title: `Search Results for "${req.query.q}"`, 
        attractions: searchResults 
    });
});

// API Route for Live Search Dropdown
app.get('/api/search', (req, res) => {
    // Get the typed letters
    const searchQuery = (req.query.q || '').toLowerCase();
    
    // If the input is empty, return an empty array
    if (!searchQuery) {
        return res.json([]);
    }

    // Filter the attractions and limit to the top 5 results
    const searchResults = attractions.filter(spot => 
        spot.name.toLowerCase().includes(searchQuery) || 
        spot.category.toLowerCase().includes(searchQuery)
    ).slice(0, 5); 

    // Send the results back as JSON data
    res.json(searchResults);
});

// 2. Explore Page (Grid of all spots)
app.get('/explore', (req, res) => {
    res.render('explore', { 
        title: 'Explore Naujan', 
        attractions: attractions 
    });
});

app.get('/attraction/:id', (req, res) => {
    const attraction = attractions.find(a => a.id === req.params.id);
    
    if (!attraction) {
        return res.status(404).render('404', { title: 'Not Found' });
    }

    res.render('attraction', { 
        title: `${attraction.name} - Visit Naujan`,
        attraction: attraction,
        mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || ''
    });
});

app.listen(port, () => {
    console.log(`Naujan Tourism Site running at http://localhost:${port}`);
});
