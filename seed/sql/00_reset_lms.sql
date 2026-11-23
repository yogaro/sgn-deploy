-- Empties every LMS table that holds sample or copied data. Kept: the 17 clusters (course.categories), the 8 Knowledge Hub
-- categories, certificate settings, and uploaded files (the media clean-up removes the ones nothing uses after 7 days).
-- Run on db_lms after the IAM reset; the next sync copies the org and people again.
BEGIN;
TRUNCATE
  core.employees, core.positions, core.org_units,
  course.courses, course.versions, course.sections, course.lessons, course.questions, course.options, course.course_trainers,
  learning.enrollments, learning.lesson_progress, learning.quiz_attempts, learning.attempt_allowances, learning.enrollment_assignments,
  learning.preferences, learning.interest_clusters, learning.notification_seen,
  assign.assignments, assign.jobs, assign.targets,
  cert.certificates, cert.credentials,
  comp.assessments, comp.competencies, comp.course_competencies,
  ev.behaviors, ev.impacts, ev.reactions, ev.rounds,
  lna.periods, lna.proposals, lna.steps, lna.representatives,
  lp.edges, lp.nodes,
  onsite.attendees, onsite.sessions,
  kh.items, kh.tags, kh.item_competencies, kh.item_images, kh.favorites, kh.reads
  RESTART IDENTITY CASCADE;
UPDATE core.sync_state SET last_synced = NULL;
COMMIT;
