"""
Templates de datasets - Configuração de datasets sintéticos

Este módulo define os templates para geração de datasets sintéticos.
Cada template define a estrutura, colunas, tipos de dados e configurações.

Templates disponíveis:
- ecommerce_sales_v1: Dataset de vendas de e-commerce
- rides_v1: Dataset de corridas de app (esqueleto)
- sensors_v1: Dataset de sensores IoT (esqueleto)

Estrutura de template:
- version: Versão do template
- kind: Tipo de dataset ("table")
- rows: Número de linhas (sample e full)
- date_range: Range de datas
- columns: Lista de colunas com configurações
- nulls: Configuração de valores nulos
- outliers: Configuração de outliers
- seasonality: Sazonalidade dos dados

Tipos de colunas:
- sequence: Sequência numérica
- category: Categoria (escolha de valores)
- date_range: Range de datas
- by_category_price: Preço condicionado à categoria
- poisson: Distribuição de Poisson
- formula: Fórmula matemática
- bernoulli: Distribuição de Bernoulli

Uso:
    from app.datasets.templates import TEMPLATES
    
    template = TEMPLATES["ecommerce_sales_v1"]
    # Usa template para gerar dataset
"""

from typing import Dict, Any

TEMPLATES: Dict[str, Dict[str, Any]] = {
    """
    Dicionário de templates de datasets.
    
    Cada template define a estrutura de um dataset sintético.
    Usado pelo generator.py para gerar dados realistas.
    """
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
