# app/datasets/templates.py
from typing import Dict, Any

TEMPLATES: Dict[str, Dict[str, Any]] = {
    "ecommerce_sales_v1": {
        "version": 1,
        "kind": "table",
        "rows": {"sample": 30, "full": 5000},
        "date_range": ("2024-01-01", "2024-12-31"),
        "columns": [
            {"name": "order_id", "type": "int", "gen": "sequence", "start": 1000},
            {"name": "date", "type": "date", "gen": "date_range"},
            {"name": "product", "type": "category", "choices": ["A","B","C","D"], "weights": [0.4,0.3,0.2,0.1]},
            {"name": "category", "type": "category", "choices": ["Eletrônicos","Moda","Casa","Esporte"], "weights": [0.35,0.25,0.25,0.15]},
            # preço depende da categoria (correlação simples)
            {"name": "price", "type": "float", "gen": "by_category_price",
             "params": {"Eletrônicos": (300, 80), "Moda": (80, 25), "Casa": (120, 35), "Esporte": (150, 40)}},
            {"name": "quantity", "type": "int", "gen": "poisson", "lam": 2.0, "min": 1, "max": 6},
            # receita é fórmula: price * quantity
            {"name": "revenue", "type": "float", "gen": "formula", "expr": "price*quantity"},
            {"name": "region", "type": "category", "choices": ["N","NE","CO","SE","S"], "weights": [0.1,0.2,0.1,0.4,0.2]},
            {"name": "is_return", "type": "bool", "gen": "bernoulli", "p": 0.04}
        ],
        "nulls": {"p": 0.02, "columns": ["region"]},         # 2% nulos em region
        "outliers": {"revenue": {"p": 0.01, "factor": 5}},   # 1% outlier em revenue
        "seasonality": "monthly"                             # sazonalidade simples na data
    },

    "rides_v1": {
        # esqueleto: corrida de app (tempo, distância, preço)
        "version": 1, "kind": "table",
        "rows": {"sample": 30, "full": 4000},
        "date_range": ("2024-01-01", "2024-06-30"),
        "columns": [
            # defina campos como timestamp, distance_km, duration_min, surge_multiplier, fare_value = formula etc.
        ]
    },

    "sensors_v1": {
        # esqueleto: sensores IoT (timestamp, device_id, temperature, humidity, fault)
        "version": 1, "kind": "table",
        "rows": {"sample": 30, "full": 8000},
        "date_range": ("2024-03-01", "2024-03-15"),
        "columns": [
            # defina campos com ruído e picos ocasionais
        ]
    }
}
