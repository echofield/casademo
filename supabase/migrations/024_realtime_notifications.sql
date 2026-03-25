-- Enable real-time for notifications table
-- Required for Supabase real-time subscriptions (postgres_changes)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
