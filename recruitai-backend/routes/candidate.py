import os
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, LoginCredential, Candidate, JobDescription
from nlp.parser import extract_text
from nlp.extractor import extract_skills, extract_experience_years
from nlp.scorer import full_screening

candidate_bp = Blueprint('candidate', __name__)


def get_candidate():
    credential_id = int(get_jwt_identity())
    credential = LoginCredential.query.get(credential_id)

    if not credential or credential.role != 'candidate':
        return None

    candidate = Candidate.query.filter_by(credential_id=credential_id).first()

    # Auto-create candidate profile row if missing
    if not candidate:
        candidate = Candidate(
            credential_id=credential_id,
            full_name='Candidate',
            email=credential.email
        )
        db.session.add(candidate)
        db.session.commit()

    return candidate


def allowed_file(filename):
    allowed = current_app.config['ALLOWED_EXTENSIONS']
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed


# ── Upload Resume + Screen ─────────────────────────────────────────────────────
@candidate_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_resume():
    candidate = get_candidate()
    if not candidate:
        return jsonify({'message': 'Unauthorized.'}), 403

    if 'resume' not in request.files:
        return jsonify({'message': 'No resume file uploaded.'}), 400

    file = request.files['resume']
    jd_id = request.form.get('jd_id', '').strip()

    if not file.filename:
        return jsonify({'message': 'No file selected.'}), 400

    if not allowed_file(file.filename):
        return jsonify({'message': 'Only PDF, DOCX, or TXT files are allowed.'}), 400

    if not jd_id:
        return jsonify({'message': 'Please select a job.'}), 400

    # Get job description
    jd = JobDescription.query.get(int(jd_id))
    if not jd:
        return jsonify({'message': 'Job not found.'}), 404

    # Save file
    filename = secure_filename(file.filename)
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    # Extract text
    try:
        resume_text = extract_text(file_path)
    except RuntimeError as e:
        return jsonify({'message': str(e)}), 422

    # NLP extraction
    skills = extract_skills(resume_text)
    experience_years = extract_experience_years(resume_text)

    # Run AI screening
    result = full_screening(resume_text, jd.description, skills)

    # Save results to candidate profile
    candidate.file_path = file_path
    candidate.file_name = filename
    candidate.raw_text = resume_text
    candidate.parsed_skills = skills
    candidate.experience_years = experience_years
    candidate.match_score = result['score']
    candidate.ai_verdict = result['verdict']
    candidate.matched_skills = result['matchedSkills']
    candidate.missing_skills = result['missingSkills']
    candidate.recommendation = result['recommendation']
    candidate.summary = result['summary']
    candidate.applied_jd_id = jd.jd_id
    candidate.status = 'Pending'

    db.session.commit()

    return jsonify({
        'score': result['score'],
        'verdict': result['verdict'],
        'recommendation': result['recommendation'],
        'summary': result['summary'],
        'experienceYears': result['experienceYears'],
        'matchedSkills': result['matchedSkills'],
        'missingSkills': result['missingSkills'],
        'tfidfScore': result['tfidfScore'],
    }), 200


# ── Resume Download / View ─────────────────────────────────────────────────────
@candidate_bp.route('/resume', methods=['GET'])
@jwt_required()
def download_resume():
    candidate = get_candidate()
    if not candidate:
        return jsonify({'message': 'Unauthorized.'}), 403

    if not candidate.file_path or not os.path.exists(candidate.file_path):
        return jsonify({'message': 'Resume file not found.'}), 404

    view_mode = request.args.get('view', '0') == '1'

    return send_file(
        candidate.file_path,
        as_attachment=not view_mode,
        download_name=candidate.file_name or 'resume'
    )


# ── Get My Profile + Results ───────────────────────────────────────────────────
@candidate_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    candidate = get_candidate()
    if not candidate:
        return jsonify({'message': 'Unauthorized.'}), 403

    data = candidate.to_dict()

    applied_jobs = []

    if candidate.applied_jd_id:
        jd = JobDescription.query.get(candidate.applied_jd_id)
        if jd:
            data['role_title'] = jd.role_title
            applied_jobs.append({
                'jd_id': jd.jd_id,
                'role_title': jd.role_title,
                'description': jd.description,
                'created_at': jd.created_at.isoformat() if jd.created_at else None,
                'application_status': candidate.status or 'Pending',
                'match_score': candidate.match_score or 0,
            })

    if candidate.file_name:
        data['resume_file_name'] = candidate.file_name
        data['resume_download_url'] = '/api/candidate/resume'
        data['resume_view_url'] = '/api/candidate/resume?view=1'

    data['applied_jobs'] = applied_jobs

    return jsonify(data), 200