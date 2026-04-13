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

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Allow supervisors to insert notifications for any user
-- Fixes 500 error when supervisor sends reminder to seller
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Drop existing policy and recreate with supervisor INSERT permission
DROP POLICY IF EXISTS notifications_own ON notifications;

-- Users can read/update/delete their own notifications
CREATE POLICY notifications_select_own ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_update_own ON notifications
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY notifications_delete_own ON notifications
FOR DELETE USING (user_id = auth.uid());

-- Supervisors can insert notifications for any user (for reminders)
-- Regular users can only insert notifications for themselves
CREATE POLICY notifications_insert ON notifications
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'supervisor'
  )
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Also create a helper function for sending notifications
-- This provides a cleaner API and better error handling
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_client_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_is_supervisor BOOLEAN;
BEGIN
  -- Check if caller is supervisor (required to send to other users)
  SELECT (role = 'supervisor') INTO v_is_supervisor
  FROM profiles WHERE id = auth.uid();

  -- Non-supervisors can only send to themselves
  IF NOT v_is_supervisor AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Only supervisors can send notifications to other users';
  END IF;

  INSERT INTO notifications (user_id, type, title, message, client_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_client_id)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
