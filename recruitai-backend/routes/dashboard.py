from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models import db, Candidate
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    total  = db.session.query(func.count(Candidate.candidate_id))\
               .filter(Candidate.match_score != None).scalar() or 0

    avg    = db.session.query(func.avg(Candidate.match_score))\
               .filter(Candidate.match_score != None).scalar()
    avg    = round(float(avg), 1) if avg else 0

    strong = db.session.query(func.count(Candidate.candidate_id))\
               .filter(Candidate.match_score >= 75).scalar() or 0

    # Top skills
    all_candidates = db.session.query(Candidate.matched_skills)\
                      .filter(Candidate.matched_skills != None).all()

    skill_freq = {}
    for (skills,) in all_candidates:
        if skills and isinstance(skills, list):
            for skill in skills:
                skill_freq[skill] = skill_freq.get(skill, 0) + 1

    top_skills = sorted(skill_freq.items(), key=lambda x: x[1], reverse=True)[:8]
    top_skills = [{ 'skill': s, 'count': c } for s, c in top_skills]

    return jsonify({
        'total':     total,
        'avg':       avg,
        'strong':    strong,
        'jobs':      1,
        'topSkills': top_skills,
    }), 200