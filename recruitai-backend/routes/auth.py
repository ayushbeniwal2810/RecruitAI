import os
import uuid
import bcrypt
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from models import db, LoginCredential, Recruiter, Candidate

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


# ---------- helpers ----------
def get_profile_by_credential(credential):
    role = (credential.role or '').strip().lower()
    if role == 'recruiter':
        return Recruiter.query.filter_by(credential_id=credential.id).first()
    return Candidate.query.filter_by(credential_id=credential.id).first()


def profile_to_user_payload(credential, profile):
    return {
        'id': credential.id,
        'email': credential.email,
        'role': credential.role,
        'full_name': profile.full_name if profile else '',
        'company_name': getattr(profile, 'company_name', None) if profile else None,
        'profile_photo': getattr(profile, 'profile_photo', None) if profile else None,
        'theme': getattr(profile, 'theme', 'light') if profile else 'light'
    }


def allowed_file(filename):
    if not filename:
        return False
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    return ext in {'png', 'jpg', 'jpeg', 'webp'}


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            stored_hash.encode('utf-8')
        )
    except Exception:
        return False


# ---------- auth ----------
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    full_name = (data.get('full_name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    role = (data.get('role') or '').strip().lower()  # normalized
    company_name = (data.get('company_name') or '').strip() if role == 'recruiter' else None

    if not full_name or not email or not password or role not in ['recruiter', 'candidate']:
        return jsonify({'message': 'Please provide valid registration details'}), 400

    exists = LoginCredential.query.filter_by(email=email).first()
    if exists:
        return jsonify({'message': 'Email already registered'}), 409

    cred = LoginCredential(
        email=email,
        role=role,
        password_hash=hash_password(password)
    )
    db.session.add(cred)
    db.session.flush()

    if role == 'recruiter':
        profile = Recruiter(
            credential_id=cred.id,
            full_name=full_name,
            company_name=company_name or None,
            email=email,
            theme='light'
        )
    else:
        profile = Candidate(
            credential_id=cred.id,
            full_name=full_name,
            email=email,
            theme='light'
        )

    db.session.add(profile)
    db.session.commit()

    return jsonify({'message': 'Registration successful'}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    selected_role = (data.get('role') or '').strip().lower()  # case-insensitive input

    if not email or not password or selected_role not in ['recruiter', 'candidate']:
        return jsonify({'message': 'Enter valid credentials'}), 400

    credential = LoginCredential.query.filter_by(email=email).first()
    if not credential:
        return jsonify({'message': 'Enter valid credentials'}), 401

    db_role = (getattr(credential, 'role', '') or '').strip().lower()
    if db_role != selected_role:
        return jsonify({'message': 'Enter valid credentials'}), 401

    stored_hash = (credential.password_hash or '').strip()
    if not stored_hash:
        return jsonify({'message': 'Enter valid credentials'}), 401

    if not verify_password(password, stored_hash):
        return jsonify({'message': 'Enter valid credentials'}), 401

    profile = get_profile_by_credential(credential)
    token = create_access_token(identity=str(credential.id))

    return jsonify({
        'token': token,
        'user': profile_to_user_payload(credential, profile)
    }), 200


# ---------- profile/settings ----------
@auth_bp.route('/theme', methods=['PUT'])
@jwt_required()
def update_theme():
    data = request.get_json() or {}
    theme = (data.get('theme') or '').strip().lower()

    if theme not in ['light', 'dark']:
        return jsonify({'message': 'Invalid theme'}), 400

    cred_id = int(get_jwt_identity())
    credential = LoginCredential.query.get(cred_id)
    if not credential:
        return jsonify({'message': 'User not found'}), 404

    profile = get_profile_by_credential(credential)
    if not profile:
        return jsonify({'message': 'Profile not found'}), 404

    profile.theme = theme
    db.session.commit()

    return jsonify({'message': 'Theme updated', 'theme': theme}), 200


@auth_bp.route('/update-email', methods=['PUT'])
@jwt_required()
def update_email():
    data = request.get_json() or {}
    new_email = (data.get('email') or '').strip().lower()

    if not new_email or '@' not in new_email:
        return jsonify({'message': 'Invalid email'}), 400

    cred_id = int(get_jwt_identity())
    credential = LoginCredential.query.get(cred_id)
    if not credential:
        return jsonify({'message': 'User not found'}), 404

    other = LoginCredential.query.filter(
        LoginCredential.email == new_email,
        LoginCredential.id != cred_id
    ).first()
    if other:
        return jsonify({'message': 'Email already in use'}), 409

    credential.email = new_email
    profile = get_profile_by_credential(credential)
    if profile and hasattr(profile, 'email'):
        profile.email = new_email

    db.session.commit()
    return jsonify({'message': 'Email updated', 'email': new_email}), 200


@auth_bp.route('/upload-photo', methods=['POST'])
@jwt_required()
def upload_photo():
    cred_id = int(get_jwt_identity())
    credential = LoginCredential.query.get(cred_id)
    if not credential:
        return jsonify({'message': 'User not found'}), 404

    profile = get_profile_by_credential(credential)
    if not profile:
        return jsonify({'message': 'Profile not found'}), 404

    if 'photo' not in request.files:
        return jsonify({'message': 'No file part'}), 400

    file = request.files['photo']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'message': 'Only png, jpg, jpeg, webp allowed'}), 400

    upload_dir = os.path.join(current_app.root_path, 'uploads', 'profiles')
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit('.', 1)[-1].lower()
    safe_name = secure_filename(file.filename.rsplit('.', 1)[0])
    final_name = f"{cred_id}_{safe_name}_{uuid.uuid4().hex[:8]}.{ext}"
    save_path = os.path.join(upload_dir, final_name)
    file.save(save_path)

    public_path = f"/uploads/profiles/{final_name}"
    profile.profile_photo = public_path
    db.session.commit()

    return jsonify({
        'message': 'Profile photo uploaded',
        'profile_photo': public_path
    }), 200