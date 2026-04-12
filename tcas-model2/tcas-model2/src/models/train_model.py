"""
train_model.py
──────────────
Trains a Random Forest Classifier on the engineered feature set produced
by synthesize.py and persists the fitted pipeline to:
 
    src/models/model2_rf.pkl
 
Expected input columns (from src/data/performance_dataset.csv):
  avg_accuracy, moving_avg_latency, trend_slope
 
Target column:
  performance_label  → "Needs Improvement" | "Stable" | "Excellent"
"""
 
from __future__ import annotations
 
import pickle
from pathlib import Path
 
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
 
 
# ── Constants ────────────────────────────────────────────────────────────────
 
DATA_PATH: str = "src/data/performance_dataset.csv"
MODEL_PATH: str = "src/models/model2_rf.pkl"
FEATURE_COLS: list[str] = ["avg_accuracy", "moving_avg_latency", "trend_slope"]
TARGET_COL: str = "performance_label"
LABEL_ORDER: list[str] = ["Needs Improvement", "Stable", "Excellent"]
RANDOM_SEED: int = 42
TEST_SIZE: float = 0.20
CV_FOLDS: int = 5
 
# Random Forest hyperparameters (tuned for this dataset size)
RF_PARAMS: dict = {
    "n_estimators": 300,
    "max_depth": 8,
    "min_samples_split": 10,
    "min_samples_leaf": 5,
    "class_weight": "balanced",
    "random_state": RANDOM_SEED,
    "n_jobs": -1,
}
 
 
# ── Pipeline Construction ─────────────────────────────────────────────────────
 
def build_pipeline() -> Pipeline:
    """
    Assemble a scikit-learn Pipeline with:
      1. StandardScaler  – normalise features to zero-mean / unit-variance
      2. RandomForestClassifier – the core classifier
 
    Returns
    -------
    Pipeline
        Unfitted sklearn Pipeline object.
    """
    return Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            ("clf", RandomForestClassifier(**RF_PARAMS)),
        ]
    )
 
 
# ── Training ──────────────────────────────────────────────────────────────────
 
def train(df: pd.DataFrame) -> tuple[Pipeline, dict]:
    """
    Fit the pipeline on *df* and evaluate via hold-out + cross-validation.
 
    Parameters
    ----------
    df : pd.DataFrame
        Feature DataFrame containing FEATURE_COLS and TARGET_COL.
 
    Returns
    -------
    tuple[Pipeline, dict]
        (fitted_pipeline, metrics_dict)
    """
    X: pd.DataFrame = df[FEATURE_COLS]
    y: pd.Series = df[TARGET_COL]
 
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )
 
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)
 
    y_pred = pipeline.predict(X_test)
 
    # Cross-validation (stratified k-fold)
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_SEED)
    cv_scores: np.ndarray = cross_val_score(
        build_pipeline(), X, y, cv=cv, scoring="f1_weighted", n_jobs=-1
    )
 
    metrics: dict = {
        "hold_out_report": classification_report(
            y_test, y_pred, labels=LABEL_ORDER, zero_division=0
        ),
        "confusion_matrix": confusion_matrix(y_test, y_pred, labels=LABEL_ORDER),
        "cv_f1_mean": float(cv_scores.mean()),
        "cv_f1_std": float(cv_scores.std()),
        "feature_importances": dict(
            zip(FEATURE_COLS, pipeline.named_steps["clf"].feature_importances_)
        ),
    }
 
    return pipeline, metrics
 
 
# ── Persistence ───────────────────────────────────────────────────────────────
 
def save_model(pipeline: Pipeline, path: str = MODEL_PATH) -> None:
    """
    Serialise *pipeline* to disk using pickle.
 
    Parameters
    ----------
    pipeline : Pipeline
        Fitted sklearn Pipeline to persist.
    path : str
        Destination file path.
    """
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as fh:
        pickle.dump(pipeline, fh, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"Model saved → {path}")
 
 
def load_model(path: str = MODEL_PATH) -> Pipeline:
    """
    Deserialise and return a previously saved Pipeline.
 
    Parameters
    ----------
    path : str
        Path to the .pkl file.
 
    Returns
    -------
    Pipeline
        The loaded, ready-to-infer Pipeline.
    """
    with open(path, "rb") as fh:
        return pickle.load(fh)
 
 
# ── Entry Point ───────────────────────────────────────────────────────────────
 
def main() -> None:
    """Load data, train, evaluate, and save the Random Forest pipeline."""
    print(f"Loading dataset from {DATA_PATH} …")
    df = pd.read_csv(DATA_PATH)
    print(f"  Rows: {len(df):,}  |  Labels: {df[TARGET_COL].value_counts().to_dict()}")
 
    print("\nTraining Random Forest pipeline …")
    pipeline, metrics = train(df)
 
    print("\n── Evaluation ──────────────────────────────────────────────────")
    print(metrics["hold_out_report"])
    print("Confusion matrix (rows=actual, cols=predicted):")
    print(pd.DataFrame(
        metrics["confusion_matrix"],
        index=LABEL_ORDER,
        columns=LABEL_ORDER,
    ).to_string())
    print(f"\nCV F1 (weighted, {CV_FOLDS}-fold): "
          f"{metrics['cv_f1_mean']:.4f} ± {metrics['cv_f1_std']:.4f}")
    print("\nFeature importances:")
    for feat, imp in sorted(
        metrics["feature_importances"].items(), key=lambda x: -x[1]
    ):
        print(f"  {feat:<25s} {imp:.4f}")
 
    save_model(pipeline)
 
 
if __name__ == "__main__":
    main()
 
