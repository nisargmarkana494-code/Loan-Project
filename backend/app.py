from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
import joblib

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_joblib(filename):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        return None
    return joblib.load(path)

logistic_model = load_joblib('logistic_model.pkl') or load_joblib('loan_model.pkl')
rf_model = load_joblib('rf_model.pkl') or load_joblib('loan_model.pkl')
dt_model = load_joblib('dt_model.pkl')
adaboost_model = load_joblib('adaboost_model.pkl')
bagging_model = load_joblib('bagging_model.pkl')
scaler = load_joblib('scaler.pkl')

for m in [logistic_model, rf_model, dt_model, adaboost_model, bagging_model]:
    if m is not None and hasattr(m, 'n_jobs'):
        m.n_jobs = 1

print('Logistic:', 'loaded' if logistic_model is not None else 'MISSING')
print('Random Forest:', 'loaded' if rf_model is not None else 'MISSING')
print('Decision Tree:', 'loaded' if dt_model is not None else 'MISSING')
print('AdaBoost:', 'loaded' if adaboost_model is not None else 'MISSING')
print('Bagging:', 'loaded' if bagging_model is not None else 'MISSING')
print('Scaler:', 'loaded' if scaler is not None else 'MISSING')

CAT_MAPPINGS = {
    'education': {"High School": 0, "Bachelor's": 1, "Master's": 2, "PhD": 3},
    'employmenttype': {"Full-time": 0, "Part-time": 1, "Self-employed": 2, "Unemployed": 3},
    'maritalstatus': {"Single": 0, "Married": 1, "Divorced": 2},
    'hasmortgage': {"No": 0, "Yes": 1},
    'hasdependents': {"No": 0, "Yes": 1},
    'loanpurpose': {"Auto": 0, "Business": 1, "Education": 2, "Home": 3, "Other": 4},
    'hascosigner': {"No": 0, "Yes": 1},
}

MODEL_MAP = {
    'logistic': (logistic_model, 'logistic_regression', 'Logistic Regression'),
    'random_forest': (rf_model, 'random_forest', 'Random Forest'),
    'decision_tree': (dt_model, 'decision_tree', 'Decision Tree'),
    'adaboost': (adaboost_model, 'adaboost', 'AdaBoost'),
    'bagging': (bagging_model, 'bagging', 'Bagging Classifier'),
}

@app.route('/')
def home():
    return "Loan Default Prediction API is running!"

def make_prediction(model, df_input):
    values = df_input.to_numpy()
    prediction_result = int(model.predict(values)[0])
    probability = None
    if hasattr(model, 'predict_proba'):
        probability = round(float(model.predict_proba(values)[0][1]), 4)
    return {
        'prediction': prediction_result,
        'probability': probability,
        'risk_status': "High Risk (Default)" if prediction_result == 1 else "Low Risk (No Default)"
    }

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if scaler is None:
            return jsonify({'success': False, 'error': 'scaler.pkl is missing in backend'}), 400

        data = request.get_json() or {}
        raw_model_choice = str(data.pop('model', 'all')).strip().lower().replace('-', '_').replace(' ', '_')
        
        # Normalize model selection
        if raw_model_choice in ('logisticregression', 'lr', 'logistic'):
            model_choice = 'logistic'
        elif raw_model_choice in ('rf', 'randomforest', 'random_forest'):
            model_choice = 'random_forest'
        elif raw_model_choice in ('dt', 'decisiontree', 'decision_tree'):
            model_choice = 'decision_tree'
        elif raw_model_choice in ('adaboost', 'ada'):
            model_choice = 'adaboost'
        elif raw_model_choice in ('bagging', 'baggingclassifier', 'bagging_classifier'):
            model_choice = 'bagging'
        elif raw_model_choice in ('both', 'all'):
            model_choice = 'all'
        else:
            model_choice = 'all'

        df_input = pd.DataFrame([data])
        df_input.columns = df_input.columns.str.strip().str.lower().str.replace(' ', '_')

        numeric_cols = ['age', 'income', 'loanamount', 'creditscore', 'monthsemployed',
                        'numcreditlines', 'interestrate', 'loanterm', 'dtiratio']
        categorical_cols = ['education', 'employmenttype', 'maritalstatus',
                            'hasmortgage', 'hasdependents', 'loanpurpose', 'hascosigner']
        expected_columns = numeric_cols + categorical_cols

        for col in expected_columns:
            if col not in df_input.columns:
                df_input[col] = 0

        # Encode categorical columns
        for col in categorical_cols:
            val = df_input[col].iloc[0]
            if isinstance(val, bool):
                df_input[col] = 1 if val else 0
            elif isinstance(val, str):
                if val in ('Yes', 'No'):
                    df_input[col] = 1 if val == 'Yes' else 0
                else:
                    mapping = CAT_MAPPINGS.get(col, {})
                    df_input[col] = mapping.get(val, 0)

        df_input[numeric_cols] = df_input[numeric_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
        df_input[numeric_cols] = scaler.transform(df_input[numeric_cols])

        df_input = df_input[expected_columns]

        response = {
            'success': True,
            'selected_model': model_choice
        }

        target_keys = MODEL_MAP.keys() if model_choice == 'all' else [model_choice]

        for key in target_keys:
            model_obj, res_key, display_name = MODEL_MAP[key]
            if model_obj is None:
                return jsonify({'success': False, 'error': f'{display_name} model (.pkl) not found'}), 400
            res = make_prediction(model_obj, df_input)
            response[res_key] = {
                'name': display_name,
                **res
            }

        # Set top-level primary result for convenience
        first_key = list(target_keys)[0]
        _, primary_res_key, _ = MODEL_MAP[first_key]
        primary = response.get(primary_res_key)
        response['prediction'] = primary['prediction']
        response['risk_status'] = primary['risk_status']

        return jsonify(response)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
