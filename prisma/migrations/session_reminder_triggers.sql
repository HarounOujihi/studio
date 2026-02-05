-- Database functions and triggers for automatic session reminder job creation

-- Function to calculate reminder time (1 hour before session)
CREATE OR REPLACE FUNCTION calculate_session_reminder_time(session_time TIMESTAMP)
RETURNS TIMESTAMP AS $$
BEGIN
    -- Return 1 hour before the session time
    RETURN session_time - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to create or update a session reminder job for training sessions
CREATE OR REPLACE FUNCTION create_or_update_training_session_reminder()
RETURNS TRIGGER AS $$
DECLARE
    reminder_time TIMESTAMP;
    existing_job_id UUID;
    session_time TIMESTAMP;
    session_from_time TIME;
    session_location TEXT;
    session_datetime TIMESTAMP;
BEGIN
    -- Only proceed if enrollment status is ENROLLED
    IF NEW.status != 'ENROLLED' AND OLD.status = 'ENROLLED' THEN
        -- Status changed from ENROLLED to something else, remove pending jobs
        DELETE FROM "Job"
        WHERE "idEtb" = NEW."idEtb"
        AND "idOrg" = NEW."idOrg"
        AND type = 'SESSION_REMINDER'
        AND status IN ('PENDING', 'PROCESSING')
        AND payload->>'enrollmentId' = NEW.id;

        RETURN NEW;
    END IF;

    -- Only create jobs when status changes TO ENROLLED
    IF NEW.status != 'ENROLLED' OR OLD.status = 'ENROLLED' THEN
        RETURN NEW;
    END IF;

    -- Find the first upcoming training schedule for this course
    SELECT ts."scheduleDate", tsession."fromTime", tsession."location"
    INTO session_time, session_from_time, session_location
    FROM "TrainingSchedule" ts
    LEFT JOIN "TrainingSession" tsession ON tsession."idSchedule" = ts.id
    WHERE ts."idArticle" = NEW."idCourse"
    AND ts."scheduleDate" > NOW()
    ORDER BY ts."scheduleDate" ASC, tsession."fromTime" ASC
    LIMIT 1;

    -- If no upcoming session found, don't create a job
    IF session_time IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calculate session datetime by combining date and time
    session_datetime := session_time;
    IF session_from_time IS NOT NULL THEN
        session_datetime := session_datetime + session_from_time;
    END IF;

    -- Calculate reminder time (1 hour before session)
    reminder_time := calculate_session_reminder_time(session_datetime);

    -- Check if a job already exists for this enrollment
    SELECT id INTO existing_job_id
    FROM "Job"
    WHERE "idEtb" = NEW."idEtb"
    AND "idOrg" = NEW."idOrg"
    AND type = 'SESSION_REMINDER'
    AND payload->>'enrollmentId' = NEW.id
    AND status IN ('PENDING', 'PROCESSING');

    IF existing_job_id IS NOT NULL THEN
        -- Update existing job with new schedule time
        UPDATE "Job"
        SET "scheduledAt" = reminder_time,
            "updatedAt" = NOW()
        WHERE id = existing_job_id;
    ELSE
        -- Create new job
        INSERT INTO "Job" (
            id,
            type,
            status,
            "scheduledAt",
            payload,
            "maxAttempts",
            "idOrg",
            "idEtb",
            "createdAt",
            "updatedAt"
        ) VALUES (
            gen_random_uuid(),
            'SESSION_REMINDER',
            'PENDING',
            reminder_time,
            jsonb_build_object(
                'enrollmentId', NEW.id,
                'sessionType', 'training'
            ),
            3,
            NEW."idOrg",
            NEW."idEtb",
            NOW(),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create or update a session reminder job for consultation sessions
CREATE OR REPLACE FUNCTION create_or_update_consultation_session_reminder()
RETURNS TRIGGER AS $$
DECLARE
    reminder_time TIMESTAMP;
    existing_job_id UUID;
BEGIN
    -- Remove existing pending jobs if consultation is being cancelled/rescheduled
    IF (OLD.status IS NOT NULL AND NEW.status != OLD.status) OR
       (OLD."startedAt" IS NOT NULL AND NEW."startedAt" != OLD."startedAt") OR
       (OLD."idTrainer" IS NOT NULL AND NEW."idTrainer" != OLD."idTrainer") THEN

        -- Delete existing pending/processing jobs
        DELETE FROM "Job"
        WHERE "idEtb" = NEW."idEtb"
        AND "idOrg" = NEW."idOrg"
        AND type = 'SESSION_REMINDER'
        AND status IN ('PENDING', 'PROCESSING')
        AND payload->>'consultationId' = NEW.id;
    END IF;

    -- Only create jobs for active consultations with scheduled times and assigned trainers
    IF NEW.status IS NULL OR
       NEW."startedAt" IS NULL OR
       NEW."startedAt" <= NOW() OR
       NEW."idTrainer" IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calculate reminder time (1 hour before session)
    reminder_time := calculate_session_reminder_time(NEW."startedAt");

    -- Check if a job already exists for this consultation
    SELECT id INTO existing_job_id
    FROM "Job"
    WHERE "idEtb" = NEW."idEtb"
    AND "idOrg" = NEW."idOrg"
    AND type = 'SESSION_REMINDER'
    AND payload->>'consultationId' = NEW.id
    AND status IN ('PENDING', 'PROCESSING');

    IF existing_job_id IS NOT NULL THEN
        -- Update existing job with new schedule time
        UPDATE "Job"
        SET "scheduledAt" = reminder_time,
            "updatedAt" = NOW()
        WHERE id = existing_job_id;
    ELSE
        -- Create new job
        INSERT INTO "Job" (
            id,
            type,
            status,
            "scheduledAt",
            payload,
            "maxAttempts",
            "idOrg",
            "idEtb",
            "createdAt",
            "updatedAt"
        ) VALUES (
            gen_random_uuid(),
            'SESSION_REMINDER',
            'PENDING',
            reminder_time,
            jsonb_build_object(
                'consultationId', NEW.id,
                'sessionType', 'consultation'
            ),
            3,
            NEW."idOrg",
            NEW."idEtb",
            NOW(),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle TrainingSchedule changes
CREATE OR REPLACE FUNCTION handle_training_schedule_change()
RETURNS TRIGGER AS $$
DECLARE
    reminder_time TIMESTAMP;
    session_datetime TIMESTAMP;
    existing_job_id UUID;
    enrollment_record RECORD;
    first_session RECORD;
BEGIN
    -- Only process if schedule date is being updated
    IF NEW."scheduleDate" = OLD."scheduleDate" THEN
        RETURN NEW;
    END IF;

    -- Get the first session time
    SELECT * INTO first_session
    FROM "TrainingSession"
    WHERE "idSchedule" = NEW.id
    ORDER BY "fromTime" ASC
    LIMIT 1;

    -- Find enrollments for this course
    SELECT e."idOrg", e."idEtb", e.status, e.id as enrollment_id
    INTO enrollment_record
    FROM "Enrollment" e
    WHERE e."idCourse" = NEW."idArticle"
    AND e.status = 'ENROLLED'
    LIMIT 1;

    -- Only create jobs if there are enrolled sessions
    IF enrollment_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- If session is in the past, remove existing jobs
    IF NEW."scheduleDate" <= NOW() THEN
        DELETE FROM "Job"
        WHERE "idEtb" = enrollment_record."idEtb"
        AND "idOrg" = enrollment_record."idOrg"
        AND type = 'SESSION_REMINDER'
        AND status IN ('PENDING', 'PROCESSING')
        AND payload->>'enrollmentId' = enrollment_record.enrollment_id;
        RETURN NEW;
    END IF;

    -- Calculate session datetime
    session_datetime := NEW."scheduleDate";
    IF first_session."fromTime" IS NOT NULL THEN
        -- Parse the fromTime and add it to the date
        session_datetime := session_datetime + (first_session."fromTime"::time);
    END IF;

    -- Calculate reminder time (1 hour before session)
    reminder_time := calculate_session_reminder_time(session_datetime);

    -- Check if a job already exists
    SELECT id INTO existing_job_id
    FROM "Job"
    WHERE "idEtb" = enrollment_record."idEtb"
    AND "idOrg" = enrollment_record."idOrg"
    AND type = 'SESSION_REMINDER'
    AND payload->>'enrollmentId' = enrollment_record.enrollment_id
    AND status IN ('PENDING', 'PROCESSING');

    IF existing_job_id IS NOT NULL THEN
        -- Update existing job
        UPDATE "Job"
        SET "scheduledAt" = reminder_time,
            "updatedAt" = NOW()
        WHERE id = existing_job_id;
    ELSE
        -- Create new job
        INSERT INTO "Job" (
            id,
            type,
            status,
            "scheduledAt",
            payload,
            "maxAttempts",
            "idOrg",
            "idEtb",
            "createdAt",
            "updatedAt"
        ) VALUES (
            gen_random_uuid(),
            'SESSION_REMINDER',
            'PENDING',
            reminder_time,
            jsonb_build_object(
                'enrollmentId', enrollment_record.enrollment_id,
                'sessionType', 'training'
            ),
            3,
            enrollment_record."idOrg",
            enrollment_record."idEtb",
            NOW(),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers

-- Trigger for Enrollment status changes
CREATE TRIGGER enrollment_session_reminder_trigger
    AFTER UPDATE ON "Enrollment"
    FOR EACH ROW
    EXECUTE FUNCTION create_or_update_training_session_reminder();

-- Trigger for ConsultationManagement changes
CREATE TRIGGER consultation_session_reminder_trigger
    AFTER INSERT OR UPDATE ON "ConsultationManagement"
    FOR EACH ROW
    EXECUTE FUNCTION create_or_update_consultation_session_reminder();

-- Trigger for TrainingSchedule changes
CREATE TRIGGER training_schedule_session_reminder_trigger
    AFTER UPDATE ON "TrainingSchedule"
    FOR EACH ROW
    EXECUTE FUNCTION handle_training_schedule_change();

-- Create unique constraint to prevent duplicate reminder jobs
ALTER TABLE "Job"
ADD CONSTRAINT unique_session_reminder_job
UNIQUE (type, "idOrg", "idEtb", ((payload->>'enrollmentId')), ((payload->>'consultationId')))
WHERE type = 'SESSION_REMINDER' AND status IN ('PENDING', 'PROCESSING');

-- Create index for better performance
CREATE INDEX idx_job_session_reminder_lookup
ON "Job" (type, "idOrg", "idEtb", ((payload->>'enrollmentId')), ((payload->>'consultationId')))
WHERE type = 'SESSION_REMINDER';

-- Function to clean up completed jobs older than 7 days (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_completed_jobs()
RETURNS void AS $$
BEGIN
    DELETE FROM "Job"
    WHERE status IN ('COMPLETED', 'FAILED')
    AND ("completedAt" < NOW() - INTERVAL '7 days' OR "completedAt" IS NULL)
    AND type = 'SESSION_REMINDER';
END;
$$ LANGUAGE plpgsql;