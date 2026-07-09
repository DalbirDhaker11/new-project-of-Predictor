"""
FastAPI backend for the Employee Resignation Risk Predictor.

This is a straight port of server.ts (Express) to Python, keeping the exact
same route paths and JSON request/response shapes so the existing React
frontend needs no changes. Uses the Gemini API (google-genai) for AI
features and MongoDB (via Motor) for optional persistence.
"""

from __future__ import annotations

import os
import time
import re
import random
import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Request
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import timedelta
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from model import Employee, DecisionTreeClassifier, generate_synthetic_hr_data
import db as dbmod

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

app = FastAPI(title="Employee Resignation Risk Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# AI Clients (Gemini & Groq)
# --------------------------------------------------------------------------

_GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
_genai_client = None
if _GEMINI_API_KEY and _GEMINI_API_KEY != "MY_GEMINI_API_KEY":
    try:
        from google import genai
        _genai_client = genai.Client(api_key=_GEMINI_API_KEY)
    except Exception as err:  # noqa: BLE001
        print(f"[gemini] Failed to initialize client: {err}")
        _genai_client = None


def _generate_content(prompt: str, system_instruction: str, temperature: float = 0.5,
                       json_mode: bool = False, contents: Any = None):
    """Thin wrapper around the Gemini API call, mirroring the TS server's usage."""
    if _genai_client is None:
        raise Exception("Gemini API key is missing or invalid.")

    from google.genai import types

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=temperature,
        response_mime_type="application/json" if json_mode else None,
    )
    return _genai_client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=contents if contents is not None else prompt,
        config=config,
    )


_GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
_groq_client = None
if _GROQ_API_KEY and _GROQ_API_KEY != "YOUR_GROQ_API_KEY_HERE":
    try:
        from groq import Groq
        _groq_client = Groq(api_key=_GROQ_API_KEY)
    except Exception as err:  # noqa: BLE001
        print(f"[groq] Failed to initialize client: {err}")
        _groq_client = None


class GroqResponse:
    def __init__(self, text: str):
        self.text = text


def _generate_content_groq(prompt: str, system_instruction: str, temperature: float = 0.5,
                           json_mode: bool = False, contents: Any = None):
    """Thin wrapper around the Groq API call."""
    if _groq_client is None:
        raise Exception("Groq API key is missing or invalid.")
        
    messages = [{"role": "system", "content": system_instruction}]
    
    if contents is not None:
        if isinstance(contents, list):
            messages.extend(contents)
        else:
            messages.append({"role": "user", "content": str(contents)})
    else:
        messages.append({"role": "user", "content": prompt})

    try:
        kwargs = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
            
        chat_completion = _groq_client.chat.completions.create(**kwargs)
        return GroqResponse(text=chat_completion.choices[0].message.content)
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "rate limit" in err_msg.lower():
            raise Exception("Groq API quota or rate limit exceeded. Please wait a bit before trying again.") from e
        raise e


# --------------------------------------------------------------------------
# Global in-memory state (mirrors server.ts)
# --------------------------------------------------------------------------

current_employees: List[Employee] = []
classifier = DecisionTreeClassifier()
classifier.fit(current_employees)

active_dataset_name: str = "Empty Dataset"

audit_log: List[Dict[str, Any]] = []


def log_action(action: str, details: str) -> None:
    audit_log.insert(0, {
        "id": f"AUD-{int(time.time() * 1000)}-{random.randint(0, 999)}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "details": details,
    })
    del audit_log[500:]


def scored(emp: Employee) -> Dict[str, Any]:
    pred = classifier.predict(emp)
    d = emp.to_dict()
    d["riskScore"] = pred["riskScore"]
    d["riskLevel"] = pred["riskLevel"]
    d["topRiskFactors"] = pred["topRiskFactors"]
    d["confidenceScore"] = pred.get("confidenceScore", 85)
    return d



# --------------------------------------------------------------------------
# Authentication
# --------------------------------------------------------------------------
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "fallback_secret_for_development_only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "manager"

class SocialLoginRequest(BaseModel):
    provider: str
    token: str
    email: str
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = await dbmod.get_user_by_email(email)
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/auth/register")
async def auth_register(req: RegisterRequest):
    existing = await dbmod.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await dbmod.create_user(req.email, req.name, req.role, req.password)
    return {"message": "User registered successfully"}

@app.post("/api/auth/login", response_model=Token)
async def auth_login(req: LoginRequest, request: Request):
    user = await dbmod.get_user_by_email(req.email)
    if not user:
        await dbmod.log_failed_login(req.email, request.client.host if request.client else "unknown", "User not found")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_sso"):
        if not dbmod.verify_password(req.password, user["password_hash"], user["salt"]):
            await dbmod.log_failed_login(req.email, request.client.host if request.client else "unknown", "Invalid password")
            raise HTTPException(status_code=401, detail="Invalid email or password")
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user["email"], "exp": expire}
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    user_out = dict(user)
    user_out.pop("password_hash", None)
    user_out.pop("salt", None)
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_out}

