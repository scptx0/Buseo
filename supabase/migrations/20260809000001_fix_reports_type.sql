-- Ampliar CHECK de reports.type para incluir 'incident'
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_type_check;
ALTER TABLE reports ADD CONSTRAINT reports_type_check CHECK (type IN ('station', 'bus', 'segment', 'incident'));
