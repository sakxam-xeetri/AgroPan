-- =====================================================
-- AgroPan — Demo Data for All Tables
-- Run: mysql -u root agropan < demo_data.sql
-- =====================================================

-- ── Users ────────────────────────────────────────────
INSERT INTO `users` (`username`, `email`, `phone`, `name`, `location`, `type`, `last_login`, `password`) VALUES
('admin',       'admin@agropan.com',      '9800000001', 'System Admin',    'Kathmandu',  'admin',    '1739260800', '$2y$10$cuBc/F4T.omUmeavHrZ1G.QFMfRiYL4P/18mYsz/sJPjEFkhtS0tq'),
('ram_thapa',   'ram@example.com',        '9812345678', 'Ram Thapa',       'Chitwan',    'farmer',   '1739174400', '$2y$10$cuBc/F4T.omUmeavHrZ1G.QFMfRiYL4P/18mYsz/sJPjEFkhtS0tq'),
('sita_sharma', 'sita@example.com',       '9823456789', 'Sita Sharma',     'Pokhara',    'farmer',   '1739088000', '$2y$10$cuBc/F4T.omUmeavHrZ1G.QFMfRiYL4P/18mYsz/sJPjEFkhtS0tq'),
('hari_kc',     'hari@example.com',       '9834567890', 'Hari KC',         'Biratnagar', 'farmer',   '1739001600', '$2y$10$cuBc/F4T.omUmeavHrZ1G.QFMfRiYL4P/18mYsz/sJPjEFkhtS0tq'),
('gita_rai',    'gita@example.com',       '9845678901', 'Gita Rai',        'Dharan',     'merchant', '1738915200', '$2y$10$cuBc/F4T.omUmeavHrZ1G.QFMfRiYL4P/18mYsz/sJPjEFkhtS0tq'),
('bishal_pun',  'bishal@example.com',     '9856789012', 'Bishal Pun',      'Butwal',     'merchant', '1738828800', '$2y$10$cuBc/F4T.omUmeavHrZ1G.QFMfRiYL4P/18mYsz/sJPjEFkhtS0tq'),
('anita_gurung','anita@example.com',      '9867890123', 'Anita Gurung',    'Lumbini',    'farmer',   '1738742400', '$2y$10$cuBc/F4T.omUmeavHrZ1G.QFMfRiYL4P/18mYsz/sJPjEFkhtS0tq'),
('raju_shrestha','raju@example.com',      '9878901234', 'Raju Shrestha',   'Lalitpur',   'merchant', '1738656000', '$2y$10$cuBc/F4T.omUmeavHrZ1G.QFMfRiYL4P/18mYsz/sJPjEFkhtS0tq');

-- ── Devices ──────────────────────────────────────────
INSERT INTO `devices` (`name`, `location`, `last_ping`, `owned_by`) VALUES
('AgroPan-Node-01', 'Chitwan Field A',   '1739260800', 'ram_thapa'),
('AgroPan-Node-02', 'Chitwan Field B',   '1739257200', 'ram_thapa'),
('AgroPan-Node-03', 'Pokhara Plot 1',    '1739253600', 'sita_sharma'),
('AgroPan-Node-04', 'Biratnagar Farm',   '1739250000', 'hari_kc'),
('AgroPan-Node-05', 'Lumbini Orchard',   '1739246400', 'anita_gurung'),
('AgroPan-Node-06', 'Dharan Warehouse',  '1739242800', 'gita_rai');

