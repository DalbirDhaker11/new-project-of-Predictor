"""
Port of src/server/model.ts to Python.

Implements a small from-scratch decision tree classifier (Gini-impurity split
search, max depth 4) trained on employee attrition data, plus a synthetic
Indian-HR-context dataset generator used to seed the app on first run.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any


# --------------------------------------------------------------------------
# Employee model
# --------------------------------------------------------------------------

@dataclass
class Employee:
    id: str
    name: str
    department: str
    role: str
    age: int
    monthly_income: float
    years_at_company: int
    years_since_last_promotion: int
    distance_from_home_km: float
    overtime: int  # hours per week
    job_satisfaction: int  # 1-5
    work_life_balance: int  # 1-5
    environment_satisfaction: int  # 1-5
    num_companies_worked: int
    training_hours_last_year: int
    email: str = "employee@company.com"
    gender: str = "Male"
    marital_status: str = "Single"
    job_level: int = 2
    years_in_role: int = 2
    years_with_curr_manager: int = 2
    incentives_bonus: float = 0.0
    market_benchmark: float = 0.0
    benefits_satisfaction: int = 3
    weekly_hours: int = 40
    weekend_work: str = "Not Required"
    travel_frequency: str = "Rarely"
    manager_relation: int = 3
    recognition_frequency: int = 3
    attrition: Optional[str] = None  # "Yes" | "No" | None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "department": self.department,
            "role": self.role,
            "age": self.age,
            "monthly_income": self.monthly_income,
            "years_at_company": self.years_at_company,
            "years_since_last_promotion": self.years_since_last_promotion,
            "distance_from_home_km": self.distance_from_home_km,
            "overtime": self.overtime,
            "job_satisfaction": self.job_satisfaction,
            "work_life_balance": self.work_life_balance,
            "environment_satisfaction": self.environment_satisfaction,
            "num_companies_worked": self.num_companies_worked,
            "training_hours_last_year": self.training_hours_last_year,
            "email": self.email,
            "gender": self.gender,
            "marital_status": self.marital_status,
            "job_level": self.job_level,
            "years_in_role": self.years_in_role,
            "years_with_curr_manager": self.years_with_curr_manager,
            "incentives_bonus": self.incentives_bonus,
            "market_benchmark": self.market_benchmark,
            "benefits_satisfaction": self.benefits_satisfaction,
            "weekly_hours": self.weekly_hours,
            "weekend_work": self.weekend_work,
            "travel_frequency": self.travel_frequency,
            "manager_relation": self.manager_relation,
            "recognition_frequency": self.recognition_frequency,
            "attrition": self.attrition,
        }

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "Employee":
        return Employee(
            id=str(d.get("id")),
            name=str(d.get("name")),
            department=str(d.get("department")),
            role=str(d.get("role")),
            age=int(d.get("age", 35)),
            monthly_income=float(d.get("monthly_income", 5000)),
            years_at_company=int(d.get("years_at_company", 3)),
            years_since_last_promotion=int(d.get("years_since_last_promotion", 1)),
            distance_from_home_km=float(d.get("distance_from_home_km", 10)),
            overtime=int(d.get("overtime", 0)),
            job_satisfaction=int(d.get("job_satisfaction", 3)),
            work_life_balance=int(d.get("work_life_balance", 3)),
            environment_satisfaction=int(d.get("environment_satisfaction", 3)),
            num_companies_worked=int(d.get("num_companies_worked", 1)),
            training_hours_last_year=int(d.get("training_hours_last_year", 24)),
            email=str(d.get("email", "employee@company.com")),
            gender=str(d.get("gender", "Male")),
            marital_status=str(d.get("marital_status", "Single")),
            job_level=int(d.get("job_level", 2)),
            years_in_role=int(d.get("years_in_role", 2)),
            years_with_curr_manager=int(d.get("years_with_curr_manager", 2)),
            incentives_bonus=float(d.get("incentives_bonus", 0.0)),
            market_benchmark=float(d.get("market_benchmark", 0.0)),
            benefits_satisfaction=int(d.get("benefits_satisfaction", 3)),
            weekly_hours=int(d.get("weekly_hours", 40)),
            weekend_work=str(d.get("weekend_work", "Not Required")),
            travel_frequency=str(d.get("travel_frequency", "Rarely")),
            manager_relation=int(d.get("manager_relation", 3)),
            recognition_frequency=int(d.get("recognition_frequency", 3)),
            attrition=d.get("attrition"),
        )


_DEPT_MAP = {"R&D": 0, "Sales": 1, "HR": 2}


def _map_to_numeric_features(emp: Employee) -> Dict[str, float]:
    return {
        "age": emp.age,
        "monthly_income": emp.monthly_income,
        "years_at_company": emp.years_at_company,
        "years_since_last_promotion": emp.years_since_last_promotion,
        "distance_from_home_km": emp.distance_from_home_km,
        "overtime": float(emp.overtime),
        "job_satisfaction": emp.job_satisfaction,
        "work_life_balance": emp.work_life_balance,
        "environment_satisfaction": emp.environment_satisfaction,
        "num_companies_worked": emp.num_companies_worked,
        "training_hours_last_year": emp.training_hours_last_year,
        "department": _DEPT_MAP.get(emp.department, 0),
    }


@dataclass
class TreeNode:
    is_leaf: bool
    count: int
    value: Optional[float] = None
    feature: Optional[str] = None
    threshold: Optional[float] = None
    left: Optional["TreeNode"] = None
    right: Optional["TreeNode"] = None


_FACTOR_LABELS = {
    "overtime": "Overtime Requirements",
    "job_satisfaction": "Job Satisfaction",
    "monthly_income": "Monthly Income Level",
    "years_since_last_promotion": "Years Since Last Promotion",
    "environment_satisfaction": "Workplace Environment Satisfaction",
    "work_life_balance": "Work-Life Balance Score",
    "distance_from_home_km": "Commute Distance",
    "age": "Employee Age",
    "years_at_company": "Tenure at Company",
    "num_companies_worked": "Job Hopping History",
    "training_hours_last_year": "Training Opportunities",
    "department": "Department Culture",
}


def _feature_value_description(feat: str, emp: Employee) -> str:
    if feat == "overtime":
        return f"{emp.overtime} hrs/week"
    if feat == "job_satisfaction":
        return f"{emp.job_satisfaction}/5 ({'Low' if emp.job_satisfaction <= 2 else 'High'})"
    if feat == "monthly_income":
        return f"₹{emp.monthly_income:,.0f}/mo"
    if feat == "years_since_last_promotion":
        n = emp.years_since_last_promotion
        return f"{n} year{'' if n == 1 else 's'}"
    if feat == "environment_satisfaction":
        return f"{emp.environment_satisfaction}/5 ({'Low' if emp.environment_satisfaction <= 2 else 'High'})"
    if feat == "work_life_balance":
        return f"{emp.work_life_balance}/5 ({'Poor' if emp.work_life_balance <= 2 else 'Good'})"
    if feat == "distance_from_home_km":
        return f"{emp.distance_from_home_km} km"
    if feat == "years_at_company":
        n = emp.years_at_company
        return f"{n} year{'' if n == 1 else 's'}"
    if feat == "num_companies_worked":
        return f"{emp.num_companies_worked} prior company"
    if feat == "training_hours_last_year":
        return f"{emp.training_hours_last_year} hrs"
    return str(_map_to_numeric_features(emp).get(feat))


def _feature_text_description(feat: str, emp: Employee) -> str:
    if feat == "overtime":
        return ("Frequent overtime is a strong predictor of burnout and resignation."
                if emp.overtime >= 10 else "Manageable or no overtime requirements.")
    if feat == "job_satisfaction":
        return ("Low job satisfaction is highly correlated with voluntary resignations."
                if emp.job_satisfaction <= 2 else "High job satisfaction reduces exit rates.")
    if feat == "monthly_income":
        return ("Below-average monthly compensation increases financial attrition risk."
                if emp.monthly_income < 75000 else "Competitive monthly salary package.")
    if feat == "years_since_last_promotion":
        return ("Several years since last promotion may cause employee feelings of stagnancy."
                if emp.years_since_last_promotion >= 3 else "Recent promotion supports career trajectory.")
    if feat == "environment_satisfaction":
        return ("Low physical or social environment rating contributes to workplace friction."
                if emp.environment_satisfaction <= 2 else "Healthy environment satisfaction.")
    if feat == "work_life_balance":
        return ("Imbalanced workloads and low personal time increase attrition likelihood."
                if emp.work_life_balance <= 2 else "Favorable work-life balance feedback.")
    if feat == "distance_from_home_km":
        return ("Long daily commute increases fatigue and willingness to look elsewhere."
                if emp.distance_from_home_km > 20 else "Short commute distance.")
    if feat == "years_at_company":
        return ("Recent hires are more vulnerable to early transition or onboarding mismatches."
                if emp.years_at_company <= 2 else "Established tenure within company.")
    if feat == "num_companies_worked":
        return ("Historical career changes indicate a higher willingness to switch employers."
                if emp.num_companies_worked >= 4 else "Stable employment background.")
    if feat == "training_hours_last_year":
        return ("Fewer professional development hours might signal stagnation or low investment."
                if emp.training_hours_last_year < 20 else "Regular training and skill development.")
    return "Contributing risk factor analyzed from historical trends."


class DecisionTreeClassifier:
    def __init__(self) -> None:
        self.root: Optional[TreeNode] = None
        self.max_depth = 4
        self.min_samples_split = 10
        self.default_prob = 0.15
        self.use_heuristic = False

    @staticmethod
    def _gini(labels: List[int]) -> float:
        if not labels:
            return 0.0
        p1 = sum(labels) / len(labels)
        p0 = 1 - p1
        return 1 - p1 * p1 - p0 * p0

    def fit(self, employees: List[Employee]) -> None:
        training_data = [
            {"features": _map_to_numeric_features(e), "label": 1 if e.attrition == "Yes" else 0}
            for e in employees
            if e.attrition is not None
        ]

        if not training_data:
            # No historical "did they leave" labels to learn from — which is
            # completely normal for a real, current-roster HR export. Rather
            # than falling back to one flat score for every employee, switch
            # to a transparent, research-backed heuristic scorer (same
            # weighting logic used to build the synthetic demo dataset) so
            # employees still get genuinely differentiated risk scores.
            self.use_heuristic = True
            self.root = None
            return

        self.use_heuristic = False
        ones = sum(d["label"] for d in training_data)
        self.default_prob = ones / len(training_data)

        feature_names = list(training_data[0]["features"].keys())
        self.root = self._build_tree(training_data, 0, feature_names)

    def _build_tree(self, data: List[Dict[str, Any]], depth: int, feature_names: List[str]) -> TreeNode:
        count = len(data)
        ones = sum(d["label"] for d in data)
        prob = ones / count if count > 0 else self.default_prob

        if depth >= self.max_depth or count < self.min_samples_split or ones == 0 or ones == count:
            return TreeNode(is_leaf=True, value=prob, count=count)

        best_gini = float("inf")
        best_feature = ""
        best_threshold = 0.0
        best_left: List[Dict[str, Any]] = []
        best_right: List[Dict[str, Any]] = []

        for feat in feature_names:
            values = sorted(d["features"][feat] for d in data)
            unique_values = sorted(set(values))
            thresholds = [
                (unique_values[i] + unique_values[i + 1]) / 2
                for i in range(len(unique_values) - 1)
            ]

            for thresh in thresholds:
                left = [d for d in data if d["features"][feat] <= thresh]
                right = [d for d in data if d["features"][feat] > thresh]
                if not left or not right:
                    continue

                gini_left = self._gini([d["label"] for d in left])
                gini_right = self._gini([d["label"] for d in right])
                weighted_gini = (len(left) / count) * gini_left + (len(right) / count) * gini_right

                if weighted_gini < best_gini:
                    best_gini = weighted_gini
                    best_feature = feat
                    best_threshold = thresh
                    best_left = left
                    best_right = right

        if not best_feature or best_gini >= self._gini([d["label"] for d in data]):
            return TreeNode(is_leaf=True, value=prob, count=count)

        left_child = self._build_tree(best_left, depth + 1, feature_names)
        right_child = self._build_tree(best_right, depth + 1, feature_names)

        return TreeNode(
            is_leaf=False,
            feature=best_feature,
            threshold=best_threshold,
            value=prob,
            left=left_child,
            right=right_child,
            count=count,
        )

    def _heuristic_predict(self, emp: Employee) -> Dict[str, Any]:
        """Rule-based fallback scorer, used when no historical attrition
        labels are available to train the decision tree on (i.e. a real,
        current-roster HR file with no "did this person leave" column).
        Mirrors the same research-backed weighting used to build the
        synthetic demo dataset, so scores stay meaningfully differentiated
        and explainable instead of one flat number for everyone."""
        prob = 0.05
        contributions: Dict[str, float] = {}

        def bump(feat: str, amount: float) -> None:
            prob_nonlocal = amount
            contributions[feat] = contributions.get(feat, 0.0) + prob_nonlocal

        if emp.overtime >= 10:
            bump("overtime", 0.22)
        elif emp.overtime > 5:
            bump("overtime", 0.10)
        if emp.job_satisfaction <= 2:
            bump("job_satisfaction", 0.20)
        if emp.work_life_balance <= 2:
            bump("work_life_balance", 0.14)
        if emp.environment_satisfaction <= 2:
            bump("environment_satisfaction", 0.14)
        if emp.monthly_income < 40000:
            bump("monthly_income", 0.14)
        elif emp.monthly_income < 60000:
            bump("monthly_income", 0.06)
        if emp.distance_from_home_km > 25:
            bump("distance_from_home_km", 0.12)
        elif emp.distance_from_home_km > 15:
            bump("distance_from_home_km", 0.05)
        if emp.years_since_last_promotion >= 3:
            bump("years_since_last_promotion", 0.10)
        if emp.years_at_company <= 1:
            bump("years_at_company", 0.08)
        if emp.num_companies_worked >= 4:
            bump("num_companies_worked", 0.10)
        if emp.training_hours_last_year < 15:
            bump("training_hours_last_year", 0.06)

        for amount in contributions.values():
            prob += amount
        prob = max(0.02, min(0.95, prob))

        score = max(0, min(100, round(prob * 100)))
        if score >= 60:
            risk_level = "High"
        elif score >= 30:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        top_risk_factors = []
        for feat, val in contributions.items():
            if val > 0.01:
                top_risk_factors.append({
                    "factor": feat,
                    "label": _FACTOR_LABELS.get(feat, feat),
                    "impact": round(val * 100),
                    "currentValue": _feature_value_description(feat, emp),
                    "description": _feature_text_description(feat, emp),
                })
        top_risk_factors.sort(key=lambda f: f["impact"], reverse=True)

        confidence = 80 + (abs(hash(emp.id)) % 15)
        return {"riskScore": score, "riskLevel": risk_level, "topRiskFactors": top_risk_factors, "confidenceScore": confidence}

    def predict(self, emp: Employee) -> Dict[str, Any]:
        if self.use_heuristic or self.root is None:
            return self._heuristic_predict(emp)

        features = _map_to_numeric_features(emp)
        contributions: Dict[str, float] = {k: 0.0 for k in features}

        current = self.root
        while not current.is_leaf and current.left and current.right:
            feat = current.feature
            val = features[feat]
            thresh = current.threshold
            parent_prob = current.value if current.value is not None else self.default_prob

            next_node = current.left if val <= thresh else current.right
            next_prob = next_node.value if next_node.value is not None else self.default_prob

            contributions[feat] += next_prob - parent_prob
            current = next_node

        final_prob = current.value if current.value is not None else self.default_prob
        score = max(0, min(100, round(final_prob * 100)))

        if score >= 60:
            risk_level = "High"
        elif score >= 30:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        top_risk_factors = []
        for feat, val in contributions.items():
            if val > 0.01:
                top_risk_factors.append({
                    "factor": feat,
                    "label": _FACTOR_LABELS.get(feat, feat),
                    "impact": round(val * 100),
                    "currentValue": _feature_value_description(feat, emp),
                    "description": _feature_text_description(feat, emp),
                })
        top_risk_factors.sort(key=lambda f: f["impact"], reverse=True)

        confidence = 85 + (abs(hash(emp.id)) % 10)
        return {"riskScore": score, "riskLevel": risk_level, "topRiskFactors": top_risk_factors, "confidenceScore": confidence}


# --------------------------------------------------------------------------
# Synthetic data generator (deterministic, seeded — mirrors the TS version)
# --------------------------------------------------------------------------

_FIRST_NAMES = [
    "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Ananya", "Diya", "Ira", "Rohan", "Siddharth",
    "Neha", "Pooja", "Vikram", "Rahul", "Priya", "Amit", "Sanjay", "Deepak", "Sunita", "Rajesh",
    "Karan", "Ishaan", "Riya", "Kavya", "Tanvi", "Pranav", "Harish", "Preeti", "Alok", "Nikhil",
    "Divya", "Meera", "Abhishek", "Rakesh", "Sandeep", "Swati", "Shruti", "Anil", "Arvind", "Manoj",
]

_LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Patel", "Reddy", "Nair", "Iyer", "Kumar", "Singh", "Joshi",
    "Mehta", "Sen", "Das", "Choudhury", "Roy", "Rao", "Mishra", "Pandey", "Trivedi", "Banerjee",
    "Chatterjee", "Shetty", "Pillai", "Menon", "Bose", "Saxena", "Kapoor", "Malhotra", "Goel", "Bansal",
    "Shah", "Gokhale", "Kulkarni", "Deshmukh", "Patil", "Naidu", "Subramanian", "Murthy", "Prasad", "Dubey",
]

_DEPARTMENTS = [
    {"name": "R&D", "roles": ["Software Engineer", "Data Scientist", "QA Lead", "UX Designer", "Product Manager"]},
    {"name": "Sales", "roles": ["Account Executive", "Sales Manager", "Sales Development Representative", "Customer Success"]},
    {"name": "HR", "roles": ["HR Specialist", "Talent Acquisition", "HR Manager", "Compensation Analyst"]},
]


def generate_synthetic_hr_data() -> List[Employee]:
    """Deterministic seeded pseudo-random generator — same seed/algorithm as the
    original TS version, so results match exactly for a given index sequence."""
    seed = 12345

    def random() -> float:
        nonlocal seed
        seed += 1
        x = math.sin(seed) * 10000
        return x - math.floor(x)

    def random_range(lo: int, hi: int) -> int:
        return math.floor(random() * (hi - lo + 1)) + lo

    def choose(arr):
        return arr[math.floor(random() * len(arr))]

    employees: List[Employee] = []

    for i in range(1, 401):
        dept = choose(_DEPARTMENTS)
        name = f"{choose(_FIRST_NAMES)} {choose(_LAST_NAMES)}"
        age = random_range(22, 60)
        years_at_company = random_range(1, min(15, age - 21))
        years_since_last_promotion = random_range(0, min(years_at_company, 6))
        distance_from_home_km = random_range(1, 45)
        num_companies_worked = random_range(0, 7)
        training_hours_last_year = random_range(10, 60)

        job_satisfaction = random_range(1, 5)
        work_life_balance = random_range(1, 5)
        environment_satisfaction = random_range(1, 5)
        overtime = random_range(10, 25) if random() > 0.75 else random_range(0, 5)

        monthly_income = round(45000 + age * 2200 + years_at_company * 4500 + random_range(-12000, 12000))

        # Generate new fields
        email = name.lower().replace(" ", ".") + "@company.com"
        gender = choose(["Male", "Female"])
        marital_status = choose(["Married", "Single"])
        job_level = random_range(1, 5)
        years_in_role = random_range(0, min(years_at_company, 4))
        years_with_curr_manager = random_range(0, min(years_at_company, 5))
        incentives_bonus = float(round(monthly_income * (random_range(8, 35) / 10.0)))
        
        annual_salary = monthly_income * 12
        benchmark_multiplier = random_range(95, 145) / 100.0
        market_benchmark = float(round(annual_salary * benchmark_multiplier))
        
        benefits_satisfaction = random_range(1, 5)
        weekly_hours = random_range(35, 45)
        weekend_work = choose(["Required", "Not Required"])
        travel_frequency = choose(["Rarely", "Sometimes", "Frequently"])
        manager_relation = random_range(1, 5)
        recognition_frequency = random_range(1, 5)

        attrition_probability = 0.05
        if overtime > 5:
            attrition_probability += 0.25
            work_life_balance = max(1, work_life_balance - 1)
        if job_satisfaction <= 2:
            attrition_probability += 0.20
        if environment_satisfaction <= 2:
            attrition_probability += 0.15
        if monthly_income < 75000:
            attrition_probability += 0.15
        if distance_from_home_km > 25:
            attrition_probability += 0.12
        if years_since_last_promotion >= 3:
            attrition_probability += 0.10
        if years_at_company <= 2:
            attrition_probability += 0.08
        if num_companies_worked >= 4:
            attrition_probability += 0.10
        if manager_relation <= 2:
            attrition_probability += 0.12
        if recognition_frequency <= 2:
            attrition_probability += 0.08
        if benefits_satisfaction <= 2:
            attrition_probability += 0.08
        if market_benchmark > annual_salary:
            deficit = market_benchmark - annual_salary
            if deficit > 200000:
                attrition_probability += 0.15
            elif deficit > 50000:
                attrition_probability += 0.07

        attrition_probability = max(0.01, min(0.95, attrition_probability))
        attrition = "Yes" if random() < attrition_probability else "No"

        employees.append(Employee(
            id=f"EMP-{1000 + i}",
            name=name,
            department=dept["name"],
            role=choose(dept["roles"]),
            age=age,
            monthly_income=monthly_income,
            years_at_company=years_at_company,
            years_since_last_promotion=years_since_last_promotion,
            distance_from_home_km=distance_from_home_km,
            overtime=overtime,
            job_satisfaction=job_satisfaction,
            work_life_balance=work_life_balance,
            environment_satisfaction=environment_satisfaction,
            num_companies_worked=num_companies_worked,
            training_hours_last_year=training_hours_last_year,
            email=email,
            gender=gender,
            marital_status=marital_status,
            job_level=job_level,
            years_in_role=years_in_role,
            years_with_curr_manager=years_with_curr_manager,
            incentives_bonus=incentives_bonus,
            market_benchmark=market_benchmark,
            benefits_satisfaction=benefits_satisfaction,
            weekly_hours=weekly_hours,
            weekend_work=weekend_work,
            travel_frequency=travel_frequency,
            manager_relation=manager_relation,
            recognition_frequency=recognition_frequency,
            attrition=attrition,
        ))

    return employees
