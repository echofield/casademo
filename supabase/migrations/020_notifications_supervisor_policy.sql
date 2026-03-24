-- ═══════════════════════════════════════════════════════════════
-- Allow supervisors to insert notifications for any user
-- Fixes 500 error when supervisor sends reminder to seller
-- ═══════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════
-- Also create a helper function for sending notifications
-- This provides a cleaner API and better error handling
-- ═══════════════════════════════════════════════════════════════

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
