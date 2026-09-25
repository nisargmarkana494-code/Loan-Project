import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier, BaggingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(os.path.dirname(BASE_DIR), 'oldback', 'Loan_default.csv')

CAT_MAPPINGS = {
    'education': {"High School": 0, "Bachelor's": 1, "Master's": 2, "PhD": 3},
    'employmenttype': {"Full-time": 0, "Part-time": 1, "Self-employed": 2, "Unemployed": 3},
    'maritalstatus': {"Single": 0, "Married": 1, "Divorced": 2},
    'hasmortgage': {"No": 0, "Yes": 1},
    'hasdependents': {"No": 0, "Yes": 1},
    'loanpurpose': {"Auto": 0, "Business": 1, "Education": 2, "Home": 3, "Other": 4},
    'hascosigner': {"No": 0, "Yes": 1},
}

NUMERIC_COLS = ['age', 'income', 'loanamount', 'creditscore', 'monthsemployed',
                'numcreditlines', 'interestrate', 'loanterm', 'dtiratio']
CATEGORICAL_COLS = ['education', 'employmenttype', 'maritalstatus',
                    'hasmortgage', 'hasdependents', 'loanpurpose', 'hascosigner']

def train():
    print(f"Loading data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

    if 'loanid' in df.columns:
        df = df.drop(columns=['loanid'])

    for col in CATEGORICAL_COLS:
        if col in df.columns and col in CAT_MAPPINGS:
            df[col] = df[col].map(CAT_MAPPINGS[col]).fillna(0)

    X = df[NUMERIC_COLS + CATEGORICAL_COLS]
    y = df['default']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train_scaled = X_train.copy()
    X_test_scaled = X_test.copy()

    X_train_scaled[NUMERIC_COLS] = scaler.fit_transform(X_train[NUMERIC_COLS])
    X_test_scaled[NUMERIC_COLS] = scaler.transform(X_test[NUMERIC_COLS])

    models = {
        'logistic_model.pkl': LogisticRegression(max_iter=1000, random_state=42),
        'rf_model.pkl': RandomForestClassifier(n_estimators=50, max_depth=12, random_state=42, n_jobs=-1),
        'dt_model.pkl': DecisionTreeClassifier(max_depth=10, random_state=42),
        'adaboost_model.pkl': AdaBoostClassifier(n_estimators=50, random_state=42),
        'bagging_model.pkl': BaggingClassifier(n_estimators=30, random_state=42, n_jobs=-1),
    }

    print("\nTraining models...")
    for filename, model in models.items():
        print(f"Training {filename}...")
        model.fit(X_train_scaled.values, y_train.values)
        y_pred = model.predict(X_test_scaled.values)
        acc = accuracy_score(y_test, y_pred)
        print(f"-> {filename} Accuracy: {acc * 100:.2f}%")
        joblib.dump(model, os.path.join(BASE_DIR, filename))

    joblib.dump(scaler, os.path.join(BASE_DIR, 'scaler.pkl'))
    print("Scaler saved successfully.")
    print("All models trained and saved!")

if __name__ == '__main__':
    train()
