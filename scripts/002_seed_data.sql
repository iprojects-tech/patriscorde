-- Seed data for Atelier E-commerce

-- Insert categories
insert into public.categories (id, name, slug, description, image, status) values
  ('c1a00000-0000-0000-0000-000000000001', 'Essentials', 'essentials', 'Foundational pieces for everyday wear', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80', 'active'),
  ('c1a00000-0000-0000-0000-000000000002', 'Outerwear', 'outerwear', 'Premium coats and jackets for all seasons', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80', 'active'),
  ('c1a00000-0000-0000-0000-000000000003', 'Accessories', 'accessories', 'Refined finishing touches', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', 'active')
on conflict (id) do nothing;

-- Insert products
insert into public.products (id, sku, name, slug, description, price, status, category_id, main_image, gallery, featured, variants) values
  (
    'a1a00000-0000-0000-0000-000000000001',
    'ATL-ESS-001',
    'Relaxed Cotton Tee',
    'relaxed-cotton-tee',
    'A perfectly weighted cotton t-shirt with a relaxed fit. Crafted from premium organic cotton with a subtle texture. The ideal foundation piece.',
    8500,
    'active',
    'c1a00000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    array['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80', 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80'],
    true,
    '{"sizes": ["XS", "S", "M", "L", "XL"], "colors": [{"name": "White", "value": "#ffffff"}, {"name": "Black", "value": "#1a1a1a"}, {"name": "Stone", "value": "#d4c5a9"}]}'
  ),
  (
    'a1a00000-0000-0000-0000-000000000002',
    'ATL-ESS-002',
    'Merino Wool Sweater',
    'merino-wool-sweater',
    'Exceptionally soft merino wool in a timeless silhouette. Temperature regulating and naturally breathable. Made to last generations.',
    24500,
    'active',
    'c1a00000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
    array['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80'],
    true,
    '{"sizes": ["XS", "S", "M", "L", "XL"], "colors": [{"name": "Charcoal", "value": "#36454f"}, {"name": "Oatmeal", "value": "#d4c5a9"}, {"name": "Navy", "value": "#1e3a5f"}]}'
  ),
  (
    'a1a00000-0000-0000-0000-000000000003',
    'ATL-OUT-001',
    'Wool Blend Overcoat',
    'wool-blend-overcoat',
    'A refined overcoat in substantial Italian wool blend. Clean lines and impeccable construction. The ultimate outer layer.',
    69500,
    'active',
    'c1a00000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80',
    array['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80', 'https://images.unsplash.com/photo-1544923246-77307dd628b5?w=800&q=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'],
    true,
    '{"sizes": ["S", "M", "L", "XL"], "colors": [{"name": "Black", "value": "#1a1a1a"}, {"name": "Camel", "value": "#c19a6b"}, {"name": "Charcoal", "value": "#36454f"}]}'
  ),
  (
    'a1a00000-0000-0000-0000-000000000004',
    'ATL-ACC-001',
    'Leather Belt',
    'leather-belt',
    'Full-grain Italian leather with brushed brass hardware. A refined essential that improves with age.',
    12500,
    'active',
    'c1a00000-0000-0000-0000-000000000003',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    array['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'],
    false,
    '{"sizes": ["30", "32", "34", "36", "38"], "colors": [{"name": "Black", "value": "#1a1a1a"}, {"name": "Brown", "value": "#8b4513"}]}'
  ),
  (
    'a1a00000-0000-0000-0000-000000000005',
    'ATL-ESS-003',
    'Oxford Shirt',
    'oxford-shirt',
    'Classic oxford cloth in a modern fit. Versatile enough for the office or weekend. Button-down collar with subtle roll.',
    16500,
    'active',
    'c1a00000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
    array['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80'],
    false,
    '{"sizes": ["XS", "S", "M", "L", "XL"], "colors": [{"name": "White", "value": "#ffffff"}, {"name": "Light Blue", "value": "#add8e6"}, {"name": "Pink", "value": "#ffc0cb"}]}'
  ),
  (
    'a1a00000-0000-0000-0000-000000000006',
    'ATL-OUT-002',
    'Quilted Jacket',
    'quilted-jacket',
    'Lightweight quilted jacket with premium down fill. Water-resistant outer and elegant diamond pattern.',
    42500,
    'active',
    'c1a00000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',
    array['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80'],
    false,
    '{"sizes": ["S", "M", "L", "XL"], "colors": [{"name": "Navy", "value": "#1e3a5f"}, {"name": "Olive", "value": "#556b2f"}]}'
  ),
  (
    'a1a00000-0000-0000-0000-000000000007',
    'ATL-ACC-002',
    'Cashmere Scarf',
    'cashmere-scarf',
    'Pure Mongolian cashmere in a generous size. Impossibly soft and surprisingly warm.',
    19500,
    'active',
    'c1a00000-0000-0000-0000-000000000003',
    'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80',
    array['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80'],
    false,
    '{"sizes": [], "colors": [{"name": "Camel", "value": "#c19a6b"}, {"name": "Grey", "value": "#808080"}, {"name": "Navy", "value": "#1e3a5f"}]}'
  ),
  (
    'a1a00000-0000-0000-0000-000000000008',
    'ATL-ESS-004',
    'Tailored Chinos',
    'tailored-chinos',
    'Impeccably tailored chinos in brushed cotton twill. Sits at the waist with a tapered leg.',
    14500,
    'active',
    'c1a00000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80',
    array['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80'],
    false,
    '{"sizes": ["28", "30", "32", "34", "36"], "colors": [{"name": "Khaki", "value": "#c3b091"}, {"name": "Navy", "value": "#1e3a5f"}, {"name": "Olive", "value": "#556b2f"}]}'
  )
on conflict (id) do nothing;
