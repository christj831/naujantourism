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
        desc: 'The fifth largest lake in the Philippines, teeming with wildlife and serene views.',
        coordinates: [121.32143932976706, 13.164128472005663],
        gallery: ['/images/benilda.jpg', '/images/liwasang.jpg', '/images/simbahang-bato.jpg', '/images/lake.jpg']
    },
    { 
        id: 'simbahang-bato',
        name: 'Simbahang Bato (Bancuro Ruins)', 
        category: 'Heritage', 
        image: '/images/simbahang-bato.jpg',
        desc: 'Built circa 1680, these coral and adobe ruins feature a "church within a church." Once a fortress against raids, it now stands as a testament to Naujeño devotion.',
        coordinates: [121.32184698287517, 13.281370180034118]
    },
    { 
        id: 'liwasang-bonifacio',
        name: 'Liwasang Bonifacio', 
        category: 'Leisure', 
        image: '/images/liwasang.jpg',
        desc: 'The heart of the town, perfect for afternoon strolls and local events.',
        coordinates: [121.3030, 13.3242]
    },
    {
        id: 'dao-waterlily-minipark',
        name: 'Dao Waterlily Minipark',
        category: 'Nature',
        image: '/images/waterlily/main.jpg',
        desc: 'A peaceful park featuring blooming water lilies and boat rides. Local artisans here craft eco-friendly bags and wallets from dried water lily stalks.',
        coordinates: [121.31942065376933, 13.2567513208881],
        gallery: ['/images/waterlily/1.jpg', '/images/waterlily/2.jpg', '/images/waterlily/3.jpg']
    },
    {
        id: 'montelago-hot-spring',
        name: 'Montelago Hot Spring & Forest Falls',
        category: 'Nature',
        image: '/images/hotspring/main.jpg',
        desc: 'Also known as Pungao Hot Spring, this volcanic site offers therapeutic warm mineral waters and guided nature walks along the shores of Naujan Lake.',
        coordinates: [121.37576057128022, 13.222410474261634],
        gallery: ['/images/hotspring/1.jpg']
    },
    {
        //not yet finished
        id: 'agrigold-farm',
        name: 'AgriGold Farm Learning Center Inc.',
        category: 'Agri-Tourism',
        image: '/images/agrigold/main.jpg',
        desc: 'A certified Learning Site for Agriculture (LSA) in Pinagsabangan I that promotes sustainable farming practices and community agricultural training.',
        coordinates: [121.25798077115141, 13.2533426861691],
        gallery: ['/images/agrigold/1.jpg', '/images/agrigold/2.jpg', '/images/agrigold/3.jpg']
    },
    {
        id: 'celeste-beach-house',
        name: 'Celeste Beach House',
        category: 'Resort',
        image: '/images/celeste.jpg',
        desc: 'A quiet beachfront resort in Brgy. Estrella offering a laid-back vibe and direct ocean access, ideal for families seeking a calm seaside getaway.',
        coordinates: [121.31222816936804, 13.32851830943331]
    },
    {
        id: 'largo-castillo-farm',
        name: 'Largo Castillo Farm House',
        category: 'Agri-Tourism',
        image: '/images/largo/main.jpg',
        desc: 'An eco-conscious farm in Nag-Iba 1 that promotes recycling. It provides a peaceful nature escape perfect for birthdays and small celebrations.',
        coordinates: [121.27758068131465, 13.333447596743362,],
        gallery: ['/images/largo/1.jpg' , '/images/largo/2.jpg', '/images/largo/3.jpg']
    },
    {
        id: 'nabul-beach-resort',
        name: 'Nabul Beach Resort',
        category: 'Resort',
        image: '/images/nabul.jpg',
        desc: 'A modest day-tour destination in San Jose known for clear waters and native kubo cottages. Perfect for quick weekend breaks and seaside picnics.',
        coordinates: [121.3400, 13.3700]
    },
    {
        //not yet finished
        id: 'villa-cornitz',
        name: 'Villa Cornitz Mini Resort',
        category: 'Resort',
        image: '/images/cornitz/main.jpg',
        desc: 'A local mini resort in Adrialuna offering swimming pools and open cottages for family reunions and simple leisure activities.',
        coordinates: [121.2920, 13.3050]
    },
    {
        id: 'la-hacienda',
        name: 'La Hacienda',
        category: 'Resort',
        image: '/images/la-hacienda.jpg',
        desc: 'A Balinese-inspired private resort in Brgy. Bancuro featuring elegant themed villas, lush gardens, and a large pool for a serene countryside escape.',
        coordinates: [121.3180, 13.2800]
    },
    {
        id: 'villa-catalina',
        name: 'Villa Catalina Eco Farm Resort',
        category: 'Resort',
        image: '/images/villa-catalina.jpg',
        desc: 'A nature-oriented eco-farm along Buhangin Road. It offers a relaxed, family-friendly environment for those who want to connect with the outdoors.',
        coordinates: [121.3100, 13.3400]
    },
    {
        id: 'benilda-ng-bancuro',
        name: 'Benilda ng Bancuro Resort & Restaurant',
        category: 'Resort',
        image: '/images/benilda.jpg',
        desc: 'A massive resort featuring a slide-equipped pool, a butterfly sanctuary, and horseback riding. Notable for its "Three Wise Monkeys" statues.',
        coordinates: [121.3225, 13.2795]
    },
    {
        id: '333-steps',
        name: '333 Steps (Melgar A)',
        category: 'Nature',
        image: '/images/333-steps.jpg',
        desc: 'A journey of faith and perseverance in Melgara. The climb rewards visitors with a spellbinding vista of rolling landscapes and the glittering sea.',
        coordinates: [121.3605, 13.2450]
    },
    {
        //not yet finished
        id: 'naujan-agri-center',
        name: 'Naujan Agricultural Center',
        category: 'Agri-Tourism',
        image: '/images/naujan-agri.jpg',
        desc: 'A local government facility that serves as a hub for farmers, providing essential services, training, and programs to support food production.',
        coordinates: [121.3005, 13.3230]
    },
    {
        id: 'hafa-adai',
        name: 'Hafa Adai',
        category: 'Leisure',
        image: '/images/hafa-adai.jpg',
        desc: 'A relaxing seaside spot in Brgy. Estrella where visitors can enjoy fresh ocean air, scenic views, and coastal dining.',
        coordinates: [121.31022214428944, 13.331900799869143]
    },
    {
        //not yet finished
        id: 'emerald-resort',
        name: 'Emerald Resort',
        category: 'Resort',
        image: '/images/emerald.jpg',
        desc: 'A peaceful beachfront getaway in Estrella offering comfortable accommodations and spacious areas for family bonding and group outings.',
        coordinates: [121.3385, 13.3560]
    },
    {
        id: 'mulawin-boulevard',
        name: 'Mulawin Boulevard',
        category: 'Landmark',
        image: '/images/mulawin.jpg',
        desc: 'A key access route and neighborhood thoroughfare in Brgy. Mulawin, reflecting the ongoing infrastructure development of the town.',
        coordinates: [121.2900, 13.3000]
    },
    {
        id: 'mais-place',
        name: 'Mai’s Place Private Pool',
        category: 'Resort',
        image: '/images/mais-place.jpg',
        desc: 'A cozy leisure venue offering a private pool and on-site dining. Ideal for intimate gatherings and weekend staycations.',
        coordinates: [121.3010, 13.3280]
    },
    {
        id: 'rio-del-sierra',
        name: 'Rio del Sierra',
        category: 'Nature',
        image: '/images/rio-del-sierra.jpg',
        desc: 'A serene river destination in Sitio Sili featuring refreshing cold waters, native kubo huts, and peaceful mountain views.',
        coordinates: [121.3700, 13.2600]
    },
    {
        id: 'organic-healing-park',
        name: 'DJMV Organic Healing Park',
        category: 'Agri-Tourism',
        image: '/images/djmv.jpg',
        desc: 'An organic farm in Pinagsabangan I dedicated to sustainable agriculture and eco-friendly practices in a relaxing natural environment.',
        coordinates: [121.2950, 13.3150]
    },
    {
        id: 'villa-valerie',
        name: 'Villa Valerie Resort',
        category: 'Resort',
        image: '/images/villa-valerie.jpg',
        desc: 'A popular local venue for birthdays and outings, featuring swimming pools and open cottages for quality time with family and friends.',
        coordinates: [121.3070, 13.3320]
    },
    {
        id: 'karacha-falls',
        name: 'Karacha Falls',
        category: 'Nature',
        image: '/images/karacha.jpg',
        desc: 'A majestic, towering waterfall in Malvar reached via off-road tracks. Features a swimmable stream and refreshing cascades.',
        coordinates: [121.3800, 13.2100]
    },
    {
        //not yet finished
        id: 'oric-sa-bathala',
        name: 'ORIC sa Bathala Waterfalls',
        category: 'Nature',
        image: '/images/oric.jpg',
        desc: 'An emerging summer destination in Sitio Bathala. The trip features a famous hanging bridge and optional horse rides to the falls.',
        coordinates: [121.3750, 13.2350]
    },
    {
        id: 'la-familia-cortijo',
        name: 'La Familia Cortijo & Event Place',
        category: 'Events',
        image: '/images/la-familia.jpg',
        desc: 'A scenic farm-style venue in Brgy. Santiago with landscaped gardens, a pool, and a calamansi farm. Perfect for weddings and reunions.',
        coordinates: [121.3120, 13.3400]
    },
    {
        id: 'darie-tambayan',
        name: 'Darie Tambayan Hotel',
        category: 'Accommodation',
        image: '/images/darie.jpg',
        desc: 'A friendly guesthouse-style lodging located along the Nautical Highway, offering basic accommodations for travelers exploring Mindoro.',
        coordinates: [121.3055, 13.3260]
    },
    {
        id: 'el-caviteno',
        name: 'El Caviteño Apartelle',
        category: 'Accommodation',
        image: '/images/el-caviteno.jpg',
        desc: 'Affordable and accessible rooms in Brgy. Estrella, suitable for short-term guests and travelers visiting nearby attractions.',
        coordinates: [121.31352692293383, 13.324207214721454]
    },
    {
        id: 'naujan-travellers-inn',
        name: 'Naujan Traveller’s Inn and Resto Bar',
        category: 'Accommodation',
        image: '/images/travellers-inn.jpg',
        desc: 'A convenient inn in Barcenaga featuring affordable rooms and an on-site restobar serving classic Filipino dishes.',
        coordinates: [121.2990, 13.3190]
    },
    {
        id: 'bahay-tuklasan-hall',
        name: 'Bahay Tuklasan Plenary Hall',
        category: 'Events',
        image: '/images/bahay-tuklasan-hall.jpg',
        desc: 'A public conference venue in Brgy. Santiago used for community training, agricultural congresses, and local government events.',
        coordinates: [121.30076869567007, 13.319883003820582]
    },
    {
        //not yet finished
        id: 'bahay-tuklasan-dorm',
        name: 'Bahay Tuklasan Dormitory',
        category: 'Accommodation',
        image: '/images/bahay-tuklasan-dorm.jpg',
        desc: 'Budget-friendly shared quarters near the Plenary Hall, ideal for students, volunteers, and groups visiting Naujan on a budget.',
        coordinates: [121.3125, 13.3415]
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
