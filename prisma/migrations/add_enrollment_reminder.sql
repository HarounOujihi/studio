CREATE OR REPLACE FUNCTION create_scheduled_reminder_jobs()
RETURNS TRIGGER AS $$ DECLARE
    -- A record variable to hold each schedule from the loop
    schedule_record RECORD;
    -- Variable to hold the start time of the first session for the current schedule
    first_session_start_time TIMESTAMP;
    -- Variable to hold the calculated scheduled time for the job
    job_scheduled_at TIMESTAMP;

    -- NEW: Variables to hold the Article's type information
    article_product_type "ProductType";
    article_service_type "ServiceType";
    session_type_value TEXT;
BEGIN
    -- Condition: Only run when the status changes TO 'ENROLLED'
    IF NEW.status = 'ENROLLED' AND OLD.status <> 'ENROLLED' THEN

        -- NEW: Query the Article to get its product and service types
        SELECT "productType", "serviceType"
        INTO article_product_type, article_service_type
        FROM "Article"
        WHERE "id" = NEW."idCourse";

        -- NEW: Determine the sessionType based on the article's types
        session_type_value := CASE
            WHEN article_product_type = 'WEBINAR' THEN 'training'
            WHEN article_product_type = 'SERVICE' AND article_service_type = 'CONSULTING' THEN 'consultation'
            ELSE NULL -- Will be omitted from the JSON if NULL
        END;

        -- Loop through each TrainingSchedule associated with the course
        FOR schedule_record IN 
            SELECT id, "scheduleDate" 
            FROM "TrainingSchedule" 
            WHERE "idArticle" = NEW."idCourse"
            ORDER BY "scheduleDate" ASC
        LOOP
            -- For the current schedule in the loop, find its FIRST session
            SELECT (ts."scheduleDate"::date || ' ' || s."fromTime"::time)::timestamp
            INTO first_session_start_time
            FROM "TrainingSchedule" ts
            JOIN "TrainingSession" s ON s."idSchedule" = ts.id
            WHERE ts.id = schedule_record.id
            ORDER BY s."fromTime" ASC
            LIMIT 1;

            -- If a session was found for this schedule, create the job.
            IF first_session_start_time IS NOT NULL THEN
                -- Calculate the job's scheduled time (1 hour before the session)
                job_scheduled_at := first_session_start_time - INTERVAL '1 hour';

                -- Insert a new record into the 'jobs' table.
                INSERT INTO "jobs" (
                    id,
                    type,
                    "idOrg",
                    "idEtb",
                    payload,
                    "scheduledAt"
                ) VALUES (
                    gen_random_uuid(),
                    'SESSION_REMINDER',
                    NEW."idOrg",
                    NEW."idEtb",
                    -- UPDATED: Added sessionType to the payload
                    jsonb_build_object(
                        'enrollmentId', NEW.id, 
                        'scheduleId', schedule_record.id,
                        'sessionType', session_type_value
                    ),
                    job_scheduled_at
                );
            END IF;

        END LOOP;

    END IF;

    -- Return the NEW row, which is standard for AFTER UPDATE triggers.
    RETURN NEW;
END;
 $$ LANGUAGE plpgsql;

-- 2. (Re)Create the trigger that calls the function.
DROP TRIGGER IF EXISTS trigger_create_job_on_enrollment_status_change ON "Enrollment";
CREATE TRIGGER trigger_create_job_on_enrollment_status_change
AFTER UPDATE ON "Enrollment"
FOR EACH ROW
EXECUTE FUNCTION create_scheduled_reminder_jobs();