-- ── Sensor Data ──────────────────────────────────────
INSERT INTO `data` (`timestamp`, `temperature`, `moisture`, `humidity`, `gases`, `nitrogen`, `device`) VALUES
('1739260800', '28.5',  '65.2', '72.1', '120.3', '45.8',  'AgroPan-Node-01'),
('1739257200', '27.3',  '58.9', '68.4', '115.7', '42.1',  'AgroPan-Node-01'),
('1739253600', '26.1',  '71.5', '75.8', '108.2', '51.3',  'AgroPan-Node-02'),
('1739250000', '29.8',  '52.3', '61.9', '132.5', '38.7',  'AgroPan-Node-03'),
('1739246400', '31.2',  '48.7', '55.3', '145.1', '35.2',  'AgroPan-Node-04'),
('1739242800', '25.6',  '74.1', '79.6', '98.4',  '55.9',  'AgroPan-Node-05'),
('1739239200', '30.4',  '61.8', '67.2', '127.6', '43.5',  'AgroPan-Node-01'),
('1739235600', '27.9',  '55.4', '63.7', '118.9', '40.8',  'AgroPan-Node-02'),
('1739232000', '33.1',  '45.2', '52.1', '155.3', '32.6',  'AgroPan-Node-03'),
('1739228400', '24.3',  '78.6', '82.4', '92.1',  '58.7',  'AgroPan-Node-05'),
('1739224800', '28.8',  '63.4', '69.8', '121.5', '44.2',  'AgroPan-Node-04'),
('1739221200', '26.7',  '69.1', '74.3', '110.8', '49.6',  'AgroPan-Node-06'),
('1739217600', '32.5',  '42.8', '49.5', '162.7', '30.1',  'AgroPan-Node-01'),
('1739214000', '29.1',  '57.6', '64.8', '128.3', '41.9',  'AgroPan-Node-02'),
('1739210400', '25.9',  '72.3', '76.9', '101.6', '53.4',  'AgroPan-Node-05');

-- ── Crops ────────────────────────────────────────────
INSERT INTO `crops` (`name`, `image`, `type`, `price`, `last_updated`) VALUES
('Rice',       'crops/rice.jpg',       'grain',     '55',   '1739260800'),
('Wheat',      'crops/wheat.jpg',      'grain',     '42',   '1739260800'),
('Maize',      'crops/maize.jpg',      'grain',     '35',   '1739174400'),
('Tomato',     'crops/tomato.jpg',     'vegetable', '80',   '1739174400'),
('Potato',     'crops/potato.jpg',     'vegetable', '30',   '1739088000'),
('Onion',      'crops/onion.jpg',      'vegetable', '45',   '1739088000'),
('Sugarcane',  'crops/sugarcane.jpg',  'grain',     '25',   '1739001600'),
('Mustard',    'crops/mustard.jpg',    'oilseed',   '120',  '1739001600'),
('Mango',      'crops/mango.jpg',      'fruit',     '150',  '1738915200'),
('Lentil',     'crops/lentil.jpg',     'legume',    '130',  '1738915200');

-- ── Warnings ─────────────────────────────────────────
INSERT INTO `warnings` (`title`, `details`, `timestamp`, `valid_till`) VALUES
('Heavy Rainfall Alert — Chitwan',     'Nepal Meteorological Department forecasts heavy rainfall (>150mm) in Chitwan district for the next 48 hours. Farmers are advised to secure crops and drain excess water from paddy fields.',  '1739260800', '1739433600'),
('Pest Outbreak — Fall Armyworm',       'Fall Armyworm infestation confirmed in maize fields across Terai region. Apply recommended pesticides immediately. Contact local agriculture office for subsidized treatment.',              '1739174400', '1739779200'),
('Heat Wave Warning — Western Nepal',   'Temperatures exceeding 40°C expected in Butwal, Nepalgunj, and surrounding areas. Irrigate crops during early morning or late evening to reduce evaporation.',                             '1739088000', '1739347200'),
('Frost Advisory — Mountainous Region', 'Sub-zero temperatures expected above 2000m elevation. Protect nurseries and seedlings with mulch or cover. Harvest mature vegetables before frost damage.',                                '1738915200', '1739001600');

