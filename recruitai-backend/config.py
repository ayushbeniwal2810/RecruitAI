import os
from dotenv import load_dotenv
from urllib.parse import quote, quote_plus, unquote

load_dotenv()

class Config:
    # Supabase/PostgreSQL (preferred) or legacy MySQL variables
    DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
    if DATABASE_URL:
        if DATABASE_URL.startswith('postgres://'):
            DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
        # Supabase passwords may contain reserved URL characters. Re-encode
        # the password while keeping the host and query separate.
        if '://' in DATABASE_URL:
            scheme, remainder = DATABASE_URL.split('://', 1)
            if '@' in remainder:
                userinfo, hostinfo = remainder.rsplit('@', 1)
                if ':' in userinfo:
                    username, password = userinfo.split(':', 1)
                    password = unquote(password)
                    userinfo = f"{username}:{quote(password, safe='')}"
                    DATABASE_URL = f"{scheme}://{userinfo}@{hostinfo}"
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        DB_HOST = os.getenv('DB_HOST', 'localhost')
        DB_PORT = os.getenv('DB_PORT', '5432')
        DB_USER = os.getenv('DB_USER', 'postgres')
        DB_PASSWORD = os.getenv('DB_PASSWORD', '')
        DB_NAME = os.getenv('DB_NAME', 'postgres')
        SQLALCHEMY_DATABASE_URI = (
            f"postgresql+psycopg2://{DB_USER}:{quote_plus(DB_PASSWORD)}"
            f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'secret')

    # File Upload
    UPLOAD_FOLDER      = os.getenv('UPLOAD_FOLDER', os.path.join(os.path.dirname(__file__), 'uploads'))
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

    # Anthropic
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')