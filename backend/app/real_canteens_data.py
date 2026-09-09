from decimal import Decimal
from app import models

REAL_CANTEEN_MENUS = {
    'NESCAFE': [
        # CATEGORY: MAGIC BOWLS
        {
            'name': 'Classic Maggi',
            'category': 'Magic Bowls',
            'price': Decimal('35.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Classic original Nestle Maggi noodles seasoned with signature tastemaker.',
            'preparation_time_minutes': 6,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 50
        },
        {
            'name': 'Cheese Maggi',
            'category': 'Magic Bowls',
            'price': Decimal('50.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Piping hot Maggi noodles topped with melted creamy cheddar cheese.',
            'preparation_time_minutes': 7,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Cheese Masala Maggi',
            'category': 'Magic Bowls',
            'price': Decimal('55.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Spicy masala Maggi noodles generously topped with melted cheese slice.',
            'preparation_time_minutes': 7,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Cheese Peri Peri Maggi',
            'category': 'Magic Bowls',
            'price': Decimal('60.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Fiery African peri-peri tossed Maggi loaded with grated cheese.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Punjabi Tadka Maggi',
            'category': 'Magic Bowls',
            'price': Decimal('50.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Desi tempered Maggi tossed with sautéed cumin, onions, garlic and chillies.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Cheese Punjabi Tadka Maggi',
            'category': 'Magic Bowls',
            'price': Decimal('60.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Desi Punjabi tadka Maggi noodles layered with gooey melted cheese.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Peri Peri Maggi',
            'category': 'Magic Bowls',
            'price': Decimal('45.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Zesty hot peri peri spiced Maggi noodles.',
            'preparation_time_minutes': 7,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Corn & Mayo Maggi',
            'category': 'Magic Bowls',
            'price': Decimal('50.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Creamy Maggi noodles prepared with sweet American corn and eggless mayonnaise.',
            'preparation_time_minutes': 7,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 30
        },
        {
            'name': 'Corn Cheese & Mayo Maggi',
            'category': 'Magic Bowls',
            'price': Decimal('60.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Rich noodles tossed with sweet corn, velvety mayo and shredded cheese.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 30
        },
        {
            'name': 'Veg Masala Maggi',
            'category': 'Magic Bowls',
            'price': Decimal('40.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Nutritious Maggi noodles tossed with garden fresh carrots, peas, and peppers.',
            'preparation_time_minutes': 7,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },

        # CATEGORY: HOT BEVERAGES
        {
            'name': 'Nescafe Classic Hot Coffee',
            'category': 'Hot Beverages',
            'price': Decimal('20.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Signature frothy Nescafe rich blend brewed with hot whole milk.',
            'preparation_time_minutes': 4,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 60
        },
        {
            'name': 'Cardamom Tea',
            'category': 'Hot Beverages',
            'price': Decimal('15.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Aromatic Indian chai infused with hand-crushed green cardamom pods.',
            'preparation_time_minutes': 3,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 60
        },
        {
            'name': 'Ginger Tea',
            'category': 'Hot Beverages',
            'price': Decimal('15.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Invigorating milk tea simmered with fresh spicy ginger root.',
            'preparation_time_minutes': 3,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 60
        },
        {
            'name': 'Lemon Tea',
            'category': 'Hot Beverages',
            'price': Decimal('20.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Soothing black tea infused with fresh tangy lemon juice and honey drops.',
            'preparation_time_minutes': 3,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 50
        },
        {
            'name': 'Green Tea',
            'category': 'Hot Beverages',
            'price': Decimal('20.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Antioxidant-rich organic whole-leaf green tea bag in steaming water.',
            'preparation_time_minutes': 3,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Hot Chocolate',
            'category': 'Hot Beverages',
            'price': Decimal('30.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Velvety Swiss chocolate melted into rich steamed milk.',
            'preparation_time_minutes': 5,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Double Shot Coffee',
            'category': 'Hot Beverages',
            'price': Decimal('30.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Extra-strong double espresso roast brew for late-night study sessions.',
            'preparation_time_minutes': 4,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 45
        },

        # CATEGORY: ICED BEVERAGES
        {
            'name': 'Nescafe Frappe (Cold Coffee)',
            'category': 'Iced Beverages',
            'price': Decimal('40.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Signature creamy chilled cold coffee shaken with crushed ice.',
            'preparation_time_minutes': 5,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 50
        },
        {
            'name': 'Cold Coffee with Crushed Ice',
            'category': 'Iced Beverages',
            'price': Decimal('40.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Refreshing cold coffee poured over shaved crystal ice.',
            'preparation_time_minutes': 4,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 50
        },
        {
            'name': 'Iced Tea',
            'category': 'Iced Beverages',
            'price': Decimal('35.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Crisp chilled Nestea with a splash of fresh lemon citrus and mint.',
            'preparation_time_minutes': 4,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 45
        },

        # CATEGORY: QUICK BITES / SNACKS
        {
            'name': 'Aloo Puff (Patties)',
            'category': 'Quick Bites / Snacks',
            'price': Decimal('20.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Flaky golden puff pastry filled with tempered potato and green peas.',
            'preparation_time_minutes': 3,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Paneer Puff (Patties)',
            'category': 'Quick Bites / Snacks',
            'price': Decimal('30.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Crisp baked puff pastry stuffed with spiced cottage cheese filling.',
            'preparation_time_minutes': 3,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },

        # CATEGORY: PACKAGED GOODS / MRP ITEMS
        {
            'name': 'KitKat',
            'category': 'Packaged Goods / MRP Items',
            'price': Decimal('20.00'),
            'pricing_type': models.PricingType.MRP,
            'unit_info': 'Printed MRP',
            'is_verified': True,
            'description': 'Crisp wafer fingers enrobed in smooth milk chocolate. Sold at printed MRP.',
            'preparation_time_minutes': 1,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 80
        },
        {
            'name': 'Munch',
            'category': 'Packaged Goods / MRP Items',
            'price': Decimal('10.00'),
            'pricing_type': models.PricingType.MRP,
            'unit_info': 'Printed MRP',
            'is_verified': True,
            'description': 'Crunchy wafer bar coated with delicious chocolate confectionery. Sold at printed MRP.',
            'preparation_time_minutes': 1,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 80
        },
        {
            'name': 'Mineral Water',
            'category': 'Packaged Goods / MRP Items',
            'price': Decimal('20.00'),
            'pricing_type': models.PricingType.MRP,
            'unit_info': 'Printed MRP',
            'is_verified': True,
            'description': 'Packaged drinking water bottle. Sold at printed MRP.',
            'preparation_time_minutes': 1,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 100
        },

        # CATEGORY: ITEMS PENDING VERIFICATION
        {
            'name': 'Unverified Nescafe Special Item 1',
            'category': 'Items Pending Verification',
            'price': Decimal('0.00'),
            'pricing_type': models.PricingType.VARIABLE,
            'unit_info': 'Pending counter confirmation',
            'is_verified': False,
            'description': 'Board text or price partially obscured by lighting glare in photo. Counter verification required.',
            'preparation_time_minutes': 5,
            'is_available': False,
            'image_url': None,
            'initial_stock': 0
        },
        {
            'name': 'Unverified Nescafe Special Item 2',
            'category': 'Items Pending Verification',
            'price': Decimal('0.00'),
            'pricing_type': models.PricingType.VARIABLE,
            'unit_info': 'Pending counter confirmation',
            'is_verified': False,
            'description': 'Board text or price partially obscured by lighting glare in photo. Counter verification required.',
            'preparation_time_minutes': 5,
            'is_available': False,
            'image_url': None,
            'initial_stock': 0
        }
    ],

    'HUNGRY NITES': [
        # CATEGORY: BURGERS & ROLLS
        {
            'name': 'Veg Burger',
            'category': 'Burgers & Rolls',
            'price': Decimal('45.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Crispy vegetable patty topped with sliced tomato, cucumber and creamy mayo in toasted bun.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Cheese Veg Burger',
            'category': 'Burgers & Rolls',
            'price': Decimal('60.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Veg burger topped with a rich slice of melted cheese.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Paneer Burger',
            'category': 'Burgers & Rolls',
            'price': Decimal('70.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Marinated grilled cottage cheese steak with spiced tandoori spread.',
            'preparation_time_minutes': 10,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 30
        },
        {
            'name': 'Veg Roll',
            'category': 'Burgers & Rolls',
            'price': Decimal('50.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Warm roll wrapped around seasoned stir-fried vegetables and mint chutney.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Paneer Roll',
            'category': 'Burgers & Rolls',
            'price': Decimal('70.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Char-grilled paneer cubes rolled with crisp onions and tangy sauce.',
            'preparation_time_minutes': 9,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },

        # CATEGORY: FRIES & CRISPY BITES
        {
            'name': 'French Fries (Salted)',
            'category': 'Fries & Crispy Bites',
            'price': Decimal('50.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Golden fried potato batons seasoned with sea salt.',
            'preparation_time_minutes': 6,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 50
        },
        {
            'name': 'Peri Peri Fries',
            'category': 'Fries & Crispy Bites',
            'price': Decimal('65.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Hot crispy fries shaken in zesty peri peri dust.',
            'preparation_time_minutes': 6,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Cheese Loaded Fries',
            'category': 'Fries & Crispy Bites',
            'price': Decimal('80.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Crispy fries smothered with warm melted cheese and jalapeño mayo.',
            'preparation_time_minutes': 7,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Veg Nuggets',
            'category': 'Fries & Crispy Bites',
            'price': Decimal('60.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '6 pcs',
            'is_verified': True,
            'description': '6 pieces of crispy vegetable nuggets served with garlic mayo dip.',
            'preparation_time_minutes': 7,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },

        # CATEGORY: SANDWICHES & TOASTIES
        {
            'name': 'Veg Grilled Sandwich',
            'category': 'Sandwiches & Toasties',
            'price': Decimal('50.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Toasted bread filled with spiced potato masala and green chutney.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Cheese Grilled Sandwich',
            'category': 'Sandwiches & Toasties',
            'price': Decimal('70.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Golden grilled sandwich stuffed with gooey melted cheese.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Paneer Cheese Sandwich',
            'category': 'Sandwiches & Toasties',
            'price': Decimal('85.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Hearty sandwich layered with marinated paneer, herbs, and molten cheese.',
            'preparation_time_minutes': 9,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 30
        },

        # CATEGORY: SHAKES & COOLERS
        {
            'name': 'Chocolate Shake',
            'category': 'Shakes & Coolers',
            'price': Decimal('60.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Thick chilled chocolate milkshake topped with chocolate drizzle.',
            'preparation_time_minutes': 5,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Oreo Thick Shake',
            'category': 'Shakes & Coolers',
            'price': Decimal('75.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Blended vanilla ice cream with crunchy crushed Oreo cookies.',
            'preparation_time_minutes': 6,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Cold Coffee (Hungry Nites Special)',
            'category': 'Shakes & Coolers',
            'price': Decimal('50.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Creamy blended cold coffee with rich coffee syrup.',
            'preparation_time_minutes': 5,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 45
        },

        # CATEGORY: PACKAGED GOODS / MRP
        {
            'name': 'Soft Drink (Can)',
            'category': 'Packaged Goods / MRP Items',
            'price': Decimal('40.00'),
            'pricing_type': models.PricingType.MRP,
            'unit_info': 'Printed MRP',
            'is_verified': True,
            'description': 'Chilled carbonated soft drink 300ml can. Sold at printed MRP.',
            'preparation_time_minutes': 1,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 60
        },

        # CATEGORY: ITEMS PENDING VERIFICATION
        {
            'name': 'Unverified Late Night Combo',
            'category': 'Items Pending Verification',
            'price': Decimal('0.00'),
            'pricing_type': models.PricingType.VARIABLE,
            'unit_info': 'Pending counter confirmation',
            'is_verified': False,
            'description': 'Special combo board text partially obscured in photo. Counter verification required.',
            'preparation_time_minutes': 8,
            'is_available': False,
            'image_url': None,
            'initial_stock': 0
        }
    ],

    'BIG TREAT CAFE': [
        # CATEGORY: HAPPY CAKES & CELEBRATIONS
        {
            'name': 'Happy Cake (Half Kg - 500g)',
            'category': 'Happy Cakes & Celebrations',
            'price': Decimal('299.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': 'Half Kg (500g)',
            'is_verified': True,
            'description': 'Freshly baked celebration cake half kg with rich whipped frosting.',
            'preparation_time_minutes': 15,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 8
        },
        {
            'name': 'Happy Cake (Full Kg - 1kg)',
            'category': 'Happy Cakes & Celebrations',
            'price': Decimal('549.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': 'Full Kg (1kg)',
            'is_verified': True,
            'description': 'Full 1kg party celebration cake with chocolate fudge and buttercream decorations.',
            'preparation_time_minutes': 20,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 6
        },
        {
            'name': 'Dutch Truffle Cake Slice',
            'category': 'Happy Cakes & Celebrations',
            'price': Decimal('75.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '1 slice',
            'is_verified': True,
            'description': 'Decadent dark chocolate ganache layered sponge pastry slice.',
            'preparation_time_minutes': 2,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 20
        },
        {
            'name': 'Red Velvet Pastry',
            'category': 'Happy Cakes & Celebrations',
            'price': Decimal('85.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '1 slice',
            'is_verified': True,
            'description': 'Ruby red sponge slice layered with luscious cream cheese frosting.',
            'preparation_time_minutes': 2,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 20
        },

        # CATEGORY: FROZEN & PARTY PACKS
        {
            'name': 'Crispy Potato Bites (Party Pack)',
            'category': 'Frozen & Party Packs',
            'price': Decimal('90.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '15 pcs',
            'is_verified': True,
            'description': '15 pieces of crispy golden bite-sized potato poppers.',
            'preparation_time_minutes': 10,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 25
        },
        {
            'name': 'Cheese Corn Triangles (Medium Pack)',
            'category': 'Frozen & Party Packs',
            'price': Decimal('75.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '6 pcs',
            'is_verified': True,
            'description': '6 pieces of golden crumb-coated triangles filled with sweet corn and molten cheese.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 25
        },
        {
            'name': 'Jalapeno Cheese Balls (Snack Pack)',
            'category': 'Frozen & Party Packs',
            'price': Decimal('65.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '5 pcs',
            'is_verified': True,
            'description': '5 pieces of spicy jalapeno studded cheese spheres fried till golden brown.',
            'preparation_time_minutes': 8,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 25
        },

        # CATEGORY: PIZZA & CONTINENTAL
        {
            'name': 'Margherita Pizza (7-inch)',
            'category': 'Pizza & Continental',
            'price': Decimal('120.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '7 inch',
            'is_verified': True,
            'description': 'Fresh basil herb, house tomato marinara and gooey mozzarella cheese on hand-tossed crust.',
            'preparation_time_minutes': 14,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 30
        },
        {
            'name': 'Paneer Tikka Pizza (7-inch)',
            'category': 'Pizza & Continental',
            'price': Decimal('160.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '7 inch',
            'is_verified': True,
            'description': 'Loaded with tandoori spiced paneer cubes, capsicum and red onion.',
            'preparation_time_minutes': 15,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 25
        },
        {
            'name': 'Creamy White Sauce Pasta',
            'category': 'Pizza & Continental',
            'price': Decimal('130.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Penne pasta tossed in rich parmesan béchamel sauce with sautéed mushrooms and herbs.',
            'preparation_time_minutes': 12,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 30
        },

        # CATEGORY: BEVERAGES & MOCKTAILS
        {
            'name': 'Virgin Mojito',
            'category': 'Beverages & Mocktails',
            'price': Decimal('60.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Muddled fresh mint leaves, lime juice and sparkling soda over crushed ice.',
            'preparation_time_minutes': 5,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Blue Curacao Lagoon',
            'category': 'Beverages & Mocktails',
            'price': Decimal('70.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Electric blue citrus cooler with lemon twists and fizz.',
            'preparation_time_minutes': 5,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Packaged Fruit Juice',
            'category': 'Packaged Goods / MRP Items',
            'price': Decimal('30.00'),
            'pricing_type': models.PricingType.MRP,
            'unit_info': 'Printed MRP',
            'is_verified': True,
            'description': 'Packaged mixed fruit juice tetra pack. Sold at printed MRP.',
            'preparation_time_minutes': 1,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 50
        },

        # CATEGORY: ITEMS PENDING VERIFICATION
        {
            'name': 'Unverified Continental Platter',
            'category': 'Items Pending Verification',
            'price': Decimal('0.00'),
            'pricing_type': models.PricingType.VARIABLE,
            'unit_info': 'Pending counter confirmation',
            'is_verified': False,
            'description': 'Bakery display board item blurred in photograph. Counter verification required.',
            'preparation_time_minutes': 10,
            'is_available': False,
            'image_url': None,
            'initial_stock': 0
        }
    ],

    'THE HEALTHY HUT': [
        # CATEGORY: FRESH COLD-PRESSED JUICES
        {
            'name': 'Fresh Orange Juice',
            'category': 'Fresh Cold-Pressed Juices',
            'price': Decimal('50.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '300ml',
            'is_verified': True,
            'description': '100% natural pure orange juice extracted fresh upon ordering with zero added sugar.',
            'preparation_time_minutes': 5,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Sweet Lime (Mosambi) Juice',
            'category': 'Fresh Cold-Pressed Juices',
            'price': Decimal('50.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '300ml',
            'is_verified': True,
            'description': 'Refreshing cold-pressed sweet lime juice with a hint of rock salt and mint.',
            'preparation_time_minutes': 5,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },
        {
            'name': 'Watermelon Cooler Juice',
            'category': 'Fresh Cold-Pressed Juices',
            'price': Decimal('40.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '350ml',
            'is_verified': True,
            'description': 'Hydrating summer watermelon juice lightly blended with lemon juice.',
            'preparation_time_minutes': 4,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 45
        },
        {
            'name': 'Pomegranate (Anar) Juice',
            'category': 'Fresh Cold-Pressed Juices',
            'price': Decimal('70.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '300ml',
            'is_verified': True,
            'description': 'Nutrient-rich pure ruby pomegranate juice cold extracted without additives.',
            'preparation_time_minutes': 6,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1541336032412-2048a678540d?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'ABC Detox Juice (Apple Beetroot Carrot)',
            'category': 'Fresh Cold-Pressed Juices',
            'price': Decimal('65.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '300ml',
            'is_verified': True,
            'description': 'Power detox blend of fresh crisp apples, earthy beetroot, juicy carrots and ginger.',
            'preparation_time_minutes': 6,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },

        # CATEGORY: HEALTHY BOWLS & SALADS
        {
            'name': 'Fresh Seasonal Fruit Bowl',
            'category': 'Healthy Bowls & Salads',
            'price': Decimal('60.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Hand-cut bowl of seasonal papaya, pineapple, apple, banana and pomegranate seeds.',
            'preparation_time_minutes': 6,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 35
        },
        {
            'name': 'Sprouted Moong & Paneer Salad',
            'category': 'Healthy Bowls & Salads',
            'price': Decimal('70.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'High-protein sprouted green moong beans tossed with diced fresh paneer, cucumber and chaat spices.',
            'preparation_time_minutes': 7,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 30
        },
        {
            'name': 'Boiled Sweet Corn Chaat',
            'category': 'Healthy Bowls & Salads',
            'price': Decimal('45.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Steamed golden corn kernels tossed with lemon, black salt and mild herbs.',
            'preparation_time_minutes': 5,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 40
        },

        # CATEGORY: WELLNESS DRINKS & SMOOTHIES
        {
            'name': 'Banana Peanut Butter Protein Smoothie',
            'category': 'Wellness Drinks & Smoothies',
            'price': Decimal('75.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': None,
            'is_verified': True,
            'description': 'Blended ripe bananas, roasted peanut butter and dairy milk for sustained workout energy.',
            'preparation_time_minutes': 6,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 30
        },
        {
            'name': 'Fresh Tender Coconut Water',
            'category': 'Wellness Drinks & Smoothies',
            'price': Decimal('50.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '1 coconut',
            'is_verified': True,
            'description': 'Natural electrolyte rich tender green coconut served chilled with straw.',
            'preparation_time_minutes': 3,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 30
        },
        {
            'name': 'Digestive Spiced Buttermilk (Chaas)',
            'category': 'Wellness Drinks & Smoothies',
            'price': Decimal('25.00'),
            'pricing_type': models.PricingType.FIXED,
            'unit_info': '250ml',
            'is_verified': True,
            'description': 'Cooling probiotic curd drink churned with roasted cumin seeds, coriander and ginger.',
            'preparation_time_minutes': 3,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1571006687087-0b1a5113d5cf?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 45
        },

        # CATEGORY: PACKAGED WELLNESS
        {
            'name': 'Packaged Coconut Water (Tetra)',
            'category': 'Packaged Goods / MRP Items',
            'price': Decimal('45.00'),
            'pricing_type': models.PricingType.MRP,
            'unit_info': 'Printed MRP',
            'is_verified': True,
            'description': 'Pure tender coconut water in 200ml sealed carton. Sold at printed MRP.',
            'preparation_time_minutes': 1,
            'is_available': True,
            'image_url': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=400&q=80',
            'initial_stock': 50
        },

        # CATEGORY: ITEMS PENDING VERIFICATION
        {
            'name': 'Unverified Immunity Herbal Infusion',
            'category': 'Items Pending Verification',
            'price': Decimal('0.00'),
            'pricing_type': models.PricingType.VARIABLE,
            'unit_info': 'Pending counter confirmation',
            'is_verified': False,
            'description': 'Handwritten wellness chalkboard entry obscured in photo. Counter verification required.',
            'preparation_time_minutes': 5,
            'is_available': False,
            'image_url': None,
            'initial_stock': 0
        }
    ]
}

