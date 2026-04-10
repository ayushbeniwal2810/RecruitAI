import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

class Config:
    # Database
    DB_HOST     = os.getenv('DB_HOST',     'localhost')
    DB_PORT     = os.getenv('DB_PORT',     '3306')
    DB_USER     = os.getenv('DB_USER',     'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME     = os.getenv('DB_NAME',     'recruitai')

    # quote_plus encodes special characters like @ in the password
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'secret')

    # File Upload
    UPLOAD_FOLDER      = os.path.join(os.path.dirname(__file__), 'uploads')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

    # Anthropic
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')