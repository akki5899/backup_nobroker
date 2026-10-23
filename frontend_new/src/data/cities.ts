// Indian Cities and Localities Database
// Organized by major cities with popular localities

export interface CityData {
  city: string;
  state: string;
  localities: string[];
}

export const INDIAN_CITIES: CityData[] = [
  {
    city: "Hyderabad",
    state: "Telangana",
    localities: [
      "Hyderabad",
      "Gachibowli",
      "Hitech City",
      "Madhapur",
      "Kondapur",
      "Kukatpally",
      "Miyapur",
      "Banjara Hills",
      "Jubilee Hills",
      "Begumpet",
      "Ameerpet",
      "Secunderabad",
      "Kompally",
      "Uppal",
      "LB Nagar",
      "Dilsukhnagar",
      "Mehdipatnam",
      "Tolichowki",
      "Manikonda",
      "Nanakramguda",
      "Financial District",
      "Kokapet",
      "Narsingi",
      "Attapur",
      "Shamshabad"
    ]
  },
  {
    city: "Bangalore",
    state: "Karnataka",
    localities: [
      "Bangalore",
      "Whitefield",
      "Electronic City",
      "Koramangala",
      "Indiranagar",
      "HSR Layout",
      "BTM Layout",
      "Jayanagar",
      "JP Nagar",
      "Marathahalli",
      "Bellandur",
      "Sarjapur Road",
      "Bannerghatta Road",
      "Hebbal",
      "Yelahanka",
      "KR Puram",
      "Malleshwaram",
      "Rajajinagar",
      "Basavanagudi",
      "Mahadevapura",
      "Ramamurthy Nagar",
      "CV Raman Nagar",
      "Old Airport Road",
      "MG Road",
      "Brigade Road"
    ]
  },
  {
    city: "Mumbai",
    state: "Maharashtra",
    localities: [
      "Mumbai",
      "Andheri",
      "Bandra",
      "Goregaon",
      "Malad",
      "Borivali",
      "Kandivali",
      "Powai",
      "Vikhroli",
      "Ghatkopar",
      "Kurla",
      "Chembur",
      "Thane",
      "Mulund",
      "Bhandup",
      "Dadar",
      "Worli",
      "Lower Parel",
      "Parel",
      "Wadala",
      "Sion",
      "Matunga",
      "Mahim",
      "Santacruz",
      "Juhu"
    ]
  },
  {
    city: "Pune",
    state: "Maharashtra",
    localities: [
      "Pune",
      "Hinjewadi",
      "Wakad",
      "Baner",
      "Aundh",
      "Kharadi",
      "Viman Nagar",
      "Hadapsar",
      "Magarpatta",
      "Koregaon Park",
      "Kalyani Nagar",
      "Pimple Saudagar",
      "Pimple Nilakh",
      "Kothrud",
      "Katraj",
      "Kondhwa",
      "NIBM Road",
      "Warje",
      "Shivaji Nagar",
      "Camp Area"
    ]
  },
  {
    city: "Delhi",
    state: "Delhi",
    localities: [
      "Delhi",
      "Connaught Place",
      "Dwarka",
      "Rohini",
      "Pitampura",
      "Janakpuri",
      "Lajpat Nagar",
      "Saket",
      "Hauz Khas",
      "Green Park",
      "Vasant Kunj",
      "Vasant Vihar",
      "Greater Kailash",
      "Defence Colony",
      "Mayur Vihar",
      "Preet Vihar",
      "Nehru Place",
      "Kalkaji",
      "Malviya Nagar",
      "RK Puram",
      "Rajouri Garden",
      "Karol Bagh",
      "Shahdara",
      "Model Town",
      "Civil Lines"
    ]
  },
  {
    city: "Noida",
    state: "Uttar Pradesh",
    localities: [
      "Noida",
      "Sector 62",
      "Sector 18",
      "Sector 52",
      "Sector 76",
      "Sector 78",
      "Sector 137",
      "Greater Noida",
      "Noida Extension",
      "Sector 150",
      "Sector 168",
      "Knowledge Park"
    ]
  },
  {
    city: "Gurgaon",
    state: "Haryana",
    localities: [
      "Gurgaon",
      "Cyber City",
      "DLF Phase 1",
      "DLF Phase 2",
      "DLF Phase 3",
      "DLF Phase 4",
      "DLF Phase 5",
      "Golf Course Road",
      "Sohna Road",
      "MG Road",
      "Sector 14",
      "Sector 29",
      "Sector 43",
      "Sector 56",
      "New Gurgaon",
      "Palam Vihar"
    ]
  },
  {
    city: "Chennai",
    state: "Tamil Nadu",
    localities: [
      "Chennai",
      "Anna Nagar",
      "T Nagar",
      "Velachery",
      "Adyar",
      "Porur",
      "OMR",
      "Tambaram",
      "Chrompet",
      "Mylapore",
      "Nungambakkam",
      "Egmore",
      "Guindy",
      "Sholinganallur",
      "Thoraipakkam",
      "Pallikaranai",
      "Perungudi",
      "Medavakkam",
      "KK Nagar",
      "Ashok Nagar"
    ]
  },
  {
    city: "Kolkata",
    state: "West Bengal",
    localities: [
      "Kolkata",
      "Salt Lake",
      "New Town",
      "Rajarhat",
      "EM Bypass",
      "Park Street",
      "Ballygunge",
      "Alipore",
      "Behala",
      "Jadavpur",
      "Garia",
      "Howrah",
      "Dum Dum",
      "Belgharia",
      "Barrackpore",
      "Barasat",
      "Kasba",
      "Lake Gardens",
      "Southern Avenue",
      "Elgin Road"
    ]
  },
  {
    city: "Ahmedabad",
    state: "Gujarat",
    localities: [
      "Ahmedabad",
      "Satellite",
      "Prahlad Nagar",
      "Bopal",
      "SG Highway",
      "Vastrapur",
      "Bodakdev",
      "Thaltej",
      "Ambawadi",
      "Navrangpura",
      "CG Road",
      "Maninagar",
      "Naranpura",
      "Gota",
      "Chandkheda"
    ]
  }
];

// Flatten all locations for autocomplete
export const ALL_LOCATIONS = INDIAN_CITIES.reduce((acc, cityData) => {
  return [...acc, ...cityData.localities.map(locality => ({
    name: locality,
    city: cityData.city,
    state: cityData.state,
    displayName: locality === cityData.city ? locality : `${locality}, ${cityData.city}`
  }))];
}, [] as Array<{ name: string; city: string; state: string; displayName: string }>);

// Major cities list for quick access
export const MAJOR_CITIES = INDIAN_CITIES.map(cd => cd.city);
