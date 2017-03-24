CREATE TABLE background_managers (     
	id SERIAL PRIMARY KEY,     
	name TEXT NOT NULL,     
	password TEXT NOT NULL,    
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 

CREATE TABLE sites (     
	id SERIAL PRIMARY KEY,     
	name TEXT NOT NULL,     
	type TEXT NOT NULL,     
	address TEXT NOT NULL,     
	code TEXT NOT NULL,     
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 

CREATE TABLE users (     
	id SERIAL PRIMARY KEY,     
	email TEXT UNIQUE NOT NULL,      
	password TEXT,     
	name TEXT,     
	phone TEXT,     
	address TEXT,     
	site TEXT,     
	title TEXT,   
	type TEXT NOT NULL DEFAULT 'EXTERNAL', --EXTERNAL/INTERNAL
	state TEXT NOT NULL, --VERIFIED/PENDING/DENY     
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 

CREATE TABLE studies (     
	id SERIAL PRIMARY KEY,     
	uid TEXT NOT NULL UNIQUE,     
	name TEXT NOT NULL,     
	type TEXT NOT NULL,     
	state TEXT NOT NULL, --INIT/ONGOING/LOCKED/COMPLETE     
	contract_number INTEGER NOT NULL,     
	due_date TIMESTAMP,     
	need_audit BOOLEAN NOT NULL,     
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 

CREATE TABLE study_sites (     
	id SERIAL PRIMARY KEY,     
	uid TEXT NOT NULL,     
	study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,     
	site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,     
	contract_number INTEGER NOT NULL,     
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     
	UNIQUE(study_id, site_id) 
); 

CREATE TABLE roles (     
	id SERIAL PRIMARY KEY,     
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- should have one not null within site, study, site ids     
	study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,     
	site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,     
	type TEXT NOT NULL, --STUDY_ADMIN/SITE_ADMIN/INPUTTER/AUDITOR     
	state TEXT NOT NULL, --ENABLE/DISABLED    
	expiring_date TIMESTAMP, 
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     
	UNIQUE(user_id, study_id, site_id, type) 
); 

