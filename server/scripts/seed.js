const { query } = require('../config/database');

const samplePackingTemplates = [
  {
    name: 'Beach Vacation',
    description: 'Essential items for a tropical beach getaway',
    tripType: 'leisure',
    climate: 'tropical',
    durationDays: 7,
    isPublic: true,
    items: [
      { name: 'Swimwear', category: 'clothing', quantity: 3, isEssential: true },
      { name: 'Sunscreen SPF 30+', category: 'toiletries', quantity: 1, isEssential: true },
      { name: 'Beach towel', category: 'accessories', quantity: 1, isEssential: true },
      { name: 'Flip flops', category: 'footwear', quantity: 1, isEssential: true },
      { name: 'Sunglasses', category: 'accessories', quantity: 1, isEssential: true },
      { name: 'Sun hat', category: 'clothing', quantity: 1, isEssential: false },
      { name: 'Beach bag', category: 'accessories', quantity: 1, isEssential: false },
      { name: 'Waterproof phone case', category: 'electronics', quantity: 1, isEssential: false },
    ]
  },
  {
    name: 'Business Trip',
    description: 'Professional attire and essentials for business travel',
    tripType: 'business',
    climate: 'temperate',
    durationDays: 3,
    isPublic: true,
    items: [
      { name: 'Business suits', category: 'clothing', quantity: 2, isEssential: true },
      { name: 'Dress shirts', category: 'clothing', quantity: 3, isEssential: true },
      { name: 'Dress shoes', category: 'footwear', quantity: 1, isEssential: true },
      { name: 'Laptop', category: 'electronics', quantity: 1, isEssential: true },
      { name: 'Laptop charger', category: 'electronics', quantity: 1, isEssential: true },
      { name: 'Business cards', category: 'documents', quantity: 1, isEssential: true },
      { name: 'Ties', category: 'clothing', quantity: 2, isEssential: false },
      { name: 'Portfolio/briefcase', category: 'accessories', quantity: 1, isEssential: false },
    ]
  },
  {
    name: 'Mountain Hiking',
    description: 'Gear for multi-day mountain hiking adventures',
    tripType: 'adventure',
    climate: 'mountain',
    durationDays: 5,
    isPublic: true,
    items: [
      { name: 'Hiking boots', category: 'footwear', quantity: 1, isEssential: true },
      { name: 'Backpack', category: 'accessories', quantity: 1, isEssential: true },
      { name: 'Rain jacket', category: 'clothing', quantity: 1, isEssential: true },
      { name: 'Hiking pants', category: 'clothing', quantity: 2, isEssential: true },
      { name: 'First aid kit', category: 'safety', quantity: 1, isEssential: true },
      { name: 'Water bottles', category: 'accessories', quantity: 2, isEssential: true },
      { name: 'Headlamp', category: 'electronics', quantity: 1, isEssential: true },
      { name: 'Sleeping bag', category: 'camping', quantity: 1, isEssential: false },
      { name: 'Tent', category: 'camping', quantity: 1, isEssential: false },
      { name: 'Hiking poles', category: 'accessories', quantity: 2, isEssential: false },
    ]
  }
];

const seedPackingTemplates = async () => {
  try {
    console.log('Seeding packing templates...');

    for (const template of samplePackingTemplates) {
      // Insert template
      const templateResult = await query(
        `INSERT INTO packing_templates (name, description, trip_type, climate, duration_days, is_public)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [template.name, template.description, template.tripType, template.climate, template.durationDays, template.isPublic]
      );

      const templateId = templateResult.rows[0].id;

      // Insert template items
      for (const item of template.items) {
        await query(
          `INSERT INTO packing_items (template_id, name, category, quantity, is_essential)
           VALUES ($1, $2, $3, $4, $5)`,
          [templateId, item.name, item.category, item.quantity, item.isEssential]
        );
      }

      console.log(`✅ Created template: ${template.name}`);
    }

    console.log('🎉 Packing templates seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding packing templates:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await seedPackingTemplates();
    
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedPackingTemplates };