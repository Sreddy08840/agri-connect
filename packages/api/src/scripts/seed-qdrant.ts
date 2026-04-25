import 'dotenv/config';
import { initQdrant, upsertDocuments, KnowledgeDoc } from '../services/qdrant';

const seedData: KnowledgeDoc[] = [
  // Government Schemes
  {
    title: 'PM-KISAN Scheme',
    content: 'The Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a central sector scheme that provides income support of ₹6,000 per year in three equal installments to all landholding farmer families in India. The funds are transferred directly to the bank accounts of the beneficiaries.',
    category: 'scheme'
  },
  {
    title: 'PM Fasal Bima Yojana (PMFBY)',
    content: 'PMFBY is a government-sponsored crop insurance scheme that integrates multiple stakeholders. it aims to provide insurance coverage and financial support to farmers in the event of failure of any of the notified crops as a result of natural calamities, pests & diseases.',
    category: 'scheme'
  },
  {
    title: 'Kisan Credit Card (KCC)',
    content: 'The KCC scheme aims to provide adequate and timely credit support from the banking system under a single window with flexible and simplified procedures for farmers for their cultivation and other needs such as purchase of agriculture inputs such as seeds, fertilizers, pesticides etc. and draw cash for their production needs.',
    category: 'scheme'
  },
  
  // Farming Knowledge
  {
    title: 'Organic Tomato Farming',
    content: 'For organic tomato farming, use well-rotted farmyard manure (FYM) or vermicompost. Maintain a spacing of 60x45 cm. Use Neem oil sprays (3000 ppm) at 10-15 day intervals to control whiteflies and fruit borers. Mulching with straw helps retain moisture and suppress weeds.',
    category: 'farming_knowledge'
  },
  {
    title: 'Rice Intensification (SRI)',
    content: 'System of Rice Intensification (SRI) is a low-water, labor-intensive method. It involves transplanting young seedlings (8-12 days old) singly with wide spacing (25x25 cm) in a square pattern. Keep the soil moist but not flooded (alternate wetting and drying).',
    category: 'farming_knowledge'
  },
  {
    title: 'Drip Irrigation Benefits',
    content: 'Drip irrigation saves water by allowing water to drip slowly to the roots of plants. It reduces evaporation and runoff, improves fertilizer efficiency (fertigation), and can increase crop yields by 20-50%. It is highly suitable for wide-spaced crops like fruit trees and vegetables.',
    category: 'farming_knowledge'
  },

  // FAQs
  {
    title: 'How to sell on Agri-Connect?',
    content: 'To sell on Agri-Connect, register as a Farmer, complete your profile, and then use the "Add Product" feature. You can also use the Voice Assistant by saying "I want to sell 50kg tomatoes at 30 rupees". Once added, your product will be visible to buyers after approval.',
    category: 'faq'
  },
  {
    title: 'How to track my order?',
    content: 'You can track your order by visiting the "My Orders" section in your profile. For each order, you can see the current status (Placed, Confirmed, Shipped, Delivered). You can also ask the Voice Assistant "Where is my order?" or "Check my order status".',
    category: 'faq'
  },
  {
    title: 'What payment methods are supported?',
    content: 'Agri-Connect supports multiple payment methods including UPI (Google Pay, PhonePe), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD) for selected regions.',
    category: 'faq'
  }
];

async function seed() {
  console.log('🌱 Starting Qdrant seeding...');
  
  try {
    // Initialize collection
    await initQdrant();
    console.log('✅ Qdrant collection initialized.');

    // Upsert documents
    await upsertDocuments(seedData);
    console.log(`✅ Successfully seeded ${seedData.length} documents into Qdrant.`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
