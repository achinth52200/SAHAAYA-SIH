"""
Lightweight NLP / Emotion Detection Model for SAHAAYA Prototype
Uses TF-IDF + Logistic Regression / XGBoost for fast training on CPU.
For production, replace with fine-tuned multilingual transformer.
"""
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder

XGB_AVAILABLE = False
xgb = None
try:
    import xgboost as _xgb
    XGB_AVAILABLE = True
    xgb = _xgb
except Exception:
    pass


EMOTIONS = ["fear", "anger", "hopelessness", "threat", "sadness", "anxiety", "neutral"]
EMOTION_TO_ID = {e: i for i, e in enumerate(EMOTIONS)}
ID_TO_EMOTION = {i: e for i, e in enumerate(EMOTIONS)}

MODEL_PATH = "models/emotion_classifier_lightweight.joblib"
VECTORIZER_PATH = "models/tfidf_vectorizer.joblib"


def load_synthetic_data(data_path: str) -> pd.DataFrame:
    """Load synthetic text interactions for training."""
    df = pd.read_json(data_path, lines=True)
    return df


def prepare_training_data(df: pd.DataFrame) -> tuple:
    """Prepare texts and labels from synthetic data."""
    texts = df["text"].tolist()
    labels = [EMOTION_TO_ID.get(e, EMOTION_TO_ID["neutral"]) for e in df["ground_truth_emotion"].tolist()]
    return texts, labels


def train_lightweight_model(
    train_texts: List[str],
    train_labels: List[int],
    val_texts: List[str],
    val_labels: List[int],
    model_save_path: str = MODEL_PATH
):
    """Train a lightweight TF-IDF + XGBoost emotion classifier."""
    
    # TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        stop_words=None,  # Keep multilingual
        min_df=1,
        max_df=0.95
    )
    
    X_train = vectorizer.fit_transform(train_texts)
    X_val = vectorizer.transform(val_texts)
    
    y_train = np.array(train_labels)
    y_val = np.array(val_labels)
    
    # Train model
    if not XGB_AVAILABLE or xgb is None:
        print("XGBoost is not available. Falling back to LogisticRegression.")
        model = LogisticRegression(max_iter=1000, random_state=42)
    else:
        model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="multi:softprob",
            num_class=len(EMOTIONS),
            eval_metric="mlogloss",
            random_state=42,
            n_jobs=-1,
            verbosity=0
        )
    
    print("Training lightweight emotion classifier...")
    print(f"Train samples: {len(train_texts)}, Val samples: {len(val_texts)}")
    print(f"Vocabulary size: {len(vectorizer.vocabulary_)}")
    
    if not XGB_AVAILABLE or xgb is None:
        model.fit(X_train, y_train)
    else:
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )
    
    # Evaluate
    val_preds = model.predict(X_val)
    val_probs = model.predict_proba(X_val)
    
    val_acc = accuracy_score(y_val, val_preds)
    val_f1 = f1_score(y_val, val_preds, average="weighted")
    
    print(f"Validation Accuracy: {val_acc:.4f}")
    print(f"Validation F1 (weighted): {val_f1:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_val, val_preds, target_names=EMOTIONS))
    
    # Save model and vectorizer
    Path(model_save_path).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_save_path)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    
    print(f"\nModel saved to {model_save_path}")
    print(f"Vectorizer saved to {VECTORIZER_PATH}")
    
    return model, vectorizer


def evaluate_model(model, vectorizer, test_texts: List[str], test_labels: List[int]) -> Dict:
    """Evaluate model on test set."""
    X_test = vectorizer.transform(test_texts)
    y_test = np.array(test_labels)
    
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)
    
    report = classification_report(y_test, preds, target_names=EMOTIONS, output_dict=True)
    return report


def predict_emotion(text: str, model, vectorizer) -> Dict[str, Any]:
    """Predict emotion for a single text."""
    X = vectorizer.transform([text])
    probs = model.predict_proba(X)[0]
    pred_id = np.argmax(probs)
    confidence = probs[pred_id]
    
    return {
        "emotion": ID_TO_EMOTION[pred_id],
        "confidence": round(float(confidence), 4),
        "all_probabilities": {ID_TO_EMOTION[i]: round(float(probs[i]), 4) for i in range(len(EMOTIONS))}
    }


def load_trained_model(model_path: str = MODEL_PATH, vectorizer_path: str = VECTORIZER_PATH):
    """Load trained model and vectorizer."""
    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    return model, vectorizer


def create_demo_predictions(model, vectorizer) -> List[Dict]:
    """Create demo predictions on sample texts."""
    demo_texts = [
        "I am scared to go out alone after the threat",
        "This is so unfair, nothing is happening with my case",
        "I don't think things will ever get better",
        "They said they will hurt me if I testify",
        "I miss my normal life before this happened",
        "I can't sleep thinking about the court hearing",
        "Just checking in, how is my case progressing?",
    ]
    
    results = []
    for text in demo_texts:
        pred = predict_emotion(text, model, vectorizer)
        results.append({"text": text, **pred})
    
    return results


if __name__ == "__main__":
    # Load synthetic data
    data_path = "data/synthetic/text_interactions.jsonl"
    df = load_synthetic_data(data_path)
    print(f"Loaded {len(df)} synthetic text interactions")
    print(f"Emotion distribution:\n{df['ground_truth_emotion'].value_counts()}")
    
    # Prepare data
    texts, labels = prepare_training_data(df)
    
    # Split
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        train_texts, train_labels, test_size=0.125, random_state=42, stratify=train_labels
    )
    
    # Train
    model, vectorizer = train_lightweight_model(
        train_texts, train_labels, val_texts, val_labels
    )
    
    # Evaluate on test
    print("\nEvaluating on test set...")
    report = evaluate_model(model, vectorizer, test_texts, test_labels)
    print(json.dumps(report, indent=2))
    
    # Demo predictions
    print("\nDemo predictions:")
    demo_results = create_demo_predictions(model, vectorizer)
    for r in demo_results:
        print(f"  Text: {r['text']}")
        print(f"  -> {r['emotion']} (confidence: {r['confidence']})")
        print()