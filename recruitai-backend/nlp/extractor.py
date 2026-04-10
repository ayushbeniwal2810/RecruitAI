import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Download required NLTK data on first run
try:
    stopwords.words('english')
except LookupError:
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt',     quiet=True)
    nltk.download('punkt_tab', quiet=True)

SKILLS_DB = {
    # Programming
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#',
    'r', 'go', 'rust', 'kotlin', 'swift', 'php', 'ruby', 'scala',
    # Web
    'react', 'angular', 'vue', 'html', 'css', 'bootstrap',
    'tailwind', 'nextjs', 'redux', 'nodejs',
    # Backend
    'flask', 'django', 'fastapi', 'express', 'spring',
    # Database
    'mysql', 'postgresql', 'mongodb', 'sqlite', 'redis', 'firebase',
    # AI/ML
    'machine learning', 'deep learning', 'nlp', 'computer vision',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn',
    'pandas', 'numpy', 'matplotlib', 'opencv', 'transformers',
    'tfidf', 'cosine similarity', 'xgboost',
    # DevOps
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git',
    'github', 'linux', 'jenkins',
    # Data
    'sql', 'data analysis', 'data science', 'power bi',
    'tableau', 'excel', 'hadoop', 'spark',
    # Tools
    'postman', 'jupyter', 'google colab', 'figma',
}


def extract_skills(text: str) -> list:
    text_lower = text.lower()
    found = []
    for skill in SKILLS_DB:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return sorted(found)


def extract_experience_years(text: str) -> float:
    text_lower = text.lower()

    # 1) Direct year mentions: "3 years", "2.5+ yrs", "experience: 4 years"
    patterns = [
        r'(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b',
        r'experience[:\s]*([0-9]+(?:\.[0-9]+)?)\s*\+?\s*(?:years?|yrs?)\b',
        r'([0-9]+(?:\.[0-9]+)?)\s*\+?\s*(?:years?|yrs?)\s+of\s+experience\b',
    ]

    found_numbers = []
    for p in patterns:
        for m in re.findall(p, text_lower):
            try:
                v = float(m)
                if 0 <= v <= 50:
                    found_numbers.append(v)
            except Exception:
                pass

    if found_numbers:
        return max(found_numbers)

    # 2) Date-range fallback: "Jan 2021 - Present", "2019 - 2023"
    month_re = r'(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*'
    range_pattern = rf'(?:{month_re}\s+)?(20\d{{2}}|19\d{{2}})\s*[-–to]+\s*(?:present|current|now|(?:{month_re}\s+)?(20\d{{2}}|19\d{{2}}))'
    ranges = re.findall(range_pattern, text_lower)

    years = []
    for r in ranges:
        # r can contain groups; pick numeric years from tuple
        nums = [x for x in r if isinstance(x, str) and x.isdigit()]
        if not nums:
            continue
        start = int(nums[0])
        if len(nums) > 1:
            end = int(nums[1])
        else:
            from datetime import datetime
            end = datetime.now().year

        if 1900 <= start <= end <= 2100:
            years.append(end - start)

    if years:
        return float(max(years))

    return 0.0


def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    try:
        tokens = word_tokenize(text)
        stop   = set(stopwords.words('english'))
        tokens = [t for t in tokens if t not in stop and len(t) > 1]
        return ' '.join(tokens)
    except Exception:
        return text