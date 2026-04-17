CREATE DATABASE IF NOT EXISTS fittrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fittrack;

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- EXERCISE LIBRARY (knjižnica vaj - vnaprej napolnjena)
-- =====================================================
CREATE TABLE IF NOT EXISTS exercise_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    muscle_group VARCHAR(50) NOT NULL,
    equipment VARCHAR(50),
    difficulty ENUM('začetnik', 'srednje', 'napredno') DEFAULT 'srednje'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- WORKOUT TEMPLATES (npr. "Push", "Pull", "Legs")
-- Šablon treninga - ustvari enkrat, ponavljaš večkrat
-- =====================================================
CREATE TABLE IF NOT EXISTS workout_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vaje v šablonu (npr. Push ima: Bench Press, OHP, Dips)
CREATE TABLE IF NOT EXISTS template_exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    exercise_id INT NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercise_library(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- WORKOUT SESSIONS (vsak put ko greš vaditi)
-- npr. danes greš vaditi "Push" → nastane nova session
-- =====================================================
CREATE TABLE IF NOT EXISTS workout_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    template_id INT NULL,                  -- NULL če je šablon izbrisan
    template_name VARCHAR(100),            -- kopija imena šablona, shrani se ob snemanju seje
    session_date DATE NOT NULL,
    duration_minutes INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- SESSION LOGS (dejanski podatki vadbe)
-- npr. Bench Press: set 1 = 12 ponovitev @ 70kg
--                   set 2 = 10 ponovitev @ 70kg
-- =====================================================
CREATE TABLE IF NOT EXISTS session_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    exercise_id INT NOT NULL,
    set_number INT NOT NULL DEFAULT 1,
    reps INT NOT NULL,
    weight DECIMAL(6,2),
    notes TEXT,
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercise_library(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- NUTRITION
-- =====================================================
CREATE TABLE IF NOT EXISTS nutrition_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entry_date DATE NOT NULL,
    meal_type ENUM('zajtrk', 'kosilo', 'večerja', 'prigrizek') NOT NULL,
    food_name VARCHAR(100) NOT NULL,
    calories INT,
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fats DECIMAL(6,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- USER PROFILE & WEIGHT
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profile (
    user_id INT PRIMARY KEY,
    birth_date DATE,
    gender ENUM('moški', 'ženska', 'drugo'),
    height_cm INT,
    current_weight_kg DECIMAL(5,2),
    goal_weight_kg DECIMAL(5,2),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS weight_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    measured_date DATE NOT NULL,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- VNAPREJ NAPOLNJENA KNJIŽNICA VAJ
-- =====================================================
INSERT INTO exercise_library (name, description, muscle_group, equipment, difficulty) VALUES
('Bench Press', 'Osnovna vaja za razvoj prsnih mišic. Leži na klopi, palica nad prsmi, spuščaš do prsni mišici in dvigaš.', 'prsi', 'barbell', 'srednje'),
('Incline Bench Press', 'Razvija zgornji del prsnih mišic. Klop nastavljen na kot okrog 30 stopinj.', 'prsi', 'barbell', 'srednje'),
('Dumbbell Press', 'Vaja za prsne mišice z bučkami. Širši nabod kot pri bench press.', 'prsi', 'dumbbell', 'začetnik'),
('Push-ups', 'Klasični skleci z lastno teže. Roke široko narazen ali tesno.', 'prsi', 'bodyweight', 'začetnik'),
('Chest Fly', 'Izolacijska vaja za prsne mišice. Leži na klopi, bučki krožno spuščaš.', 'prsi', 'dumbbell', 'začetnik'),
('Dips', 'Odrinjavanja na vzporednicah. Razvija prsni mišici in triceps.', 'prsi', 'bodyweight', 'srednje'),
('Pull-ups', 'Klasični dvigi na precečniki. Široka uka za latissimus dorsi.', 'hrbet', 'bodyweight', 'srednje'),
('Lat Pulldown', 'Vlečenje navzdol na kabelski napravi za razvoj hrbta.', 'hrbet', 'cable', 'začetnik'),
('Barbell Row', 'Veslanje s palico v pokončni drži. Hrbet pokrizen naprej.', 'hrbet', 'barbell', 'srednje'),
('Dumbbell Row', 'Enoročno veslanje z bučko. Koleno na klopi za oporo.', 'hrbet', 'dumbbell', 'začetnik'),
('Deadlift', 'Mrtvi dvig. Palica dvigaš z zemlj do pas. Razvija celoten hrbet.', 'hrbet', 'barbell', 'napredno'),
('Cable Row', 'Veslanje na kabelski napravi v sedeči drži za srednji hrbet.', 'hrbet', 'cable', 'začetnik'),
('Squat', 'Klasični počepi. Palica na trapeziju, počepi do 90 stopinj.', 'noge', 'barbell', 'srednje'),
('Leg Press', 'Leg press naprava. Noge postaviš na ploščo in potiskaš.', 'noge', 'machine', 'začetnik'),
('Lunges', 'Izpadni koraki naprej z bučkami ali brez opreme.', 'noge', 'dumbbell', 'začetnik'),
('Romanian Deadlift', 'Romanski mrtvi dvig. Razvija zadnjo lojo noge (hamstrings).', 'noge', 'barbell', 'srednje'),
('Leg Curl', 'Pregibanje nog na napravi za razvoj hamstringov.', 'noge', 'machine', 'začetnik'),
('Leg Extension', 'Iztegovanje nog na napravi za razvoj kvadricepsa.', 'noge', 'machine', 'začetnik'),
('Calf Raises', 'Dvig na prstih za razvoj mecev. Stoji ali sede.', 'noge', 'bodyweight', 'začetnik'),
('Bulgarian Split Squat', 'Bugarski razdeljeni počepi. Ena noga za na klopi.', 'noge', 'dumbbell', 'srednje'),
('Overhead Press', 'Vojaski press nad glavo s palico. Razvija ramena.', 'ramena', 'barbell', 'srednje'),
('Dumbbell Shoulder Press', 'Press nad glavo z bučkami. Sede ali stoje.', 'ramena', 'dumbbell', 'začetnik'),
('Lateral Raises', 'Dvig bučk vstran za razvoj lateralnega deljta.', 'ramena', 'dumbbell', 'začetnik'),
('Front Raises', 'Dvig bučk spredaj za razvoj prednjega deljta.', 'ramena', 'dumbbell', 'začetnik'),
('Rear Delt Fly', 'Razvoj zadnjih ramen. Nagne naprej, bučki dvigi.', 'ramena', 'dumbbell', 'začetnik'),
('Arnold Press', 'Arnoldov press z rotacijo bučk med dvigom.', 'ramena', 'dumbbell', 'srednje'),
('Barbell Curl', 'Klasični curl za biceps s palico.', 'roke', 'barbell', 'začetnik'),
('Dumbbell Curl', 'Curl z bučkami alternativno ali hkrati.', 'roke', 'dumbbell', 'začetnik'),
('Hammer Curl', 'Kladivasti curl uka navzdol za brachialis.', 'roke', 'dumbbell', 'začetnik'),
('Tricep Pushdown', 'Potiskanje navzdol na kabelski napravi za triceps.', 'roke', 'cable', 'začetnik'),
('Skull Crushers', 'Lomilci lobanje za triceps s palico leže na klopi.', 'roke', 'barbell', 'srednje'),
('Tricep Dips', 'Odrinjavanja za triceps na klopi ali stolcu.', 'roke', 'bodyweight', 'začetnik'),
('Preacher Curl', 'Curl na preacher bench za izolirani biceps.', 'roke', 'barbell', 'začetnik'),
('Plank', 'Deska staticna drza za jedro. Drži 30 do 120 sekund.', 'trebuh', 'bodyweight', 'začetnik'),
('Crunches', 'Klasični trebušnjaki. Roke za glavo ali na prsi.', 'trebuh', 'bodyweight', 'začetnik'),
('Leg Raises', 'Dvig nog leže. Ravne noge dvigi do tla ali navpično.', 'trebuh', 'bodyweight', 'srednje'),
('Russian Twists', 'Zviti tupa levo desno za poševne mišice.', 'trebuh', 'bodyweight', 'začetnik'),
('Mountain Climbers', 'Plezalci kardio plus core hitro menjaj noge.', 'trebuh', 'bodyweight', 'srednje'),
('Ab Wheel Rollout', 'Kotaljenje z ab wheel napredna vaja za core.', 'trebuh', 'equipment', 'napredno'),
('Hanging Leg Raises', 'Dvig nog viseče na precečniki za spodnji del.', 'trebuh', 'bodyweight', 'srednje');

-- =====================================================
-- MIGRACIJA v3.1: Zaščita napredka vadb
-- Za OBSTOJEČE baze – zaženi samo enkrat
-- =====================================================

-- 1. Dodaj stolpec template_name v workout_sessions (če še ne obstaja)
ALTER TABLE workout_sessions
    ADD COLUMN IF NOT EXISTS template_name VARCHAR(100) AFTER template_id;

-- 2. Zapolni template_name iz obstoječih šablonov (za stare seje)
UPDATE workout_sessions ws
    JOIN workout_templates wt ON ws.template_id = wt.id
    SET ws.template_name = wt.name
    WHERE ws.template_name IS NULL OR ws.template_name = '';

-- 3. Odstrani stari CASCADE FK in dodaj SET NULL FK na template_id
ALTER TABLE workout_sessions
    DROP FOREIGN KEY IF EXISTS workout_sessions_ibfk_2;

ALTER TABLE workout_sessions
    MODIFY COLUMN template_id INT NULL,
    ADD CONSTRAINT fk_ws_template
        FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL;
