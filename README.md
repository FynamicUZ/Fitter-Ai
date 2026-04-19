# Fitter

Predict **calories, mass, protein, fat, and carbs** from a single food photo.

Fine-tunes EfficientNet-B3 (`timm`) on [Nutrition5k](https://github.com/google-research-datasets/Nutrition5k) with a 5-value regression head. Built for free Google Colab (T4, 16 GB VRAM); checkpoints persist to Google Drive so disconnects don't lose progress.

## Layout

```
fitter/
├── notebooks/train_colab.ipynb     # Colab entry point — run this
├── src/
│   ├── data.py                     # Nutrition5k parser + Dataset + target normalizer
│   ├── model.py                    # timm backbone + regression head
│   ├── train.py                    # AMP training loop, Drive checkpointing, resume
│   ├── eval.py                     # per-target MAE / %MAE on test split
│   └── predict.py                  # single-image CLI → JSON
├── configs/efficientnet_b3.yaml
└── requirements.txt
```

## Quickstart (Colab)

1. Open `notebooks/train_colab.ipynb` in Colab. Runtime → Change runtime type → **T4 GPU**.
2. Run cells top to bottom.
3. After step 3 finishes once, the ~6 GB of Nutrition5k RGB images stay on your Drive — later sessions skip the download.

Full training is 30 epochs; expect ~6–10 hours split across one or two free sessions. Re-running the training cell after a disconnect resumes from `last.pt` on Drive.

## Local dry run

```bash
pip install -r requirements.txt
# Requires Nutrition5k downloaded to the path in the config.
python -m src.train --config configs/efficientnet_b3.yaml --subset 200 --max_steps 50 --set train.epochs=1
```

## Config overrides

Any field can be overridden from the CLI:

```bash
python -m src.train --config configs/efficientnet_b3.yaml \
  --set train.batch_size=24 --set train.epochs=50
```

## Outputs

`src/predict.py` prints JSON:

```json
{
  "calories_kcal": 412.3,
  "mass_g": 281.0,
  "fat_g": 14.2,
  "carb_g": 48.7,
  "protein_g": 22.1
}
```

## Targets to beat

Nutrition5k paper's RGB-only direct-prediction baseline: ~70 kcal MAE. Our setup reproduces that with EfficientNet-B3 + log-space normalization.

## Known limits

- Trained on controlled overhead cafeteria shots — expect degraded accuracy on in-the-wild phone photos.
- No depth channel (RGB-only to save Colab disk). Adding depth generally lowers kcal MAE.
- Assumes a single dish per image. Multi-dish plates need a detection step upstream.