@app.post("/api/auth/social-login", response_model=Token)
async def auth_social_login(req: SocialLoginRequest):
    user = await dbmod.get_user_by_email(req.email)
    if not user:
        user = await dbmod.create_user(req.email, req.name, "manager", is_sso=True)
        
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user["email"], "exp": expire}
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    user_out = dict(user)
    user_out.pop("password_hash", None)
    user_out.pop("salt", None)
    return {"access_token": access_token, "token_type": "bearer", "user": user_out}

@app.get("/api/auth/me")
async def auth_me(current_user: dict = Depends(get_current_user)):
    user_out = dict(current_user)
    user_out.pop("password_hash", None)
    user_out.pop("salt", None)
    return user_out

# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------


@app.get("/api/health")
async def health(current_user: dict = Depends(get_current_user)):
    return {
        "status": "ok",
        "modelTrained": True,
        "modelMode": "heuristic" if classifier.use_heuristic else "trained",
        "rowCount": len(current_employees),
        "dbConnected": dbmod.is_db_connected(),
        "metrics": getattr(classifier, "metrics", {}),
    }


@app.get("/api/import-history")
async def import_history(current_user: dict = Depends(get_current_user)):
    try:
        history = await dbmod.get_import_history()
        return {"dbConnected": dbmod.is_db_connected(), "history": history}
    except Exception as err:  # noqa: BLE001
        return JSONResponse(status_code=500, content={"error": str(err)})


@app.get("/api/audit-log")
async def get_audit_log(current_user: dict = Depends(get_current_user)):
    return audit_log


@app.get("/api/employees")
async def get_employees(current_user: dict = Depends(get_current_user)):
    try:
        return [scored(e) for e in current_employees]
    except Exception as err:  # noqa: BLE001
        return JSONResponse(status_code=500, content={"error": str(err)})


