
import { DestinationHub } from '../types';

/**
 * Shared destination hub data used by both the Destinations listing page
 * and DestinationDetail page (via useParams lookup).
 */
export const DESTINATION_HUBS: DestinationHub[] = [
    { city: 'Banjul', country: 'The Gambia', airport: 'BJL', frequency: 'Daily', equipment: 'ERJ-120', profile: "West Africa's gateway to eco-tourism and coastal adventure.", img: 'https://images.unsplash.com/photo-1544321689-d499ec24467c?auto=format&fit=crop&q=80', region: 'africa' },
    { city: 'Dakar', country: 'Senegal', airport: 'DSS', frequency: '2x Daily', equipment: 'ERJ-120', profile: 'West Africa\'s premier aviation hub. Gateway to the Francophone corridor.', img: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&q=80', region: 'africa' },
    { city: 'Bissau', country: 'Guinea-Bissau', airport: 'OXB', frequency: 'Daily', equipment: 'ERJ-120', profile: 'Efficient regional transit hub on the Atlantic coast.', img: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&q=80', region: 'africa' },
    { city: 'Conakry', country: 'Guinea', airport: 'CKY', frequency: 'Daily', equipment: 'ERJ-120', profile: 'Port-city gateway serving trade and commerce travellers.', img: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&q=80', region: 'africa' },
    { city: 'Freetown', country: 'Sierra Leone', airport: 'FNA', frequency: 'Daily', equipment: 'ERJ-120', detail: 'Lungi-Town Terminal', profile: 'Gateway to the Atlantic. Modernized terminal with ferry transfer connections.', img: 'https://images.unsplash.com/photo-1489440543286-a69330151c0b?auto=format&fit=crop&q=80', region: 'africa' },
    { city: 'Monrovia', country: 'Liberia', airport: 'ROB', frequency: 'Daily', equipment: 'ERJ-120', profile: 'Roberts International. Direct gateway to Monrovia.', img: 'https://images.unsplash.com/photo-1551882547-ff43c63ebe5e?auto=format&fit=crop&q=80', region: 'africa' },
    { city: 'Accra', country: 'Ghana', airport: 'ACC', frequency: '2x Daily', equipment: 'ERJ-120', profile: 'Executive commerce hub. Premier terminal for West-African business travel.', img: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80', region: 'africa' },
    { city: 'Lagos', country: 'Nigeria', airport: 'LOS', frequency: '3x Daily', equipment: 'ERJ-120', profile: 'The Delta Peak. Busiest hub in the intercontinental network.', img: 'https://images.unsplash.com/photo-1618833162734-722649666014?auto=format&fit=crop&q=80', region: 'africa' },
];
