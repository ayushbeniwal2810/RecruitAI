from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, LoginCredential, Recruiter, Candidate, JobDescription
from sqlalchemy import desc

recruiter_bp = Blueprint('recruiter', __name__)


def get_recruiter():
    credential_id = int(get_jwt_identity())
    credential    = LoginCredential.query.get(credential_id)
    if not credential or credential.role != 'recruiter':
        return None
    return Recruiter.query.filter_by(credential_id=credential_id).first()


# ── Post a Job ─────────────────────────────────────────────────────────────────
@recruiter_bp.route('/job', methods=['POST'])
@jwt_required()
def post_job():
    recruiter = get_recruiter()
    if not recruiter:
        return jsonify({ 'message': 'Unauthorized.' }), 403

    data        = request.get_json()
    role_title  = data.get('role_title',  '').strip()
    description = data.get('description','').strip()
    skills      = data.get('required_skills', [])

    if not role_title or not description:
        return jsonify({ 'message': 'Role title and description are required.' }), 400

    jd = JobDescription(
        recruiter_id    = recruiter.recruiter_id,
        role_title      = role_title,
        description     = description,
        required_skills = skills,
    )
    db.session.add(jd)
    db.session.commit()

    return jsonify({ 'message': 'Job posted successfully.', 'job': jd.to_dict() }), 201


# ── Get All Jobs ───────────────────────────────────────────────────────────────
@recruiter_bp.route('/jobs', methods=['GET'])
@jwt_required()
def get_jobs():
    recruiter = get_recruiter()
    if not recruiter:
        # Allow candidates to view jobs too
        jobs = JobDescription.query.order_by(desc(JobDescription.created_at)).all()
        return jsonify({ 'jobs': [j.to_dict() for j in jobs] }), 200

    jobs = JobDescription.query.filter_by(
        recruiter_id=recruiter.recruiter_id
    ).order_by(desc(JobDescription.created_at)).all()

    return jsonify({ 'jobs': [j.to_dict() for j in jobs] }), 200


# ── Delete a Job ───────────────────────────────────────────────────────────────
@recruiter_bp.route('/job/<int:jd_id>', methods=['DELETE'])
@jwt_required()
def delete_job(jd_id):
    recruiter = get_recruiter()
    if not recruiter:
        return jsonify({ 'message': 'Unauthorized.' }), 403

    jd = JobDescription.query.filter_by(
        jd_id=jd_id,
        recruiter_id=recruiter.recruiter_id
    ).first()

    if not jd:
        return jsonify({ 'message': 'Job not found.' }), 404

    db.session.delete(jd)
    db.session.commit()

    return jsonify({ 'message': 'Job deleted successfully.' }), 200


# ── Get All Candidates ─────────────────────────────────────────────────────────
@recruiter_bp.route('/candidates', methods=['GET'])
@jwt_required()
def get_candidates():
    recruiter = get_recruiter()
    if not recruiter:
        return jsonify({ 'message': 'Unauthorized.' }), 403

    candidates = Candidate.query.filter(
        Candidate.match_score != None
    ).order_by(desc(Candidate.match_score)).all()

    return jsonify({
        'candidates': [c.to_dict() for c in candidates],
        'total':      len(candidates),
    }), 200


# ── Shortlist or Reject Candidate ──────────────────────────────────────────────
@recruiter_bp.route('/candidate/<int:candidate_id>', methods=['PATCH'])
@jwt_required()
def update_candidate_status(candidate_id):
    recruiter = get_recruiter()
    if not recruiter:
        return jsonify({ 'message': 'Unauthorized.' }), 403

    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({ 'message': 'Candidate not found.' }), 404

    data   = request.get_json()
    status = data.get('status', '').strip()

    if status not in ['Shortlisted', 'Rejected', 'Pending']:
        return jsonify({ 'message': 'Invalid status.' }), 400

    candidate.status = status
    db.session.commit()

    return jsonify({
        'message':   f'Candidate {status.lower()} successfully.',
        'candidate': candidate.to_dict(),
    }), 200