@app.post("/api/train")
async def train(request: Request, current_user: dict = Depends(get_current_user)):
    global current_employees
    try:
        body = await request.json()
        employees_raw = body.get("employees")
        file_name = body.get("fileName") or "upload"

        if not isinstance(employees_raw, list) or len(employees_raw) == 0:
            if dbmod.is_db_connected():
                await dbmod.record_import(file_name, 0, "error", "Missing or invalid employee list")
            return JSONResponse(status_code=400, content={"error": "Missing or invalid employee list"})

        # Canonical field -> accepted exact-header aliases (normalized on the
        # fly: lowercased, punctuation/spaces stripped). Covers the common
        # ways an HR export might label each column.
        _FIELD_ALIASES: Dict[str, List[str]] = {
            "id": ["id", "employeeid", "empid", "employeecode", "empcode"],
            "name": ["name", "employeename", "fullname"],
            "department": ["department", "dept", "team", "function"],
            "role": ["role", "designation", "jobtitle", "position", "title", "jobrole"],
            "age": ["age", "employeeage"],
            "monthly_income": ["monthlyincome", "income", "salary", "monthlysalary", "grosssalary", "ctc", "monthlyctc", "pay"],
            "years_at_company": ["yearsatcompany", "tenure", "yearsofservice", "experienceatcompany", "yearswithcompany"],
            "years_since_last_promotion": ["yearssincelastpromotion", "yearssincepromotion", "lastpromotion"],
            "distance_from_home_km": ["distancefromhomekm", "distancefromhome", "distance", "commutekm", "commutedistance", "distancefromoffice"],
            "overtime": ["overtime", "overtimerequired", "ot"],
            "job_satisfaction": ["jobsatisfaction", "jobsat"],
            "work_life_balance": ["worklifebalance", "wlb", "worklife"],
            "environment_satisfaction": ["environmentsatisfaction", "envsat", "environmentrating", "workplacesatisfaction", "companyculturerating", "benefitssatisfaction"],
            "num_companies_worked": ["numcompaniesworked", "priorcompanies", "numberofcompanies", "companiesworked"],
            "training_hours_last_year": ["traininghourslastyear", "traininghours", "trainingcompleted"],
            "attrition": ["attrition", "left", "resigned", "hasleft", "status", "attritionstatus"],
            "_overtime_hours": ["overtimehours", "weeklyovertimehours"],
            "email": ["email", "emailaddress", "mail", "empemail"],
            "gender": ["gender", "sex"],
            "marital_status": ["maritalstatus", "marital", "relationshipstatus"],
            "job_level": ["joblevel", "level", "grade"],
            "years_in_role": ["yearsinrole", "yearsincurrentrole", "timeinrole"],
            "years_with_curr_manager": ["yearswithcurrmanager", "yearswithmanager", "tenurewithmanager", "withmanager"],
            "incentives_bonus": ["incentivesbonus", "incentives", "bonus", "bonusamount"],
            "market_benchmark": ["marketbenchmark", "benchmark", "marketrate"],
            "benefits_satisfaction": ["benefitssatisfaction", "benefitssat", "benefitsrating"],
            "weekly_hours": ["weeklyhours", "hoursperweek", "workhours"],
            "weekend_work": ["weekendwork", "weekends"],
            "travel_frequency": ["travelfrequency", "travel", "businesstravel"],
            "manager_relation": ["managerrelation", "managerrelationship", "managerrating", "relationswithmanager"],
            "recognition_frequency": ["recognitionfrequency", "recognition", "recognitionrating"],
        }
        # If an exact alias isn't found, fall back to scanning every column
        # name for these substrings (checked in priority order). This catches
        # header variants no one thought to alias explicitly, e.g. a column
        # literally named "DistanceFromOffice_KM" or "AnnualCTC".
        _FIELD_KEYWORDS: Dict[str, List[str]] = {
            "distance_from_home_km": ["distance", "commute"],
            "monthly_income": ["salary", "income", "ctc", "pay", "compensation"],
            "role": ["role", "designation", "title", "position"],
            "job_satisfaction": ["jobsatisfaction"],
            "environment_satisfaction": ["environment", "culture", "workplace"],
        }
        # Fields where a missing column is expected/optional and shouldn't be
        # reported back to the user as a "column not found" warning.
        _OPTIONAL_FIELDS = {"id", "attrition", "years_since_last_promotion", "num_companies_worked", "training_hours_last_year", "_overtime_hours", "overtime", "email", "gender", "marital_status", "job_level", "years_in_role", "years_with_curr_manager", "incentives_bonus", "market_benchmark", "benefits_satisfaction", "weekly_hours", "weekend_work", "travel_frequency", "manager_relation", "recognition_frequency"}

        parsed: List[Employee] = []
        field_match_counts: Dict[str, int] = {f: 0 for f in _FIELD_ALIASES}

        def _normalize_key(k: str) -> str:
            """Lowercase and strip everything except letters/digits, so
            'Monthly Income', 'monthly_income', 'Monthly-Income (INR)' all
            normalize to the same lookup key."""
            return "".join(ch for ch in k.lower() if ch.isalnum())

        def make_pick(emp: Dict[str, Any]):
            normalized_row = {_normalize_key(str(k)): v for k, v in emp.items()}

            def pick(field: str, default=None):
                # Pass 1: exact alias match
                for alias in _FIELD_ALIASES.get(field, [field]):
                    if alias in normalized_row and normalized_row[alias] not in (None, ""):
                        field_match_counts[field] = field_match_counts.get(field, 0) + 1
                        return normalized_row[alias]
                # Pass 2: keyword-contains fallback over every column name
                for keyword in _FIELD_KEYWORDS.get(field, []):
                    for key, val in normalized_row.items():
                        if keyword in key and val not in (None, ""):
                            field_match_counts[field] = field_match_counts.get(field, 0) + 1
                            return val
                return default
            return pick

        def _to_float(val, default: float) -> float:
            try:
                if val is None or val == "":
                    return default
                return float(str(val).replace(",", "").replace("₹", "").strip())
            except (ValueError, TypeError):
                return default

        for index, emp in enumerate(employees_raw):
            pick = make_pick(emp)

            eid = str(pick("id", default=f"EMP-UPLOAD-{1000 + index}"))
            name = str(pick("name", default=f"Employee {1000 + index}"))
            department = str(pick("department", default="R&D"))
            role = str(pick("role", default="Staff"))
            age = _to_float(pick("age"), 35)

            # Salary: many Indian HR exports report ANNUAL CTC (e.g. 900000)
            # rather than monthly income. If the matched value is implausibly
            # large for a monthly figure, treat it as annual and convert.
            raw_income = _to_float(pick("monthly_income"), 45000)
            monthly_income = raw_income / 12 if raw_income > 250000 else raw_income

            years_at_company = _to_float(pick("years_at_company"), 3)
            years_since_last_promotion = _to_float(pick("years_since_last_promotion"), 1)
            distance_from_home_km = _to_float(pick("distance_from_home_km"), 10)

            overtime_field_val = pick("overtime")
            if overtime_field_val is None:
                overtime_field_val = pick("_overtime_hours")

            if overtime_field_val is not None:
                overtime_raw = str(overtime_field_val).strip()
                try:
                    overtime = int(float(overtime_raw.replace(",", "").replace("₹", "").strip()))
                except ValueError:
                    overtime_lower = overtime_raw.lower()
                    if overtime_lower.startswith("y") or overtime_lower in ("1", "true"):
                        overtime = 15
                    else:
                        overtime = 0
            else:
                overtime = 0

            job_satisfaction = max(1, min(5, int(_to_float(pick("job_satisfaction"), 3))))
            work_life_balance = max(1, min(5, int(_to_float(pick("work_life_balance"), 3))))
            environment_satisfaction = max(1, min(5, int(_to_float(pick("environment_satisfaction"), 3))))
            num_companies_worked = _to_float(pick("num_companies_worked"), 1)
            training_hours_last_year = _to_float(pick("training_hours_last_year"), 24)

            # Pick or fallback new fields
            email_val = pick("email")
            email = str(email_val).strip() if email_val is not None else (name.lower().replace(" ", ".") + "@company.com")

            gender_val = pick("gender")
            gender = str(gender_val).strip() if gender_val is not None else ("Male" if int(age) % 2 == 0 else "Female")

            marital_status_val = pick("marital_status")
            marital_status = str(marital_status_val).strip() if marital_status_val is not None else ("Married" if int(age) > 30 else "Single")

            job_level = int(_to_float(pick("job_level"), max(1, min(5, int(years_at_company / 3) + 1))))
            years_in_role = int(_to_float(pick("years_in_role"), max(0, min(years_at_company, 2))))
            years_with_curr_manager = int(_to_float(pick("years_with_curr_manager"), max(0, min(years_at_company, 3))))

            incentives_bonus = float(_to_float(pick("incentives_bonus"), round(monthly_income * 2.0)))
            annual_salary = monthly_income * 12
            market_benchmark = float(_to_float(pick("market_benchmark"), round(annual_salary * 1.15)))

            benefits_satisfaction = int(_to_float(pick("benefits_satisfaction"), 3))
            weekly_hours = int(_to_float(pick("weekly_hours"), 40))

            weekend_work_val = pick("weekend_work")
            weekend_work = str(weekend_work_val).strip() if weekend_work_val is not None else "Not Required"

            travel_frequency_val = pick("travel_frequency")
            travel_frequency = str(travel_frequency_val).strip() if travel_frequency_val is not None else "Rarely"

            manager_relation = int(_to_float(pick("manager_relation"), 4))
            recognition_frequency = int(_to_float(pick("recognition_frequency"), 3))

            attrition = None
            attrition_val = pick("attrition")
            if attrition_val is not None:
                clean = str(attrition_val).strip().lower()
                attrition = "Yes" if clean in ("yes", "1", "true", "y") else "No"

            parsed.append(Employee(
                id=eid, name=name, department=department, role=role,
                age=int(age), monthly_income=monthly_income,
                years_at_company=int(years_at_company),
                years_since_last_promotion=int(years_since_last_promotion),
                distance_from_home_km=distance_from_home_km, overtime=overtime,
                job_satisfaction=job_satisfaction, work_life_balance=work_life_balance,
                environment_satisfaction=environment_satisfaction,
                num_companies_worked=int(num_companies_worked),
                training_hours_last_year=int(training_hours_last_year),
                email=email, gender=gender, marital_status=marital_status,
                job_level=job_level, years_in_role=years_in_role,
                years_with_curr_manager=years_with_curr_manager,
                incentives_bonus=incentives_bonus, market_benchmark=market_benchmark,
                benefits_satisfaction=benefits_satisfaction, weekly_hours=weekly_hours,
                weekend_work=weekend_work, travel_frequency=travel_frequency,
                manager_relation=manager_relation, recognition_frequency=recognition_frequency,
                attrition=attrition,
            ))

        classifier.fit(parsed)
        current_employees = parsed

        unmatched_fields = [
            f for f, count in field_match_counts.items()
            if count == 0 and f not in _OPTIONAL_FIELDS
        ]
        warning = None
        if unmatched_fields:
            warning = (
                f"Couldn't find a matching column for: {', '.join(unmatched_fields)}. "
                "These fields were filled with default placeholder values for every row — "
                "check your file's column headers if the numbers look identical across employees."
            )

        if dbmod.is_db_connected():
            await dbmod.save_employees(parsed)
            await dbmod.record_import(file_name, len(parsed), "success", warning or "Model retrained on uploaded data.")

        log_action("DATA_IMPORT", f"Uploaded and retrained on {len(parsed)} employee records." + (f" WARNING: {warning}" if warning else ""))

        return {
            "success": True,
            "rowCount": len(parsed),
            "message": "Model successfully trained on uploaded HR data.",
            "warning": warning,
            "modelMode": "heuristic" if classifier.use_heuristic else "trained",
            "metrics": getattr(classifier, "metrics", {}),
        }
    except Exception as err:  # noqa: BLE001
        return JSONResponse(status_code=500, content={"error": str(err)})


