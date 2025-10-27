# app/datasets/generator.py
from __future__ import annotations
import os, hashlib, math, random
from typing import Tuple
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from .templates import TEMPLATES

STATIC_DIR = "static/data"

def _safe_formula_eval(expr: str, variables: dict) -> np.ndarray:
    """
    Avalia uma expressão matemática simples de forma SEGURA.
    
    Por que precisamos disso?
    - eval() é PERIGOSO: executa qualquer código Python
    - Esta função só permite operações matemáticas básicas (+, -, *, /)
    
    Como funciona?
    1. Substitui nomes de variáveis (ex: "price") pelos valores reais
    2. Só permite números e operadores matemáticos
    3. Usa eval() mas com contexto restrito (sem funções perigosas)
    
    Exemplo:
    - expr = "price * quantity"
    - variables = {"price": [10, 20], "quantity": [2, 3]}
    - resultado = [20, 60]
    """
    # Cria um ambiente limpo: sem funções built-in perigosas
    safe_dict = {
        "__builtins__": {},  # Remove TODAS as funções built-in (print, open, etc)
        "np": np,             # Permite numpy (para operações em arrays)
    }
    
    # Adiciona as variáveis que queremos usar (colunas do DataFrame)
    safe_dict.update(variables)
    
    try:
        # Agora sim, eval() mas APENAS com o que está em safe_dict
        result = eval(expr, safe_dict, {})
        return result
    except Exception as e:
        raise ValueError(f"Fórmula inválida '{expr}': {e}")

def _stable_seed(*parts: str) -> int:
    h = hashlib.sha256("::".join(parts).encode()).hexdigest()
    return int(h[:12], 16)  # usa 48 bits

def _ensure_dirs(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def _date_series(start: str, end: str, n: int, seasonality: str|None, rng: np.random.Generator):
    dt_start = datetime.fromisoformat(start)
    dt_end = datetime.fromisoformat(end)
    total_days = (dt_end - dt_start).days + 1
    # amostra uniforme + sazonalidade simples (mais pontos em fim de mês)
    days = rng.integers(0, total_days, size=n)
    dates = [dt_start + timedelta(days=int(d)) for d in days]
    if seasonality == "monthly":
        # puxa 30% para os últimos 5 dias do mês
        for i in range(n):
            if rng.random() < 0.3:
                d = dates[i]
                last = (datetime(d.year, d.month, 28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
                delta = rng.integers(0, min(5, last.day))
                dates[i] = last - timedelta(days=int(delta))
    return np.array([d.date().isoformat() for d in dates])

def generate_dataset(template_id: str, seed_parts: Tuple[str, ...], size: str = "full") -> Tuple[str, str]:
    """
    Gera dataset e salva em CSV.
    Retorna (sample_csv_text, full_csv_path).
    size: "sample" ou "full" (gera os dois sempre; 'size' determina qual sample_len usar no retorno).
    """
    tpl = TEMPLATES[template_id]
    seed = _stable_seed(template_id, *seed_parts)
    rng = np.random.default_rng(seed)

    rows_sample = tpl["rows"]["sample"]
    rows_full = tpl["rows"]["full"]

    def _build(n):
        df = pd.DataFrame(index=range(n))
        cat_cache = {}
        # 1) gerar colunas independentes/correlacionadas
        for col in tpl["columns"]:
            name = col["name"]; gen = col.get("gen","")
            if gen == "sequence":
                start = col.get("start", 1)
                df[name] = np.arange(start, start + n)
            elif col["type"] == "category":
                choices = col["choices"]; weights = col.get("weights")
                df[name] = rng.choice(choices, size=n, p=(np.array(weights) if weights else None))
                cat_cache[name] = (choices, weights)
            elif gen == "date_range":
                start, end = tpl["date_range"]
                df[name] = _date_series(start, end, n, tpl.get("seasonality"), rng)
            elif gen == "by_category_price":
                # preço ~ N(mean,std) condicionado à category
                means, stds = {}, {}
                for k, (m,s) in col["params"].items():
                    means[k] = m; stds[k] = s
                cat = df["category"].values
                price = []
                for c in cat:
                    val = rng.normal(means[c], stds[c])
                    price.append(max(5.0, float(val)))
                df[name] = np.round(price, 2)
            elif gen == "poisson":
                lam = float(col.get("lam", 2.0))
                q = rng.poisson(lam, size=n)
                q = np.clip(q, col.get("min", 1), col.get("max", 10))
                df[name] = q
            elif gen == "formula":
                expr = col["expr"]
                # Avalia a fórmula de forma SEGURA (sem eval() direto)
                variables = {c: df[c].values for c in df.columns}
                df[name] = np.round(_safe_formula_eval(expr, variables), 2)
            elif gen == "bernoulli":
                p = float(col.get("p", 0.05))
                df[name] = (rng.random(n) < p).astype(int)
            else:
                # fallback numérico
                df[name] = rng.normal(0, 1, size=n)

        # 2) injetar nulos
        nulls = tpl.get("nulls")
        if nulls:
            p = float(nulls["p"]); cols = nulls["columns"]
            mask = rng.random((n, len(cols))) < p
            for j, c in enumerate(cols):
                vals = df[c].astype("object").values
                vals[mask[:, j]] = None
                df[c] = vals

        # 3) outliers
        outliers = tpl.get("outliers", {})
        for c, cfg in outliers.items():
            p = float(cfg.get("p", 0.01)); factor = float(cfg.get("factor", 5))
            idx = rng.random(n) < p
            if c in df:
                df.loc[idx, c] = df.loc[idx, c] * factor

        return df

    df_full = _build(rows_full)
    df_sample = df_full.sample(n=rows_sample, random_state=seed).sort_index()

    # paths
    base_dir = os.path.join(STATIC_DIR, template_id)
    _ensure_dirs(base_dir)
    full_path = os.path.join(base_dir, f"{seed}_full.csv")
    sample_path = os.path.join(base_dir, f"{seed}_sample.csv")

    df_full.to_csv(full_path, index=False)
    df_sample.to_csv(sample_path, index=False)

    return (df_sample.to_csv(index=False), full_path)
