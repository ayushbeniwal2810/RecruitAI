import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nlp.extractor import preprocess_text, extract_skills


# Load .env explicitly (stable in scripts + Flask runtime)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"))


def compute_tfidf_score(resume_text: str, jd_text: str) -> float:
    resume_clean = preprocess_text(resume_text)
    jd_clean = preprocess_text(jd_text)

    if not resume_clean or not jd_clean:
        return 0.0

    try:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([resume_clean, jd_clean])
        score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return round(float(score) * 100, 2)
    except Exception:
        return 0.0


def compute_skill_overlap(resume_skills: list, jd_text: str) -> tuple:
    jd_skills = extract_skills(jd_text)
    matched = [s for s in resume_skills if s in jd_skills]
    missing = [s for s in jd_skills if s not in resume_skills]
    return matched, missing


def _extract_json(text: str) -> dict:
    if not text:
        raise ValueError("Empty AI response")

    clean = text.strip().replace("```json", "").replace("```", "").strip()

    # Try direct parse
    try:
        return json.loads(clean)
    except Exception:
        pass

    # Try extracting JSON object substring
    start = clean.find("{")
    end = clean.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(clean[start:end + 1])

    raise ValueError("No valid JSON object in AI response")


def get_ai_analysis(resume_text: str, jd_text: str, tfidf_score: float) -> dict:
    api_key = os.getenv("NVIDIA_API_KEY", "")
    base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    model = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")

    if not api_key:
        print("NVIDIA_API_KEY missing — falling back to rule-based scoring")
        return _rule_based_verdict(tfidf_score)

    prompt = f"""You are an AI resume screening system.
Analyze this resume against the job description.
The TF-IDF cosine similarity score is: {tfidf_score}%.
Use this as a base but refine based on context.

RESUME:
{resume_text[:2500]}

JOB DESCRIPTION:
{jd_text[:1500]}

Return ONLY a valid JSON object — no markdown, no explanation, no code blocks:
{{
  "score": <integer 0-100>,
  "verdict": "<Strong Match|Moderate Match|Weak Match>",
  "recommendation": "<Shortlist|Consider|Reject>",
  "summary": "<2-3 sentence professional analysis>",
  "experienceYears": <estimated years as number>
}}"""

    try:
        client = OpenAI(api_key=api_key, base_url=base_url)

        response = client.chat.completions.create(
            model=model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": "Return only valid JSON. No markdown."},
                {"role": "user", "content": prompt},
            ],
        )

        raw = (response.choices[0].message.content or "").strip()
        parsed = _extract_json(raw)

        # Normalize / guardrails
        parsed_score = parsed.get("score", int(tfidf_score))
        try:
            parsed_score = int(float(parsed_score))
        except Exception:
            parsed_score = int(tfidf_score)
        parsed_score = max(0, min(100, parsed_score))

        verdict = parsed.get("verdict", "Moderate Match")
        if verdict not in ["Strong Match", "Moderate Match", "Weak Match"]:
            verdict = "Moderate Match"

        recommendation = parsed.get("recommendation", "Consider")
        if recommendation not in ["Shortlist", "Consider", "Reject"]:
            recommendation = "Consider"

        summary = str(parsed.get("summary", "")).strip()

        exp = parsed.get("experienceYears", 0)
        try:
            exp = float(exp)
            if exp < 0:
                exp = 0
        except Exception:
            exp = 0

        return {
            "score": parsed_score,
            "verdict": verdict,
            "recommendation": recommendation,
            "summary": summary,
            "experienceYears": exp,
        }

    except Exception as e:
        print(f"NVIDIA AI error: {e} — falling back to rule-based scoring")
        return _rule_based_verdict(tfidf_score)


def _rule_based_verdict(score: float) -> dict:
    if score >= 70:
        verdict = "Strong Match"
        rec = "Shortlist"
        summary = f"Strong candidate with a {int(score)}% match score. Skills align well with the job requirements. Recommended for further evaluation."
    elif score >= 45:
        verdict = "Moderate Match"
        rec = "Consider"
        summary = f"Moderate candidate with a {int(score)}% match score. Some relevant skills found but may lack certain requirements. Worth considering."
    else:
        verdict = "Weak Match"
        rec = "Reject"
        summary = f"Weak match with a {int(score)}% score. Candidate skills do not sufficiently align with the job requirements at this time."

    return {
        "score": int(score),
        "verdict": verdict,
        "recommendation": rec,
        "summary": summary,
        "experienceYears": 0,
    }


def full_screening(resume_text: str, jd_text: str, resume_skills: list) -> dict:
    tfidf_score = compute_tfidf_score(resume_text, jd_text)
    matched_skills, missing_skills = compute_skill_overlap(resume_skills, jd_text)

    # Boost score based on skill matches if tfidf is low
    if tfidf_score < 10 and len(matched_skills) > 0:
        skill_score = min(len(matched_skills) * 8, 90)
        tfidf_score = max(tfidf_score, skill_score)

    ai_result = get_ai_analysis(resume_text, jd_text, tfidf_score)

    return {
        "score": ai_result.get("score", int(tfidf_score)),
        "verdict": ai_result.get("verdict", "Moderate Match"),
        "recommendation": ai_result.get("recommendation", "Consider"),
        "summary": ai_result.get("summary", ""),
        "experienceYears": ai_result.get("experienceYears", 0),
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "tfidfScore": tfidf_score,
    }