# --------------------------------------------------------------------------
# AI draft content types (retention email, warning letter, etc.)
# --------------------------------------------------------------------------

_DRAFT_TYPE_CONFIG = {
    "retention_email": {
        "label": "a highly personalized retention email from their Manager/HR",
        "instructions": "Write an email draft that addresses their career happiness, opens a dialogue for support, and suggests potential adjustments (like flexible work options, remote/hybrid schedules, role adjustments, or a salary/bonus review depending on their specific stressors). Keep it completely free of 'flight-risk' vocabulary.",
        "useRiskFactors": True,
    },
    "talking_points": {
        "label": "manager talking points outline for a 1-on-1 discussion",
        "instructions": "Write structural guidelines and bullet points for the manager to follow in a 1-on-1 meeting, focused on the identified stressors, without ever revealing that a risk model was used.",
        "useRiskFactors": True,
    },
    "warning_letter": {
        "label": "a formal HR warning letter",
        "instructions": "Write a formal, professional warning letter addressing a performance or conduct concern. Keep tone firm but respectful and compliant with standard Indian labor/HR documentation norms. Use placeholders like [Specific Incident/Date] and [Policy Reference] for details not provided.",
        "useRiskFactors": False,
    },
    "appreciation_letter": {
        "label": "an appreciation/recognition letter",
        "instructions": "Write a warm, specific letter recognizing the employee's contributions and impact. Reference their role and tenure naturally. Use placeholders like [Specific Achievement] where a concrete detail isn't available.",
        "useRiskFactors": False,
    },
    "offer_letter": {
        "label": "a job offer letter",
        "instructions": "Write a standard, professional offer letter for this role, including placeholders for [Compensation Details], [Start Date], [Reporting Manager], and [Benefits Summary]. Keep formatting clean and formal.",
        "useRiskFactors": False,
    },
    "meeting_summary": {
        "label": "a 1-on-1 or team meeting summary",
        "instructions": "Write a concise, structured meeting summary template covering discussion points, decisions, and action items relevant to this employee's role and current situation. Use placeholders like [Date] and [Attendees].",
        "useRiskFactors": True,
    },
    "performance_review": {
        "label": "a performance review document",
        "instructions": "Write a structured performance review covering strengths, areas for growth, and goals for the next period, grounded in the employee's role, tenure, and satisfaction indicators. Use placeholders like [Rating] and [Review Period] where specific data isn't available.",
        "useRiskFactors": True,
    },
}

