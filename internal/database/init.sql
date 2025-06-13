-- Active: 1742903392842@@127.0.0.1@5433
-- entrypoint for the metadata configuration of sgs

-- create users
CREATE TABLE IF NOT EXISTS users(
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	username VARCHAR(100) UNIQUE NOT NULL,
	password VARCHAR(255) NOT NULL,
	full_name VARCHAR(255),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- create projects. an abstraction of a bucket
CREATE TABLE IF NOT EXISTS projects(
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	owner_id UUID NOT NULL REFERENCES users(id),
	bucket VARCHAR(255) UNIQUE NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- create files
CREATE TABLE IF NOT EXISTS files(
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	filename VARCHAR(255) NOT NULL,
	project_id UUID REFERENCES projects(id) NOT NULL,
	size INTEGER NOT NULL,
	content_type VARCHAR(255) NOT NULL,
	uploaded_by UUID REFERENCES users(id) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	-- unique filename per project
	CONSTRAINT unique_project_filename UNIQUE(project_id, filename)
);

-- create api_keys
CREATE TABLE IF NOT EXISTS api_keys(
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	token VARCHAR(255) UNIQUE NOT NULL,
	name VARCHAR(255) NOT NULL,
	project_id UUID REFERENCES projects(id) NOT NULL,
	user_id UUID REFERENCES users(id) NOT NULL,
	expires_at TIMESTAMPTZ NOT NULL,
	revoked_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- create signed_urls
-- CREATE TABLE IF NOT EXISTS signed_urls(
-- 	id UUID PRIMARY KEY DEFAULT gen_random_uuid()
-- 	url VARCHAR(1000) NOT NULL,
-- 	file_id UUID REFERENCES files(id) NOT NULL,
-- 	project_id UUID REFERENCES projects(id) NOT NULL,
-- 	allowed_operation VARCHAR(10) NOT NULL, -- (read, write)
-- 	expires_at TIMESTAMPTZ NOT NULL,
-- 	revoked_at TIMESTAMPTZ,
-- 	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );