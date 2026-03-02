INSERT INTO hospitals (name, city, address, phone, latitude, longitude, emergency_rating, emergency_available)
SELECT 'City Care Hospital', 'Chennai', 'Anna Nagar', '9876543210', 13.0827, 80.2707, 4.4, true
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'City Care Hospital');

INSERT INTO hospitals (name, city, address, phone, latitude, longitude, emergency_rating, emergency_available)
SELECT 'LifeLine Medical Center', 'Bengaluru', 'MG Road', '9123456780', 12.9716, 77.5946, 4.7, true
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'LifeLine Medical Center');

INSERT INTO blood_donors (name, blood_group, city, phone, verified, availability)
SELECT 'Arun Kumar', 'O+', 'Chennai', '9000011111', true, 'AVAILABLE'
WHERE NOT EXISTS (SELECT 1 FROM blood_donors WHERE phone = '9000011111');

INSERT INTO blood_donors (name, blood_group, city, phone, verified, availability)
SELECT 'Priya R', 'A-', 'Bengaluru', '9000022222', true, 'BUSY'
WHERE NOT EXISTS (SELECT 1 FROM blood_donors WHERE phone = '9000022222');
