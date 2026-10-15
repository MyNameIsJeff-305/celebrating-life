CREATE TABLE qr_visits (
 id uuid PRIMARY KEY, language text NOT NULL CHECK(language IN ('es','en')),
 opened_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE contacts (
 id uuid PRIMARY KEY, name text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '',
 intent text NOT NULL CHECK(intent IN ('prayer','faith','contact','visit')), message text NOT NULL DEFAULT '',
 contact_permission boolean NOT NULL DEFAULT false, updates_permission boolean NOT NULL DEFAULT false,
 consent_version text NOT NULL DEFAULT '2026-10-15', language text NOT NULL CHECK(language IN ('es','en')),
 visit_id uuid REFERENCES qr_visits(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE attendees (
 id uuid PRIMARY KEY, code text NOT NULL UNIQUE, name text NOT NULL, phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '',
 age_range text NOT NULL DEFAULT '', updates_permission boolean NOT NULL DEFAULT false,
 consent_version text NOT NULL DEFAULT '2026-10-15', language text NOT NULL CHECK(language IN ('es','en')),
 visit_id uuid REFERENCES qr_visits(id), created_at timestamptz NOT NULL DEFAULT now(), arrived_at timestamptz
);
CREATE INDEX contacts_created ON contacts(created_at DESC);
CREATE INDEX attendees_created ON attendees(created_at DESC);
CREATE INDEX contacts_visit ON contacts(visit_id);
CREATE INDEX attendees_visit ON attendees(visit_id);
