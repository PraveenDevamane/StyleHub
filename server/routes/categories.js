const express = require('express');
const router = express.Router();
const { db } = require('../firebase-config');
const { requireAdmin } = require('../services/authService');
const { collection, getDocs, addDoc, query, orderBy } = require('firebase/firestore');
const { createDocument } = require('../services/firestoreRest');

const DEFAULT_CATEGORIES = [
  'Footwear',
  'Dress',
  'Saree',
  'Accessories',
  'T-Shirts',
  'Jeans',
  'Kurta',
  'Lehenga',
  'Shirts',
  'Jackets',
  'Sportswear',
  'Winterwear',
  'Kids Wear',
  'Bags',
  'Watches',
];

// GET all categories (with seed fallback)
router.get('/', async (req, res) => {
  try {
    const q = query(collection(db, 'categories'), orderBy('name'));
    let snap = await getDocs(q);

    if (snap.empty) {
      console.log('[Categories] Collection is empty. Initializing defaults...');
      const now = new Date().toISOString();
      const promises = DEFAULT_CATEGORIES.map((name) =>
        addDoc(collection(db, 'categories'), {
          name,
          image_url: null,
          created_at: now,
        })
      );
      await Promise.all(promises);
      snap = await getDocs(q);
    }

    const categories = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST to create a category
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, image_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const newCategory = {
      name: name.trim(),
      image_url: image_url || null,
      created_at: new Date().toISOString(),
    };

    const createdCategory = await createDocument('categories', newCategory, req.firebaseIdToken);
    res.status(201).json(createdCategory);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

module.exports = router;