_DRAFT_SYSTEM_INSTRUCTION = """You are an elite, highly empathetic HR executive specializing in strategic talent management and communications in India's top corporate and tech hubs (such as Bengaluru, Mumbai, Pune, Hyderabad, and Delhi-NCR).
Your goal is to write practical, professional, action-oriented, and personalized HR communication documents grounded in standard Indian enterprise practice (mentioning benefits like transport/cab services, health insurance for family, flexible hybrid setups, and festival-season pacing where relevant).
CRITICAL MANDATE: Never disclose that the employee was scored by a machine learning model, flight risk algorithm, or artificial intelligence. Communications must always read as authored directly by a human HR professional or manager."""


def _fallback_retention_email(emp: Employee) -> str:
    first_name = emp.name.split(" ")[0]
    lines = [
        f"Subject: Career Growth & Support Check-in — {emp.name}",
        "",
        f"Hi {first_name},",
        "",
        "I hope you're having a great week!",
        "",
        f"I wanted to reach out and schedule a brief, casual sync to chat about how things are going for you in your role as {emp.role}. "
        f"You've been a key contributor in the {emp.department} team, and I want to ensure you are feeling fully supported, challenged, and satisfied in your career trajectory here.",
        "",
        "In particular, I'd love to check in on a couple of areas:",
    ]
    if emp.overtime > 5:
        lines.append("- **Workload & Balance**: How you're finding the recent workload pacing and whether we can optimize overtime needs.")
    if emp.job_satisfaction <= 2:
        lines.append("- **Role Fulfillment**: Exploring if there are specific projects, tools, or resources that would make your daily work more satisfying.")
    if emp.work_life_balance <= 2:
        lines.append("- **Work-Life Integration**: Any adjustments we can offer (like remote flexibility or hours pacing) to better support your balance.")
    if emp.distance_from_home_km > 25:
        lines.append(f"- **Commute Adjustments**: Discussing flexible scheduling or remote work to ease your commute of {emp.distance_from_home_km} km.")
    lines += [
        "",
        "Let's catch up for 15-20 minutes over coffee or a video call next week. Please let me know what day and time works best for you.",
        "",
        "Thank you again for all that you do!",
        "",
        "Warm regards,",
        "",
        "[Your Name]",
        "[Your Title]",
    ]
    return "\n".join(lines)


def _fallback_talking_points(emp: Employee) -> str:
    lines = [
        f"### 1-on-1 Manager talking points for {emp.name} ({emp.role})",
        "",
        "**Objective**: Initiate a warm, positive discussion about satisfaction and career development without revealing any algorithmic scoring.",
        "",
        "**1. Set the Tone (First 3-5 minutes)**",
        f"* \"Thanks for carving out time today. I want to check in and see how you are doing personally and professionally. Your contributions to {emp.department} are highly valued.\"",
        "",
        "**2. Focus on Core Risk Areas (The Pivot)**",
    ]
    if emp.overtime > 5:
        lines.append("* **Address Burnout**: 'I know you've put in overtime recently. Let's look at the projects causing this and see how we can redistribute tasks.'")
    if emp.job_satisfaction <= 2:
        lines.append(f"* **Role Satisfaction**: 'Are there parts of your current role as {emp.role} that feel repetitive or where you feel blocked? Let's talk about alignment.'")
    if emp.work_life_balance <= 2:
        lines.append("* **Work-life balance**: 'I want to make sure your work-life balance is healthy. Would hybrid scheduling or shifting core hours help you?'")
    if emp.distance_from_home_km > 25:
        lines.append(f"* **Commute support**: 'Your commute is around {emp.distance_from_home_km} km. Would you be interested in having set remote-work days to cut back on travel?'")
    lines += [
        "",
        "**3. Action Plan & Next Steps**",
        "* **Co-Create Solutions**: Ask: \"If you could change one thing about your current daily workflow, what would it be?\"",
        "* **Commit to Review**: Set a concrete follow-up date (e.g., in two weeks) to implement any agreed-upon adjustments.",
    ]
    return "\n".join(lines)


