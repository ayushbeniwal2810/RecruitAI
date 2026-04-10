import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db

from routes.auth import auth_bp
from routes.recruiter import recruiter_bp
from routes.candidate import candidate_bp
from routes.dashboard import dashboard_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    JWTManager(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(recruiter_bp, url_prefix='/api/recruiter')
    app.register_blueprint(candidate_bp, url_prefix='/api/candidate')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    with app.app_context():
        db.create_all()
        print('✅ All database tables created successfully.')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'RecruitAI backend is running 🚀'}

    @app.route('/uploads/<path:filename>')
    def uploaded_files(filename):
        upload_root = os.path.join(app.root_path, 'uploads')
        return send_from_directory(upload_root, filename)

    return app


if __name__ == '__main__':
    app = create_app()
    print('🚀 Starting RecruitAI backend on http://localhost:5000')
    app.run(debug=True, port=5000)