import sys
import os

# Add parent directory to path to import model
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from model import generate_synthetic_hr_data, RandomForestClassifier

def main():
    print("Generating synthetic HR dataset...")
    employees = generate_synthetic_hr_data()
    print(f"Generated {len(employees)} employee records.")
    
    # Check labels count
    yes_count = sum(1 for e in employees if e.attrition == "Yes")
    no_count = sum(1 for e in employees if e.attrition == "No")
    print(f"Attrition distribution: Yes = {yes_count}, No = {no_count} (Total labelled: {yes_count + no_count})")
    
    print("\nTraining RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=15, max_depth=5, min_samples_split=6)
    clf.fit(employees)
    
    print("\nEvaluation metrics from training (80/20 train/test validation split):")
    for metric, val in clf.metrics.items():
        print(f"  {metric.capitalize()}: {val * 100:.2f}%")
        
    # Run predictions on a couple of employees and print their top risk factors
    print("\nSample employee predictions:")
    for i in range(5):
        emp = employees[i]
        pred = clf.predict(emp)
        print(f"\nEmployee: {emp.name} ({emp.role})")
        print(f"  Actual Attrition: {emp.attrition}")
        print(f"  Predicted Risk Score: {pred['riskScore']}/100")
        print(f"  Risk Level: {pred['riskLevel']}")
        print(f"  Confidence: {pred['confidenceScore']}%")
        print("  Top Risk Factors:")
        for factor in pred['topRiskFactors'][:3]:
            print(f"    - {factor['label']} ({factor['currentValue']}): impact {factor['impact']}% | {factor['description']}")

if __name__ == "__main__":
    main()