@app.post("/api/draft")
async def draft(request: Request):
    try:
        body = await request.json()
        employee_id = body.get("employeeId")
        draft_type = body.get("type") or "retention_email"

        emp = next((e for e in current_employees if e.id == employee_id), None)
        if emp is None:
            return JSONResponse(status_code=404, content={"error": "Employee not found"})

        prediction = classifier.predict(emp)
        config = _DRAFT_TYPE_CONFIG.get(draft_type, _DRAFT_TYPE_CONFIG["retention_email"])

        factors_text = "\n".join(
            f"- {f['label']} (Current Value: {f['currentValue']}): {f['description']}"
            for f in prediction["topRiskFactors"]
        )

        risk_section = ""
        if config["useRiskFactors"]:
            risk_section = (
                "\nIDENTIFIED STRESSORS / CONTRIBUTING FACTORS:\n"
                + (factors_text or "- No extreme risk factors found. General career check-in recommended.")
                + "\n"
            )

        prompt = f"""Write {config['label']} for the following employee.

EMPLOYEE PROFILE:
- Name: {emp.name}
- Role: {emp.role} ({emp.department} Department)
- Tenure: {emp.years_at_company} years
- Monthly Income: ₹{emp.monthly_income:,.0f}
- Commute: {emp.distance_from_home_km} km from home
- Overtime requirement: {emp.overtime} hrs/week
- Job Satisfaction: {emp.job_satisfaction}/5
- Work-Life Balance: {emp.work_life_balance}/5
- Workplace Environment Satisfaction: {emp.environment_satisfaction}/5
{risk_section}
Instructions: {config['instructions']}
Keep the communication realistic, professional, and structured with placeholders like [Manager Name] or [Proposed Review Date] where appropriate. Write only in clean Markdown."""

        if _genai_client is None:
            if draft_type not in ("retention_email", "talking_points"):
                log_action("AI_DRAFT_GENERATED", f"Generated {draft_type} for {emp.name} (demo mode, no API key).")
                return {
                    "draft": (
                        f"### {config['label']} — {emp.name}\n\n"
                        "*(Demo mode: set GEMINI_API_KEY to generate a fully personalized document.)*\n\n"
                        f"**Role:** {emp.role} ({emp.department})\n**Tenure:** {emp.years_at_company} years\n\n---\n\n"
                        f"[Add specific details for this {draft_type.replace('_', ' ')} here. In demo mode this is a "
                        "placeholder shell — connect a Gemini API key to have this drafted automatically based on "
                        "the employee's full profile.]"
                    ),
                    "isDemo": True,
                }

            log_action("AI_DRAFT_GENERATED", f"Generated {draft_type} for {emp.name} (demo mode, no API key).")
            draft_text = _fallback_retention_email(emp) if draft_type == "retention_email" else _fallback_talking_points(emp)
            return {"draft": draft_text, "isDemo": True}

        response = _generate_content(prompt, _DRAFT_SYSTEM_INSTRUCTION, temperature=0.7)
        log_action("AI_DRAFT_GENERATED", f"Generated {draft_type} for {emp.name}.")
        return {"draft": response.text, "isDemo": False}
    except Exception as err:  # noqa: BLE001
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(err)})


def clean_and_parse_json(text: str) -> dict:
    if not text:
        return {}
    text = text.strip()
    if text.startswith("```"):
        nl_idx = text.find("\n")
        if nl_idx != -1:
            text = text[nl_idx:].strip()
        if text.endswith("```"):
            text = text[:-3].strip()
    
    # Fix invalid backslash escapes
    # JSON only allows: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
    pattern = re.compile(r'\\([\"\\/bfnrt]|u[0-9a-fA-F]{4})|(\\)')
    def replace(match):
        if match.group(1):
            return match.group(0)
        else:
            return '\\\\'
    cleaned_text = pattern.sub(replace, text)
    return json.loads(cleaned_text)


