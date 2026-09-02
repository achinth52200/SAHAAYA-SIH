"""
NLP / Emotion Detection Model for SAHAAYA
Multilingual emotion classification using transformer models.
Supports: fear, anger, hopelessness, threat, sadness, anxiety, neutral
"""
import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel, AutoConfig
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, f1_score
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional
import random


EMOTIONS = ["fear", "anger", "hopelessness", "threat", "sadness", "anxiety", "neutral"]
EMOTION_TO_ID = {e: i for i, e in enumerate(EMOTIONS)}
ID_TO_EMOTION = {i: e for i, e in enumerate(EMOTIONS)}

MODEL_NAME = "bert-base-multilingual-cased"  # Supports 100+ languages including Indian languages
MAX_LENGTH = 128
BATCH_SIZE = 16
LEARNING_RATE = 2e-5
EPOCHS = 3


class EmotionDataset(Dataset):
    def __init__(self, texts: List[str], labels: List[int], tokenizer, max_length: int = MAX_LENGTH):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            truncation=True,
            max_length=self.max_length,
            padding="max_length",
            return_tensors="pt"
        )
        
        return {
            "input_ids": encoding["input_ids"].flatten(),
            "attention_mask": encoding["attention_mask"].flatten(),
            "labels": torch.tensor(label, dtype=torch.long)
        }


class MultilingualEmotionClassifier(nn.Module):
    def __init__(self, model_name: str = MODEL_NAME, num_labels: int = len(EMOTIONS), dropout: float = 0.3):
        super().__init__()
        self.config = AutoConfig.from_pretrained(model_name)
        self.bert = AutoModel.from_pretrained(model_name)
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(self.config.hidden_size, num_labels)
    
    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        return logits


def load_synthetic_data(data_path: str) -> pd.DataFrame:
    """Load synthetic text interactions for training."""
    df = pd.read_json(data_path, lines=True)
    return df


def prepare_training_data(df: pd.DataFrame) -> tuple:
    """Prepare texts and labels from synthetic data."""
    texts = df["text"].tolist()
    labels = [EMOTION_TO_ID.get(e, EMOTION_TO_ID["neutral"]) for e in df["ground_truth_emotion"].tolist()]
    return texts, labels


def train_model(
    train_texts: List[str],
    train_labels: List[int],
    val_texts: List[str],
    val_labels: List[int],
    model_save_path: str,
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
):
    """Train the emotion classification model."""
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    
    train_dataset = EmotionDataset(train_texts, train_labels, tokenizer)
    val_dataset = EmotionDataset(val_texts, val_labels, tokenizer)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    model = MultilingualEmotionClassifier().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE)
    criterion = nn.CrossEntropyLoss()
    
    print(f"Training on {device}...")
    print(f"Train samples: {len(train_texts)}, Val samples: {len(val_texts)}")
    
    best_f1 = 0.0
    
    for epoch in range(EPOCHS):
        # Training
        model.train()
        train_loss = 0.0
        for batch in train_loader:
            optimizer.zero_grad()
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)
            
            logits = model(input_ids, attention_mask)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
        
        # Validation
        model.eval()
        val_preds = []
        val_true = []
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)
                
                logits = model(input_ids, attention_mask)
                preds = torch.argmax(logits, dim=1)
                val_preds.extend(preds.cpu().numpy())
                val_true.extend(labels.cpu().numpy())
        
        val_f1 = f1_score(val_true, val_preds, average="weighted")
        val_acc = accuracy_score(val_true, val_preds)
        
        print(f"Epoch {epoch+1}/{EPOCHS} - Train Loss: {train_loss/len(train_loader):.4f} - Val Acc: {val_acc:.4f} - Val F1: {val_f1:.4f}")
        
        if val_f1 > best_f1:
            best_f1 = val_f1
            torch.save({
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "epoch": epoch,
                "val_f1": val_f1,
            }, model_save_path)
            print(f"  Saved best model (F1: {best_f1:.4f})")
    
    return model, tokenizer


def evaluate_model(model, tokenizer, test_texts: List[str], test_labels: List[int], device: str) -> Dict:
    """Evaluate model on test set."""
    model.eval()
    test_dataset = EmotionDataset(test_texts, test_labels, tokenizer)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    preds = []
    with torch.no_grad():
        for batch in test_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            logits = model(input_ids, attention_mask)
            batch_preds = torch.argmax(logits, dim=1)
            preds.extend(batch_preds.cpu().numpy())
    
    report = classification_report(test_labels, preds, target_names=EMOTIONS, output_dict=True)
    return report


def predict_emotion(text: str, model, tokenizer, device: str) -> Dict[str, Any]:
    """Predict emotion for a single text."""
    model.eval()
    encoding = tokenizer(
        text,
        truncation=True,
        max_length=MAX_LENGTH,
        padding="max_length",
        return_tensors="pt"
    )
    
    with torch.no_grad():
        input_ids = encoding["input_ids"].to(device)
        attention_mask = encoding["attention_mask"].to(device)
        logits = model(input_ids, attention_mask)
        probs = torch.softmax(logits, dim=1)
        pred_id = torch.argmax(probs, dim=1).item()
        confidence = probs[0][pred_id].item()
    
    return {
        "emotion": ID_TO_EMOTION[pred_id],
        "confidence": round(confidence, 4),
        "all_probabilities": {ID_TO_EMOTION[i]: round(probs[0][i].item(), 4) for i in range(len(EMOTIONS))}
    }


def load_trained_model(model_path: str, device: str = "cuda" if torch.cuda.is_available() else "cpu"):
    """Load a trained model from checkpoint."""
    model = MultilingualEmotionClassifier().to(device)
    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    return model, tokenizer


def create_demo_predictions(model, tokenizer, device: str) -> List[Dict]:
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
        pred = predict_emotion(text, model, tokenizer, device)
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
    model_save_path = "models/emotion_classifier.pt"
    Path(model_save_path).parent.mkdir(parents=True, exist_ok=True)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, tokenizer = train_model(
        train_texts, train_labels, val_texts, val_labels, model_save_path, device
    )
    
    # Evaluate
    print("\nEvaluating on test set...")
    report = evaluate_model(model, tokenizer, test_texts, test_labels, device)
    print(json.dumps(report, indent=2))
    
    # Demo predictions
    print("\nDemo predictions:")
    demo_results = create_demo_predictions(model, tokenizer, device)
    for r in demo_results:
        print(f"  Text: {r['text']}")
        print(f"  -> {r['emotion']} (confidence: {r['confidence']})")
        print()