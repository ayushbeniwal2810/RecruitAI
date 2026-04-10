from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class LoginCredential(db.Model):
    __tablename__ = 'login_credentials'

    id            = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email         = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.Enum('recruiter', 'candidate'), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    recruiter = db.relationship('Recruiter', backref='credential', uselist=False)
    candidate = db.relationship('Candidate', backref='credential', uselist=False)

    def to_dict(self):
        return {
            'id':    self.id,
            'email': self.email,
            'role':  self.role,
        }


class Recruiter(db.Model):
    __tablename__ = 'recruiters'

    recruiter_id  = db.Column(db.Integer, primary_key=True, autoincrement=True)
    credential_id = db.Column(db.Integer, db.ForeignKey('login_credentials.id'), nullable=False)
    full_name     = db.Column(db.String(100), nullable=False)
    company_name  = db.Column(db.String(100))
    email         = db.Column(db.String(100))
    profile_photo = db.Column(db.String(255))
    theme         = db.Column(db.Enum('light', 'dark'), default='light')
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    jobs = db.relationship('JobDescription', backref='recruiter', lazy=True)

    def to_dict(self):
        return {
            'recruiter_id': self.recruiter_id,
            'full_name':    self.full_name,
            'company_name': self.company_name,
            'email':        self.email,
            'profile_photo': self.profile_photo,
            'theme':        self.theme or 'light',
            'role':         'recruiter',
            'created_at':   str(self.created_at),
        }


class Candidate(db.Model):
    __tablename__ = 'candidates'

    candidate_id     = db.Column(db.Integer, primary_key=True, autoincrement=True)
    credential_id    = db.Column(db.Integer, db.ForeignKey('login_credentials.id'), nullable=False)
    full_name        = db.Column(db.String(100), nullable=False)
    email            = db.Column(db.String(100))
    profile_photo    = db.Column(db.String(255))
    theme            = db.Column(db.Enum('light', 'dark'), default='light')
    file_path        = db.Column(db.String(255))
    file_name        = db.Column(db.String(255))
    raw_text         = db.Column(db.Text)
    parsed_skills    = db.Column(db.JSON)
    experience_years = db.Column(db.Float, default=0)
    match_score      = db.Column(db.Float, default=0)
    ai_verdict       = db.Column(db.Enum('Strong Match', 'Moderate Match', 'Weak Match'))
    matched_skills   = db.Column(db.JSON)
    missing_skills   = db.Column(db.JSON)
    recommendation   = db.Column(db.Enum('Shortlist', 'Consider', 'Reject'))
    summary          = db.Column(db.Text)
    status           = db.Column(db.Enum('Pending', 'Shortlisted', 'Rejected'), default='Pending')
    applied_jd_id    = db.Column(db.Integer, db.ForeignKey('job_descriptions.jd_id'))
    uploaded_at      = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'candidate_id':    self.candidate_id,
            'full_name':       self.full_name,
            'email':           self.email,
            'profile_photo':   self.profile_photo,
            'theme':           self.theme or 'light',
            'role':            'candidate',
            'match_score':     self.match_score,
            'ai_verdict':      self.ai_verdict,
            'matched_skills':  self.matched_skills,
            'missing_skills':  self.missing_skills,
            'recommendation':  self.recommendation,
            'summary':         self.summary,
            'status':          self.status,
            'experience_years': self.experience_years,
            'uploaded_at':     str(self.uploaded_at),
        }


class JobDescription(db.Model):
    __tablename__ = 'job_descriptions'

    jd_id           = db.Column(db.Integer, primary_key=True, autoincrement=True)
    recruiter_id    = db.Column(db.Integer, db.ForeignKey('recruiters.recruiter_id'), nullable=False)
    role_title      = db.Column(db.String(100), nullable=False)
    description     = db.Column(db.Text, nullable=False)
    required_skills = db.Column(db.JSON)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    candidates = db.relationship('Candidate', backref='job', lazy=True,
                                  foreign_keys='Candidate.applied_jd_id')

    def to_dict(self):
        return {
            'jd_id':           self.jd_id,
            'recruiter_id':    self.recruiter_id,
            'role_title':      self.role_title,
            'description':     self.description,
            'required_skills': self.required_skills,
            'created_at':      str(self.created_at),
            'applicants':      len(self.candidates),
        }