@app.post("/api/auto-compare")
async def auto_compare(request: Request, current_user: dict = Depends(get_current_user)):
    try:
        if _genai_client is None:
            return JSONResponse(status_code=500, content={"error": "Gemini API key is missing. Cannot perform AI auto-compare."})

        body = await request.json()
        employee_ids = body.get("employeeIds")

        scored_employees = [
            {**e.to_dict(), **{k: v for k, v in classifier.predict(e).items() if k in ("riskScore", "topRiskFactors")}}
            for e in current_employees
        ]

        if isinstance(employee_ids, list) and len(employee_ids) > 0:
            target = [e for e in scored_employees if e["id"] in employee_ids]
        else:
            target = sorted(scored_employees, key=lambda e: e["riskScore"], reverse=True)[:10]

        if not target:
            return JSONResponse(status_code=400, content={"error": "No employees to compare."})

        context_data = [{
            "id": e["id"],
            "name": e["name"],
            "department": e["department"],
            "role": e["role"],
            "riskScore": e["riskScore"],
            "tenure": e["years_at_company"],
            "salary": e["monthly_income"],
            "satisfaction": e["job_satisfaction"],
            "commute": e["distance_from_home_km"],
            "topFactors": [{"factor": f["factor"], "impact": f["impact"], "value": f["currentValue"]} for f in e["topRiskFactors"]],
        } for e in target]

        system_instruction = "You are an elite, highly concise HR analytics assistant. Your goal is to write extremely short, high-density comparative reports."

        if isinstance(employee_ids, list) and len(employee_ids) > 0:
            prompt = f"""Here are the employees selected for comparison:
{json.dumps(context_data, indent=2)}

Task:
1. Provide a concise summary report comparing their risk profiles, value, and action recommendations.
2. Structure your report with a compact comparison table and short bullet points. Total length must not exceed 250 words.
3. Your output MUST be valid JSON with two fields:
   - "selected_employee_ids": an array of the string IDs of the employees analyzed.
   - "report_markdown": the short, high-density markdown-formatted report.

Return ONLY the JSON object. Do not include markdown wraps around the JSON block."""
        else:
            prompt = f"""Here are the top highest-risk employees currently in the system:
{json.dumps(context_data, indent=2)}

Task:
1. Select exactly 2 to 3 employees from this list who provide a meaningful comparison.
2. Provide a concise summary report comparing their risk profiles, value, and action recommendations.
3. Structure your report with a compact comparison table and short bullet points. Total length must not exceed 250 words.
4. Your output MUST be valid JSON with two fields:
   - "selected_employee_ids": an array of the string IDs of the employees selected.
   - "report_markdown": the short, high-density markdown-formatted report.

Return ONLY the JSON object. Do not include markdown wraps around the JSON block."""

        response = _generate_content(prompt, system_instruction, temperature=0.2, json_mode=True)
        result = clean_and_parse_json(response.text or "{}")
        log_action("AI_COMPARE_GENERATED", f"Compared {len(target)} employees.")
        return result
    except Exception as err:  # noqa: BLE001
        return JSONResponse(status_code=500, content={"error": str(err)})


