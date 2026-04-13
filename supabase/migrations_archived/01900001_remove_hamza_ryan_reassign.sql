-- Migration 019: Remove Hamza Said & Ryan Jackson, reassign their clients to Hasael Moussa
-- Hasael (supervisor + seller) will manually dispatch them from the app

-- Reassign all clients from Hamza Said to Hasael Moussa
UPDATE clients
SET seller_id = (SELECT id FROM profiles WHERE full_name = 'Hasael Moussa' LIMIT 1)
WHERE seller_id = (SELECT id FROM profiles WHERE full_name = 'Hamza Said' LIMIT 1);

-- Reassign all clients from Ryan Jackson to Hasael Moussa
UPDATE clients
SET seller_id = (SELECT id FROM profiles WHERE full_name = 'Hasael Moussa' LIMIT 1)
WHERE seller_id = (SELECT id FROM profiles WHERE full_name = 'Ryan Jackson' LIMIT 1);

-- Deactivate removed profiles (keeps history intact)
UPDATE profiles SET active = false WHERE full_name IN ('Hamza Said', 'Ryan Jackson');