-- ── Emails (Newsletter Subscribers) ──────────────────
INSERT INTO `emails` (`email`, `name`, `subscribed_at`, `is_active`) VALUES
('ram@example.com',     'Ram Thapa',       '1738828800', 1),
('sita@example.com',    'Sita Sharma',     '1738828800', 1),
('hari@example.com',    'Hari KC',         '1738742400', 1),
('gita@example.com',    'Gita Rai',        '1738742400', 1),
('bishal@example.com',  'Bishal Pun',      '1738656000', 1),
('anita@example.com',   'Anita Gurung',    '1738656000', 1),
('raju@example.com',    'Raju Shrestha',   '1738569600', 0),
('kumar@farm.np',       'Kumar Tamang',    '1738569600', 1),
('priya@agro.com',      'Priya Adhikari',  '1738483200', 1),
('deepak@soil.np',      'Deepak Bhandari', '1738483200', 1);

-- ── Questions (Forum) ───────────────────────────────
INSERT INTO `questions` (`question`, `type`, `asked_by`, `upvotes`, `downvotes`, `answers`) VALUES
('How to prevent late blight in potatoes during monsoon season?',                              'disease',  'ram_thapa',    '2,3',   '0', ''),
('What is the best organic fertilizer for rice paddies?',                                       'soil',     'sita_sharma',  '1,4,5', '0', ''),
('When is the ideal time to plant wheat in the Terai region?',                                  'crop',     'hari_kc',      '3',     '0', ''),
('How do I identify nitrogen deficiency in maize crops?',                                       'soil',     'anita_gurung', '1,2',   '0', ''),
('What are the best pest control methods for sugarcane borers?',                                'pest',     'ram_thapa',    '1',     '5', ''),
('How does the AgroPan IoT sensor measure soil moisture accurately?',                           'general',  'gita_rai',     '2,4',   '0', ''),
('Is drip irrigation better than flood irrigation for vegetable farming?',                      'crop',     'bishal_pun',   '1,3,5', '0', ''),
('What weather conditions trigger the AgroPan alert system?',                                   'weather',  'raju_shrestha','2',     '0', '');

-- ── Answers ──────────────────────────────────────────
INSERT INTO `answers` (`answer`, `answered_by`, `upvotes`, `downvotes`) VALUES
('Apply copper-based fungicide (Bordeaux mixture) before monsoon. Ensure proper drainage and avoid overhead irrigation. Rotate crops every 2 years.',           'sita_sharma',   '1,3',   '0'),
('Use well-composted farmyard manure (FYM) at 10-12 tonnes per hectare. Vermicompost also works great — apply 2-3 tonnes before transplanting.',                'hari_kc',       '1,2,4', '0'),
('In Terai region, wheat should be planted between mid-November to early December. Delayed planting reduces yields significantly after December 20.',            'ram_thapa',     '2,5',   '0'),
('Nitrogen deficiency shows as yellowing of lower leaves (chlorosis) progressing upward. The "V" pattern on leaf tips is a classic sign. Apply urea at 60kg/ha.','sita_sharma',   '1,3',   '0'),
('Integrated Pest Management (IPM) works best: release Trichogramma wasps, apply neem-based sprays, and remove affected stalks. Avoid chemical-only approach.', 'anita_gurung',  '1,4',   '0'),
('Drip irrigation saves 40-60% water compared to flood irrigation. It also reduces weed growth and disease spread. Best for vegetables, fruits, and spices.',    'gita_rai',      '2,3,5', '0');

-- ── Link answers to questions ────────────────────────
UPDATE `questions` SET `answers` = '1'   WHERE `question_id` = 1;
UPDATE `questions` SET `answers` = '2'   WHERE `question_id` = 2;
UPDATE `questions` SET `answers` = '3'   WHERE `question_id` = 3;
UPDATE `questions` SET `answers` = '4'   WHERE `question_id` = 4;
UPDATE `questions` SET `answers` = '5'   WHERE `question_id` = 5;
UPDATE `questions` SET `answers` = '6'   WHERE `question_id` = 7;
