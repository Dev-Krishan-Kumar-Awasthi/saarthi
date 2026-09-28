"""
SAARTHI — ML Anomaly Detection Layer
Uses scikit-learn IsolationForest trained on synthetic historical agent-action distributions.
Provides an explainable anomaly score/signal to the Risk Engine.
"""
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.ensemble import IsolationForest

MODEL_VERSION = "isoforest-v1.0.0"

class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.is_trained = False
        self._init_and_train()

    def _init_and_train(self):
        """
        Trains IsolationForest on synthetic normal agent operational patterns:
        Feature vector:
        0: amount (typical: 200 - 4500)
        1: action_frequency_per_minute (typical: 0.5 - 3.0)
        2: failed_attempts_recent (typical: 0 - 1)
        3: reversibility_score (1.0 = fully reversible, 0.0 = completely irreversible)
        4: evidence_confidence (typical: 0.85 - 1.0)
        5: time_deviation_seconds (typical: 1 - 15)
        """
        try:
            rng = np.random.RandomState(42)
            n_samples = 400
            
            # Normal distribution of agent actions
            amounts = rng.uniform(200, 4500, n_samples)
            frequencies = rng.uniform(0.2, 2.5, n_samples)
            failed_attempts = rng.choice([0, 1], size=n_samples, p=[0.85, 0.15])
            reversibility = rng.uniform(0.7, 1.0, n_samples)
            evidence_conf = rng.uniform(0.9, 1.0, n_samples)
            time_dev = rng.uniform(1.0, 10.0, n_samples)
            
            X_train = np.column_stack([
                amounts, frequencies, failed_attempts, reversibility, evidence_conf, time_dev
            ])
            
            self.model = IsolationForest(
                n_estimators=50,
                contamination=0.08,
                random_state=42
            )
            self.model.fit(X_train)
            self.is_trained = True
        except Exception as e:
            print(f"Warning initializing ML Anomaly Detector: {e}")
            self.is_trained = False

    def extract_features(self, action_data: Dict[str, Any], context: Dict[str, Any]) -> np.ndarray:
        amount = float(action_data.get("amount", 1000))
        freq = float(context.get("action_frequency", 1.0))
        failed = float(context.get("failed_attempts", 0))
        rev = float(context.get("reversibility", 0.8))
        conf = float(context.get("evidence_confidence", 1.0))
        time_dev = float(context.get("time_deviation", 2.0))
        return np.array([[amount, freq, failed, rev, conf, time_dev]])

    def evaluate(self, action_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates the action request and outputs:
        - anomaly_score: 0 to 100 (higher = more anomalous)
        - is_anomaly: bool
        - explanation: human readable reason
        - model_version: str
        """
        if not self.is_trained or self.model is None:
            return {
                "available": False,
                "anomaly_score": 0,
                "is_anomaly": False,
                "explanation": "ML model unavailable (failed safely)",
                "model_version": MODEL_VERSION
            }

        features = self.extract_features(action_data, context)
        # raw decision function: negative means outlier/anomaly
        raw_score = self.model.decision_function(features)[0]
        prediction = self.model.predict(features)[0]  # -1 for anomaly, 1 for normal

        # Normalize score into 0-100 scale: raw scores typically range from -0.3 to +0.25
        # Lower raw score => higher anomaly score
        normalized_score = int(np.clip((0.2 - raw_score) / 0.5 * 100, 0, 100))
        is_anomaly = bool(prediction == -1 or normalized_score >= 65)

        # Generate explainable human-readable reason
        explanations = []
        amount = features[0][0]
        freq = features[0][1]
        failed = features[0][2]
        conf = features[0][4]

        if amount > 5000:
            explanations.append(f"Financial amount (₹{amount:,.0f}) significantly exceeds normal training distribution")
        if freq > 3.0:
            explanations.append(f"Unusual high request frequency ({freq:.1f} calls/min)")
        if failed >= 3:
            explanations.append(f"Abnormal sequence of {int(failed)} consecutive failed execution attempts")
        if conf < 0.7:
            explanations.append(f"Depressed evidence confidence ({int(conf*100)}%) creates behavioral divergence")

        if not explanations:
            if is_anomaly:
                explanation = "Multi-variate behavioral feature outlier detected by Isolation Forest"
            else:
                explanation = "Behavioral patterns conform to historical baseline"
        else:
            explanation = "; ".join(explanations)

        return {
            "available": True,
            "anomaly_score": normalized_score,
            "is_anomaly": is_anomaly,
            "raw_score": round(float(raw_score), 4),
            "explanation": explanation,
            "model_version": MODEL_VERSION
        }

ml_detector = AnomalyDetector()