@app.post("/api/chat")
async def chat(request: Request, current_user: dict = Depends(get_current_user)):
    try:
        if _groq_client is None:
            return JSONResponse(status_code=500, content={
                "error": "Groq API key is missing. Configure GROQ_API_KEY to enable the chat assistant."
            })

        body = await request.json()
        message = body.get("message")
        history = body.get("history")

        if not isinstance(message, str) or not message:
            return JSONResponse(status_code=400, content={"error": "Missing 'message' string in request body."})

        scored_employees = []
        for e in current_employees:
            pred = classifier.predict(e)
            d = e.to_dict()
            d["riskScore"] = pred["riskScore"]
            d["riskLevel"] = pred["riskLevel"]
            scored_employees.append(d)

        total = len(scored_employees)
        high_risk = [e for e in scored_employees if e["riskLevel"] == "High"]
        med_risk = [e for e in scored_employees if e["riskLevel"] == "Medium"]
        avg_risk = round(sum(e["riskScore"] for e in scored_employees) / total) if total > 0 else 0
        by_dept: Dict[str, int] = {}
        for e in scored_employees:
            by_dept[e["department"]] = by_dept.get(e["department"], 0) + 1

        top15 = sorted(scored_employees, key=lambda e: e["riskScore"], reverse=True)[:15]
        top15_lines = "\n".join(
            f"- {e['id']} | {e['name']} | {e['department']} | {e['role']} | {e['riskScore']} | {e['riskLevel']}"
            for e in top15
        ) or "No employee data loaded yet."

        # Compute heatmap summaries dynamically to give chatbot full visibility into the active Heatmap tab
        reasons_summary = {}
        for e in current_employees:
            pred = classifier.predict(e)
            top_factors = pred.get("topRiskFactors", [])
            reason = "Other"
            if top_factors:
                top_feat = top_factors[0]["factor"]
                if top_feat in ("overtime", "work_life_balance"):
                    reason = "Better work/life balance"
                elif top_feat == "distance_from_home_km":
                    reason = "Change of location"
                elif top_feat in ("monthly_income", "incentives_bonus", "market_benchmark", "benefits_satisfaction"):
                    reason = "Better pay and benefits"
                elif top_feat in ("environment_satisfaction", "job_satisfaction"):
                    reason = "Culture and climate"
                elif top_feat in ("years_since_last_promotion", "num_companies_worked", "job_level"):
                    reason = "Career development"
                elif top_feat in ("manager_relation", "years_with_curr_manager"):
                    reason = "Relationship with manager"
            
            # Map tenure
            t = e.years_at_company
            if t <= 1:
                tenure_seg = "0 - 1 Years"
            elif t <= 2:
                tenure_seg = "1 - 2 Years"
            elif t <= 5:
                tenure_seg = "2 - 5 Years"
            elif t <= 10:
                tenure_seg = "5 - 10 Years"
            elif t <= 20:
                tenure_seg = "10 - 20 Years"
            else:
                tenure_seg = "20+ Years"

            if reason not in reasons_summary:
                reasons_summary[reason] = {}
            reasons_summary[reason][tenure_seg] = reasons_summary[reason].get(tenure_seg, 0) + 1

        heatmap_lines = []
        for reason, segments in reasons_summary.items():
            seg_str = ", ".join(f"{seg}: {count} employees" for seg, count in sorted(segments.items()))
            heatmap_lines.append(f"- {reason} -> {seg_str}")
        heatmap_text = "\n".join(heatmap_lines) or "No heatmap data."

        dataset_summary = f"""
Total employees in system: {total}
Average risk score: {avg_risk}/100
High risk count: {len(high_risk)}
Medium risk count: {len(med_risk)}
Departments: {', '.join(f'{d} ({c})' for d, c in by_dept.items()) or 'none'}

Top 15 highest-risk employees (id, name, dept, role, riskScore, riskLevel):
{top15_lines}

Active Heatmap Data (Reasons for leaving grouped by tenure):
{heatmap_text}
"""

        system_instruction = f"""You are an AI HR Assistant embedded in an Employee Resignation Risk Predictor platform used by Indian HR teams.
Explain all resignation risks, retention concepts, employee metrics, and analytics in very simple, friendly, and easy-to-understand language. Avoid complicated tech or math jargon so the user can easily follow your advice.
You can answer questions about the currently loaded employee dataset (summarized below), explain resignation risk concepts, suggest retention strategies, and help HR think through people-management decisions.
You do NOT have the ability to take real actions (you cannot send emails, edit records, or modify data) — you can only inform, analyze, and draft text for the user to review and use themselves.
Never invent specific employee data that isn't in the summary provided. If asked about a specific employee not listed in the summary, say you only have visibility into the highest-risk employees in this conversation and suggest they open that employee's profile in the app for full detail.
Be concise, warm, and professional. Use Markdown formatting for lists/structure when helpful.

APP USAGE GUIDE (Use this to answer "how do I..." questions):
- Upload CSV/Excel data: Go to the "Directory" tab and use the drag-and-drop file upload area on the left.
- See company health/pulse: Go to the "Pulse" tab.
- View turnover heatmap: Go to the "Heatmap" tab.
- Compare specific employees: Go to the "Compare" tab.
- Generate retention emails/talking points: Select an employee in the Directory, then click "Generate AI Action Plan" in their profile.

CURRENT DATASET SUMMARY:
{dataset_summary}"""

        if isinstance(history, list):
            contents = []
            for h in history:
                if isinstance(h, dict) and isinstance(h.get("text"), str) and h.get("role") in ("user", "model"):
                    role = "assistant" if h["role"] == "model" else "user"
                    contents.append({"role": role, "content": h["text"]})
            contents.append({"role": "user", "content": message})
        else:
            contents = message

        response = _generate_content_groq("", system_instruction, temperature=0.5, contents=contents)
        return {"reply": response.text}
    except Exception as err:  # noqa: BLE001
        return JSONResponse(status_code=500, content={"error": str(err)})


# --------------------------------------------------------------------------
# Startup: connect to Mongo (if configured), restore persisted data or seed
# a synthetic demo dataset so the dashboard isn't empty on first run.
# --------------------------------------------------------------------------

@app.on_event("startup")
async def on_startup():
    global current_employees
    db_ok = await dbmod.connect_db()
    if db_ok:
        try:
            persisted = await dbmod.load_employees()
            if persisted:
                current_employees = persisted
                classifier.fit(current_employees)
                log_action("DATA_LOAD", f"Loaded {len(persisted)} employee records from MongoDB on startup.")
                print(f"[db] Restored {len(persisted)} employee records from MongoDB.")
                return
        except Exception as err:  # noqa: BLE001
            print(f"[db] Failed to load persisted employees: {err}")

    # No persisted data (or DB not connected) — start empty. Real HR data
    # should be uploaded via the Directory tab, or the sample Indian dataset
    # can be loaded explicitly via POST /api/seed-sample.
    current_employees = []
    classifier.fit(current_employees)


@app.post("/api/seed-sample")
async def seed_sample():
    """Explicitly (never automatically) loads a synthetic sample dataset of
    400 Indian employees, for demoing the app with no real data on hand."""
    global current_employees
    current_employees = generate_synthetic_hr_data()
    classifier.fit(current_employees)
    if dbmod.is_db_connected():
        await dbmod.save_employees(current_employees)
    log_action("DATA_SEED", f"Loaded {len(current_employees)} synthetic sample employee records (user-requested).")
    return {"success": True, "rowCount": len(current_employees)}


# --------------------------------------------------------------------------
# Static file serving (production build of the React frontend)
# --------------------------------------------------------------------------

_DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.isdir(_DIST_DIR):
    app.mount("/", StaticFiles(directory=_DIST_DIR, html=True), name="static")
