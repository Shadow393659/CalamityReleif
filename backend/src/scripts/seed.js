require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { User, DistressRequest, ResourceInventory, ReliefCamp } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/noor_disaster_db';

const seedDatabase = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Database connection established.');

    console.log('[Seed] Purging existing disaster collections...');
    await Promise.all([
      User.deleteMany({}),
      DistressRequest.deleteMany({}),
      ResourceInventory.deleteMany({}),
      ReliefCamp.deleteMany({}),
    ]);
    console.log('[Seed] Existing collections cleared.');

    // ==========================================
    // 1. SEED USERS & ORGANIZATIONS
    // ==========================================
    console.log('[Seed] Seeding Users and Emergency Responders...');
    const usersData = [
      {
        name: 'Dr. Ayesha Rahman',
        email: 'ayesha.rahman@noor-relief.org',
        password: 'Password123!',
        role: 'System Admin',
        organizationName: 'National Disaster Management Authority (NDMA)',
        verifiedStatus: true,
        operationalZone: 'Central Command',
        activeStatus: 'Available',
        phone: '+91-98765-00101',
        skills: ['Incident Command', 'Disaster Logistics', 'GIS Coordination'],
      },
      {
        name: 'Capt. Tariq Mahmud',
        email: 'tariq.control@gov-emergency.gov',
        password: 'Password123!',
        role: 'Government Control Room',
        organizationName: 'State Emergency Operations Center (SEOC)',
        verifiedStatus: true,
        operationalZone: 'Coastal Command',
        activeStatus: 'Available',
        phone: '+91-98765-00102',
        skills: ['Crisis Dispatch', 'Ham Radio Communications', 'Evacuation Planning'],
      },
      {
        name: 'Rezaul Karim',
        email: 'rezaul.k@noor-relief.org',
        password: 'Password123!',
        role: 'NGO Field Agent',
        organizationName: 'Noor Rapid Response Wing',
        verifiedStatus: true,
        operationalZone: 'Kendrapara & Sundarbans',
        activeStatus: 'Available',
        phone: '+91-98765-00103',
        skills: ['Flood Boat Operations', 'Water Purification', 'First Aid'],
      },
      {
        name: 'Dr. Ananya Sen',
        email: 'ananya.sen@doctors-relief.org',
        password: 'Password123!',
        role: 'NGO Field Agent',
        organizationName: 'Doctors Disaster Taskforce',
        verifiedStatus: true,
        operationalZone: 'Puri Coastal Sector',
        activeStatus: 'Busy',
        phone: '+91-98765-00104',
        skills: ['Emergency Trauma Triage', 'Pediatric Care', 'Infection Control'],
      },
      {
        name: 'Kazi Nurul Islam',
        email: 'nurul.volunteer@gmail.com',
        password: 'Password123!',
        role: 'Volunteer',
        organizationName: 'Coastal Fishermen Rescue Guild',
        verifiedStatus: true,
        operationalZone: 'Paradip Port & Jagatsinghpur',
        activeStatus: 'Available',
        phone: '+91-98765-00105',
        skills: ['Zodiac Boat Operator', 'Deep Water Swimming', 'Night Navigation'],
      },
      {
        name: 'Farhana Yasmin',
        email: 'farhana.y@volunteer-net.org',
        password: 'Password123!',
        role: 'Volunteer',
        organizationName: 'Red Crescent Youth Corps',
        verifiedStatus: true,
        operationalZone: 'Balasore Sector',
        activeStatus: 'Available',
        phone: '+91-98765-00106',
        skills: ['Shelter Coordination', 'Ration Distribution', 'Mental Health Support'],
      },
      {
        name: 'Bimal Mondal',
        email: 'bimal.mondal@citizen-aid.org',
        password: 'Password123!',
        role: 'Citizen',
        organizationName: 'Local Resident',
        verifiedStatus: true,
        operationalZone: 'Kendrapara Coastal Village',
        activeStatus: 'Available',
        phone: '+91-98765-00107',
        skills: [],
      },
    ];

    const createdUsers = await User.create(usersData);
    console.log(`[Seed] Seeded ${createdUsers.length} users successfully.`);

    const adminUser = createdUsers[0];
    const dispatchUser = createdUsers[1];
    const fieldAgentReza = createdUsers[2];
    const doctorAnanya = createdUsers[3];
    const volunteerNurul = createdUsers[4];

    // ==========================================
    // 2. SEED RELIEF CAMPS & SHELTERS
    // ==========================================
    console.log('[Seed] Seeding Cyclone Relief Camps & Shelters...');
    const campsData = [
      {
        campName: 'Cyclone Shelter Hub #4 - Sagar Island',
        address: 'Gangasagar High Ground Road, South 24 Parganas, WB',
        districtZone: 'Sundarbans Delta',
        location: {
          type: 'Point',
          coordinates: [88.0833, 21.65], // [lng, lat]
        },
        totalCapacity: 1200,
        currentOccupancy: 840,
        facilitiesAvailable: [
          'Doctor on site',
          'Clean Water',
          'Baby Food',
          'Electricity',
          'Sanitary Facilities',
          'Emergency Generator',
        ],
        contactPerson: 'Sub-Inspector Kalyan Das',
        phone: '+91-98300-11223',
        status: 'Active',
      },
      {
        campName: 'Kendrapara Coastal High School Emergency Hub',
        address: 'Rajnagar Block, Kendrapara District, Odisha',
        districtZone: 'Kendrapara & Coastal Zone',
        location: {
          type: 'Point',
          coordinates: [86.7623, 20.5734],
        },
        totalCapacity: 800,
        currentOccupancy: 795,
        facilitiesAvailable: [
          'Clean Water',
          'Doctor on site',
          'Warm Blankets',
          'Baby Food',
          'Emergency Power Backup',
        ],
        contactPerson: 'Manojit Ray (Headmaster & Camp Warden)',
        phone: '+91-94370-55667',
        status: 'Active',
      },
      {
        campName: 'Paradip Port Multi-Purpose Refuge Center',
        address: 'Sector 2 Disaster Complex, Paradip, Jagatsinghpur',
        districtZone: 'Paradip Port & Jagatsinghpur',
        location: {
          type: 'Point',
          coordinates: [86.6114, 20.3165],
        },
        totalCapacity: 1500,
        currentOccupancy: 1500,
        facilitiesAvailable: [
          'Doctor on site',
          'Surgical Triage Tent',
          'Clean Water',
          'Electricity',
          'Radio Transceiver',
        ],
        contactPerson: 'Capt. Arunima Sen',
        phone: '+91-94388-99001',
        status: 'Full',
      },
      {
        campName: 'Puri Sea-Beach Girls Higher Secondary Shelter',
        address: 'VIP Road, Near Balukhand Sanctuary, Puri',
        districtZone: 'Puri Coastal Sector',
        location: {
          type: 'Point',
          coordinates: [85.8312, 19.8135],
        },
        totalCapacity: 950,
        currentOccupancy: 520,
        facilitiesAvailable: [
          'Doctor on site',
          'Clean Water',
          'Baby Food',
          'Sanitary Kits',
          'Dry Food Distribution',
        ],
        contactPerson: 'Sasmita Patnaik',
        phone: '+91-94371-22445',
        status: 'Active',
      },
      {
        campName: 'Balasore North Coast Flood Shelter #12',
        address: 'Chandipur Coastal Defense Perimeter, Balasore',
        districtZone: 'Balasore Sector',
        location: {
          type: 'Point',
          coordinates: [87.0135, 21.4682],
        },
        totalCapacity: 600,
        currentOccupancy: 310,
        facilitiesAvailable: [
          'Clean Water',
          'Warm Blankets',
          'Baby Food',
          'Emergency Generator',
        ],
        contactPerson: 'Deepak Mohapatra',
        phone: '+91-94373-88776',
        status: 'Active',
      },
    ];

    const createdCamps = await ReliefCamp.create(campsData);
    console.log(`[Seed] Seeded ${createdCamps.length} relief camps.`);

    // ==========================================
    // 3. SEED RESOURCE INVENTORIES
    // ==========================================
    console.log('[Seed] Seeding Resource Inventories & Warehouses...');
    const inventoryData = [
      {
        itemType: 'Food Packets',
        totalQuantity: 12000,
        availableQuantity: 9200,
        allocatedQuantity: 2800,
        unit: 'meals (ready-to-eat)',
        warehouseLocation: {
          type: 'Point',
          coordinates: [86.761, 20.575],
          address: 'Kendrapara Central Civil Supplies Godown',
          districtZone: 'Kendrapara & Coastal Zone',
        },
        managedByOrg: 'Noor Rapid Response Wing',
        contactPerson: 'Rezaul Karim',
        contactPhone: '+91-98765-00103',
      },
      {
        itemType: 'Drinking Water (Liters)',
        totalQuantity: 35000,
        availableQuantity: 24500,
        allocatedQuantity: 10500,
        unit: 'liters (purified canisters)',
        warehouseLocation: {
          type: 'Point',
          coordinates: [86.615, 20.318],
          address: 'Paradip Port Maritime Warehouse 4',
          districtZone: 'Paradip Port & Jagatsinghpur',
        },
        managedByOrg: 'State Emergency Operations Center (SEOC)',
        contactPerson: 'Capt. Tariq Mahmud',
        contactPhone: '+91-98765-00102',
      },
      {
        itemType: 'Medical Kits',
        totalQuantity: 850,
        availableQuantity: 520,
        allocatedQuantity: 330,
        unit: 'trauma & pediatric kits',
        warehouseLocation: {
          type: 'Point',
          coordinates: [85.833, 19.815],
          address: 'Puri District Hospital Emergency Depot',
          districtZone: 'Puri Coastal Sector',
        },
        managedByOrg: 'Doctors Disaster Taskforce',
        contactPerson: 'Dr. Ananya Sen',
        contactPhone: '+91-98765-00104',
      },
      {
        itemType: 'Blankets',
        totalQuantity: 5000,
        availableQuantity: 3800,
        allocatedQuantity: 1200,
        unit: 'thermal woolen blankets',
        warehouseLocation: {
          type: 'Point',
          coordinates: [88.085, 21.652],
          address: 'Kakdwip Sunderbans Staging Warehouse',
          districtZone: 'Sundarbans Delta',
        },
        managedByOrg: 'Red Crescent Youth Corps',
        contactPerson: 'Farhana Yasmin',
        contactPhone: '+91-98765-00106',
      },
      {
        itemType: 'Rescue Boats',
        totalQuantity: 24,
        availableQuantity: 15,
        allocatedQuantity: 9,
        unit: 'inflatable zodiacs with 40HP engines',
        warehouseLocation: {
          type: 'Point',
          coordinates: [86.612, 20.32],
          address: 'Paradip Marine Rescue Dockyard',
          districtZone: 'Paradip Port & Jagatsinghpur',
        },
        managedByOrg: 'Coastal Fishermen Rescue Guild',
        contactPerson: 'Kazi Nurul Islam',
        contactPhone: '+91-98765-00105',
      },
      {
        itemType: 'Tents',
        totalQuantity: 750,
        availableQuantity: 560,
        allocatedQuantity: 190,
        unit: 'waterproof 6-person family shelters',
        warehouseLocation: {
          type: 'Point',
          coordinates: [87.015, 21.47],
          address: 'Balasore Civil Defense Reserve Stock',
          districtZone: 'Balasore Sector',
        },
        managedByOrg: 'National Disaster Management Authority (NDMA)',
        contactPerson: 'Dr. Ayesha Rahman',
        contactPhone: '+91-98765-00101',
      },
    ];

    const createdInventory = await ResourceInventory.create(inventoryData);
    console.log(`[Seed] Seeded ${createdInventory.length} inventory categories.`);

    // ==========================================
    // 4. SEED REALISTIC DISTRESS REQUESTS
    // ==========================================
    console.log('[Seed] Seeding Realistic Coastal Disaster Distress Calls...');
    const distressData = [
      {
        citizenName: 'Rabindra Majumdar',
        contactNumber: '+91-98311-24589',
        alternateContact: '+91-98311-24590',
        location: {
          type: 'Point',
          coordinates: [88.102, 21.661], // Sundarbans Island
          readableAddress: 'Village Kumirmari, Plot 44, Near River Embankment breach',
          districtZone: 'Sundarbans Delta',
        },
        needType: 'Rescue / Evacuation',
        urgencyLevel: 'Critical (Life-Threatening)',
        peopleCount: {
          adults: 4,
          children: 2,
          elderly: 2,
          pets: 1,
        },
        status: 'In Progress',
        assignedTo: volunteerNurul._id,
        verificationNotes: 'High tidal surge breached mud dyke. Stranded on corrugated roof. Water level still rising rapidly.',
        timeline: [
          {
            status: 'Pending',
            timestamp: new Date(Date.now() - 4 * 3600 * 1000),
            updatedBy: null,
            updaterName: 'Citizen SOS Call',
            notes: 'SOS logged via emergency hotline. Water up to 6 feet in ground floor.',
          },
          {
            status: 'Claimed',
            timestamp: new Date(Date.now() - 2.5 * 3600 * 1000),
            updatedBy: dispatchUser._id,
            updaterName: 'Capt. Tariq Mahmud (Control Room)',
            notes: 'Assigned to Marine Volunteer Squad Nurul Islam with Zodiac Boat #3.',
          },
          {
            status: 'In Progress',
            timestamp: new Date(Date.now() - 1 * 3600 * 1000),
            updatedBy: volunteerNurul._id,
            updaterName: 'Kazi Nurul Islam (Volunteer)',
            notes: 'Boat deployed from Sagar Jetty; navigating debris in tidal channel. ETA 20 mins.',
          },
        ],
      },
      {
        citizenName: 'Sabita Rani Pradhan',
        contactNumber: '+91-94372-91823',
        alternateContact: '',
        location: {
          type: 'Point',
          coordinates: [86.771, 20.582], // Kendrapara
          readableAddress: 'Satabhaya Ward 3, Near Old Primary School, Rajnagar',
          districtZone: 'Kendrapara & Coastal Zone',
        },
        needType: 'Medical Emergency',
        urgencyLevel: 'Critical (Life-Threatening)',
        peopleCount: {
          adults: 2,
          children: 0,
          elderly: 1,
          pets: 0,
        },
        status: 'Claimed',
        assignedTo: doctorAnanya._id,
        verificationNotes: '72-year-old grandfather experiencing severe chest pain and breathlessness. Flood water cut off ambulance route.',
        timeline: [
          {
            status: 'Pending',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000),
            updaterName: 'Local Asha Worker',
            notes: 'Urgent cardiac alert; home partially waterlogged.',
          },
          {
            status: 'Claimed',
            timestamp: new Date(Date.now() - 35 * 60 * 1000),
            updatedBy: doctorAnanya._id,
            updaterName: 'Dr. Ananya Sen',
            notes: 'Medical quick-response team dispatched with portable ECG and defibrillator.',
          },
        ],
      },
      {
        citizenName: 'Gouranga Halder',
        contactNumber: '+91-94380-44119',
        alternateContact: '+91-94380-44120',
        location: {
          type: 'Point',
          coordinates: [86.621, 20.325], // Paradip
          readableAddress: 'Nehru Bangla Fishing Settlement, Paradip Outer Pier',
          districtZone: 'Paradip Port & Jagatsinghpur',
        },
        needType: 'Food & Water',
        urgencyLevel: 'High',
        peopleCount: {
          adults: 8,
          children: 5,
          elderly: 3,
          pets: 2,
        },
        status: 'Pending',
        assignedTo: null,
        verificationNotes: 'Tubewell saline contaminated after storm surge. 16 individuals have had no drinking water for 24 hours.',
        timeline: [
          {
            status: 'Pending',
            timestamp: new Date(Date.now() - 5 * 3600 * 1000),
            updaterName: 'Community Leader Call',
            notes: 'Drinking water exhausted; children showing dehydration signs.',
          },
        ],
      },
      {
        citizenName: 'Manjula Devi',
        contactNumber: '+91-94376-77881',
        alternateContact: '',
        location: {
          type: 'Point',
          coordinates: [85.845, 19.821], // Puri
          readableAddress: 'Chakratirtha Road, Fishermen Basti, Hut #89',
          districtZone: 'Puri Coastal Sector',
        },
        needType: 'Emergency Shelter',
        urgencyLevel: 'High',
        peopleCount: {
          adults: 3,
          children: 3,
          elderly: 0,
          pets: 1,
        },
        status: 'Pending',
        assignedTo: null,
        verificationNotes: 'Asbestos and thatch roof blown away by 130 km/h wind gusts. Heavy monsoon rain pouring in.',
        timeline: [
          {
            status: 'Pending',
            timestamp: new Date(Date.now() - 3 * 3600 * 1000),
            updaterName: 'Citizen SMS Gateway',
            notes: 'Family sheltered under drenched plastic sheet. Need immediate relocation to Sea-Beach Camp.',
          },
        ],
      },
      {
        citizenName: 'Haradhan Mondal',
        contactNumber: '+91-98305-66772',
        alternateContact: '',
        location: {
          type: 'Point',
          coordinates: [88.091, 21.648], // Sagar Island
          readableAddress: 'Dhablat South Sector, Plot 12, River Bank',
          districtZone: 'Sundarbans Delta',
        },
        needType: 'Food & Water',
        urgencyLevel: 'Moderate',
        peopleCount: {
          adults: 3,
          children: 2,
          elderly: 1,
          pets: 0,
        },
        status: 'In Progress',
        assignedTo: fieldAgentReza._id,
        verificationNotes: 'Dry rations flooded in mud house. Baby formula and boiled water needed for 7-month infant.',
        timeline: [
          {
            status: 'Pending',
            timestamp: new Date(Date.now() - 6 * 3600 * 1000),
            updaterName: 'Citizen Dispatch',
            notes: 'Request for dry rations and milk powder.',
          },
          {
            status: 'Claimed',
            timestamp: new Date(Date.now() - 3 * 3600 * 1000),
            updatedBy: fieldAgentReza._id,
            updaterName: 'Rezaul Karim (Noor NGO)',
            notes: 'Picked up 10 Food Packets + 20L Water from Kendrapara Warehouse.',
          },
          {
            status: 'In Progress',
            timestamp: new Date(Date.now() - 1.5 * 3600 * 1000),
            updatedBy: fieldAgentReza._id,
            updaterName: 'Rezaul Karim (Noor NGO)',
            notes: 'En route via tractor trailer across muddy bypass.',
          },
        ],
      },
      {
        citizenName: 'Tapan Behera',
        contactNumber: '+91-94379-33221',
        alternateContact: '',
        location: {
          type: 'Point',
          coordinates: [87.022, 21.472], // Balasore
          readableAddress: 'Kasafal Marine Village, Near Jetty 2',
          districtZone: 'Balasore Sector',
        },
        needType: 'Rescue / Evacuation',
        urgencyLevel: 'Critical (Life-Threatening)',
        peopleCount: {
          adults: 5,
          children: 0,
          elderly: 0,
          pets: 0,
        },
        status: 'Resolved',
        assignedTo: volunteerNurul._id,
        verificationNotes: 'Trawler engine failed during storm surge. 5 crew members rescued and brought ashore.',
        timeline: [
          {
            status: 'Pending',
            timestamp: new Date(Date.now() - 14 * 3600 * 1000),
            updaterName: 'Coast Guard Radar Relay',
            notes: 'Disabled fishing vessel drifting towards sandbar.',
          },
          {
            status: 'In Progress',
            timestamp: new Date(Date.now() - 12 * 3600 * 1000),
            updatedBy: volunteerNurul._id,
            updaterName: 'Kazi Nurul Islam',
            notes: 'Guild rescue boat dispatched.',
          },
          {
            status: 'Resolved',
            timestamp: new Date(Date.now() - 8 * 3600 * 1000),
            updatedBy: volunteerNurul._id,
            updaterName: 'Kazi Nurul Islam',
            notes: 'All 5 crew brought to Chandipur defense harbor safely. No serious injuries.',
          },
        ],
      },
      {
        citizenName: 'Anil Kumar Sahu',
        contactNumber: '+91-94375-11998',
        alternateContact: '',
        location: {
          type: 'Point',
          coordinates: [86.758, 20.569],
          readableAddress: 'Aul Bazaar Road, Crossroad 4',
          districtZone: 'Kendrapara & Coastal Zone',
        },
        needType: 'Emergency Shelter',
        urgencyLevel: 'Low',
        peopleCount: {
          adults: 2,
          children: 0,
          elderly: 0,
          pets: 0,
        },
        status: 'False Alarm',
        assignedTo: null,
        verificationNotes: 'Report of collapsed building was inspected by municipal drone patrol. Only temporary shed bamboo collapsed; building intact and residents relocated.',
        timeline: [
          {
            status: 'Pending',
            timestamp: new Date(Date.now() - 10 * 3600 * 1000),
            updaterName: 'Anonymous Citizen',
            notes: 'Reported structure collapse.',
          },
          {
            status: 'False Alarm',
            timestamp: new Date(Date.now() - 7 * 3600 * 1000),
            updatedBy: dispatchUser._id,
            updaterName: 'Capt. Tariq Mahmud (Control Room)',
            notes: 'Physical on-site inspection confirmed no collapse and zero casualties.',
          },
        ],
      },
      {
        citizenName: 'Pratima Jena',
        contactNumber: '+91-94381-88992',
        alternateContact: '+91-94381-88993',
        location: {
          type: 'Point',
          coordinates: [86.765, 20.589],
          readableAddress: 'Batighar Island, Near False Point Lighthouse',
          districtZone: 'Kendrapara & Coastal Zone',
        },
        needType: 'Medical Emergency',
        urgencyLevel: 'High',
        peopleCount: {
          adults: 2,
          children: 1,
          elderly: 1,
          pets: 0,
        },
        status: 'Pending',
        assignedTo: null,
        verificationNotes: '10-year-old child sustained deep puncture wound on leg from cyclone sheet metal. High fever developing.',
        timeline: [
          {
            status: 'Pending',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            updaterName: 'LightHouse Keeper Radio Relay',
            notes: 'Requires tetanus injection and sterile dressing immediately. Island accessible only by high-speed boat.',
          },
        ],
      },
    ];

    const createdDistress = await DistressRequest.create(distressData);
    console.log(`[Seed] Seeded ${createdDistress.length} realistic distress calls.`);

    console.log('========================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`- 👥 Users & Responders:  ${createdUsers.length}`);
    console.log(`- ⛺ Relief Camps:        ${createdCamps.length}`);
    console.log(`- 📦 Resource Depots:     ${createdInventory.length}`);
    console.log(`- 🚨 Distress Incidents:   ${createdDistress.length}`);
    console.log('========================================================');
    console.log('Test Credentials:');
    console.log('  Admin User:      ayesha.rahman@noor-relief.org / Password123!');
    console.log('  Control Room:    tariq.control@gov-emergency.gov / Password123!');
    console.log('  Field Agent:     rezaul.k@noor-relief.org / Password123!');
    console.log('========================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
