ALTER TABLE chat_members ADD COLUMN role VARCHAR(20) DEFAULT 'member';
ALTER TABLE chat_members ADD COLUMN can_write BOOLEAN DEFAULT true;
ALTER TABLE chats ADD COLUMN settings JSONB DEFAULT '{"members_can_write": true}'::jsonb;